const Review = require('../models/Review');
const Order  = require('../models/Order');
const { NotFoundError, ValidationError } = require('../utils/errors');

// POST /api/reviews
exports.createReview = async (req, res, next) => {
  try {
    const { orderId, productId, rating, comment } = req.body;

    if (!orderId || !productId || !rating) {
      return next(new ValidationError('orderId, productId y rating son obligatorios'));
    }

    // El pedido debe pertenecer al usuario y estar entregado
    const order = await Order.findOne({ _id: orderId, userId: req.user._id });
    if (!order) return next(new NotFoundError('Pedido no encontrado'));
    if (order.status !== 'delivered') {
      return next(new ValidationError('Solo puedes valorar pedidos entregados'));
    }

    // El producto debe estar en el pedido
    const itemInOrder = order.items.some(
      (i) => i.productId.toString() === productId.toString()
    );
    if (!itemInOrder) {
      return next(new ValidationError('Este producto no pertenece al pedido'));
    }

    const review = await Review.create({
      userId: req.user._id,
      productId,
      orderId,
      rating: Number(rating),
      comment: comment?.trim() || undefined,
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    if (error.code === 11000) {
      return next(new ValidationError('Ya has valorado este producto en este pedido'));
    }
    next(error);
  }
};

// GET /api/reviews/order/:orderId  — reseñas ya enviadas por el usuario para ese pedido
exports.getReviewsByOrder = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      orderId: req.params.orderId,
      userId: req.user._id,
    });
    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};
