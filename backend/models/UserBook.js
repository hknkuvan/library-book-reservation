const db = require('../config/db');

class UserBook {
  /**
   * Add book to personal library
   */
  static addToLibrary(userId, bookId, status = 'want_to_read') {
    const book = db.prepare('SELECT id FROM books WHERE id = ?').get(bookId);
    if (!book) return { error: 'Book not found.' };

    const existing = db.prepare('SELECT id FROM user_books WHERE user_id = ? AND book_id = ?').get(userId, bookId);
    if (existing) return { error: 'Book is already in your library.' };

    const stmt = db.prepare(`
      INSERT INTO user_books (user_id, book_id, status) VALUES (?, ?, ?)
    `);
    const result = stmt.run(userId, bookId, status);
    return { success: true, userBook: UserBook.findById(result.lastInsertRowid) };
  }

  /**
   * Update status (want_to_read / reading / read)
   */
  static updateStatus(id, userId, status) {
    const ub = db.prepare('SELECT * FROM user_books WHERE id = ? AND user_id = ?').get(id, userId);
    if (!ub) return { error: 'Not found in your library.' };

    db.prepare('UPDATE user_books SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
    return { success: true, userBook: UserBook.findById(id) };
  }

  /**
   * Add or update review + rating
   */
  static addReview(id, userId, rating, review) {
    const ub = db.prepare('SELECT * FROM user_books WHERE id = ? AND user_id = ?').get(id, userId);
    if (!ub) return { error: 'Not found in your library.' };

    db.prepare(`
      UPDATE user_books SET rating = ?, review = ?, status = 'read', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(rating, review || null, id);
    return { success: true, userBook: UserBook.findById(id) };
  }

  /**
   * Add a generic comment (PBI-15) - Upserts a review record
   */
  static addComment(userId, bookId, comment) {
    const existing = db.prepare('SELECT id FROM user_books WHERE user_id = ? AND book_id = ?').get(userId, bookId);
    
    if (existing) {
      db.prepare('UPDATE user_books SET review = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(comment, existing.id);
      return { success: true, userBook: UserBook.findById(existing.id) };
    } else {
      const stmt = db.prepare(`
        INSERT INTO user_books (user_id, book_id, status, review) VALUES (?, ?, 'reading', ?)
      `);
      const result = stmt.run(userId, bookId, comment);
      return { success: true, userBook: UserBook.findById(result.lastInsertRowid) };
    }
  }

  /**
   * Remove from library
   */
  static removeFromLibrary(id, userId) {
    const result = db.prepare('DELETE FROM user_books WHERE id = ? AND user_id = ?').run(id, userId);
    return result.changes > 0;
  }

  /**
   * Find by ID with book info
   */
  static findById(id) {
    return db.prepare(`
      SELECT ub.*, b.title, b.author, b.category, b.isbn, b.pages, b.cover_image, b.description
      FROM user_books ub
      JOIN books b ON ub.book_id = b.id
      WHERE ub.id = ?
    `).get(id);
  }

  /**
   * Get user's personal library
   */
  static findByUser(userId, status = null) {
    let query = `
      SELECT ub.*, b.title, b.author, b.category, b.isbn, b.pages, b.cover_image, b.description
      FROM user_books ub
      JOIN books b ON ub.book_id = b.id
      WHERE ub.user_id = ?
    `;
    const params = [userId];

    if (status) {
      query += ' AND ub.status = ?';
      params.push(status);
    }

    query += ' ORDER BY ub.updated_at DESC';
    return db.prepare(query).all(...params);
  }

  /**
   * Get reading stats for a user
   */
  static getReadingStats(userId) {
    const totalRead = db.prepare("SELECT COUNT(*) as count FROM user_books WHERE user_id = ? AND status = 'read'").get(userId).count;
    const totalReading = db.prepare("SELECT COUNT(*) as count FROM user_books WHERE user_id = ? AND status = 'reading'").get(userId).count;
    const totalWant = db.prepare("SELECT COUNT(*) as count FROM user_books WHERE user_id = ? AND status = 'want_to_read'").get(userId).count;
    const totalBooks = db.prepare("SELECT COUNT(*) as count FROM user_books WHERE user_id = ?").get(userId).count;

    // Total pages read
    const pagesResult = db.prepare(`
      SELECT COALESCE(SUM(b.pages), 0) as total_pages
      FROM user_books ub JOIN books b ON ub.book_id = b.id
      WHERE ub.user_id = ? AND ub.status = 'read'
    `).get(userId);

    // Average rating given
    const avgResult = db.prepare(`
      SELECT COALESCE(AVG(rating), 0) as avg_rating
      FROM user_books WHERE user_id = ? AND rating IS NOT NULL
    `).get(userId);

    // Category distribution (read books)
    const categories = db.prepare(`
      SELECT b.category, COUNT(*) as count
      FROM user_books ub JOIN books b ON ub.book_id = b.id
      WHERE ub.user_id = ? AND ub.status = 'read' AND b.category IS NOT NULL
      GROUP BY b.category ORDER BY count DESC
    `).all(userId);

    // Monthly reading (this year)
    const currentYear = new Date().getFullYear();
    const monthly = db.prepare(`
      SELECT CAST(strftime('%m', ub.updated_at) AS INTEGER) as month, COUNT(*) as count
      FROM user_books ub
      WHERE ub.user_id = ? AND ub.status = 'read' AND strftime('%Y', ub.updated_at) = ?
      GROUP BY month ORDER BY month
    `).all(userId, String(currentYear));

    // Recent reads
    const recentReads = db.prepare(`
      SELECT ub.*, b.title, b.author, b.category, b.pages
      FROM user_books ub JOIN books b ON ub.book_id = b.id
      WHERE ub.user_id = ? AND ub.status = 'read'
      ORDER BY ub.updated_at DESC LIMIT 5
    `).all(userId);

    return {
      totalRead, totalReading, totalWant, totalBooks,
      totalPages: pagesResult.total_pages,
      avgRating: Math.round(avgResult.avg_rating * 10) / 10,
      categories, monthly, recentReads
    };
  }

  /**
   * Get reviews for a specific book
   */
  static getBookReviews(bookId) {
    return db.prepare(`
      SELECT ub.rating, ub.review, ub.updated_at,
             u.first_name, u.last_name
      FROM user_books ub
      JOIN users u ON ub.user_id = u.id
      WHERE ub.book_id = ? AND ub.review IS NOT NULL
      ORDER BY ub.updated_at DESC
    `).all(bookId);
  }
}

module.exports = UserBook;
