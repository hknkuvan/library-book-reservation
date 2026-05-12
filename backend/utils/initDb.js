const db = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * Schema migrations — fixes mismatches between old DB and current code.
 * SQLite doesn't support ALTER COLUMN, so we recreate affected tables.
 */
function runMigrations() {
  // --- Migration 1: users.password must allow NULL (registration flow) ---
  const userCols = db.prepare('PRAGMA table_info(users)').all();
  const passwordCol = userCols.find(c => c.name === 'password');
  if (passwordCol && passwordCol.notnull === 1) {
    console.log('🔄 Migration: fixing users.password to allow NULL...');
    db.pragma('foreign_keys = OFF');
    db.transaction(() => {
      db.exec(`
        CREATE TABLE users_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT DEFAULT NULL,
          phone TEXT DEFAULT NULL,
          birth_date TEXT DEFAULT NULL,
          birth_country TEXT DEFAULT NULL,
          birth_city TEXT DEFAULT NULL,
          gender TEXT DEFAULT NULL,
          address TEXT DEFAULT NULL,
          role TEXT NOT NULL DEFAULT 'end_user' CHECK(role IN ('system_admin', 'end_user')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      // Consolidate birth_place_* (old) → birth_country/birth_city (new)
      const hasBirthCountry = userCols.some(c => c.name === 'birth_country');
      const hasBirthPlace   = userCols.some(c => c.name === 'birth_place_country');
      const bcSrc = hasBirthCountry && hasBirthPlace
        ? 'COALESCE(birth_country, birth_place_country)'
        : hasBirthCountry ? 'birth_country'
        : hasBirthPlace   ? 'birth_place_country'
        : "''";
      const bciSrc = hasBirthCountry && hasBirthPlace
        ? 'COALESCE(birth_city, birth_place_city)'
        : hasBirthCountry ? 'birth_city'
        : hasBirthPlace   ? 'birth_place_city'
        : "''";
      db.exec(`
        INSERT INTO users_new
          (id, first_name, last_name, email, password, phone, birth_date,
           birth_country, birth_city, gender, address, role, created_at, updated_at)
        SELECT id, first_name, last_name, email, password, phone, birth_date,
               ${bcSrc}, ${bciSrc}, gender, address, role, created_at, updated_at
        FROM users
      `);
      db.exec('DROP TABLE users');
      db.exec('ALTER TABLE users_new RENAME TO users');
    })();
    db.pragma('foreign_keys = ON');
    console.log('✅ users table migrated.');
  }

  // --- Migration 2: reservations schema (reserved_at→borrowed_at, add due_date/created_at, fix statuses) ---
  const resCols = db.prepare('PRAGMA table_info(reservations)').all();
  const hasBorrowedAt = resCols.some(c => c.name === 'borrowed_at');
  if (!hasBorrowedAt) {
    console.log('🔄 Migration: fixing reservations table schema...');
    const hasReservedAt = resCols.some(c => c.name === 'reserved_at');
    db.pragma('foreign_keys = OFF');
    db.transaction(() => {
      db.exec(`
        CREATE TABLE reservations_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          book_id INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'active'
            CHECK(status IN ('active', 'returned', 'overdue', 'cancelled')),
          borrowed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          due_date TEXT NOT NULL DEFAULT '2099-12-31',
          returned_at DATETIME DEFAULT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (book_id) REFERENCES books(id)
        )
      `);
      if (hasReservedAt) {
        db.exec(`
          INSERT INTO reservations_new
            (id, user_id, book_id, status, borrowed_at, due_date, returned_at, created_at)
          SELECT
            id, user_id, book_id,
            CASE COALESCE(status, 'reserved')
              WHEN 'reserved'   THEN 'active'
              WHEN 'returned'   THEN 'returned'
              WHEN 'cancelled'  THEN 'cancelled'
              ELSE 'active'
            END,
            reserved_at,
            date(reserved_at, '+14 days'),
            returned_at,
            reserved_at
          FROM reservations
        `);
      }
      db.exec('DROP TABLE reservations');
      db.exec('ALTER TABLE reservations_new RENAME TO reservations');
    })();
    db.pragma('foreign_keys = ON');
    console.log('✅ reservations table migrated.');
  }

  // --- Migration 3: books.category must allow NULL ---
  const bookCols = db.prepare('PRAGMA table_info(books)').all();
  const categoryCol = bookCols.find(c => c.name === 'category');
  if (categoryCol && categoryCol.notnull === 1) {
    console.log('🔄 Migration: fixing books.category to allow NULL...');
    db.pragma('foreign_keys = OFF');
    db.transaction(() => {
      db.exec(`
        CREATE TABLE books_new (
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
          status TEXT NOT NULL DEFAULT 'active',
          submitted_by INTEGER DEFAULT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      db.exec(`
        INSERT INTO books_new
          (id, title, author, category, isbn, publication_date, pages, description,
           cover_image, available_copies, total_copies, status, submitted_by, created_at, updated_at)
        SELECT
          id, title, author, category, isbn, publication_date, pages, description,
          cover_image, available_copies, total_copies, status, submitted_by, created_at, updated_at
        FROM books
      `);
      db.exec('DROP TABLE books');
      db.exec('ALTER TABLE books_new RENAME TO books');
    })();
    db.pragma('foreign_keys = ON');
    console.log('✅ books table migrated.');
  }
}

function initDatabase() {
  // Run schema migrations before any CREATE TABLE IF NOT EXISTS calls
  runMigrations();

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT DEFAULT NULL,
      phone TEXT DEFAULT NULL,
      birth_date TEXT DEFAULT NULL,
      birth_country TEXT DEFAULT NULL,
      birth_city TEXT DEFAULT NULL,
      gender TEXT DEFAULT NULL,
      address TEXT DEFAULT NULL,
      role TEXT NOT NULL DEFAULT 'end_user' CHECK(role IN ('system_admin', 'end_user')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migrate existing DB: add columns if they don't exist yet
  const newColumns = [
    ['birth_date',    'TEXT DEFAULT NULL'],
    ['birth_country', 'TEXT DEFAULT NULL'],
    ['birth_city',    'TEXT DEFAULT NULL'],
    ['gender',        'TEXT DEFAULT NULL'],
    ['address',       'TEXT DEFAULT NULL'],
  ];
  for (const [col, def] of newColumns) {
    try { db.exec(`ALTER TABLE users ADD COLUMN ${col} ${def}`); } catch (_) { /* already exists */ }
  }

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

  // Create reservations table (Sprint 3 - Book Borrowing)
  db.exec(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'returned', 'overdue', 'cancelled')),
      borrowed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      due_date TEXT NOT NULL DEFAULT '2099-12-31',
      returned_at DATETIME DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (book_id) REFERENCES books(id)
    )
  `);

  // Create user_books table (Sprint 3 - Personal Library)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'want_to_read' CHECK(status IN ('want_to_read', 'reading', 'read')),
      rating INTEGER DEFAULT NULL CHECK(rating >= 1 AND rating <= 5),
      review TEXT DEFAULT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (book_id) REFERENCES books(id),
      UNIQUE(user_id, book_id)
    )
  `);

  // Create chapters table (Sprint 4 - E-Reader)
  db.exec(`
    CREATE TABLE IF NOT EXISTS chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      chapter_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      FOREIGN KEY (book_id) REFERENCES books(id),
      UNIQUE(book_id, chapter_number)
    )
  `);

  // Books column migrations (add any missing columns to existing databases)
  const bookMigrations = [
    ["publication_date", "TEXT DEFAULT NULL"],
    ["pages",            "INTEGER DEFAULT NULL"],
    ["cover_image",      "TEXT DEFAULT NULL"],
    ["updated_at",       "DATETIME DEFAULT NULL"],
    ["status",           "TEXT NOT NULL DEFAULT 'active'"],
    ["submitted_by",     "INTEGER DEFAULT NULL"],
  ];
  for (const [col, def] of bookMigrations) {
    try { db.exec(`ALTER TABLE books ADD COLUMN ${col} ${def}`); } catch (_) { /* already exists */ }
  }

  // Create favorites table (Sprint 2 - Favorites)
  db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (book_id) REFERENCES books(id),
      UNIQUE(user_id, book_id)
    )
  `);

  // Create indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_token ON token_blacklist(token)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_expires ON token_blacklist(expires_at)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_reset_token ON password_resets(token)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_books_category ON books(category)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_books_author ON books(author)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_reservations_book ON reservations(book_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_user_books_user ON user_books(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_user_books_book ON user_books(book_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_favorites_book ON favorites(book_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_books_status ON books(status)`);

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

  // Seed sample chapters if table is empty
  const chapterCount = db.prepare('SELECT COUNT(*) as count FROM chapters').get();
  if (chapterCount.count === 0) {
    // Find The Great Gatsby and 1984
    const gatsby = db.prepare('SELECT id FROM books WHERE title = ?').get('The Great Gatsby');
    const orwell = db.prepare('SELECT id FROM books WHERE title = ?').get('1984');

    const insertChapter = db.prepare(`
      INSERT INTO chapters (book_id, chapter_number, title, content)
      VALUES (?, ?, ?, ?)
    `);

    if (gatsby) {
      insertChapter.run(gatsby.id, 1, 'Chapter 1', '<p>In my younger and more vulnerable years my father gave me some advice that I’ve been turning over in my mind ever since.</p><p>"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven’t had the advantages that you’ve had."</p><p>He didn’t say any more, but we’ve always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that. In consequence, I’m inclined to reserve all judgments, a habit that has opened up many curious natures to me and also made me the victim of not a few veteran bores...</p><p>And so with the sunshine and the great bursts of leaves growing on the trees, just as things grow in fast movies, I had that familiar conviction that life was beginning over again with the summer.</p>');
      
      insertChapter.run(gatsby.id, 2, 'Chapter 2', '<p>About half way between West Egg and New York the motor road hastily joins the railroad and runs beside it for a quarter of a mile, so as to shrink away from a certain desolate area of land. This is a valley of ashes—a fantastic farm where ashes grow like wheat into ridges and hills and grotesque gardens; where ashes take the forms of houses and chimneys and rising smoke and, finally, with a transcendent effort, of men who move dimly and already crumbling through the powdery air.</p><p>Occasionally a line of gray cars crawls along an invisible track, gives out a ghastly creak, and comes to rest, and immediately the ash-gray men swarm up with leaden spades and stir up an impenetrable cloud, which screens their obscure operations from your sight.</p>');
    }

    if (orwell) {
      insertChapter.run(orwell.id, 1, 'Part 1, Chapter 1', '<p>It was a bright cold day in April, and the clocks were striking thirteen. Winston Smith, his chin nuzzled into his breast in an effort to escape the vile wind, slipped quickly through the glass doors of Victory Mansions, though not quickly enough to prevent a swirl of gritty dust from entering along with him.</p><p>The hallway smelt of boiled cabbage and old rag mats. At one end of it a coloured poster, too large for indoor display, had been tacked to the wall. It depicted simply an enormous face, more than a metre wide: the face of a man of about forty-five, with a heavy black moustache and ruggedly handsome features.</p><p>Winston made for the stairs. It was no use trying the lift. Even at the best of times it was seldom working, and at present the electric current was cut off during daylight hours. It was part of the economy drive in preparation for Hate Week...</p>');

      insertChapter.run(orwell.id, 2, 'Part 1, Chapter 2', '<p>As he put his hand to the door-knob Winston saw that he had left the diary open on the table. DOWN WITH BIG BROTHER was written all over it, in letters almost big enough to be legible across the room. It was an inconceivably stupid thing to have done. But, he realized, even in his panic he had not wanted to smudge the creamy paper by shutting the book while the ink was wet.</p><p>He drew in his breath and opened the door. Instantly a warm wave of relief flowed through him. A colourless, crushed-looking woman, with wispy hair and a lined face, was standing outside.</p><p>"Oh, comrade," she said in a dreary, whining sort of voice, "I thought I heard you come in. Do you think you could come across and have a look at our kitchen sink? It’s blocked up and..."</p>');
    }
    
    console.log('✅ Sample chapters seeded for testing the E-Reader.');
  }

  console.log('✅ Database initialized successfully (SQLite).');
}

module.exports = initDatabase;
