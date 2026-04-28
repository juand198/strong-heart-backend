const User = require('../models/User');
const Product = require('../models/Product');
const { NotFoundError, ConflictError } = require('../utils/errors');

// POST /api/favorites
exports.addFavorite = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) return next(new NotFoundError('productId requerido'));

    const product = await Product.findById(productId);
    if (!product) return next(new NotFoundError('Producto no encontrado'));

    const user = await User.findById(req.user._id);

    const alreadyFav = user.favorites.some((id) => id.toString() === productId);
    if (alreadyFav) return next(new ConflictError('El producto ya está en favoritos'));

    user.favorites.push(productId);
    await user.save();

    res.status(201).json({ success: true, data: { productId, addedAt: new Date() } });
  } catch (error) {
    next(error);
  }
};

// GET /api/favorites
exports.getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('favorites');
    res.json({ success: true, data: user.favorites });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/favorites/:productId
exports.removeFavorite = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const index = user.favorites.findIndex(
      (id) => id.toString() === req.params.productId
    );

    if (index === -1) return next(new NotFoundError('Producto no encontrado en favoritos'));

    user.favorites.splice(index, 1);
    await user.save();

    res.json({ success: true, message: 'Eliminado de favoritos' });
  } catch (error) {
    next(error);
  }
};

// GET /api/favorites/:productId
exports.checkFavorite = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('favorites');
    const isFavorite = user.favorites.some(
      (id) => id.toString() === req.params.productId
    );
    res.json({ success: true, data: { isFavorite } });
  } catch (error) {
    next(error);
  }
};
