const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Helper function to extract college from email
function getCollegeFromEmail(email) {
  const domain = email.split('@')[1];
  return domain;
}

// Register
router.post('/register', async (req, res) => {
  const { email, password, username } = req.body;

  // Validate .edu email
  if (!email.endsWith('.edu')) {
    return res.status(400).json({ error: 'Must use a .edu email address' });
  }

  try {
    const college = getCollegeFromEmail(email);
    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password_hash, username, college) VALUES ($1, $2, $3, $4) RETURNING id, email, username, college',
      [email, password_hash, username, college]
    );

    res.status(201).json({ message: 'User created!', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      res.status(400).json({ error: 'Email or username already taken' });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, is_admin: user.is_admin },
      process.env.JWT_SECRET || 'devsecret',
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, email: user.email, username: user.username, college: user.college, is_admin: user.is_admin } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;