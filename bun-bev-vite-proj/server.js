const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the frontend
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// API routes
app.use('/api', require('./backend'));

// Handle all other routes by serving the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});