const express = require("express");
const path = require("path");
const port = 3000;
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require('body-parser');
const session = require('express-session');

// Creating the Express server
const app = express();

// Connect to SQLite database
let db = new sqlite3.Database("overall1.db", (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Connected to the SQlite database.");
});

// Session management
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// static resourse & templating engine
app.use(express.static("public"));
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/style", express.static(path.join(__dirname, "style")));
// Set EJS as templating engine
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route สำหรับหน้า bill
app.get("/dorm", function (req, res) {
  res.render('detail', { user: req.session.user });
});

// Route สำหรับหน้า bill
app.get("/bill", function (req, res) {
  if (!req.session.user) {
    return res.redirect('/'); // ถ้าไม่ได้ login ให้กลับไปหน้าแรก
  }
  res.render('bill', { user: req.session.user });
});

app.get("/tenant/:dormitory_id", function (req, res) {
  const dormitory_id = req.params.dormitory_id; // รับค่า dormitory_id จาก URL

  // Query รวมข้อมูลจากหลายตาราง
  const query = `
    SELECT 
      d.dormitory_id, d.dormitory_name, d.dorm_address, d.province, d.district, d.subdistrict, d.zip_code,
      di.information, di.dorm_pic,
      f.facility,
      r.room_id, r.room_type_id,
      rt.room_type_name, rt.price
    FROM dormitory d
    LEFT JOIN dormitory_info di ON d.dormitory_id = di.dormitory_id
    LEFT JOIN facilities f ON d.dormitory_id = f.dormitory_id
    LEFT JOIN room r ON d.dormitory_id = r.dormitory_id
    LEFT JOIN room_type rt ON r.room_type_id = rt.room_type_id
    WHERE d.dormitory_id = ?`;

  db.all(query, [dormitory_id], (err, rows) => {
    if (err) {
      console.log(err.message);
      return res.status(500).send(" ");
    }

    if (!rows || rows.length === 0) {
      return res.status(404).send("ไม่พบข้อมูลหอพัก");
    }

    // ดึงข้อมูลหอพักจาก row แรก
    let dormData = {
      dormitory_id: rows[0].dormitory_id,
      dorm_name: rows[0].dormitory_name,
      dorm_address: `${rows[0].dorm_address}, ${rows[0].subdistrict}, ${rows[0].district}, ${rows[0].province}, ${rows[0].zip_code}`,
      information: [],
      gallery: [],
      facilities: [],
      rooms: []
    };

    // วนลูปเพิ่มข้อมูลรายละเอียด
    rows.forEach(row => {
      if (row.information && !dormData.information.includes(row.information)) {
        dormData.information.push(row.information);
      }
    });

    // วนลูปเพิ่มรูปภาพทั้งหมด
    rows.forEach(row => {
      if (row.dorm_pic) {
        let imageBase64 = `data:image/jpeg;base64,${Buffer.from(row.dorm_pic).toString("base64")}`;
        if (!dormData.gallery.includes(imageBase64)) {
          dormData.gallery.push(imageBase64);
        }
      }
    });

    // วนลูปเพิ่มข้อมูลสิ่งอำนวยความสะดวก
    rows.forEach(row => {
      if (row.facility && !dormData.facilities.includes(row.facility)) {
        dormData.facilities.push(row.facility);
      }
    });

    // วนลูปเพิ่มข้อมูลห้องพัก
    rows.forEach(row => {
      if (row.room_id && !dormData.rooms.some(r => r.room_id === row.room_id)) {
        dormData.rooms.push({
          room_id: row.room_id,
          room_type: row.room_type_name,
          price: row.price
        });
      }
    });

    console.log(dormData);
    res.render("tenant", { data: dormData, user: req.session.user});
  });
});

// Middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Route for the home page
app.get('/', (req, res) => {
    res.render('start');
});

app.post('/register', (req, res) => {
  const { username, password, firstName, lastName, telephone, email } = req.body;
  let errors = [];

  // ตรวจสอบว่า telephone ต้องเป็นตัวเลข 10 หลัก
  if (!/^[0-9]{10}$/.test(telephone)) {
      errors.push("หมายเลขโทรศัพท์ต้องมี 10 หลัก");
  }

  if (errors.length > 0) {
      return res.status(400).json({ status: 'error', message: errors.join(", ") });
  }

  // ตรวจสอบความซ้ำซ้อนของ username, email และชื่อเต็ม
  db.get("SELECT * FROM tenant WHERE tenant_username = ? OR email = ? OR (firstName = ? AND lastName = ?)",
      [username, email, firstName, lastName], (err, row) => {
          if (err) {
              console.error(err);
              return res.status(500).json({ status: 'error', message: 'Database error' });
          }
          if (row) {
              return res.status(400).json({ status: 'error', message: 'Username, Email หรือ Full Name ถูกใช้ไปแล้ว' });
          }

          // นับจำนวน tenant ที่มีอยู่เพื่อสร้าง tenant_ID ใหม่
          db.get("SELECT COUNT(*) AS count FROM tenant", [], (err, result) => {
              if (err) {
                  console.error(err);
                  return res.status(500).json({ status: 'error', message: 'Database error' });
              }

              let count = result.count + 1;
              let tenant_ID = `T${count.toString().padStart(3, '0')}`; // สร้าง ID ในรูปแบบ T001, T002, T003

              // INSERT ข้อมูลใหม่ลงฐานข้อมูล
              db.run("INSERT INTO tenant (tenant_ID, tenant_username, tenant_password, firstName, lastName, telephone, email) VALUES (?, ?, ?, ?, ?, ?, ?)",
                  [tenant_ID, username, password, firstName, lastName, telephone, email],
                  function (err) {
                      if (err) {
                          console.error(err, 'cannot insert user');
                          return res.status(500).json({ status: 'error', message: 'Database error' });
                      }
                      console.log('Insert user success');
                      res.status(200).json({ status: 'success', message: 'User registered successfully', tenant_ID });
                  }
              );
          });
      }
  );
});


// API route for user login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM tenant WHERE tenant_username = ? AND tenant_password = ?", [username, password], (err, row) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ status: 'error', message: 'Database error' });
        }
        if (!row) {
            return res.status(400).json({ status: 'error', message: 'Invalid username or password' });
        }

        // Create a session for the user
        req.session.user = {
            id: row.id,
            username: row.tenant_username,
            firstName: row.firstName,
            lastName: row.lastName
        };

        res.status(200).json({ status: 'success', message: 'Login successful' });
    });
});

// Route for the ref page
app.get('/home', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    res.render('home', { user: req.session.user });
});

// Route for the owner login page
app.get('/owner-login', (req, res) => {
    res.render('owner-login');
});

// API route for owner login
app.post('/owner-login', (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM owners WHERE owner_username = ? AND owner_password = ?", [username, password], (err, row) => {
      if (err) {
          console.log(err);
          return res.status(500).json({ status: 'error', message: 'Database error' });
      }
      if (!row) {
          return res.status(400).json({ status: 'error', message: 'Invalid owner username or password' });
      }

      // Create a session for the owner
      req.session.owner = {
          id: row.id,
          username: row.owner_username
      };

      res.status(200).json({ status: 'success', message: 'Login successful' });
  });
});

// Route for the owner page
app.get('/owner', (req, res) => {
    if (!req.session.owner) {
        return res.redirect('/owner-login');
    }
    res.render('owner', { owner: req.session.owner });
});

// Route: Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.listen(port, () => {
  console.log(`Starting node.js at port ${port}`);
});
