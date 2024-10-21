const express = require('express');
const router = express.Router();
const { createSubject, editSubject, deleteSubject } = require('../controllers/subjectController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

/**
 * @swagger
 * /subjects:
 *   post:
 *     summary: Create a new subject
 *     description: Create a new subject for a user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               folderId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Subject created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorised
 *       500:
 *         description: Internal server error
 */
router.post('/', createSubject);

/**
 * @swagger
 * /subjects/{id}:
 *   put:
 *     summary: Edit a subject
 *     description: Edit an existing subject for the user.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the subject to edit
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subject updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorised
 *       404:
 *         description: Subject not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', editSubject);

/**
 * @swagger
 * /subjects/{id}:
 *   delete:
 *     summary: Delete a subject
 *     description: Delete an existing subject for the user.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the subject to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subject deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Subject not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', deleteSubject);

module.exports = router;