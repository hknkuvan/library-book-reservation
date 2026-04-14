const fs = require('fs');
const path = require('path');
const axios = require('axios');
const db = require('../config/db');

const BOOKS_TO_FETCH = [
  {
    title: "Alice's Adventures in Wonderland",
    author: "Lewis Carroll",
    category: "Fantasy",
    isbn: "978-1503222687", /* fake for open library or distinct */
    cover_image: "https://covers.openlibrary.org/b/id/8086053-L.jpg",
    publication_date: "1865-11-26",
    pages: 200,
    description: "Alice falls through a rabbit hole into a fantasy world populated by peculiar, anthropomorphic creatures.",
    txtUrl: "https://www.gutenberg.org/files/11/11-0.txt",
    chapterRegex: /CHAPTER [IVXLCDM]+\./gi
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    category: "Romance",
    isbn: "978-1503290563",
    cover_image: "https://covers.openlibrary.org/b/id/8259441-L.jpg",
    publication_date: "1813-01-28",
    pages: 279,
    description: "A witty exploration of love, class, and society in Regency-era England.",
    txtUrl: "https://www.gutenberg.org/files/1342/1342-0.txt",
    chapterRegex: /Chapter \d+/gi
  },
  {
    title: "Frankenstein",
    author: "Mary Shelley",
    category: "Horror",
    isbn: "978-1503261280",
    cover_image: "https://covers.openlibrary.org/b/id/8718949-L.jpg",
    publication_date: "1818-01-01",
    pages: 280,
    description: "The story of Victor Frankenstein, a young scientist who creates a sapient creature in an unorthodox scientific experiment.",
    txtUrl: "https://www.gutenberg.org/files/84/84-0.txt",
    chapterRegex: /Chapter \d+/gi
  }
];

async function seedRealBooks() {
  console.log('Clearing old chapters and books...');
  db.exec('DELETE FROM chapters');
  db.exec('DELETE FROM user_books');
  db.exec('DELETE FROM reservations');
  db.exec('DELETE FROM books');

  const insertBook = db.prepare(`
    INSERT INTO books (title, author, category, isbn, publication_date, pages, description, cover_image, available_copies, total_copies)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertChapter = db.prepare(`
    INSERT INTO chapters (book_id, chapter_number, title, content)
    VALUES (?, ?, ?, ?)
  `);

  for (const info of BOOKS_TO_FETCH) {
    console.log(`Downloading text for: ${info.title}...`);
    try {
      const res = await axios.get(info.txtUrl, { responseType: 'text' });
      let text = res.data;

      // Extract Gutenberg preamble and postamble (heuristic)
      const startMarker = "*** START OF THE PROJECT GUTENBERG";
      const endMarker = "*** END OF THE PROJECT GUTENBERG";
      
      let startIndex = text.indexOf(startMarker);
      if (startIndex !== -1) {
        startIndex = text.indexOf('\n', startIndex) + 1; // go to end of line
      } else {
        startIndex = 0;
      }

      let endIndex = text.indexOf(endMarker);
      if (endIndex === -1) endIndex = text.length;

      text = text.substring(startIndex, endIndex);

      // Save book record
      const result = insertBook.run(
        info.title, info.author, info.category, info.isbn, 
        info.publication_date, info.pages, info.description, 
        info.cover_image, 5, 5
      );
      const bookId = result.lastInsertRowid;

      // Split into chapters
      let chapters = [];
      let matches = [...text.matchAll(info.chapterRegex)];

      if (matches.length === 0) {
        console.log(`No chapters found for ${info.title}, storing as 1 big chapter.`);
        insertChapter.run(bookId, 1, 'Full Text', `<p>${text.replace(/\n\n/g, '</p><p>')}</p>`);
        continue;
      }

      // Format split matches into chapters
      for (let i = 0; i < matches.length; i++) {
        const title = matches[i][0];
        const startChunk = matches[i].index + title.length;
        const endChunk = (i + 1 < matches.length) ? matches[i+1].index : text.length;
        
        let content = text.substring(startChunk, endChunk).trim();
        content = content.replace(/\r\n\r\n/g, '</p><p>').replace(/\n\n/g, '</p><p>');
        content = `<p>${content}</p>`;

        insertChapter.run(bookId, i + 1, title.trim(), content);
      }
      
      console.log(`✅ Inserted ${info.title} with ${matches.length} chapters.`);
      
    } catch (e) {
      console.error(`❌ Failed to fetch/parse ${info.title}:`, e.message);
    }
  }

  // Also re-seed simple fake books for variety so UI doesn't look empty
  const fakeBooks = [
    { title: 'The Catcher in the Rye', author: 'J.D. Salinger', cover: 'https://covers.openlibrary.org/b/id/12699290-L.jpg' },
    { title: '1984', author: 'George Orwell', cover: 'https://covers.openlibrary.org/b/id/8381831-L.jpg' }
  ];
  for (const b of fakeBooks) {
     insertBook.run(b.title, b.author, 'Classic Literature', null, null, 300, 'A classic book.', b.cover, 2, 2);
  }

  console.log('✅ Real books seeded successfully.');
}

seedRealBooks();
