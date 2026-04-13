const db = require('../config/db');

class Book {
  /**
   * Create a new book
   */
  static create({ title, author, category, isbn, publication_date, pages, description, cover_image, available_copies, total_copies }) {
    const stmt = db.prepare(`
      INSERT INTO books (title, author, category, isbn, publication_date, pages, description, cover_image, available_copies, total_copies)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(title, author, category || null, isbn || null, publication_date || null, pages || null, description || null, cover_image || null, available_copies || 1, total_copies || 1);
    return Book.findById(result.lastInsertRowid);
  }

  /**
   * Find all books with optional search/filter
   */
  static findAll({ search, category, page = 1, limit = 20 } = {}) {
    let query = 'SELECT * FROM books WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const { count } = db.prepare(countQuery).get(...params);

    // Add pagination
    const offset = (page - 1) * limit;
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const books = db.prepare(query).all(...params);

    return {
      books,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Find book by ID
   */
  static findById(id) {
    return db.prepare('SELECT * FROM books WHERE id = ?').get(id);
  }

  /**
   * Find book by ISBN
   */
  static findByIsbn(isbn) {
    return db.prepare('SELECT * FROM books WHERE isbn = ?').get(isbn);
  }

  /**
   * Update a book
   */
  static update(id, fields) {
    const setClauses = [];
    const values = [];

    for (const [key, value] of Object.entries(fields)) {
      setClauses.push(`${key} = ?`);
      values.push(value);
    }

    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE books SET ${setClauses.join(', ')} WHERE id = ?`;
    const result = db.prepare(query).run(...values);

    if (result.changes === 0) return null;
    return Book.findById(id);
  }

  /**
   * Delete a book
   */
  static delete(id) {
    const result = db.prepare('DELETE FROM books WHERE id = ?').run(id);
    return result.changes > 0;
  }

  /**
   * Get all unique categories
   */
  static getCategories() {
    return db.prepare('SELECT DISTINCT category FROM books WHERE category IS NOT NULL ORDER BY category').all().map(r => r.category);
  }
}

module.exports = Book;
