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
app.use(cors());
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

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Users currently logged in
const users = new Map();
const wsToEmail = new Map();

// Users working on a note
const activeUsersByNote = new Map();

// Notify all users in the note about the updated list of active users, excluding themselves
const notifyAllUsersInNote = (noteId) => {
  const usersInNote = activeUsersByNote.get(noteId);

  if (!usersInNote) return;

  usersInNote.forEach((userEmail) => {
    const userSocket = users.get(userEmail);
    if (userSocket && userSocket.readyState === WebSocket.OPEN) {
      const otherUsers = Array.from(usersInNote).filter((email) => email !== userEmail);

      userSocket.send(
        JSON.stringify({
          type: 'currentUsers',
          noteId,
          users: otherUsers,
        })
      );

      console.log(`Notified ${userEmail} about other users in the note:`, otherUsers);
    }
  });
};

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'register') {
      // Register a user by email when they connect
      users.set(data.email, ws);
      wsToEmail.set(ws, data.email);
      console.log(`${data.email} registered for live notifications`);

      // Log all currently registered users
      console.log('Current registered users:');
      users.forEach((_, email) => {
        console.log(email);
      });
    }

    if (data.type === 'joinNote') {
      const { noteId, email } = data;
      users.set(data.email, ws);

      if (!activeUsersByNote.has(noteId)) {
        activeUsersByNote.set(noteId, new Set());
      }

      const usersInNote = activeUsersByNote.get(noteId);
      usersInNote.add(email);
      wsToEmail.set(ws, email);
      console.log(`User ${email} joined note ${noteId}`);

      // Notify other users in the note
      usersInNote.forEach((userEmail) => {
        if (userEmail !== email) {
          const userSocket = users.get(userEmail);
          if (userSocket && userSocket.readyState === WebSocket.OPEN) {
            userSocket.send(
              JSON.stringify({
                type: 'userJoined',
                noteId,
                email,
              })
            );
          }
        }
      });

      notifyAllUsersInNote(noteId);

      // Log all users currently working on the note
      console.log(`Current users in note ${noteId}:`, Array.from(usersInNote));
    }

    if (data.type === 'share') {
      const { sharedEmail, noteId, sharedBy } = data;
      const recipientSocket = users.get(sharedEmail);

      if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
        recipientSocket.send(
          JSON.stringify({
            type: 'notification',
            message: `${sharedBy} has shared a note with you.`,
          })
        );
      }
    }

    // Handle note updates (real-time collaboration)
    if (data.type === 'noteUpdate') {
      const { noteId, updatedContent, updatedBy } = data;

      // Notify other users in the note with the updated content
      const usersInNote = activeUsersByNote.get(noteId);
      if (usersInNote) {
        usersInNote.forEach((userEmail) => {
          if (userEmail !== updatedBy) {
            const userSocket = users.get(userEmail);
            if (userSocket && userSocket.readyState === WebSocket.OPEN) {
              userSocket.send(
                JSON.stringify({
                  type: 'noteContentUpdate',
                  noteId,
                  updatedContent,
                  updatedBy,
                })
              );
            }
          }
        });
      }
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    const email = [...users.entries()].find(([, socket]) => socket === ws)?.[0];
    if (email) {
      console.log(`Client disconnected: ${email}`);
      users.delete(email);

      // Remove user from active notes
      activeUsersByNote.forEach((usersInNote, noteId) => {
        if (usersInNote.has(email)) {
          usersInNote.delete(email);
          console.log(`User ${email} left note ${noteId}`);

          notifyAllUsersInNote(noteId);

          if (usersInNote.size === 0) {
            activeUsersByNote.delete(noteId);
          }
        }
      });
    } else {
      console.log('Email not found for disconnected socket');
    }

    // Log all currently registered users
    console.log('Current live notification users:');
    users.forEach((_, email) => {
      console.log(email);
    });
  });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`\nBackend server is running on ${chalk.cyan(`http://localhost:${PORT}`)}`);
  console.log(`Swagger documentation is available at ${chalk.cyan(`http://localhost:${PORT}/api-docs`)}`);
});

module.exports = app;
