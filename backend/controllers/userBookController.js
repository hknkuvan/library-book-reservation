const UserBook = require('../models/UserBook');

/**
 * POST /api/user-books — Add book to personal library
 */
exports.addToLibrary = (req, res) => {
  try {
    const { book_id, status } = req.body;
    if (!book_id) return res.status(400).json({ success: false, message: 'book_id is required.' });

    const validStatuses = ['want_to_read', 'reading', 'read'];
    const bookStatus = validStatuses.includes(status) ? status : 'want_to_read';

    const result = UserBook.addToLibrary(req.user.id, book_id, bookStatus);
    if (result.error) return res.status(400).json({ success: false, message: result.error });

    res.status(201).json({ success: true, message: 'Book added to your library!', userBook: result.userBook });
  } catch (error) {
    console.error('Add to library error:', error);
    res.status(500).json({ success: false, message: 'Failed to add book.' });
  }
};

/**
 * GET /api/user-books — Get personal library
 */
exports.getMyLibrary = (req, res) => {
  try {
    const { status } = req.query;
    const books = UserBook.findByUser(req.user.id, status || null);
    res.json({ success: true, books });
  } catch (error) {
    console.error('Get library error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch library.' });
  }
};

/**
 * PUT /api/user-books/:id — Update status
 */
exports.updateUserBook = (req, res) => {
  try {
    const { status, rating, review } = req.body;

    // If rating is provided, update review
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Rating must be 1-5.' });
      const result = UserBook.addReview(req.params.id, req.user.id, rating, review);
      if (result.error) return res.status(400).json({ success: false, message: result.error });
      return res.json({ success: true, message: 'Review saved!', userBook: result.userBook });
    }

    // Otherwise update status
    if (status) {
      const validStatuses = ['want_to_read', 'reading', 'read'];
      if (!validStatuses.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });

      const result = UserBook.updateStatus(req.params.id, req.user.id, status);
      if (result.error) return res.status(400).json({ success: false, message: result.error });
      return res.json({ success: true, message: 'Status updated!', userBook: result.userBook });
    }

    res.status(400).json({ success: false, message: 'status or rating is required.' });
  } catch (error) {
    console.error('Update user book error:', error);
    res.status(500).json({ success: false, message: 'Failed to update.' });
  }
};

/**
 * POST /api/user-books/comment — Add a comment to a book (PBI-15)
 */
exports.postComment = (req, res) => {
  try {
    const { book_id, comment } = req.body;
    if (!book_id || !comment) return res.status(400).json({ success: false, message: 'book_id and comment are required.' });

    const result = UserBook.addComment(req.user.id, book_id, comment);
    res.json({ success: true, message: 'Comment posted!', userBook: result.userBook });
  } catch (error) {
    console.error('Post comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to post comment.' });
  }
};

/**
 * DELETE /api/user-books/:id — Remove from library
 */
exports.removeFromLibrary = (req, res) => {
  try {
    const deleted = UserBook.removeFromLibrary(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Book not found in your library.' });
    res.json({ success: true, message: 'Removed from your library.' });
  } catch (error) {
    console.error('Remove error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove.' });
  }
};

/**
 * GET /api/user-books/stats — Reading statistics
 */
exports.getReadingStats = (req, res) => {
  try {
    const stats = UserBook.getReadingStats(req.user.id);
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Reading stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
};

/**
 * GET /api/user-books/reviews/:bookId — Get reviews for a book
 */
exports.getBookReviews = (req, res) => {
  try {
    const reviews = UserBook.getBookReviews(req.params.bookId);
    res.json({ success: true, reviews });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews.' });
  }
};
