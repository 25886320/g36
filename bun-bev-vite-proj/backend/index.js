require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const chalk = require('chalk'); // Import chalk

// Create an Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
const authRoutes = require('./routes/auth');
const subjectRoutes = require('./routes/subjects');
const noteRoutes = require('./routes/notes');
const userRoutes = require('./routes/users');
const folderRoutes = require('./routes/folders')
const noteUserRoutes = require('./routes/noteUser')
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

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`\nBackend server is running on ${chalk.cyan(`http://localhost:${PORT}`)}`);
  console.log(`Swagger documentation is available at ${chalk.cyan(`http://localhost:${PORT}/api-docs`)}`);
});

module.exports = app;