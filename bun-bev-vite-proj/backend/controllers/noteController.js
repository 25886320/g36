const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Create a new note
const createNote = async (req, res) => {
  const { title, content, folderName, subjectName, createdAt } = req.body;
  const ownerId = req.user.id; // Assuming you have middleware that sets req.user

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Validate input
    if (!title ||  !folderName || !subjectName) {
      return res.status(400).json({ message: 'Title, folder name, and subject name are required.' });
    }

    // Check if folder exists, if not create it
    let folderResult = await client.query('SELECT id FROM folders WHERE name = $1 AND owner_id = $2', [folderName, ownerId]);
    let folderId;
    if (folderResult.rows.length === 0) {
      folderResult = await client.query('INSERT INTO folders (name, owner_id, created_at) VALUES ($1, $2, $3) RETURNING id', [folderName, ownerId, createdAt]);
    }
    folderId = folderResult.rows[0].id;

    if (!folderId) {
      throw new Error('Failed to create or retrieve folder');
    }

    // Check if subject exists, if not create it
    let subjectResult = await client.query('SELECT id FROM subjects WHERE name = $1 AND folder_id = $2', [subjectName, folderId]);
    let subjectId;
    if (subjectResult.rows.length === 0) {
      subjectResult = await client.query('INSERT INTO subjects (name, folder_id, created_at) VALUES ($1, $2, $3) RETURNING id', [subjectName, folderId, createdAt]);
    }
    subjectId = subjectResult.rows[0].id;

    if (!subjectId) {
      throw new Error('Failed to create or retrieve subject');
    }

    // Insert the note into the database
    const noteResult = await client.query(
      'INSERT INTO notes (title, content, folder_id, subject_id, owner_id, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, content, folderId, subjectId, ownerId, createdAt]
    );

    await client.query('COMMIT');

    res.status(201).json({
      ...noteResult.rows[0],
      folderName,
      subjectName,
      created_at: noteResult.rows[0].created_at.toISOString() // Ensure the date is in ISO format
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating note:', err);
    res.status(500).json({ message: 'Error creating note' });
  } finally {
    client.release();
  }
};

const editNote = async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const userId = req.user.id;

  try {
    // Validate input
    if (!title) {
      return res.status(400).json({ message: 'Title is required.' });
    }

    const result = await pool.query(
      `UPDATE notes 
       SET title = $1, content = $2, updated_at = NOW() 
       WHERE id = $3 AND (owner_id = $4 OR id IN (
         SELECT note_id FROM user_notes WHERE user_id = $4 AND editor = true
       )) 
       RETURNING *`,
      [title, content, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found or you do not have permission to edit this note' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error editing note:', err);
    res.status(500).json({ message: 'Error editing note' });
  }
};


const deleteNote = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Check if the user is the owner or linked to the note
    const result = await pool.query(
      `DELETE FROM notes 
       WHERE id = $1 AND (owner_id = $2 OR id IN (
         SELECT note_id FROM user_notes WHERE user_id = $2
       )) 
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found or you do not have permission to delete this note' });
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    console.error('Error deleting note:', err);
    res.status(500).json({ message: 'Error deleting note' });
  }
};

const getAllNotes = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT DISTINCT notes.*, folders.name AS folder_name, subjects.name AS subject_name 
       FROM notes 
       LEFT JOIN folders ON notes.folder_id = folders.id 
       LEFT JOIN subjects ON notes.subject_id = subjects.id 
       WHERE notes.owner_id = $1 OR (notes.id IN (
         SELECT note_id FROM user_notes WHERE user_id = $1 AND answered_invite = true
       ))
       ORDER BY notes.created_at DESC`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({ message: 'No notes found', notes: [] });
    }

    res.json({ notes: result.rows });
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ message: 'Error fetching notes' });
  }
};

const updateNoteColor = async (req, res) => {
  const { id } = req.params;
  const { color } = req.body;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'UPDATE notes SET color = $1, updated_at = NOW() WHERE id = $2 AND owner_id = $3 RETURNING *',
      [color, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found or you do not have permission to update this note' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating note color:', err);
    res.status(500).json({ message: 'Error updating note color' });
  }
};

const getNote = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const noteResult = await pool.query(
      `SELECT notes.*, 
          CASE 
            WHEN notes.owner_id = $2 THEN true
            WHEN un.editor = true THEN true
            ELSE false
          END AS can_edit
       FROM notes
       LEFT JOIN user_notes un ON un.note_id = notes.id AND un.user_id = $2
       WHERE notes.id = $1`,
      [id, userId]
    );

    if (noteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found or you do not have permission to view this note' });
    }

    const note = noteResult.rows[0];

    res.json(note);
  } catch (err) {
    console.error('Error fetching note:', err);
    res.status(500).json({ message: 'Error fetching note' });
  }
};

module.exports = { createNote, editNote, deleteNote, getAllNotes, updateNoteColor, getNote };