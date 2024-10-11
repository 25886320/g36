const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// PostgreSQL pool setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,  // Required for Supabase
  },
});

// Register a new user with optional avatar
const registerUser = async (req, res) => {
  const { email, password } = req.body;
  const avatar = req.file; // Assuming avatar is sent as multipart/form-data

  try {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save avatar to disk if provided
    let avatarPath = null;
    if (avatar) {
      const avatarFileName = `${Date.now()}-${avatar.originalname}`;
      avatarPath = path.join('uploads', 'avatars', avatarFileName);

      // Save the file to disk
      fs.writeFileSync(avatarPath, avatar.buffer);
    }

    // Insert the user into the database
    const result = await pool.query(
      'INSERT INTO users (email, password, avatar_url) VALUES ($1, $2, $3) RETURNING *',
      [email, hashedPassword, avatarPath]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error registering user');
  }
};

// Login an existing user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(400).send('User not found');
    }

    // Compare provided password with the hashed password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).send('Invalid credentials');
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error logging in');
  }
};

module.exports = { registerUser, loginUser };
