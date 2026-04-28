const express = require('express');
const router = express.Router();
const { getProducts, getBadges, getProduct, getRecommendedSize } = require('../controllers/productController');

router.get('/', getProducts);
router.get('/badges', getBadges);
router.get('/:id', getProduct);
router.get('/:id/recommended-size', getRecommendedSize);

module.exports = router;
