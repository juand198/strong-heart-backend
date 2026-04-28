const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AuthError } = require('../utils/errors');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AuthError('Token no proporcionado'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new AuthError('Token inválido: usuario no encontrado'));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AuthError('Token inválido'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AuthError('Token expirado'));
    }
    next(error);
  }
};

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
    algorithm: 'HS256',
  });
};

// Middleware: solo admins
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return next(new AuthError('Acceso restringido a administradores'));
  }
  next();
};

module.exports = { protect, generateToken, adminOnly };
