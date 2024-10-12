const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Middleware sets this
    const result = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ message: 'Error fetching user profile', error: err.message });
  }
};

const getUserByEmail = async (req, res) => {
  const { email } = req.params;
  try {
    const result = await pool.query('SELECT id, username, email FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching user by email:', err);
    res.status(500).json({ message: 'Error fetching user', error: err.message });
  }
};

module.exports = { getUserProfile, getUserByEmail };