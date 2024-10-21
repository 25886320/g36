const express = require('express');
const router = express.Router();
const { createNote, editNote, deleteNote, getAllNotes, updateNoteColor, getNote, getSharedNotes} = require('../controllers/noteController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

/**
 * @swagger
 * /notes:
 *   get:
 *     summary: Get all notes
 *     description: Retrieve list of all notes for a user.
 *     responses:
 *       200:
 *         description: A list of notes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   content:
 *                     type: string
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', getAllNotes);

/**
 * @swagger
 * /notes:
 *   get:
 *     summary: Get all shared notes
 *     description: Retrieve list of all notes for a user.
 *     responses:
 *       200:
 *         description: A list of notes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   content:
 *                     type: string
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/shared-notes', getSharedNotes);

/**
 * @swagger
 * /notes:
 *   post:
 *     summary: Create a new note
 *     description: Create a new note for the user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Note created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', createNote);

/**
 * @swagger
 * /notes/{id}:
 *   put:
 *     summary: Edit a note
 *     description: Edit an existing note for the user.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the note to edit
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Note updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', editNote);

/**
 * @swagger
 * /notes/{id}/color:
 *   put:
 *     summary: Update the colour of a note
 *     description: Change the colour of an existing note
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the note to update the colour of
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               color:
 *                 type: string
 *     responses:
 *       200:
 *         description: Note color updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorised
 *       404:
 *         description: Note not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/color', updateNoteColor);

/**
 * @swagger
 * /notes/{id}:
 *   delete:
 *     summary: Delete a note
 *     description: Delete an existing note.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the note to delete
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Note deleted successfully
 *       401:
 *         description: Unauthorised
 *       404:
 *         description: Note not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', deleteNote);

/**
 * @swagger
 * /notes/{id}:
 *   get:
 *     summary: Get a specific note
 *     description: Retrieve a specific note by its ID.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the note to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A note object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 content:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorised
 *       404:
 *         description: Note not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getNote);

module.exports = router;
