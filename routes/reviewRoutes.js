const express = require('express');
const router = express.Router();
const { createReview, getReviewsByOrder } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', createReview);
router.get('/order/:orderId', getReviewsByOrder);

module.exports = router;
