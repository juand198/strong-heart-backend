const User = require('../models/User');
const { generateToken } = require('../middleware/authMiddleware');
const { AuthError, ConflictError } = require('../utils/errors');

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { email, password, name, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ConflictError('Ya existe una cuenta con ese email'));
    }

    const user = await User.create({ email, password, name, phone });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AuthError('Email o contraseña incorrectos'));
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh-token
exports.refreshToken = async (req, res, next) => {
  try {
    // req.user ya fue validado por el middleware protect
    const token = generateToken(req.user._id);

    res.json({
      success: true,
      data: { token },
    });
  } catch (error) {
    next(error);
  }
};
