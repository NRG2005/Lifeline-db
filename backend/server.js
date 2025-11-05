const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const port = 3001; // We'll run our server on this port

// --- 1. DATABASE CONNECTION ---
// Create a "pool" of connections to your MySQL database
// !! Replace with your own MySQL password !!
const db = mysql.createPool({
  host: 'localhost',
  user: 'root', // Or your MySQL username
  password: 'YOUR_MYSQL_PASSWORD_HERE', // !! IMPORTANT: CHANGE THIS
  database: 'lifeline_db'
}).promise(); // Use .promise() for modern async/await syntax


// --- 2. SERVE STATIC FILES ---
// This tells Express to serve your HTML, CSS, and JS files
// from the 'public' folder.
app.use(express.static(path.join(__dirname, 'public')));


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


// --- 4. START THE SERVER ---
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Serving static files from:', path.join(__dirname, 'public'));
});