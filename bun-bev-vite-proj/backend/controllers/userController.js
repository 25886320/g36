const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query('SELECT id, username, email, avatar_url FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ message: 'Error fetching user profile' });
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
    res.status(500).json({ message: 'Error fetching user' });
  }
};

const updateProfileImageUrl = async (req, res) => {
  try {
    const userId = req.user.id; // Middleware sets this
    const { imageUrl } = req.body;

    const result = await pool.query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2',
      [imageUrl, userId]
    );

    res.status(200).json({ message: 'Profile image updated successfully' });
  } catch (err) {
    console.error('Error updating profile image:', err);
    res.status(500).json({ message: 'Error updating profile image' });
  }
};

const deleteAccount = async (req, res) => {
  const userId = req.user.id;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM notes WHERE owner_id = $1', [userId]);
    await client.query('DELETE FROM subjects WHERE id IN (SELECT id FROM subjects WHERE folder_id IN (SELECT id FROM folders WHERE owner_id = $1))', [userId]);
    await client.query('DELETE FROM folders WHERE owner_id = $1', [userId]);
    await client.query('DELETE FROM user_notes WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
    await client.query('COMMIT');

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting account:', err);
    res.status(500).json({ message: 'Error deleting account' });
  } finally {
    client.release();
  }
};

const updateUsername = async (req, res) => {
  const userId = req.user.id;
  const { username } = req.body;

  if (!username || username.trim() === '') {
    return res.status(400).json({ message: 'Invalid username' });
  }

  try {
    // Check if the username already exists
    const usernameCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    await pool.query('UPDATE users SET username = $1 WHERE id = $2', [username, userId]);
    res.json({ message: 'Username updated successfully' });
  } catch (err) {
    console.error('Error updating username:', err);
    res.status(500).json({ message: 'Error updating username' });
  }
};

const updateEmail = async (req, res) => {
  const userId = req.user.id;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Invalid email' });
  }

  try {
    // Email validation
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email' });
    }

    // Check if the email already exists
    const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    await pool.query('UPDATE users SET email = $1 WHERE id = $2', [email, userId]);
    res.json({ message: 'Email updated successfully' });
  } catch (err) {
    console.error('Error updating email:', err);
    res.status(500).json({ message: 'Error updating email' });
  }
};

const checkEmailExists = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const exists = result.rows.length > 0;
    res.json({ exists });
  } catch (err) {
    console.error('Error checking email existence:', err);
    res.status(500).json({ message: 'Error checking email' });
  }
};

module.exports = { 
  getUserProfile, 
  getUserByEmail, 
  deleteAccount, 
  updateUsername, 
  updateEmail,
  updateProfileImageUrl,
  checkEmailExists
};
