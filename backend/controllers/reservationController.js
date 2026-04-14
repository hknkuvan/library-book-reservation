const Reservation = require('../models/Reservation');

// Mark overdue on every request (lightweight check)
const checkOverdue = () => { try { Reservation.checkOverdue(); } catch (e) { /* ignore */ } };

/**
 * POST /api/reservations — Borrow a book
 */
exports.borrowBook = (req, res) => {
  try {
    checkOverdue();
    const { book_id } = req.body;
    if (!book_id) return res.status(400).json({ success: false, message: 'book_id is required.' });

    const result = Reservation.create(req.user.id, book_id);
    if (result.error) return res.status(400).json({ success: false, message: result.error });

    res.status(201).json({ success: true, message: 'Book borrowed successfully! Due in 14 days.', reservation: result.reservation });
  } catch (error) {
    console.error('Borrow error:', error);
    res.status(500).json({ success: false, message: 'Failed to borrow book.' });
  }
};

/**
 * PUT /api/reservations/:id/return — Return a book
 */
exports.returnBook = (req, res) => {
  try {
    const userId = req.user.role === 'system_admin' ? null : req.user.id;
    const result = Reservation.returnBook(req.params.id, userId);
    if (result.error) return res.status(400).json({ success: false, message: result.error });

    res.json({ success: true, message: 'Book returned successfully!', reservation: result.reservation });
  } catch (error) {
    console.error('Return error:', error);
    res.status(500).json({ success: false, message: 'Failed to return book.' });
  }
};

/**
 * GET /api/reservations/my — User's reservations
 */
exports.getMyReservations = (req, res) => {
  try {
    checkOverdue();
    const { status } = req.query;
    const reservations = Reservation.findByUser(req.user.id, status || null);
    res.json({ success: true, reservations });
  } catch (error) {
    console.error('My reservations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reservations.' });
  }
};

/**
 * GET /api/reservations — Admin: all reservations
 */
exports.getAllReservations = (req, res) => {
  try {
    checkOverdue();
    const { status, search, page, limit } = req.query;
    const data = Reservation.findAll({ status, search, page: page || 1, limit: limit || 50 });
    res.json({ success: true, ...data });
  } catch (error) {
    console.error('All reservations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reservations.' });
  }
};

/**
 * GET /api/reservations/stats — Admin: reservation stats
 */
exports.getStats = (req, res) => {
  try {
    checkOverdue();
    const stats = Reservation.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
};
