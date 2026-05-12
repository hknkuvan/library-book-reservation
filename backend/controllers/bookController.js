const { validationResult } = require('express-validator');
const Book = require('../models/Book');
const Chapter = require('../models/Chapter');

/**
 * Create a new book (Admin only)
 * POST /api/books
 */
const createBook = (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: errors.array().map(err => err.msg)
      });
    }

    const { title, author, category, isbn, publication_date, pages, description, cover_image, available_copies, total_copies } = req.body;

    // Check if ISBN already exists (if provided)
    if (isbn) {
      const existingBook = Book.findByIsbn(isbn);
      if (existingBook) {
        return res.status(409).json({
          success: false,
          message: 'A book with this ISBN already exists.'
        });
      }
    }

    const book = Book.create({
      title, author, category, isbn, publication_date,
      pages, description, cover_image, available_copies, total_copies
    });

    res.status(201).json({
      success: true,
      message: 'Book created successfully.',
      book
    });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating the book.'
    });
  }
};

/**
 * Get all books with optional search/filter
 * GET /api/books
 */
const getAllBooks = (req, res) => {
  try {
    const { search, category, page, limit, status } = req.query;
    const adminView = req.user.role === 'system_admin';
    const result = Book.findAll({ search, category, page, limit, adminView, status });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching books.'
    });
  }
};

/**
 * Get book by ID
 * GET /api/books/:id
 */
const getBookById = (req, res) => {
  try {
    const book = Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found.'
      });
    }

    res.json({
      success: true,
      book
    });
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching the book.'
    });
  }
};

/**
 * Update a book (Admin only)
 * PUT /api/books/:id
 */
const updateBook = (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: errors.array().map(err => err.msg)
      });
    }

    const bookId = req.params.id;
    const existingBook = Book.findById(bookId);
    if (!existingBook) {
      return res.status(404).json({
        success: false,
        message: 'Book not found.'
      });
    }

    const { title, author, category, isbn, publication_date, pages, description, cover_image, available_copies, total_copies } = req.body;

    // Check ISBN uniqueness if changed
    if (isbn && isbn !== existingBook.isbn) {
      const isbnTaken = Book.findByIsbn(isbn);
      if (isbnTaken) {
        return res.status(409).json({
          success: false,
          message: 'A book with this ISBN already exists.'
        });
      }
    }

    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (author !== undefined) updateFields.author = author;
    if (category !== undefined) updateFields.category = category;
    if (isbn !== undefined) updateFields.isbn = isbn;
    if (publication_date !== undefined) updateFields.publication_date = publication_date;
    if (pages !== undefined) updateFields.pages = pages;
    if (description !== undefined) updateFields.description = description;
    if (cover_image !== undefined) updateFields.cover_image = cover_image;
    if (available_copies !== undefined) updateFields.available_copies = available_copies;
    if (total_copies !== undefined) updateFields.total_copies = total_copies;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update.'
      });
    }

    const updatedBook = Book.update(bookId, updateFields);

    res.json({
      success: true,
      message: 'Book updated successfully.',
      book: updatedBook
    });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating the book.'
    });
  }
};

/**
 * Delete a book (Admin only) — blocked if active reservations exist
 * DELETE /api/books/:id
 */
const deleteBook = (req, res) => {
  try {
    const bookId = req.params.id;
    const existing = Book.findById(bookId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    if (Book.hasActiveReservations(bookId)) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete this book — it has active reservations. Archive it instead.'
      });
    }

    Book.delete(bookId);
    res.json({ success: true, message: 'Book deleted successfully.' });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while deleting the book.' });
  }
};

/**
 * Archive a book (Admin only) — soft delete, hidden from users
 * PUT /api/books/:id/archive
 */
const archiveBook = (req, res) => {
  try {
    const book = Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found.' });
    if (book.status === 'archived') return res.status(400).json({ success: false, message: 'Book is already archived.' });

    const updated = Book.archive(req.params.id);
    res.json({ success: true, message: 'Book archived successfully.', book: updated });
  } catch (error) {
    console.error('Archive book error:', error);
    res.status(500).json({ success: false, message: 'Failed to archive book.' });
  }
};

/**
 * Restore an archived book (Admin only)
 * PUT /api/books/:id/restore
 */
const restoreBook = (req, res) => {
  try {
    const book = Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found.' });

    const updated = Book.restore(req.params.id);
    res.json({ success: true, message: 'Book restored to catalog.', book: updated });
  } catch (error) {
    console.error('Restore book error:', error);
    res.status(500).json({ success: false, message: 'Failed to restore book.' });
  }
};

/**
 * Submit a new book entry (logged-in user)
 * POST /api/books/submit
 */
const submitBook = (req, res) => {
  try {
    const { title, author, category, isbn, description, cover_image } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ success: false, message: 'Title is required.' });
    if (!author || !author.trim()) return res.status(400).json({ success: false, message: 'Author is required.' });

    if (isbn) {
      const existing = Book.findByIsbn(isbn);
      if (existing) return res.status(409).json({ success: false, message: 'A book with this ISBN already exists.' });
    }

    const book = Book.createPending({ title: title.trim(), author: author.trim(), category, isbn, description, cover_image, submitted_by: req.user.id });
    res.status(201).json({ success: true, message: 'Book submitted for review! It will appear in the catalog after admin approval.', book });
  } catch (error) {
    console.error('Submit book error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit book.' });
  }
};

/**
 * Get all pending submissions (Admin only)
 * GET /api/books/pending
 */
const getPendingSubmissions = (req, res) => {
  try {
    const books = Book.findPending();
    res.json({ success: true, books });
  } catch (error) {
    console.error('Get pending error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending submissions.' });
  }
};

/**
 * Approve a pending submission (Admin only)
 * PUT /api/books/:id/approve
 */
const approveSubmission = (req, res) => {
  try {
    const book = Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found.' });
    if (book.status !== 'pending') return res.status(400).json({ success: false, message: 'Book is not pending approval.' });

    const { title, author, category, isbn, description, cover_image } = req.body;
    const updated = Book.approve(req.params.id, { title, author, category, isbn, description, cover_image });
    res.json({ success: true, message: 'Book approved and added to catalog.', book: updated });
  } catch (error) {
    console.error('Approve submission error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve submission.' });
  }
};

/**
 * Reject a pending submission (Admin only)
 * PUT /api/books/:id/reject
 */
const rejectSubmission = (req, res) => {
  try {
    const book = Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found.' });
    if (book.status !== 'pending') return res.status(400).json({ success: false, message: 'Book is not pending approval.' });

    Book.reject(req.params.id);
    res.json({ success: true, message: 'Submission rejected.' });
  } catch (error) {
    console.error('Reject submission error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject submission.' });
  }
};

/**
 * Get all categories
 * GET /api/books/categories
 */
const getCategories = (req, res) => {
  try {
    const categories = Book.getCategories();
    res.json({ success: true, categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching categories.'
    });
  }
};

/**
 * Get all chapters for a book
 * GET /api/books/:id/chapters
 */
const getChapters = (req, res) => {
  try {
    const chapters = Chapter.findByBook(req.params.id);
    res.json({ success: true, chapters });
  } catch (error) {
    console.error('Get chapters error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch chapters.' });
  }
};

/**
 * Get specific chapter content
 * GET /api/books/:id/chapters/:chapterNumber
 */
const getChapterByNumber = (req, res) => {
  try {
    const chapter = Chapter.findByNumber(req.params.id, req.params.chapterNumber);
    if (!chapter) return res.status(404).json({ success: false, message: 'Chapter not found.' });
    res.json({ success: true, chapter });
  } catch (error) {
    console.error('Get chapter error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch chapter content.' });
  }
};

module.exports = {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
  archiveBook,
  restoreBook,
  submitBook,
  getPendingSubmissions,
  approveSubmission,
  rejectSubmission,
  getCategories,
  getChapters,
  getChapterByNumber
};
