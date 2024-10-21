const express = require('express');
// const multer = require('multer');
// const path = require('path');
const authMiddleware = require('../middleware/auth');
const { Pool } = require('pg');
const { getUserProfile, getUserByEmail, deleteAccount, updateUsername, updateEmail, updateProfileImageUrl, checkEmailExists, getUserDetailsByEmails, getUserRole } = require('../controllers/userController');
const router = express.Router();



/**
 * @swagger
 * /users/check-email:
 *   post:
 *     summary: Check if an email exists
 *     description: Check if the provided email exists in the database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */
router.post('/check-email', checkEmailExists);

router.use(authMiddleware);

router.put('/profile-image', updateProfileImageUrl);

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve profile information of a user.
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
 *         description: Unauthorised
 *       500:
 *         description: Internal server error
 */
router.get('/profile', getUserProfile);

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
 *         description: Unauthorised
 *       500:
 *         description: Internal server error
 */


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
 *         description: Unauthorised
 *       500:
 *         description: Internal server error
 */
router.get('/data', async (req, res) => {
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
 *         description: Unauthorised
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/by-email/:email', getUserByEmail);

/**
 * @swagger
 * /users/account:
 *   delete:
 *     summary: Delete user account
 *     description: Delete the user's account.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         description: Unauthorised
 *       500:
 *         description: Internal server error
 */
router.delete('/account', authMiddleware, deleteAccount);

/**
 * @swagger
 * /users/username:
 *   put:
 *     summary: Update user's username
 *     description: Update the user's username.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Username updated successfully
 *       400:
 *         description: Invalid username
 *       401:
 *         description: Unauthorised
 *       500:
 *         description: Internal server error
 */
router.put('/username', authMiddleware, updateUsername);

/**
 * @swagger
 * /users/email:
 *   put:
 *     summary: Update user's email
 *     description: Update the user's email.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email updated successfully
 *       400:
 *         description: Invalid email
 *       401:
 *         description: Unauthorised
 *       500:
 *         description: Internal server error
 */
router.put('/email', authMiddleware, updateEmail);

/**
 * @swagger
 * /users/getUserDetailsByEmails:
 *   post:
 *     summary: Get user details by multiple emails
 *     description: Retrieve user information for multiple emails.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emails:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   username:
 *                     type: string
 *                   email:
 *                     type: string
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post('/getUserDetailsByEmails', (req, res) => {
  getUserDetailsByEmails(req, res);
});

/**
 * @swagger
 * /users/getUserRole:
 *   post:
 *     summary: Get user role
 *     description: Retrieve the role of the user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: User role retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 role:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post('/getUserRole', getUserRole);

module.exports = router;
