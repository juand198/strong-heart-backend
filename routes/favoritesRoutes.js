const express = require('express');
const router = express.Router();
const {
  addFavorite,
  getFavorites,
  removeFavorite,
  checkFavorite,
} = require('../controllers/favoritesController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getFavorites);
router.post('/', addFavorite);
router.get('/:productId', checkFavorite);
router.delete('/:productId', removeFavorite);

module.exports = router;
