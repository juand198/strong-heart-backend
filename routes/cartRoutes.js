const express = require('express');
const router = express.Router();
const {
  addItem,
  getCart,
  updateItem,
  removeItem,
  clearCart,
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');
const { cartItemRules, validate } = require('../middleware/validators');

router.use(protect);

router.get('/items', getCart);
router.post('/items', cartItemRules, validate, addItem);
router.put('/items/:cartItemId', updateItem);
router.delete('/items/:cartItemId', removeItem);
router.delete('/clear', clearCart);

module.exports = router;
