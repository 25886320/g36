require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const chalk = require('chalk');
const http = require('http');
const WebSocket = require('ws');

// Create an Express app
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:8000', 'https://g36.onrender.com'],
  credentials: true,
}));
app.use(express.json());
const authRoutes = require('./routes/auth');
const subjectRoutes = require('./routes/subjects');
const noteRoutes = require('./routes/notes');
const userRoutes = require('./routes/users');
const folderRoutes = require('./routes/folders');
const noteUserRoutes = require('./routes/noteUser');
const { swaggerUi, swaggerDocs } = require('./docs/swagger');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/auth', authRoutes);
app.use('/auth/users', userRoutes);
app.use('/notes', noteRoutes);
app.use('/auth/folders', folderRoutes);
app.use('/auth/subjects', subjectRoutes);
app.use('/auth/note-user', noteUserRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Create a server using the HTTP module
const server = http.createServer(app);

// Create a WebSocket server and attach it to the HTTP server
const wss = new WebSocket.Server({ server });

// Track connected users by email
const users = new Map();

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'register') {
      // Register a user by email when they connect
      users.set(data.email, ws);
      console.log(`${data.email} registered for real-time updates`);

      // Log all currently registered users
      console.log('Current registered users:');
      users.forEach((_, email) => {
        console.log(email);
      });
    }

    if (data.type === 'share') {
      const { sharedEmail, noteId, sharedBy } = data; // Include 'sharedBy'
      const recipientSocket = users.get(sharedEmail);

      if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
        recipientSocket.send(
          JSON.stringify({
            type: 'notification',
            message: `${sharedBy} has shared a note with you.`, // Updated message
          })
        );
      }
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    // Remove user on disconnect
    for (let [email, socket] of users.entries()) {
      if (socket === ws) {
        users.delete(email);
        break;
      }
    }
    console.log('Client disconnected');

    // Log all currently registered users
    console.log('Current registered users:');
    users.forEach((_, email) => {
      console.log(email);
    });
  });
});

// Start the HTTP server and WebSocket server on the same port
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`\nBackend server is running on ${chalk.cyan(`http://localhost:${PORT}`)}`);
  console.log(`Swagger documentation is available at ${chalk.cyan(`http://localhost:${PORT}/api-docs`)}`);
});

module.exports = app;
