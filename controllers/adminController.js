const User    = require('../models/User');
const Product = require('../models/Product');
const Order   = require('../models/Order');
const Message = require('../models/Message');
const { NotFoundError, ValidationError } = require('../utils/errors');

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const scheduleMessageCleanup = (orderId) =>
  Message.updateMany({ orderId }, { deleteAt: new Date(Date.now() + SEVEN_DAYS) });
const { generateTrackingCode } = require('../utils/helpers');

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

// GET /api/admin/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      ordersByStatus,
      recentOrders,
      revenue,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'name email'),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const statusMap = {};
    ordersByStatus.forEach(({ _id, count }) => { statusMap[_id] = count; });

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalProducts,
          totalOrders,
          revenue: revenue[0]?.total || 0,
        },
        ordersByStatus: statusMap,
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── PEDIDOS ─────────────────────────────────────────────────────────────────

// GET /api/admin/orders
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, limit = 20, offset = 0, userId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const [orders, total, unreadOrderIds] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(Number(offset))
        .limit(Number(limit))
        .populate('userId', 'name email phone'),
      Order.countDocuments(filter),
      Message.distinct('orderId', { senderRole: 'user', readByAdmin: false }),
    ]);

    const unreadSet = new Set(unreadOrderIds.map((id) => id.toString()));
    const ordersWithChat = orders.map((o) => ({
      ...o.toObject(),
      hasUnreadChat: unreadSet.has(o._id.toString()),
    }));

    res.json({ success: true, data: { orders: ordersWithChat, total } });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/orders/:orderId
exports.getOrderDetail = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('userId', 'name email phone');
    if (!order) return next(new NotFoundError('Pedido no encontrado'));
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/orders/:orderId/status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, trackingCode, notes } = req.body;

    const validStatuses = ['pending', 'processing', 'awaiting_payment', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return next(new ValidationError(`Estado inválido. Válidos: ${validStatuses.join(', ')}`));
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) return next(new NotFoundError('Pedido no encontrado'));

    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: notes || `Estado actualizado a ${status} por admin`,
    });

    // Generar tracking automáticamente al enviar
    if (status === 'shipped') {
      order.trackingCode = trackingCode || order.trackingCode || generateTrackingCode();
    }
    if (trackingCode) order.trackingCode = trackingCode;

    await order.save();

    if (['delivered', 'cancelled'].includes(status)) {
      scheduleMessageCleanup(order._id).catch(() => {});
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// ─── USUARIOS ────────────────────────────────────────────────────────────────

// GET /api/admin/users
exports.getAllUsers = async (req, res, next) => {
  try {
    const { limit = 20, offset = 0, search } = req.query;
    const filter = { role: { $ne: 'admin' } };

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(Number(offset))
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, data: { users, total } });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users/:userId
exports.getUserDetail = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) return next(new NotFoundError('Usuario no encontrado'));

    // Pedidos del usuario
    const orders = await Order.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { user, orders } });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/users/:userId
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return next(new NotFoundError('Usuario no encontrado'));
    if (user.role === 'admin') {
      return next(new ValidationError('No puedes eliminar a otro administrador'));
    }
    await user.deleteOne();
    res.json({ success: true, message: 'Usuario eliminado' });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/users/:userId/role
exports.changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return next(new ValidationError('Rol inválido'));
    }
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role },
      { new: true }
    ).select('-password');
    if (!user) return next(new NotFoundError('Usuario no encontrado'));
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// ─── PRODUCTOS ───────────────────────────────────────────────────────────────

// POST /api/admin/products
exports.createProduct = async (req, res, next) => {
  try {
    const { id, name, price, formattedPrice, badge, color, category, image, description, story, careInstructions, measuresToConsider, sizes, stock } = req.body;
    const product = await Product.create({ id, name, price, formattedPrice, badge, color, category, image, description, story, careInstructions, measuresToConsider, sizes, stock });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/products/:productId
exports.updateProduct = async (req, res, next) => {
  try {
    const { name, price, formattedPrice, badge, color, category, image, description, story, careInstructions, measuresToConsider, sizes, stock } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      { name, price, formattedPrice, badge, color, category, image, description, story, careInstructions, measuresToConsider, sizes, stock },
      { new: true, runValidators: true }
    );
    if (!product) return next(new NotFoundError('Producto no encontrado'));
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/products/:productId
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.productId);
    if (!product) return next(new NotFoundError('Producto no encontrado'));
    res.json({ success: true, message: 'Producto eliminado' });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/products/:productId/stock
exports.updateStock = async (req, res, next) => {
  try {
    // body: { stock: { S: 10, M: 20, L: 15 } }
    const { stock } = req.body;
    if (!stock || typeof stock !== 'object') {
      return next(new ValidationError('Formato de stock inválido. Envía { stock: { S: 10, M: 20 } }'));
    }

    const updateFields = {};
    for (const [size, qty] of Object.entries(stock)) {
      updateFields[`stock.${size}`] = qty;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      { $set: updateFields },
      { new: true }
    );
    if (!product) return next(new NotFoundError('Producto no encontrado'));
    res.json({ success: true, data: { stock: product.stock } });
  } catch (error) {
    next(error);
  }
};
