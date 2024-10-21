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
    const userId = req.user.id;
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

    // Find all notes owned by the user
    const notesResult = await client.query('SELECT id FROM notes WHERE owner_id = $1', [userId]);
    const noteIds = notesResult.rows.map(row => row.id);

    // Delete all records in user_notes where note_id matches the user's notes
    if (noteIds.length > 0) {
      await client.query('DELETE FROM user_notes WHERE note_id = ANY($1::int[])', [noteIds]);
    }

    // Delete all notes owned by the user
    await client.query('DELETE FROM notes WHERE owner_id = $1', [userId]);

    // Delete folders and subjects owned by the user
    await client.query('DELETE FROM subjects WHERE id IN (SELECT id FROM subjects WHERE folder_id IN (SELECT id FROM folders WHERE owner_id = $1))', [userId]);
    await client.query('DELETE FROM folders WHERE owner_id = $1', [userId]);

    // Delete the user
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

const getUserDetailsByEmails = async (req, res) => {
  const { emails, noteId } = req.body;

  if (!emails || !Array.isArray(emails) || !noteId) {
    return res.status(400).json({ error: 'Invalid request. A list of emails and a noteId are required.' });
  }

  try {
    // Fetch the user details for the provided emails
    const userQuery = `
      SELECT id, username, email, avatar_url 
      FROM users 
      WHERE email = ANY($1::text[])
    `;
    const userResult = await pool.query(userQuery, [emails]);

    if (!userResult.rows || userResult.rows.length === 0) {
      return res.status(404).json({ message: 'No users found with the provided emails' });
    }

    const usersWithRoles = [];
    for (const user of userResult.rows) {
      // Check if the user has an entry in the user_notes table
      const userNoteResult = await pool.query(
        `SELECT editor FROM user_notes WHERE note_id = $1 AND user_id = $2`,
        [noteId, user.id]
      );

      if (userNoteResult.rows.length > 0) {
        // User is in user_notes, determine their role
        const role = userNoteResult.rows[0].editor ? 'editor' : 'viewer';
        usersWithRoles.push({
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar_url,
          role,
        });
      } else {
        // User is not in user_notes, they are considered the owner
        usersWithRoles.push({
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar_url,
          role: 'owner',
        });
      }
    }

    res.status(200).json(usersWithRoles);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
};

const getUserRole = async (req, res) => {
  try {
    const { noteId } = req.body;
    const userId = req.user.id;

    if (!noteId) {
      return res.status(400).json({ error: 'Note ID is required.' });
    }

    // Check if the user is in the user_notes table
    const userNoteResult = await pool.query(
      `SELECT editor FROM user_notes WHERE note_id = $1 AND user_id = $2`,
      [noteId, userId]
    );

    if (userNoteResult.rows.length > 0) {
      // If the user is in the user_notes table, determine their role
      const role = userNoteResult.rows[0].editor ? 'editor' : 'viewer';
      return res.status(200).json({ role });
    }

    // If the user isn't in user_notes, check if they are in users
    const userResult = await pool.query(
      `SELECT id FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length > 0) {
      // If the user is in the users table, they are the owner
      return res.status(200).json({ role: 'owner' });
    }

    // If the user is not found
    return res.status(404).json({ error: 'User not found.' });
  } catch (error) {
    console.error('Error getting user role:', error);
    return res.status(500).json({ error: 'Failed to determine user role.' });
  }
};

module.exports = { 
  getUserProfile, 
  getUserByEmail, 
  deleteAccount, 
  updateUsername, 
  updateEmail,
  updateProfileImageUrl,
  checkEmailExists,
  getUserDetailsByEmails,
  getUserRole
};
