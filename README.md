# Lifeline: Diagnostic Centre Management System

This is a full-stack web application built as a DBMS mini-project. It simulates the internal management system for a diagnostic center, handling patient registration, test scheduling, and staff management.

The application features a **MySQL database** with advanced logic (stored procedures, triggers, functions) and a **Node.js/Express.js backend** that serves a dynamic HTML/CSS frontend with a professional medical interface.

![ER Diagram](ER-Diagram.jpeg)
*(To make this image work, upload your ER Diagram image file, name it `ER-Diagram.jpeg`, and push it to your GitHub repository)*

---

## Core Features

This application implements all the key requirements for a diagnostic center's database with a professional medical UI:

### 🏥 Professional Medical Interface
* **Modern Dashboard:** Real-time statistics with medical-grade design
* **Clinical Color Scheme:** Professional blue and clinical gray palette
* **Medical Icons:** Font Awesome medical icons throughout
* **Responsive Design:** Works on desktop, tablet, and mobile devices

### 📊 Dynamic Dashboard
* Live patient, test, and staff statistics
* Quick action buttons for common tasks
* Recent activity feed
* Animated number counters

### 👥 Patient Management
* Complete patient registration system with form validation
* Search and filter capabilities
* View and edit patient information
* Professional patient cards with avatars
* Action buttons for viewing details and medical history

### 🧪 Test Scheduling & Management
* Schedule new tests using existing stored procedures
* View all tests with enhanced status tracking
* Update test results and status
* Cancel tests when needed
* Color-coded status badges (Pending, In Progress, Completed)
* Test-specific icons (blood test, X-ray, etc.)

### 👨‍⚕️ Staff Directory
* View referring doctors with specializations
* Lab staff management with roles and departments
* Contact information and professional details
* Role-based icons and organization

---

## Enhanced API Endpoints

### Statistics (for Dashboard)
* `GET /api/stats/total-patients` - Get total registered patients
* `GET /api/stats/pending-tests` - Get count of pending tests
* `GET /api/stats/total-staff` - Get total staff count (doctors + reviewers)

### Patient Management
* `GET /api/patients` - Get all patients with enhanced formatting
* `GET /api/patients/:id` - Get specific patient details
* `POST /api/patients/register` - Register new patient (uses `RegisterNewPatient` stored procedure)
* `PUT /api/patients/:id` - Update patient information

### Test Management
* `GET /api/tests` - Get all tests with enhanced status information
* `GET /api/tests/:id` - Get specific test details
* `POST /api/tests/schedule` - Schedule new test (uses `ScheduleNewTest` stored procedure)
* `PUT /api/tests/:id` - Update test status and results
* `DELETE /api/tests/:id` - Cancel test (sets status to "Cancelled")

### Staff Directory
* `GET /api/doctors` - Get all referring doctors
* `GET /api/reviewers` - Get all lab staff with department information

---

## Tech Stack

### Frontend
* **HTML5** with semantic markup
* **Tailwind CSS** with custom medical theme configuration
* **Font Awesome 6.4.0** for professional medical icons
* **Vanilla JavaScript** with modern ES6+ features
* **Custom CSS Variables** for medical color scheme

### Backend
* **Node.js** with Express.js framework
* **MySQL2** with connection pooling and async/await
* **Environment Variables** for secure configuration
* **JSON Middleware** for API request handling
* **Static File Serving** for frontend assets

### Database
* **MySQL** with advanced features
* **Stored Procedures** for complex operations
* **Triggers** for data validation
* **Functions** for calculations
* **Foreign Key Constraints** for data integrity

---

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MySQL Server (v8.0 or higher)
- Modern web browser

### Quick Start

1. **Clone and Install:**
   ```bash
   git clone <repository-url>
   cd diagnostic-centre
   npm install
   ```

2. **Database Setup:**
   ```bash
   # Start MySQL and run the schema
   mysql -u root -p < schema.sql
   ```

3. **Environment Configuration:**
   ```bash
   # Update .env file with your MySQL credentials
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=lifeline_db
   PORT=3001
   ```

4. **Start the Application:**
   ```bash
   npm start
   # Open http://localhost:3001 in your browser
   ```

---

## Database Design & Logic

The core of this project is the MySQL database (`lifeline_db`) with professional business logic.

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
