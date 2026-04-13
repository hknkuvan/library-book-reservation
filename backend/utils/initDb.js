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

  // Create password_resets table (Sprint 2 - Forgot/Reset Password)
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create books table (Sprint 2 - Book Management)
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      category TEXT DEFAULT NULL,
      isbn TEXT DEFAULT NULL UNIQUE,
      publication_date TEXT DEFAULT NULL,
      pages INTEGER DEFAULT NULL,
      description TEXT DEFAULT NULL,
      cover_image TEXT DEFAULT NULL,
      available_copies INTEGER DEFAULT 1,
      total_copies INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_token ON token_blacklist(token)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_expires ON token_blacklist(expires_at)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_reset_token ON password_resets(token)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_books_category ON books(category)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_books_author ON books(author)`);

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

  // Seed sample books if table is empty
  const bookCount = db.prepare('SELECT COUNT(*) as count FROM books').get();
  if (bookCount.count === 0) {
    const sampleBooks = [
      { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'Classic Literature', isbn: '978-0743273565', publication_date: '1925-04-10', pages: 180, description: 'A novel about the American Dream set in the Jazz Age, following the mysterious millionaire Jay Gatsby and his obsession with Daisy Buchanan.', available_copies: 5, total_copies: 5 },
      { title: 'To Kill a Mockingbird', author: 'Harper Lee', category: 'Classic Literature', isbn: '978-0061120084', publication_date: '1960-07-11', pages: 281, description: 'A gripping tale of racial injustice and childhood innocence in the American South, told through the eyes of young Scout Finch.', available_copies: 3, total_copies: 4 },
      { title: '1984', author: 'George Orwell', category: 'Dystopian Fiction', isbn: '978-0451524935', publication_date: '1949-06-08', pages: 328, description: 'A chilling prophecy about the future, depicting a totalitarian regime that controls every aspect of life through surveillance and propaganda.', available_copies: 4, total_copies: 4 },
      { title: 'Pride and Prejudice', author: 'Jane Austen', category: 'Romance', isbn: '978-0141439518', publication_date: '1813-01-28', pages: 279, description: 'A witty exploration of love, class, and society in Regency-era England, centered on the spirited Elizabeth Bennet.', available_copies: 2, total_copies: 3 },
      { title: 'The Catcher in the Rye', author: 'J.D. Salinger', category: 'Coming-of-Age', isbn: '978-0316769488', publication_date: '1951-07-16', pages: 234, description: 'The story of teenage Holden Caulfield and his experiences in New York City after being expelled from prep school.', available_copies: 3, total_copies: 3 },
      { title: 'Harry Potter and the Philosopher\'s Stone', author: 'J.K. Rowling', category: 'Fantasy', isbn: '978-0747532743', publication_date: '1997-06-26', pages: 223, description: 'The magical journey of Harry Potter as he discovers he is a wizard and begins his education at Hogwarts School.', available_copies: 6, total_copies: 8 },
      { title: 'The Lord of the Rings', author: 'J.R.R. Tolkien', category: 'Fantasy', isbn: '978-0544003415', publication_date: '1954-07-29', pages: 1178, description: 'An epic high-fantasy adventure following hobbit Frodo Baggins on his quest to destroy the One Ring.', available_copies: 2, total_copies: 3 },
      { title: 'Clean Code', author: 'Robert C. Martin', category: 'Technology', isbn: '978-0132350884', publication_date: '2008-08-01', pages: 464, description: 'A handbook of agile software craftsmanship, teaching developers how to write clean, readable, and maintainable code.', available_copies: 4, total_copies: 5 },
      { title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', category: 'Non-Fiction', isbn: '978-0062316097', publication_date: '2015-02-10', pages: 443, description: 'A sweeping narrative of human history from the Stone Age to the present, exploring how Homo sapiens came to dominate the world.', available_copies: 3, total_copies: 3 },
      { title: 'The Alchemist', author: 'Paulo Coelho', category: 'Philosophical Fiction', isbn: '978-0062315007', publication_date: '1988-01-01', pages: 197, description: 'A mystical story about Santiago, an Andalusian shepherd boy who travels to the Egyptian pyramids in search of treasure.', available_copies: 5, total_copies: 5 },
    ];

    const insert = db.prepare(`
      INSERT INTO books (title, author, category, isbn, publication_date, pages, description, available_copies, total_copies)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const book of sampleBooks) {
      insert.run(book.title, book.author, book.category, book.isbn, book.publication_date, book.pages, book.description, book.available_copies, book.total_copies);
    }
    console.log(`✅ ${sampleBooks.length} sample books seeded.`);
  }

  console.log('✅ Database initialized successfully (SQLite).');
}

module.exports = initDatabase;
