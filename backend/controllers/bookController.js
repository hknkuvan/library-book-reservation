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
    const { search, category, page, limit } = req.query;
    const result = Book.findAll({ search, category, page, limit });

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
 * Delete a book (Admin only)
 * DELETE /api/books/:id
 */
const deleteBook = (req, res) => {
  try {
    const bookId = req.params.id;
    const deleted = Book.delete(bookId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Book not found.'
      });
    }

    res.json({
      success: true,
      message: 'Book deleted successfully.'
    });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the book.'
    });
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
  getCategories,
  getChapters,
  getChapterByNumber
};
