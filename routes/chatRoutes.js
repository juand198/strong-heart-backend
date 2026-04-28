const express = require('express');
const router  = express.Router();
const { getMessages, sendMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/:orderId',  getMessages);
router.post('/:orderId', sendMessage);

module.exports = router;
