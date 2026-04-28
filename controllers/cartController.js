const CartItem = require('../models/CartItem');
const Product = require('../models/Product');
const { NotFoundError, ValidationError } = require('../utils/errors');

// POST /api/cart/items
exports.addItem = async (req, res, next) => {
  try {
    const { productId, quantity, size, color } = req.body;

    const product = await Product.findById(productId);
    if (!product) return next(new NotFoundError('Producto no encontrado'));

    // Comprobar stock
    const stockForSize = product.stock?.[size];
    if (stockForSize !== undefined && stockForSize < quantity) {
      return next(new ValidationError(`Stock insuficiente para la talla ${size}`));
    }

    // Upsert: si ya existe mismo producto+talla, sumamos cantidad
    const existing = await CartItem.findOne({
      userId: req.user._id,
      productId,
      size,
    });

    if (existing) {
      existing.quantity += quantity;
      if (color) existing.color = color;
      await existing.save();
      await existing.populate('productId');
      return res.status(201).json({ success: true, data: existing });
    }

    const item = await CartItem.create({
      userId: req.user._id,
      productId,
      quantity,
      size,
      color,
    });

    await item.populate('productId');
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

// GET /api/cart/items
exports.getCart = async (req, res, next) => {
  try {
    const items = await CartItem.find({ userId: req.user._id }).populate('productId');

    const total = items.reduce((sum, item) => {
      const price = item.productId?.price || 0;
      return sum + price * item.quantity;
    }, 0);

    const quantity = items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({ success: true, data: { items, total, quantity } });
  } catch (error) {
    next(error);
  }
};

// PUT /api/cart/items/:cartItemId
exports.updateItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) return next(new ValidationError('Cantidad inválida'));

    const item = await CartItem.findOne({
      _id: req.params.cartItemId,
      userId: req.user._id,
    });
    if (!item) return next(new NotFoundError('Item no encontrado en el carrito'));

    item.quantity = quantity;
    await item.save();
    await item.populate('productId');

    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/cart/items/:cartItemId
exports.removeItem = async (req, res, next) => {
  try {
    const item = await CartItem.findOneAndDelete({
      _id: req.params.cartItemId,
      userId: req.user._id,
    });
    if (!item) return next(new NotFoundError('Item no encontrado en el carrito'));

    res.json({ success: true, message: 'Item eliminado del carrito' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/cart/clear
exports.clearCart = async (req, res, next) => {
  try {
    await CartItem.deleteMany({ userId: req.user._id });
    res.json({ success: true, message: 'Carrito vaciado' });
  } catch (error) {
    next(error);
  }
};
