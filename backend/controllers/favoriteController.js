const Favorite = require('../models/Favorite');
const Book = require('../models/Book');

exports.toggleFavorite = (req, res) => {
  try {
    const bookId = parseInt(req.params.bookId);
    const book = Book.findById(bookId);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found.' });

    const result = Favorite.toggle(req.user.id, bookId);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ success: false, message: 'Failed to update favorite.' });
  }
};

exports.getMyFavorites = (req, res) => {
  try {
    const favorites = Favorite.findByUser(req.user.id);
    res.json({ success: true, favorites });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch favorites.' });
  }
};

exports.getFavoriteIds = (req, res) => {
  try {
    const ids = Favorite.getFavoritedBookIds(req.user.id);
    res.json({ success: true, favoriteIds: ids });
  } catch (error) {
    console.error('Get favorite ids error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch favorites.' });
  }
};
