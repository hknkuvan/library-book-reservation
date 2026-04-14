const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/reservationController');

// All routes require authentication
router.use(authenticate);

// User routes
router.post('/', ctrl.borrowBook);                    // Borrow a book
router.put('/:id/return', ctrl.returnBook);            // Return a book
router.get('/my', ctrl.getMyReservations);              // My reservations

// Admin routes
router.get('/stats', requireAdmin, ctrl.getStats);      // Stats (must be before /)
router.get('/', requireAdmin, ctrl.getAllReservations);  // All reservations

module.exports = router;
