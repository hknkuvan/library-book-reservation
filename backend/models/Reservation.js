const db = require('../config/db');

class Reservation {
  /**
   * Borrow a book — creates reservation & decrements available_copies
   */
  static create(userId, bookId) {
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId);
    if (!book) return { error: 'Book not found.' };
    if (book.available_copies < 1) return { error: 'No copies available for this book.' };

    // Check if user already has this book borrowed
    const existing = db.prepare(
      'SELECT id FROM reservations WHERE user_id = ? AND book_id = ? AND status = ?'
    ).get(userId, bookId, 'active');
    if (existing) return { error: 'You already have this book borrowed.' };

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // 14-day loan period

    const stmt = db.prepare(`
      INSERT INTO reservations (user_id, book_id, status, borrowed_at, due_date)
      VALUES (?, ?, 'active', CURRENT_TIMESTAMP, ?)
    `);
    const result = stmt.run(userId, bookId, dueDate.toISOString().split('T')[0]);

    // Decrement available copies
    db.prepare('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?').run(bookId);

    return { success: true, reservation: Reservation.findById(result.lastInsertRowid) };
  }

  /**
   * Return a book
   */
  static returnBook(reservationId, userId) {
    const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(reservationId);
    if (!reservation) return { error: 'Reservation not found.' };
    if (reservation.status !== 'active' && reservation.status !== 'overdue')
      return { error: 'This reservation is already returned.' };
    // Normal users can only return their own
    if (userId && reservation.user_id !== userId) return { error: 'Not your reservation.' };

    db.prepare(`
      UPDATE reservations SET status = 'returned', returned_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(reservationId);

    db.prepare('UPDATE books SET available_copies = available_copies + 1 WHERE id = ?').run(reservation.book_id);

    return { success: true, reservation: Reservation.findById(reservationId) };
  }

  /**
   * Find reservation by ID (with book + user info)
   */
  static findById(id) {
    return db.prepare(`
      SELECT r.*, b.title AS book_title, b.author AS book_author, b.category AS book_category, b.isbn AS book_isbn,
             u.first_name, u.last_name, u.email
      FROM reservations r
      JOIN books b ON r.book_id = b.id
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `).get(id);
  }

  /**
   * Find all reservations for a user
   */
  static findByUser(userId, status = null) {
    let query = `
      SELECT r.*, b.title AS book_title, b.author AS book_author, b.category AS book_category,
             b.isbn AS book_isbn, b.pages AS book_pages
      FROM reservations r
      JOIN books b ON r.book_id = b.id
      WHERE r.user_id = ?
    `;
    const params = [userId];

    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }

    query += ' ORDER BY r.created_at DESC';
    return db.prepare(query).all(...params);
  }

  /**
   * Find all reservations (admin) with filters
   */
  static findAll({ status, search, page = 1, limit = 20 } = {}) {
    let query = `
      SELECT r.*, b.title AS book_title, b.author AS book_author, b.category AS book_category,
             u.first_name, u.last_name, u.email
      FROM reservations r
      JOIN books b ON r.book_id = b.id
      JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (b.title LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const countQuery = query.replace(/SELECT r\.\*.*?FROM/, 'SELECT COUNT(*) as count FROM');
    const { count } = db.prepare(countQuery).get(...params);

    const offset = (page - 1) * limit;
    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return {
      reservations: db.prepare(query).all(...params),
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / limit) }
    };
  }

  /**
   * Get reservation statistics
   */
  static getStats() {
    const active = db.prepare("SELECT COUNT(*) as count FROM reservations WHERE status = 'active'").get().count;
    const overdue = db.prepare("SELECT COUNT(*) as count FROM reservations WHERE status = 'overdue'").get().count;
    const returned = db.prepare("SELECT COUNT(*) as count FROM reservations WHERE status = 'returned'").get().count;
    const total = db.prepare("SELECT COUNT(*) as count FROM reservations").get().count;
    const dueSoon = db.prepare("SELECT COUNT(*) as count FROM reservations WHERE status = 'active' AND due_date <= date('now', '+3 days')").get().count;
    return { active, overdue, returned, total, dueSoon };
  }

  /**
   * Mark overdue reservations
   */
  static checkOverdue() {
    const result = db.prepare(`
      UPDATE reservations SET status = 'overdue'
      WHERE status = 'active' AND due_date < date('now')
    `).run();
    return result.changes;
  }
}

module.exports = Reservation;
