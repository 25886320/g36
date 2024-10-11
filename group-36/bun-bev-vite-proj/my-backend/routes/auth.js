const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');

const router = express.Router();

// Route for registering a new user
router.post('/register', registerUser);

// Route for logging in a user
router.post('/login', loginUser);

module.exports = router;
