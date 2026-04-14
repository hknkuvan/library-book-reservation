const db = require('../config/db');

class User {
  /**
   * Find a user by email
   */
  static findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email) || null;
  }

  /**
   * Find a user by ID (excludes password)
   */
  static findById(id) {
    return db.prepare(
      'SELECT id, first_name, last_name, email, phone, birth_date, birth_place_country, birth_place_city, gender, address, role, created_at, updated_at FROM users WHERE id = ?'
    ).get(id) || null;
  }

  /**
   * Create a new user
   */
  static create({ first_name, last_name, email, password, phone, birth_date, birth_place_country, birth_place_city, gender, address, role }) {
    const result = db.prepare(`
      INSERT INTO users (first_name, last_name, email, password, phone, birth_date, birth_place_country, birth_place_city, gender, address, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(first_name, last_name, email, password || '', phone || null, birth_date || null, birth_place_country || null, birth_place_city || null, gender || null, address || null, role || 'end_user');

    return {
      id: result.lastInsertRowid,
      first_name, last_name, email, phone, role: role || 'end_user'
    };
  }

  /**
   * Update user profile
   */
  static update(id, fields) {
    const allowedFields = ['first_name', 'last_name', 'email', 'password', 'phone', 'birth_date', 'birth_place_country', 'birth_place_city', 'gender', 'address'];
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (fields[field] !== undefined && fields[field] !== null) {
        updates.push(`${field} = ?`);
        values.push(fields[field]);
      }
    }

    if (updates.length === 0) {
      return null;
    }

    // Also update updated_at
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = db.prepare(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
    ).run(...values);

    if (result.changes === 0) {
      return null;
    }

    return User.findById(id);
  }

  /**
   * Delete a user by ID
   */
  static delete(id) {
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return result.changes > 0;
  }

  /**
   * Check if email is taken by another user
   */
  static isEmailTaken(email, excludeUserId = null) {
    let query = 'SELECT id FROM users WHERE email = ?';
    const params = [email];

    if (excludeUserId) {
      query += ' AND id != ?';
      params.push(excludeUserId);
    }

    const row = db.prepare(query).get(...params);
    return !!row;
  }
}

module.exports = User;
