const express = require('express');
const router = express.Router();
const { addUserToNote, getPendingInvites, acceptInvite, rejectInvite } = require('../controllers/noteUserController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

/**
 * @swagger
 * /note-user:
 *   post:
 *     summary: Add a user to a note
 *     description: Add a user to a note with specified permissions.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               editor:
 *                 type: boolean
 *               noteId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: User added to note successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User or Note not found
 *       500:
 *         description: Internal server error
 */
router.post('/', addUserToNote);

/**
 * @swagger
 * /auth/note-user/pending-invites:
 *   get:
 *     summary: Get pending invites for the user
 *     description: Retrieve all pending invites for the user.
 *     responses:
 *       200:
 *         description: A list of pending invites
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   noteId:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   sharedBy:
 *                     type: string
 *                   answeredInvite:
 *                     type: boolean
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/pending-invites', getPendingInvites);

/**
 * @swagger
 * /auth/note-user/accept:
 *   post:
 *     summary: Accept a shared note invite
 *     description: Mark a shared note invite as accepted.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               noteId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Invite accepted successfully
 *       404:
 *         description: Invite not found
 *       500:
 *         description: Internal server error
 */
router.post('/accept', acceptInvite);

/**
 * @swagger
 * /auth/note-user/reject:
 *   delete:
 *     summary: Reject a shared note invite
 *     description: Remove a shared note invite.
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         description: The ID of the note to reject
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Invite rejected successfully
 *       404:
 *         description: Invite not found
 *       500:
 *         description: Internal server error
 */
router.delete('/reject/:noteId', rejectInvite);

module.exports = router;
