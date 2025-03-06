CREATE TABLE `bill` (
  `bill_id` VARCHAR PRIMARY KEY,
  `room_id` VARCHAR,
  `rent_fee` DECIMAL,
  `water_bill` DECIMAL,
  `electricity_bill` DECIMAL,
  `internet_bill` DECIMAL,
  `central_service_fee` DECIMAL,
  `security_fee` DECIMAL,
  `fine` DECIMAL,
  FOREIGN KEY (`room_id`) REFERENCES `room` (`room_id`) ON DELETE CASCADE
);

CREATE TABLE `contact` (
  `contact_id` VARCHAR PRIMARY KEY,
  `tenant_ID` VARCHAR,
  `topic` VARCHAR(255),
  `description` TEXT,
  `picture` BLOB,
  `date` DATETIME,
  `response_time` DATETIME,
  `status` VARCHAR(10),
  `response` TEXT,
  FOREIGN KEY (`tenant_ID`) REFERENCES `tenant` (`tenant_ID`) ON DELETE CASCADE
);

CREATE TABLE `contract` (
  `contract_id` VARCHAR(20) PRIMARY KEY,
  `tenantFirstName` VARCHAR(30),
  `tenantLastName` VARCHAR(30),
  `dormitory_id` VARCHAR(20),
  `floor_number` INT,
  `room_id` VARCHAR(20),
  `user_citizen_id` VARCHAR(20),
  `user_address` VARCHAR(255),
  `contract_start_date` DATE,
  `contract_end_date` DATE,
  `contract_month` INT,
  `rent_fee` DECIMAL(10,2),
  `warranty` DECIMAL(10,2),
  `electric_meter_number` VARCHAR(50),
  `water_meter_number` VARCHAR(50),
  `electric_per_unit` DECIMAL(10,2),
  `water_per_unit` DECIMAL(10,2),
  `extra_condition` TEXT,
  `signature` BLOB,
  FOREIGN KEY (dormitory_id) REFERENCES dormitory(dormitory_id),
  FOREIGN KEY (room_id) REFERENCES room(room_id)
);

CREATE TABLE `dormitory` (
  `dormitory_id` VARCHAR PRIMARY KEY,
  `dormitory_name` VARCHAR(50),
  `owner_id` VARCHAR,
  `contact` VARCHAR(10),
  `email` VARCHAR(50),
  `monthly_bill_date` INT,
  `bill_due_date` INT,
  `floor_count` INT,
  `dorm_address` VARCHAR(255),
  `province` VARCHAR(50),
  `subdistrict` VARCHAR(50),
  `district` VARCHAR(50),
  `zip_code` VARCHAR(5),
  `information` TEXT,
  `dorm_pic` BLOB,
  FOREIGN KEY (`owner_id`) REFERENCES `owners` (`owner_id`) ON DELETE CASCADE
);

CREATE TABLE `dormitory_info` (
  `dormitory_id` VARCHAR PRIMARY KEY,
  `information` TEXT,
  `dorm_pic` BLOB,
  FOREIGN KEY (`dormitory_id`) REFERENCES `dormitory` (`dormitory_id`) ON DELETE CASCADE
);

CREATE TABLE dormitory_floors (
  `dormitory_id` VARCHAR,
  `floor_number` INT,
  `room_amount` INT,
  PRIMARY KEY (dormitory_id, floor_number),
  FOREIGN KEY (dormitory_id) REFERENCES dormitory(dormitory_id)
);

CREATE TABLE `facilities` (
  `facilityID` VARCHAR PRIMARY KEY,
  `dormitory_id` VARCHAR,
  `facility` VARCHAR(100),
  FOREIGN KEY (`dormitory_id`) REFERENCES `dormitory` (`dormitory_id`) ON DELETE CASCADE
);

CREATE TABLE `owners` (
  `owner_id` VARCHAR PRIMARY KEY,
  `owner_username` VARCHAR,
  `owner_password` VARCHAR(255)
);

CREATE TABLE `payment` (
  `payment_id` VARCHAR PRIMARY KEY,
  `room_id` VARCHAR,
  `tenant_ID` VARCHAR,
  `bill_id` VARCHAR,
  `bill_status` VARCHAR(20),
  `payment_due_date` DATE,
  `bank_info` VARCHAR(45),
  `bank_pic` BLOB,
  `receipt_pic` BLOB,
  FOREIGN KEY (`room_id`) REFERENCES `room` (`room_id`) ON DELETE CASCADE,
  FOREIGN KEY (`tenant_ID`) REFERENCES `tenant` (`tenant_ID`) ON DELETE CASCADE,
  FOREIGN KEY (`bill_id`) REFERENCES `bill` (`bill_id`) ON DELETE CASCADE
);

CREATE TABLE `room` (
  `room_id` VARCHAR PRIMARY KEY,
  `dormitory_id` VARCHAR,
  `room_type_id` VARCHAR,
  `tenant_ID` VARCHAR,
  FOREIGN KEY (`dormitory_id`) REFERENCES `dormitory` (`dormitory_id`) ON DELETE CASCADE,
  FOREIGN KEY (`tenant_ID`) REFERENCES `tenant` (`tenant_ID`) ON DELETE CASCADE
);

CREATE TABLE `room_type` (
  `room_type_id` VARCHAR PRIMARY KEY,
  `room_type_name` VARCHAR(50),
  `price` DECIMAL
);

CREATE TABLE `tenant` (
  `tenant_ID` VARCHAR PRIMARY KEY,
  `tenant_username` VARCHAR,
  `tenant_password` VARCHAR(255),
  `firstName` VARCHAR(30),
  `lastName` VARCHAR(30),
  `telephone` VARCHAR(10),
  `email` VARCHAR(35)
);

CREATE TABLE `tenant_status` (
  `tenant_ID` VARCHAR PRIMARY KEY,
  `room_status` VARCHAR(30),
  `tenant_status` VARCHAR(30),
  `bill_status` VARCHAR(20),
  `tenant_picture` BLOB,
  FOREIGN KEY (`tenant_ID`) REFERENCES `tenant` (`tenant_ID`) ON DELETE CASCADE
);