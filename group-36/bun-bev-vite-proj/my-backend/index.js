require('dotenv').config();  // Load environment variables
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// Create an Express app
const app = express();

// Middleware to parse JSON
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const userRoutes = require('./routes/users');
app.use('/users', userRoutes);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/auth/register', upload.single('avatar'), AuthController.registerUser);
app.post('/auth/login', AuthController.loginUser);

// PostgreSQL connection using environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,  // This is needed for Supabase connection
  },
});


app.get('/', (req, res) => {
  res.send('Server is running');
});

app.post('/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if the username already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert the new user
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [username, email, hashedPassword]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error during user registration:', err);
    res.status(500).json({ message: 'Error registering user', error: err });
  }
});

// Login an existing user
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(400).send('User not found');
    }

    // Compare the provided password with the hashed password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(400).send('Invalid credentials');
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error logging in');
  }
});

// Protected route example (requires valid JWT)
app.get('/protected', authenticateToken, (req, res) => {
  res.send('This is a protected route');
});

// Middleware to authenticate JWT tokens
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);  // No token, unauthorized

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);  // Invalid token, forbidden
    req.user = user;
    next();  // Proceed to the next handler if token is valid
  });
}


app.post('/notes', authenticateToken, async (req, res) => {
  const { title, content } = req.body;
  const ownerId = req.user.userId;

  try {
    const result = await pool.query(
      'INSERT INTO notes (title, content, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [title, content, ownerId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating note:', err);
    res.status(500).json({ message: 'Error creating note', error: err });
  }
});

// Update a note
app.put('/notes/:id', authenticateToken, async (req, res) => {
  const { title, content } = req.body;
  const { id } = req.params;
  const ownerId = req.user.userId;

  try {
    const result = await pool.query(
      'UPDATE notes SET title = $1, content = $2, updated_at = NOW() WHERE id = $3 AND owner_id = $4 RETURNING *',
      [title, content, id, ownerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found or unauthorized' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating note:', err);
    res.status(500).json({ message: 'Error updating note', error: err });
  }
});

// Delete a note
app.delete('/notes/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user.userId;

  try {
    const result = await pool.query(
      'DELETE FROM notes WHERE id = $1 AND owner_id = $2 RETURNING *',
      [id, ownerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found or unauthorized' });
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    console.error('Error deleting note:', err);
    res.status(500).json({ message: 'Error deleting note', error: err });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
