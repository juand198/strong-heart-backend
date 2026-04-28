const express = require('express');
const router = express.Router();
const { register, login, refreshToken } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { registerRules, loginRules, validate } = require('../middleware/validators');

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.post('/refresh-token', protect, refreshToken);

module.exports = router;
