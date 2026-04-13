const express = require('express');
const cors = require('cors');
require('dotenv').config();

const initDatabase = require('./utils/initDb');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found.'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error.'
  });
});

// Initialize database and start server
try {
  initDatabase();
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 Library Book Reservation System - Backend API`);
    console.log(`💾 Database: SQLite (file-based, no setup required)`);
    console.log(`\nAPI Endpoints:`);
    console.log(`  POST   /api/auth/register  - Create account`);
    console.log(`  POST   /api/auth/login     - Login`);
    console.log(`  POST   /api/auth/logout    - Logout`);
    console.log(`  GET    /api/auth/profile   - Get profile`);
    console.log(`  PUT    /api/auth/profile   - Update profile`);
    console.log(`  DELETE /api/auth/profile   - Delete account`);
  });
} catch (error) {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
}
