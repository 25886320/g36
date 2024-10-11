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

    console.log('Attempting to create subject:', { name, folder_id });

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
    console.error('Error details:', err.message);
    if (err.code) {
      console.error('Error code:', err.code);
    }
    res.status(500).json({ message: 'Error creating subject', error: err.message });
  }
};

module.exports = { createSubject };