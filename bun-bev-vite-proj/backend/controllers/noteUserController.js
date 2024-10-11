const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const getPendingInvites = async (req, res) => {
  const userId = req.user.id; 
  try {
    const result = await pool.query(
      `SELECT 
        n.id AS note_id,
        n.title,
        n.content,
        n.subject_id,
        n.folder_id,
        u.username AS shared_by,
        f.name AS folder_name,  -- Join to get folder name
        s.name AS subject_name   -- Join to get subject name
      FROM user_notes AS un
      JOIN notes AS n ON un.note_id = n.id
      JOIN users AS u ON n.owner_id = u.id
      LEFT JOIN folders AS f ON n.folder_id = f.id  -- Join to folders table
      LEFT JOIN subjects AS s ON n.subject_id = s.id  -- Join to subjects table
      WHERE un.user_id = $1 AND un.answered_invite = false`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching note invites:', error);
    res.status(500).json({ message: 'Error fetching note invites' });
  }
}

const addUserToNote = async (req, res) => {
  const { email, editor, noteId } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const userResult = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userId = userResult.rows[0].id;

    const noteResult = await client.query('SELECT id FROM notes WHERE id = $1', [noteId]);
    if (noteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }

    await client.query(
      'INSERT INTO user_notes (user_id, note_id, editor, answered_invite) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, note_id) DO UPDATE SET editor = $3',
      [userId, noteId, editor, false]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'User added to note successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error adding user to note:', err);
    res.status(500).json({ message: 'Error adding user to note', error: err.message });
  } finally {
    client.release();
  }
};

const acceptInvite = async (req, res) => {
  const { noteId } = req.body;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `UPDATE user_notes 
       SET answered_invite = true 
       WHERE user_id = $1 AND note_id = $2`,
      [userId, noteId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Invite not found' });
    }

    res.status(200).json({ message: 'Invite accepted successfully' });
  } catch (error) {
    console.error('Error accepting invite:', error);
    res.status(500).json({ message: 'Error accepting invite' });
  }
};

const rejectInvite = async (req, res) => {
  const noteId = req.params.noteId;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `DELETE FROM user_notes 
       WHERE user_id = $1 AND note_id = $2`,
      [userId, noteId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Invite not found' });
    }

    res.status(200).json({ message: 'Invite rejected successfully' });
  } catch (error) {
    console.error('Error rejecting invite:', error);
    res.status(500).json({ message: 'Error rejecting invite' });
  }
};

module.exports = { 
  addUserToNote,
  getPendingInvites,
  acceptInvite,
  rejectInvite
};
