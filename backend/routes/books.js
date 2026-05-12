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
  archiveBook,
  restoreBook,
  submitBook,
  getPendingSubmissions,
  approveSubmission,
  rejectSubmission,
  getCategories,
  getChapters,
  getChapterByNumber
} = require('../controllers/bookController');

// Public routes (all authenticated users)
router.get('/categories', authenticate, getCategories);
router.get('/pending', authenticate, requireAdmin, getPendingSubmissions);
router.get('/', authenticate, getAllBooks);
router.get('/:id', authenticate, getBookById);
router.get('/:id/chapters', authenticate, getChapters);
router.get('/:id/chapters/:chapterNumber', authenticate, getChapterByNumber);

// User route — submit a book for review
router.post('/submit', authenticate, submitBook);

// Admin-only routes
router.post('/', authenticate, requireAdmin, bookValidation, createBook);
router.put('/:id', authenticate, requireAdmin, bookUpdateValidation, updateBook);
router.put('/:id/archive', authenticate, requireAdmin, archiveBook);
router.put('/:id/restore', authenticate, requireAdmin, restoreBook);
router.put('/:id/approve', authenticate, requireAdmin, approveSubmission);
router.put('/:id/reject', authenticate, requireAdmin, rejectSubmission);
router.delete('/:id', authenticate, requireAdmin, deleteBook);

module.exports = router;
