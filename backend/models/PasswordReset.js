const db = require('../config/db');
const crypto = require('crypto');

class PasswordReset {
  /**
   * Create a password reset token
   */
  static create(email) {
    // Invalidate any existing tokens for this email
    db.prepare('DELETE FROM password_resets WHERE email = ?').run(email);

    // Generate a unique token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    db.prepare(
      'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)'
    ).run(email, token, expiresAt);

    return token;
  }

  /**
   * Find a valid (non-expired, unused) reset token
   */
  static findByToken(token) {
    return db.prepare(
      'SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > datetime(\'now\')'
    ).get(token);
  }

  /**
   * Mark a token as used
   */
  static markUsed(token) {
    db.prepare('UPDATE password_resets SET used = 1 WHERE token = ?').run(token);
  }

  /**
   * Clean up expired tokens
   */
  static cleanup() {
    db.prepare('DELETE FROM password_resets WHERE expires_at < datetime(\'now\')').run();
  }
}

module.exports = PasswordReset;
