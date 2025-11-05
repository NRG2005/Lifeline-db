# Lifeline: Diagnostic Centre Management System

This is a full-stack web application built as a DBMS mini-project. It simulates the internal management system for a diagnostic center, handling patient registration, test scheduling, and staff management.

The application features a **MySQL database** with advanced logic (stored procedures, triggers, functions) and a **Node.js/Express.js backend** that serves a dynamic HTML/CSS frontend.

![ER Diagram](ER-Diagram.jpeg)
*(To make this image work, upload your ER Diagram image file, name it `ER-Diagram.jpeg`, and push it to your GitHub repository)*

---

## Core Features

This application implements all the key requirements for a diagnostic center's database:

* **Dynamic Dashboard:** A homepage with at-a-glance statistics for patients, tests, and staff.
* **Patient Management:**
    * View a complete list of all registered patients, fetched live from the database.
    * Register new patients (this will be implemented via a `POST` request to `RegisterNewPatient`).
* **Test Scheduling:**
    * View all scheduled tests with their current status.
    * Schedule new tests (this will be implemented via a `POST` request to `ScheduleNewTest`).
* **Staff Directory:**
    * View a list of all referring doctors.
    * View a list of all internal lab staff (reviewers) and their departments.

---

## Tech Stack

* **Frontend:**
    * HTML5
    * [Tailwind CSS](https://tailwindcss.com/) (loaded via CDN for simplicity)
    * JavaScript (for dynamic data fetching with `fetch`)

* **Backend:**
    * [Node.js](https://nodejs.org/en)
    * [Express.js](https://expressjs.com/) (for the web server and API)

* **Database:**
    * MySQL
    * [mysql2](https://www.npmjs.com/package/mysql2) (Node.js driver)

---

## Database Design & Logic

The core of this project is the MySQL database (`lifeline_db`). It's not just simple tables; it includes business logic at the database level.

### Tables (Schema)

* `Patient`: Stores all patient information.
* `Companion`: Stores details of persons accompanying a patient.
* `Doctor`: Stores information on external referring doctors.
* `Department`: Lists the internal lab departments (e.g., Radiology, Pathology).
* `Reviewer`: Stores details of internal lab staff.
* `Test`: The central table linking patients, doctors, and reviewers for each test.

### SQL Business Logic

The database enforces rules and provides helper functions:

* **Stored Procedure (`RegisterNewPatient`):** A secure procedure to safely insert a new patient into the `Patient` table.
* **Stored Procedure (`ScheduleNewTest`):** A procedure that automatically assigns the correct `department_id` based on the test name.
* **Function (`CalculateAge`):** A function that calculates a patient's age from their `date_of_birth`.
* **Trigger (`before_test_insert`):** A trigger that runs before any new test is added, preventing a `test_date` from being set in the past.

---

## Project Structure
