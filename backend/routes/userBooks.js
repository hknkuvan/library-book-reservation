const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/userBookController');

// All routes require authentication
router.use(authenticate);

// User routes
router.get('/stats', ctrl.getReadingStats);                // Reading stats (must be before /:id)
router.get('/reviews/:bookId', ctrl.getBookReviews);       // Reviews for a book
router.post('/review', ctrl.submitReview);                 // Submit/update review from book detail page
router.delete('/review/:bookId', ctrl.deleteReview);       // Delete own review
router.get('/', ctrl.getMyLibrary);                        // My library
router.post('/', ctrl.addToLibrary);                       // Add to library
router.put('/:id', ctrl.updateUserBook);                   // Update status/review
router.delete('/:id', ctrl.removeFromLibrary);             // Remove from library

module.exports = router;
