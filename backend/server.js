const express = require('express');
const cors = require('cors');
require('dotenv').config();

const initDatabase = require('./utils/initDb');
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const reservationRoutes = require('./routes/reservations');
const userBookRoutes = require('./routes/userBooks');

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
app.use('/api/books', bookRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/user-books', userBookRoutes);

// Admin: get all users (simple inline)
const { authenticate, requireAdmin } = require('./middleware/auth');
const db = require('./config/db');

app.get('/api/admin/users', authenticate, requireAdmin, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.role, u.created_at,
             (SELECT COUNT(*) FROM reservations r WHERE r.user_id = u.id AND r.status = 'active') as active_reservations,
             (SELECT COUNT(*) FROM user_books ub WHERE ub.user_id = u.id) as library_count
      FROM users u ORDER BY u.created_at DESC
    `).all();
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
});

app.get('/api/admin/stats', authenticate, requireAdmin, (req, res) => {
  try {
    const totalBooks = db.prepare('SELECT COUNT(*) as c FROM books').get().c;
    const totalUsers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'end_user'").get().c;
    const activeRes = db.prepare("SELECT COUNT(*) as c FROM reservations WHERE status = 'active'").get().c;
    const overdueRes = db.prepare("SELECT COUNT(*) as c FROM reservations WHERE status = 'overdue'").get().c;
    const returnedRes = db.prepare("SELECT COUNT(*) as c FROM reservations WHERE status = 'returned'").get().c;
    const totalRes = db.prepare('SELECT COUNT(*) as c FROM reservations').get().c;
    const recentBooks = db.prepare("SELECT COUNT(*) as c FROM books WHERE created_at >= date('now', '-30 days')").get().c;
    res.json({ success: true, stats: { totalBooks, totalUsers, activeRes, overdueRes, returnedRes, totalRes, recentBooks } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
});

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
    console.log(`\nAPI Endpoints ready ✅`);
  });
} catch (error) {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
}
