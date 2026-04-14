const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { bookValidation, bookUpdateValidation } = require('../middleware/validate');
const {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
  getCategories,
  getChapters,
  getChapterByNumber
} = require('../controllers/bookController');

// Public routes (all authenticated users can view books)
router.get('/categories', authenticate, getCategories);
router.get('/', authenticate, getAllBooks);
router.get('/:id', authenticate, getBookById);
router.get('/:id/chapters', authenticate, getChapters);
router.get('/:id/chapters/:chapterNumber', authenticate, getChapterByNumber);

// Admin-only routes
router.post('/', authenticate, requireAdmin, bookValidation, createBook);
router.put('/:id', authenticate, requireAdmin, bookUpdateValidation, updateBook);
router.delete('/:id', authenticate, requireAdmin, deleteBook);

module.exports = router;
