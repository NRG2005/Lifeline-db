-- 1. Create the database
CREATE DATABASE IF NOT EXISTS lifeline_db;
USE lifeline_db;

-- 2. Create Tables
CREATE TABLE Patient (
    patient_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    contact_number VARCHAR(15) UNIQUE,
    email VARCHAR(100) UNIQUE,
    address VARCHAR(255),
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Department (
    department_id INT PRIMARY KEY AUTO_INCREMENT,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    hod_id INT
);

CREATE TABLE Reviewer (
    reviewer_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    department_id INT,
    role VARCHAR(50),
    contact_number VARCHAR(15) UNIQUE,
    email VARCHAR(100) UNIQUE,
    FOREIGN KEY (department_id) REFERENCES Department(department_id)
);

-- Add the HOD foreign key after Reviewer table is created
ALTER TABLE Department
ADD CONSTRAINT fk_hod
FOREIGN KEY (hod_id) REFERENCES Reviewer(reviewer_id);

CREATE TABLE Doctor (
    doctor_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    specialization VARCHAR(100),
    contact_number VARCHAR(15) UNIQUE,
    email VARCHAR(100) UNIQUE,
    clinic_address VARCHAR(255)
);

CREATE TABLE Companion (
    accompanying_person_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    relationship VARCHAR(50),
    contact_number VARCHAR(15),
    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id)
);

CREATE TABLE Test (
    test_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT,
    doctor_id INT,
    department_id INT,
    reviewer_id INT,
    test_name VARCHAR(100) NOT NULL,
    sample_type VARCHAR(50),
    test_date DATE,
    report_details TEXT,
    status VARCHAR(20) DEFAULT 'Pending',
    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES Doctor(doctor_id),
    FOREIGN KEY (department_id) REFERENCES Department(department_id),
    FOREIGN KEY (reviewer_id) REFERENCES Reviewer(reviewer_id)
);

-- 3. Insert Sample Data
INSERT INTO Department (department_name) VALUES ('Radiology'), ('Pathology'), ('Cardiology');

INSERT INTO Reviewer (first_name, last_name, department_id, role, contact_number, email) VALUES
('Priya', 'Sharma', 1, 'Senior Radiologist', '9876543210', 'priya.sharma@lifeline.com'),
('Amit', 'Singh', 2, 'Senior Pathologist', '9876543211', 'amit.singh@lifeline.com'),
('Sunita', 'Patel', 1, 'Radiologist', '9876543212', 'sunita.patel@lifeline.com');

UPDATE Department SET hod_id = 1 WHERE department_id = 1;
UPDATE Department SET hod_id = 2 WHERE department_id = 2;

INSERT INTO Patient (first_name, last_name, date_of_birth, gender, contact_number, email, address) VALUES
('Rohan', 'Verma', '1985-05-20', 'Male', '8123456789', 'rohan.verma@email.com', '123 MG Road, Bangalore'),
('Anjali', 'Mehta', '1992-11-15', 'Female', '8123456780', 'anjali.mehta@email.com', '456 Koramangala, Bangalore'),
('Jane', 'Smith', '1985-08-22', 'Female', '9123456789', 'jane.smith@email.com', '456 Wellness Ave, Curetown');

INSERT INTO Doctor (first_name, last_name, specialization, contact_number, email, clinic_address) VALUES
('Vikram', 'Rao', 'Cardiologist', '7234567890', 'vikram.rao@clinic.com', '789 Indiranagar, Bangalore'),
('Deepa', 'Iyer', 'General Physician', '7234567891', 'deepa.iyer@clinic.com', '101 Jayanagar, Bangalore');

INSERT INTO Companion (patient_id, first_name, last_name, relationship, contact_number) VALUES
(1, 'Pooja', 'Verma', 'Spouse', '8123456788');

INSERT INTO Test (patient_id, doctor_id, department_id, reviewer_id, test_name, sample_type, test_date, status) VALUES
(1, 1, 3, NULL, 'ECG', 'N/A', '2025-10-11', 'Pending'),
(2, 2, 2, 2, 'Blood Test', 'Blood', '2025-10-12', 'Pending');

-- 4. Create Stored Procedures
DELIMITER //
CREATE PROCEDURE ScheduleNewTest(
    IN p_patient_id INT,
    IN p_doctor_id INT,
    IN p_test_name VARCHAR(100),
    IN p_test_date DATE
)
BEGIN
    DECLARE v_department_id INT;
    -- Basic logic: Assign department based on test name
    IF p_test_name LIKE '%MRI%' OR p_test_name LIKE '%X-Ray%' THEN
        SET v_department_id = 1; -- Radiology
    ELSEIF p_test_name LIKE '%Blood Test%' OR p_test_name LIKE '%Biopsy%' THEN
        SET v_department_id = 2; -- Pathology
    ELSEIF p_test_name LIKE '%ECG%' THEN
        SET v_department_id = 3; -- Cardiology
    END IF;

    -- Insert the new test record
    INSERT INTO Test (patient_id, doctor_id, department_id, test_name, test_date, status)
    VALUES (p_patient_id, p_doctor_id, v_department_id, p_test_name, p_test_date, 'Scheduled');
END //
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE RegisterNewPatient(
    IN p_first_name VARCHAR(50),
    IN p_last_name VARCHAR(50),
    IN p_date_of_birth DATE,
    IN p_gender VARCHAR(10),
    IN p_contact_number VARCHAR(15),
    IN p_email VARCHAR(100),
    IN p_address VARCHAR(255),
    OUT p_new_patient_id INT
)
BEGIN
    INSERT INTO Patient (first_name, last_name, date_of_birth, gender, contact_number, email, address)
    VALUES (p_first_name, p_last_name, p_date_of_birth, p_gender, p_contact_number, p_email, p_address);
    SET p_new_patient_id = LAST_INSERT_ID();
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE DeletePatient(
    IN p_patient_id INT
)
BEGIN
    -- First, check if patient has any tests
    DECLARE test_count INT;
    SELECT COUNT(*) INTO test_count FROM Test WHERE patient_id = p_patient_id;
    
    IF test_count > 0 THEN
        -- Delete all tests associated with the patient
        DELETE FROM Test WHERE patient_id = p_patient_id;
    END IF;
    
    -- Delete companions associated with the patient
    DELETE FROM Companion WHERE patient_id = p_patient_id;
    
    -- Finally, delete the patient
    DELETE FROM Patient WHERE patient_id = p_patient_id;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE DeleteTest(
    IN p_test_id INT
)
BEGIN
    -- Simply delete the test
    DELETE FROM Test WHERE test_id = p_test_id;
END$$
DELIMITER ;

-- 5. Create Function
DELIMITER //
CREATE FUNCTION CalculateAge(
    p_date_of_birth DATE
)
RETURNS INT
DETERMINISTIC
BEGIN
    RETURN TIMESTAMPDIFF(YEAR, p_date_of_birth, CURDATE());
END //
DELIMITER ;

-- 6. Create Trigger
DELIMITER //
CREATE TRIGGER before_test_insert
BEFORE INSERT ON Test
FOR EACH ROW
BEGIN
    IF NEW.test_date < CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: Test date cannot be in the past.';
    END IF;
END //
DELIMITER ;