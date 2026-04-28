const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrder,
  getTracking,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { orderRules, validate } = require('../middleware/validators');

router.use(protect);

router.get('/', getOrders);
router.post('/', orderRules, validate, createOrder);
router.get('/:orderId', getOrder);
router.put('/:orderId', updateOrder);
router.get('/:orderId/tracking', getTracking);

module.exports = router;
