const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get('/', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM users');
    res.json({ message: 'Database connected!', userCount: result.rows[0].count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.use('/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});