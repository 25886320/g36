const express = require('express');
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/auth');
const { Pool } = require('pg');
const { getUserProfile, getUserByEmail } = require('../controllers/userController');
const router = express.Router();

// Set up multer for avatar uploads (if needed)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/avatars'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = req.user.id + ext;
    cb(null, filename);
  }
});

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve profile information of authenticated user.
 *     responses:
 *       200:
 *         description: Profile information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/profile', getUserProfile);

const upload = multer({ storage });

/**
 * @swagger
 * /users/upload-avatar:
 *   post:
 *     summary: Upload user avatar
 *     description: Upload an avatar image for a user.
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *       400:
 *         description: No file uploaded
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// Route to handle avatar upload
// router.post('/upload-avatar', authenticateToken, upload.single('avatar'), (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ message: 'No file uploaded' });
//   }
//   // Handle successful upload
// });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

/**
 * @swagger
 * /users/data:
 *   get:
 *     summary: Get user data
 *     description: Retrieve folders and subjects belonging to user.
 *     responses:
 *       200:
 *         description: User data including folders and subjects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 folders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       subjects:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             notes:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                   title:
 *                                     type: string
 *                                   content:
 *                                     type: string
 *                                   createdAt:
 *                                     type: string
 *                                     format: date-time
 *                                   updatedAt:
 *                                     type: string
 *                                     format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/data', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const foldersResult = await pool.query(
      'SELECT id, name FROM folders WHERE owner_id = $1',
      [userId]
    );

    const folders = await Promise.all(foldersResult.rows.map(async (folder) => {
      const subjectsResult = await pool.query(
        'SELECT id, name FROM subjects WHERE folder_id = $1',
        [folder.id]
      );

      const subjects = await Promise.all(subjectsResult.rows.map(async (subject) => {
        const notesResult = await pool.query(
          'SELECT id, title, content, created_at, updated_at FROM notes WHERE subject_id = $1',
          [subject.id]
        );

        return {
          id: subject.id,
          name: subject.name,
          notes: notesResult.rows.map(note => ({
            id: note.id,
            title: note.title,
            content: note.content,
            createdAt: note.created_at,
            updatedAt: note.updated_at
          }))
        };
      }));

      return {
        id: folder.id,
        name: folder.name,
        subjects
      };
    }));

    res.json({ folders });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

/**
 * @swagger
 * /users/by-email/{email}:
 *   get:
 *     summary: Get user by email
 *     description: Retrieve user information by email.
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/by-email/:email', authMiddleware, getUserByEmail);

module.exports = router;