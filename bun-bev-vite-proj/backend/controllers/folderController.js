const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const getFoldersAndSubjects = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const result = await pool.query(
      `SELECT 
        f.id AS folder_id, 
        f.name AS folder_name, 
        s.id AS subject_id, 
        s.name AS subject_name,
        s.created_at AS subject_created_at,
        COALESCE(MAX(n.updated_at), s.created_at) AS last_edit_date
      FROM 
        folders f
      LEFT JOIN 
        subjects s ON f.id = s.folder_id
      LEFT JOIN 
        notes n ON n.subject_id = s.id
      WHERE 
        f.owner_id = $1
      GROUP BY 
        f.id, s.id
      ORDER BY 
        f.name, s.name`,
      [ownerId]
    );

    const folders = result.rows.reduce((acc, row) => {
      if (!acc[row.folder_id]) {
        acc[row.folder_id] = {
          id: row.folder_id,
          name: row.folder_name,
          subjects: []
        };
      }
      if (row.subject_id) {
        acc[row.folder_id].subjects.push({
          id: row.subject_id,
          name: row.subject_name,
          lastEditDate: row.last_edit_date || row.subject_created_at
        });
      }
      return acc;
    }, {});

    res.json({ folders: Object.values(folders) });
  } catch (err) {
    console.error('Error fetching folders and subjects:', err);
    res.status(500).json({ message: 'Error fetching folders and subjects' });
  }
};

const createFolder = async (req, res) => {
  try {
    const { name } = req.body;
    const ownerId = req.user.id;

    // Validate folder name
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Folder name is required' });
    }

    const result = await pool.query(
      'INSERT INTO folders (name, owner_id) VALUES ($1, $2) RETURNING id, name',
      [name, ownerId]
    );

    const newFolder = result.rows[0];
    res.status(201).json(newFolder);
  } catch (err) {
    console.error('Error creating folder:', err);
    res.status(500).json({ message: 'Error creating folder' });
  }
};

const deleteFolder = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if the folder belongs to the user
    const folderCheck = await client.query('SELECT * FROM folders WHERE id = $1 AND owner_id = $2', [id, userId]);
    if (folderCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Folder not found or you do not have permission to delete this folder' });
    }

    // Delete all notes associated with the folder
    await client.query('DELETE FROM notes WHERE folder_id = $1', [id]);

    // Delete all subjects associated with the folder
    await client.query('DELETE FROM subjects WHERE folder_id = $1', [id]);

    // Delete the folder
    await client.query('DELETE FROM folders WHERE id = $1', [id]);

    await client.query('COMMIT');

    res.json({ message: 'Folder and all associated notes and subjects deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting folder:', err);
    res.status(500).json({ message: 'Error deleting folder' });
  } finally {
    client.release();
  }
};

const editFolder = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.user.id;

  try {
    const query = `
      UPDATE folders 
      SET name = $1 
      WHERE id = $2 AND owner_id = $3 
      RETURNING id, name, owner_id
    `;
    const values = [name, id, userId];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Folder not found or you do not have permission to edit this folder' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error editing folder:', err);

    res.status(500).json({ 
      message: 'Error editing folder' 
    });
  }
};

module.exports = { createFolder, getFoldersAndSubjects, deleteFolder, editFolder };
