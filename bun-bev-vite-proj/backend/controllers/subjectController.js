const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const createSubject = async (req, res) => {
  try {
    const { name, folder_id } = req.body;

    // Input validation
    if (!name || !folder_id) {
      return res.status(400).json({ message: 'Name and folder ID are required' });
    }

    // First, check if the folder belongs to the user
    const folderCheck = await pool.query(
      'SELECT * FROM folders WHERE id = $1 AND owner_id = $2',
      [folder_id, req.user.id]
    );

    if (folderCheck.rows.length === 0) {
      return res.status(403).json({ message: 'You do not have permission to add subjects to this folder' });
    }

    const result = await pool.query(
      'INSERT INTO subjects (name, folder_id) VALUES ($1, $2) RETURNING id, name, folder_id',
      [name, folder_id]
    );

    const newSubject = result.rows[0];
    console.log('Subject created successfully:', newSubject);
    res.status(201).json(newSubject);
  } catch (err) {
    console.error('Error creating subject:', err);
    res.status(500).json({ message: 'Error creating subject' });
  }
};

const editSubject = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.user.id;

  // Input validation
  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  try {
    const query = `
      UPDATE subjects 
      SET name = $1 
      WHERE id = $2 AND folder_id IN (SELECT id FROM folders WHERE owner_id = $3)
      RETURNING id, name, folder_id
    `;
    const values = [name, id, userId];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Subject not found or you do not have permission to edit this subject' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error editing subject:', err);
    res.status(500).json({ message: 'Error editing subject' });
  }
};

const deleteSubject = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if the subject belongs to a folder owned by the user
    const subjectCheck = await client.query(
      'SELECT * FROM subjects WHERE id = $1 AND folder_id IN (SELECT id FROM folders WHERE owner_id = $2)',
      [id, userId]
    );

    if (subjectCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Subject not found or you do not have permission to delete this subject' });
    }

    // Delete all notes associated with the subject
    await client.query('DELETE FROM notes WHERE subject_id = $1', [id]);

    // Delete the subject
    await client.query('DELETE FROM subjects WHERE id = $1', [id]);

    await client.query('COMMIT');

    res.json({ message: 'Subject and all associated notes deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting subject:', err);
    res.status(500).json({ message: 'Error deleting subject' });
  } finally {
    client.release();
  }
};

module.exports = { createSubject, editSubject, deleteSubject };
