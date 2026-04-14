const db = require('../config/db');

class Chapter {
  static findByBook(bookId) {
    return db.prepare('SELECT id, book_id, chapter_number, title FROM chapters WHERE book_id = ? ORDER BY chapter_number ASC').all(bookId);
  }

  static findByNumber(bookId, chapterNumber) {
    return db.prepare('SELECT * FROM chapters WHERE book_id = ? AND chapter_number = ?').get(bookId, chapterNumber);
  }
}

module.exports = Chapter;
