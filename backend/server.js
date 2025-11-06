const express = require('express');
const mysql = require('mysql2');
const path = require('path');
// Load environment variables from .env file in the parent directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const port = process.env.PORT || 3001;

// --- MIDDLEWARE ---
// Parse JSON bodies for POST requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 1. DATABASE CONNECTION ---
// Create a "pool" of connections to your MySQL database
// Using environment variables for security
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
}).promise(); // Use .promise() for modern async/await syntax


// --- 2. SERVE STATIC FILES ---
// This tells Express to serve your HTML, CSS, and JS files
// from the 'frontend' folder.
// Go up one directory (..) since server.js is in 'backend' folder
app.use(express.static(path.join(__dirname, '..', 'frontend')));


// --- 3. CREATE API ENDPOINTS ---

// API to get all patients
app.get('/api/patients', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Patient');
    res.json(rows); // Send the data back as JSON
  } catch (err) {
    console.error('Error fetching patients:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// API to get all scheduled tests
app.get('/api/tests', async (req, res) => {
    try {
      // Your query might be more complex, but this is a start
      const [rows] = await db.query('SELECT * FROM Test');
      res.json(rows);
    } catch (err) {
      console.error('Error fetching tests:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

// --- API ENDPOINTS FOR STAFF PAGE ---

// API to get all doctors
app.get('/api/doctors', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Doctor');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching doctors:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// API to get all reviewers (with their department name)
app.get('/api/reviewers', async (req, res) => {
  try {
    // We use a JOIN to get the department_name from the Department table
    const query = `
      SELECT 
        r.reviewer_id, 
        r.first_name, 
        r.last_name, 
        r.role, 
        d.department_name 
      FROM Reviewer r
      LEFT JOIN Department d ON r.department_id = d.department_id
    `;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching reviewers:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// --- API ENDPOINTS FOR DASHBOARD STATISTICS ---

// API to get total number of patients
app.get('/api/stats/total-patients', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT COUNT(*) as total FROM Patient');
    res.json({ total: rows[0].total });
  } catch (err) {
    console.error('Error fetching patient count:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// API to get number of pending tests
app.get('/api/stats/pending-tests', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT COUNT(*) as total FROM Test WHERE status = "Pending"');
    res.json({ total: rows[0].total });
  } catch (err) {
    console.error('Error fetching pending test count:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// API to get total number of staff (doctors + reviewers)
app.get('/api/stats/total-staff', async (req, res) => {
  try {
    const [doctorRows] = await db.query('SELECT COUNT(*) as doctorCount FROM Doctor');
    const [reviewerRows] = await db.query('SELECT COUNT(*) as reviewerCount FROM Reviewer');
    const total = doctorRows[0].doctorCount + reviewerRows[0].reviewerCount;
    res.json({ total: total });
  } catch (err) {
    console.error('Error fetching staff count:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// --- API ENDPOINTS FOR ACTIONS ---

// API to register a new patient (using the existing stored procedure)
app.post('/api/patients/register', async (req, res) => {
  try {
    const { 
      first_name, 
      last_name, 
      date_of_birth, 
      gender, 
      contact_number, 
      email, 
      address 
    } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !contact_number) {
      return res.status(400).json({ 
        error: 'Missing required fields: first_name, last_name, contact_number' 
      });
    }

    // Use the existing stored procedure
    const [result] = await db.query(
      'CALL RegisterNewPatient(?, ?, ?, ?, ?, ?, ?, @new_patient_id)',
      [first_name, last_name, date_of_birth, gender, contact_number, email, address]
    );
    
    // Get the new patient ID
    const [idResult] = await db.query('SELECT @new_patient_id as patient_id');
    const newPatientId = idResult[0].patient_id;

    res.json({ 
      success: true, 
      message: 'Patient registered successfully',
      patient_id: newPatientId
    });
  } catch (err) {
    console.error('Error registering patient:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Contact number or email already exists' });
    } else {
      res.status(500).json({ error: 'Database error' });
    }
  }
});

// API to schedule a new test (using the existing stored procedure)
app.post('/api/tests/schedule', async (req, res) => {
  try {
    const { patient_id, doctor_id, test_name, test_date } = req.body;

    // Validate required fields
    if (!patient_id || !doctor_id || !test_name || !test_date) {
      return res.status(400).json({ 
        error: 'Missing required fields: patient_id, doctor_id, test_name, test_date' 
      });
    }

    // Use the existing stored procedure
    await db.query(
      'CALL ScheduleNewTest(?, ?, ?, ?)',
      [patient_id, doctor_id, test_name, test_date]
    );

    res.json({ 
      success: true, 
      message: 'Test scheduled successfully' 
    });
  } catch (err) {
    console.error('Error scheduling test:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// API to get a single patient by ID
app.get('/api/patients/:id', async (req, res) => {
  try {
    const patientId = req.params.id;
    const [rows] = await db.query('SELECT * FROM Patient WHERE patient_id = ?', [patientId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching patient:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// API to update patient information
app.put('/api/patients/:id', async (req, res) => {
  try {
    const patientId = req.params.id;
    const { 
      first_name, 
      last_name, 
      date_of_birth, 
      gender, 
      contact_number, 
      email, 
      address 
    } = req.body;

    await db.query(
      `UPDATE Patient 
       SET first_name = ?, last_name = ?, date_of_birth = ?, 
           gender = ?, contact_number = ?, email = ?, address = ?
       WHERE patient_id = ?`,
      [first_name, last_name, date_of_birth, gender, contact_number, email, address, patientId]
    );

    res.json({ 
      success: true, 
      message: 'Patient information updated successfully' 
    });
  } catch (err) {
    console.error('Error updating patient:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Contact number or email already exists' });
    } else {
      res.status(500).json({ error: 'Database error' });
    }
  }
});

// API to get a single test by ID
app.get('/api/tests/:id', async (req, res) => {
  try {
    const testId = req.params.id;
    const [rows] = await db.query('SELECT * FROM Test WHERE test_id = ?', [testId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching test:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// API to update test status
app.put('/api/tests/:id', async (req, res) => {
  try {
    const testId = req.params.id;
    const { status, report_details } = req.body;

    await db.query(
      'UPDATE Test SET status = ?, report_details = ? WHERE test_id = ?',
      [status, report_details, testId]
    );

    res.json({ 
      success: true, 
      message: 'Test updated successfully' 
    });
  } catch (err) {
    console.error('Error updating test:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// API to cancel a test
app.delete('/api/tests/:id', async (req, res) => {
  try {
    const testId = req.params.id;
    
    await db.query('UPDATE Test SET status = "Cancelled" WHERE test_id = ?', [testId]);

    res.json({ 
      success: true, 
      message: 'Test cancelled successfully' 
    });
  } catch (err) {
    console.error('Error cancelling test:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


// --- 4. START THE SERVER ---
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Serving static files from:', path.join(__dirname, '..', 'frontend'));
});