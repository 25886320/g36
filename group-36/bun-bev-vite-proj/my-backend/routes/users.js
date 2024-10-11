const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../Controllers/AuthController');  // Import authentication middleware

const router = express.Router();

// Set up multer to store avatars in uploads/avatars
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/avatars'));  // Correct the path for storing avatars
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = req.user.userId + ext;  // Save the file with the user ID as filename
    cb(null, filename);
  }
});

const upload = multer({ storage });

// Route to handle avatar upload
router.post('/upload-avatar', authenticateToken, upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

 
