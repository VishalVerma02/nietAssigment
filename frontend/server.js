const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
let PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, '.')));

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/admin-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

app.get('/admin-dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

app.get('/admin-management', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-management.html'));
});

app.get('/admin-management.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-management.html'));
});

app.get('/assignment', (req, res) => {
  res.sendFile(path.join(__dirname, 'assignment.html'));
});

app.get('/assignment.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'assignment.html'));
});

// Start server with error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Frontend server running at http://localhost:${PORT}`);
  console.log(`📖 Open: http://localhost:${PORT}/login.html\n`);
});

// Handle port already in use
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use`);
    console.error(`Trying to kill existing process...`);
    process.exit(1);
  } else {
    throw err;
  }
});
