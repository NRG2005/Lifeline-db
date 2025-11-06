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

// API to get detailed test statistics
app.get('/api/stats/test-breakdown', async (req, res) => {
  try {
    const [pendingRows] = await db.query('SELECT COUNT(*) as count FROM Test WHERE status = "Pending"');
    const [progressRows] = await db.query('SELECT COUNT(*) as count FROM Test WHERE status IN ("Scheduled", "In Progress")');
    const [completedRows] = await db.query('SELECT COUNT(*) as count FROM Test WHERE status = "Completed"');
    const [todayRows] = await db.query('SELECT COUNT(*) as count FROM Test WHERE DATE(test_date) = CURDATE()');
    
    res.json({
      pending: pendingRows[0].count,
      inProgress: progressRows[0].count,
      completed: completedRows[0].count,
      today: todayRows[0].count
    });
  } catch (err) {
    console.error('Error fetching test statistics:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// API to get recent activity for dashboard
app.get('/api/stats/recent-activity', async (req, res) => {
  try {
    // Get recent patients (last 3)
    const [recentPatients] = await db.query(`
      SELECT first_name, last_name, patient_id, registration_date 
      FROM Patient 
      ORDER BY registration_date DESC 
      LIMIT 3
    `);
    
    // Get recent tests (last 3)
    const [recentTests] = await db.query(`
      SELECT t.test_name, t.test_id, t.patient_id, t.test_date, t.status,
             p.first_name, p.last_name
      FROM Test t
      JOIN Patient p ON t.patient_id = p.patient_id
      ORDER BY t.test_date DESC 
      LIMIT 3
    `);
    
    // Combine and format activities
    const activities = [];
    
    // Add recent patients
    recentPatients.forEach(patient => {
      activities.push({
        type: 'patient_registered',
        title: 'New patient registered',
        description: `${patient.first_name} ${patient.last_name} - ID: ${patient.patient_id}`,
        timestamp: patient.registration_date,
        icon: 'fas fa-user-plus',
        iconColor: 'blue'
      });
    });
    
    // Add recent tests
    recentTests.forEach(test => {
      const activity = {
        title: '',
        description: `${test.test_name} - Patient: ${test.first_name} ${test.last_name}`,
        timestamp: test.test_date,
        icon: '',
        iconColor: ''
      };
      
      if (test.status === 'Completed') {
        activity.type = 'test_completed';
        activity.title = 'Test completed';
        activity.icon = 'fas fa-check-circle';
        activity.iconColor = 'green';
      } else if (test.status === 'Pending') {
        activity.type = 'test_scheduled';
        activity.title = 'Test scheduled';
        activity.icon = 'fas fa-calendar-plus';
        activity.iconColor = 'orange';
      } else {
        activity.type = 'test_in_progress';
        activity.title = 'Test in progress';
        activity.icon = 'fas fa-flask';
        activity.iconColor = 'blue';
      }
      
      activities.push(activity);
    });
    
    // Sort by timestamp and return latest 5
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(activities.slice(0, 5));
    
  } catch (err) {
    console.error('Error fetching recent activity:', err);
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

// API to delete a patient using stored procedure
app.delete('/api/patients/:id', async (req, res) => {
  try {
    const patientId = req.params.id;
    
    // Use the stored procedure to delete patient
    await db.query('CALL DeletePatient(?)', [patientId]);

    res.json({ 
      success: true, 
      message: 'Patient and associated records deleted successfully' 
    });
  } catch (err) {
    console.error('Error deleting patient:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// API to permanently delete a test using stored procedure
app.delete('/api/tests/:id/permanent', async (req, res) => {
  try {
    const testId = req.params.id;
    
    // Use the stored procedure to delete test
    await db.query('CALL DeleteTest(?)', [testId]);

    res.json({ 
      success: true, 
      message: 'Test deleted permanently' 
    });
  } catch (err) {
    console.error('Error deleting test:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


// --- 4. START THE SERVER ---
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Serving static files from:', path.join(__dirname, '..', 'frontend'));
});