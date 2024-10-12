const express = require('express');
const router = express.Router();
const { createFolder, getFoldersAndSubjects, deleteFolder, editFolder } = require('../controllers/folderController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

/**
 * @swagger
 * /folders:
 *   post:
 *     summary: Create a new folder
 *     description: Create a new folder for a user.
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
 *       201:
 *         description: Folder created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', createFolder);

/**
 * @swagger
 * /folders:
 *   get:
 *     summary: Get all folders and their subjects
 *     description: Retrieve all folders and subjects in them for the user.
 *     responses:
 *       200:
 *         description: A list of folders and their subjects
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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', getFoldersAndSubjects);

/**
 * @swagger
 * /folders/{id}:
 *   delete:
 *     summary: Delete a folder
 *     description: Delete an existing folder for the user.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the folder to delete
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Folder deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Folder not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', deleteFolder);

/**
 * @swagger
 * /folders/{id}:
 *   put:
 *     summary: Edit a folder
 *     description: Edit an existing folder for the user.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the folder to edit
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
 *         description: Folder updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Folder not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', editFolder);

module.exports = router;