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
   * adminView=true returns all statuses; user view hides archived/pending
   */
  static findAll({ search, category, page = 1, limit = 20, adminView = false, status } = {}) {
    let query = 'SELECT * FROM books WHERE 1=1';
    const params = [];

    if (!adminView) {
      query += " AND status = 'active'";
    } else if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

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
   * Delete a book (hard delete)
   */
  static delete(id) {
    const result = db.prepare('DELETE FROM books WHERE id = ?').run(id);
    return result.changes > 0;
  }

  /**
   * Archive a book (soft delete — hidden from users, kept in DB)
   */
  static archive(id) {
    const result = db.prepare("UPDATE books SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
    return result.changes > 0 ? Book.findById(id) : null;
  }

  /**
   * Restore an archived book back to active
   */
  static restore(id) {
    const result = db.prepare("UPDATE books SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
    return result.changes > 0 ? Book.findById(id) : null;
  }

  /**
   * Create a pending user submission
   */
  static createPending({ title, author, category, isbn, description, cover_image, submitted_by }) {
    const stmt = db.prepare(`
      INSERT INTO books (title, author, category, isbn, description, cover_image, status, submitted_by, available_copies, total_copies)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, 0, 0)
    `);
    const result = stmt.run(title, author, category || null, isbn || null, description || null, cover_image || null, submitted_by);
    return Book.findById(result.lastInsertRowid);
  }

  /**
   * Approve a pending submission — moves it to active catalog
   */
  static approve(id, fields = {}) {
    const setClauses = ["status = 'active'", "available_copies = COALESCE(available_copies, 1)", "total_copies = COALESCE(NULLIF(total_copies,0), 1)", "updated_at = CURRENT_TIMESTAMP"];
    const values = [];
    const allowed = ['title','author','category','isbn','description','cover_image'];
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        setClauses.unshift(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    values.push(id);
    db.prepare(`UPDATE books SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
    return Book.findById(id);
  }

  /**
   * Reject a pending submission — marks as archived (hidden)
   */
  static reject(id) {
    db.prepare("UPDATE books SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
    return Book.findById(id);
  }

  /**
   * Get all pending submissions with submitter info
   */
  static findPending() {
    return db.prepare(`
      SELECT b.*, u.first_name, u.last_name, u.email
      FROM books b
      LEFT JOIN users u ON b.submitted_by = u.id
      WHERE b.status = 'pending'
      ORDER BY b.created_at DESC
    `).all();
  }

  /**
   * Get all unique categories (active books only)
   */
  static getCategories() {
    return db.prepare("SELECT DISTINCT category FROM books WHERE category IS NOT NULL AND status = 'active' ORDER BY category").all().map(r => r.category);
  }

  /**
   * Check if a book has any active reservations
   */
  static hasActiveReservations(id) {
    const row = db.prepare("SELECT COUNT(*) as c FROM reservations WHERE book_id = ? AND status IN ('active','overdue')").get(id);
    return row.c > 0;
  }
}

module.exports = Book;
