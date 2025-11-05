Lifeline: Diagnostic Centre Management System

This is a full-stack web application built as a DBMS mini-project. It simulates the internal management system for a diagnostic center, handling patient registration, test scheduling, and staff management.

The application features a MySQL database with advanced logic (stored procedures, triggers, functions) and a Node.js/Express.js backend that serves a dynamic HTML/CSS frontend.

(To make this image work, upload your ER Diagram image file, name it ER-Diagram.jpeg, and place it in the main project folder)

Core Features

This application implements all the key requirements for a diagnostic center's database:

Dynamic Dashboard: A homepage with at-a-glance statistics for patients, tests, and staff.

Patient Management:

View a complete list of all registered patients, fetched live from the database.

Register new patients (this will be implemented via a POST request to RegisterNewPatient).

Test Scheduling:

View all scheduled tests with their current status.

Schedule new tests (this will be implemented via a POST request to ScheduleNewTest).

Staff Directory:

View a list of all referring doctors.

View a list of all internal lab staff (reviewers) and their departments.

Tech Stack

Frontend:

HTML5

Tailwind CSS (loaded via CDN for simplicity)

JavaScript (for dynamic data fetching with fetch)

Backend:

Node.js

Express.js (for the web server and API)

Database:

MySQL

mysql2 (Node.js driver)

Database Design & Logic

The core of this project is the MySQL database (lifeline_db). It's not just simple tables; it includes business logic at the database level.

Tables (Schema)

Patient: Stores all patient information.

Companion: Stores details of persons accompanying a patient.

Doctor: Stores information on external referring doctors.

Department: Lists the internal lab departments (e.g., Radiology, Pathology).

Reviewer: Stores details of internal lab staff.

Test: The central table linking patients, doctors, and reviewers for each test.

SQL Business Logic

The database enforces rules and provides helper functions:

Stored Procedure (RegisterNewPatient): A secure procedure to safely insert a new patient into the Patient table.

Stored Procedure (ScheduleNewTest): A procedure that automatically assigns the correct department_id based on the test name.

Function (CalculateAge): A function that calculates a patient's age from their date_of_birth.

Trigger (before_test_insert): A trigger that runs before any new test is added, preventing a test_date from being set in the past.

Project Structure

/DiagnosticWebsite
  |
  |-- /public
  |     |-- index.html     (Dashboard Page)
  |     |-- patients.html  (Patients Page)
  |     |-- tests.html     (Tests Page)
  |     +-- staff.html     (Staff Page)
  |
  |-- server.js          (The Backend Express Server)
  |-- package.json
  |-- README.md          (This file)


Getting Started: How to Run This Project

Prerequisites

Node.js: You must have Node.js installed (which includes npm).

MySQL: You must have a MySQL server running (e.g., via Homebrew, MySQL Workbench, etc.).

1. Database Setup

Log in to your MySQL server as root:

mysql -u root -p


Create the database:

CREATE DATABASE lifeline_db;


Use the new database:

USE lifeline_db;


Run the SQL commands from your Untitled.pdf log file (or a separate .sql script) to create all the tables (Patient, Doctor, Test, etc.), stored procedures (RegisterNewPatient), functions (CalculateAge), and triggers.

Insert the sample data from your PDF to populate the tables.

2. Backend Installation

Navigate to the project folder (DiagnosticWebsite) in your terminal.

Initialize the project (creates package.json):

npm init -y


Install the necessary packages:

npm install express mysql2


3. Configure the Server

Open the server.js file.

On line 13, find password: 'YOUR_MYSQL_PASSWORD_HERE'.

Change this string to your actual MySQL root password.

4. Run the Application

Make sure your MySQL server is running.

Run the backend server from your terminal:

node server.js


You will see the message: Server running at http://localhost:3001

Open your web browser and go to http://localhost:3001.

The website is now live, fully styled, and pulling all its data directly from your lifeline_db database!

API Endpoints

This server provides the following API routes for the frontend:

GET /api/patients: Fetches all patients from the Patient table.

GET /api/tests: Fetches all tests from the Test table.

GET /api/doctors: Fetches all doctors from the Doctor table.

GET /api/reviewers: Fetches all reviewers and joins their department name.