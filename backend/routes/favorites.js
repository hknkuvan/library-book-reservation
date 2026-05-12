const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/favoriteController');

router.use(authenticate);

router.get('/', ctrl.getMyFavorites);
router.get('/ids', ctrl.getFavoriteIds);
router.post('/:bookId', ctrl.toggleFavorite);

module.exports = router;
