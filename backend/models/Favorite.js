const db = require('../config/db');

class Favorite {
  static toggle(userId, bookId) {
    const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND book_id = ?').get(userId, bookId);
    if (existing) {
      db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id);
      return { favorited: false };
    }
    db.prepare('INSERT INTO favorites (user_id, book_id) VALUES (?, ?)').run(userId, bookId);
    return { favorited: true };
  }

  static isFavorite(userId, bookId) {
    return !!db.prepare('SELECT id FROM favorites WHERE user_id = ? AND book_id = ?').get(userId, bookId);
  }

  static findByUser(userId) {
    return db.prepare(`
      SELECT f.id, f.created_at, b.id as book_id, b.title, b.author, b.category, b.cover_image, b.available_copies, b.total_copies
      FROM favorites f
      JOIN books b ON f.book_id = b.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).all(userId);
  }

  static getFavoritedBookIds(userId) {
    return db.prepare('SELECT book_id FROM favorites WHERE user_id = ?').all(userId).map(r => r.book_id);
  }
}

module.exports = Favorite;
