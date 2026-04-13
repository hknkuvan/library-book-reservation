const db = require('../config/db');
const bcrypt = require('bcryptjs');

function initDatabase() {
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      phone TEXT DEFAULT NULL,
      role TEXT NOT NULL DEFAULT 'end_user' CHECK(role IN ('system_admin', 'end_user')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create token blacklist table (for logout)
  db.exec(`
    CREATE TABLE IF NOT EXISTS token_blacklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create index on token_blacklist
  db.exec(`CREATE INDEX IF NOT EXISTS idx_token ON token_blacklist(token)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_expires ON token_blacklist(expires_at)`);

  // Seed admin user if not exists
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@library.com');

  if (!existingAdmin) {
    const hashedPassword = bcrypt.hashSync('admin123', 12);
    db.prepare(
      'INSERT INTO users (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)'
    ).run('System', 'Admin', 'admin@library.com', hashedPassword, 'system_admin');
    console.log('✅ Admin user seeded: admin@library.com / admin123');
  } else {
    console.log('ℹ️  Admin user already exists.');
  }

  console.log('✅ Database initialized successfully (SQLite).');
}

module.exports = initDatabase;
