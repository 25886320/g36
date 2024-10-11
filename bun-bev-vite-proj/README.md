## Project Report

You can view the project's detailed report in Google Docs [here](https://docs.google.com/document/d/11rplxgnQL0naLAn9VyG4lKZTYkgSOLiQvS0O6OvDBUM/edit?usp=sharing).

## Project Overview

This is a collaborative note-taking web application designed to allow users to create, share, and edit notes in real-time. The app supports markdown rendering for easy note formatting, secure authentication using JWT tokens, and real-time updates using WebSockets to enable smooth multi-user collaboration. 

## Folder Structure

```markdown
├── backend                 # Backend code (Node.js)
│   ├── controllers         # Handles the business logic
│   ├── routes              # API routes (auth, user)
│   └── index.js            # Entry point for the backend
├── database                # Database SQL and access info
├── frontend                # Frontend code (React.js + Tailwind CSS)
│   ├── src
│   │   ├── assets          # All assets (images, svg files, etc.)
│   │   ├── components      # React components
│   │   └── styles          # Global and component-specific styles
│   ├── public              # Static assets (images, favicon, etc.)
│   └── index.html          # Main HTML file
└── README.md               # Project documentation
```

## Tech Stack

- **Frontend**: React.js, Tailwind CSS, Marked.js
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (Supabase)
- **Real-time Collaboration**: WebSockets
- **Authentication**: JWT Tokens

## How to Run the Application

### Prerequisites

- Node.js

- `.env` file in backend/. See README in backend directory.

### 1. Install Dependencies:

- Run this command in the root directory (`bun-bev-vite-proj/`) to install all dependencies for both frontend and backend:

```bash
npm run install-all
```

### 2. Run the Application

- Run this command in the root directory (`bun-bev-vite-proj/`) to run both frontend and backend together:

```bash
npm run start
```

### 3. Run Individually (Optional)

**Frontend:**

```bash
cd frontend
npm run dev
```

**Backend:**

```bash
cd backend
npm start
```