const Message = require('../models/Message');
const Order   = require('../models/Order');
const { NotFoundError, ValidationError } = require('../utils/errors');

// ── USER ──────────────────────────────────────────────────────────────────────

// GET /api/chat/:orderId
exports.getMessages = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, userId: req.user._id });
    if (!order) return next(new NotFoundError('Pedido no encontrado'));

    // Mark admin messages as read by user
    await Message.updateMany(
      { orderId: order._id, senderRole: 'admin', readByUser: false },
      { readByUser: true }
    );

    const messages = await Message.find({ orderId: order._id }).sort({ createdAt: 1 });
    res.json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
};

// POST /api/chat/:orderId
exports.sendMessage = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return next(new ValidationError('El mensaje no puede estar vacío'));

    const order = await Order.findOne({ _id: req.params.orderId, userId: req.user._id });
    if (!order) return next(new NotFoundError('Pedido no encontrado'));

    if (order.status === 'delivered' || order.status === 'cancelled') {
      return next(new ValidationError('No puedes enviar mensajes en pedidos cerrados'));
    }

    const msg = await Message.create({
      orderId:     order._id,
      senderId:    req.user._id,
      senderRole:  'user',
      text:        text.trim(),
      readByAdmin: false,
      readByUser:  true,
    });

    res.status(201).json({ success: true, data: msg });
  } catch (err) {
    next(err);
  }
};

// ── ADMIN ─────────────────────────────────────────────────────────────────────

// GET /api/admin/chat/:orderId
exports.adminGetMessages = async (req, res, next) => {
  try {
    // Mark user messages as read by admin
    await Message.updateMany(
      { orderId: req.params.orderId, senderRole: 'user', readByAdmin: false },
      { readByAdmin: true }
    );

    const messages = await Message.find({ orderId: req.params.orderId }).sort({ createdAt: 1 });
    res.json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/chat/:orderId
exports.adminSendMessage = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return next(new ValidationError('El mensaje no puede estar vacío'));

    const order = await Order.findById(req.params.orderId);
    if (!order) return next(new NotFoundError('Pedido no encontrado'));

    const msg = await Message.create({
      orderId:     order._id,
      senderId:    req.user._id,
      senderRole:  'admin',
      text:        text.trim(),
      readByAdmin: true,
      readByUser:  false,
    });

    res.status(201).json({ success: true, data: msg });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/chat/unread-orders — orderIds with unread user messages
exports.getUnreadOrders = async (req, res, next) => {
  try {
    const orderIds = await Message.distinct('orderId', { senderRole: 'user', readByAdmin: false });
    res.json({ success: true, data: orderIds });
  } catch (err) {
    next(err);
  }
};
