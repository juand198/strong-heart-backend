const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const CartItem = require('../models/CartItem');
const Message = require('../models/Message');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { generateTrackingCode, estimateDelivery } = require('../utils/helpers');

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const scheduleMessageCleanup = (orderId) =>
  Message.updateMany({ orderId }, { deleteAt: new Date(Date.now() + SEVEN_DAYS) });

// POST /api/orders
exports.createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddressId, paymentMethod, notes } = req.body;

    // Verificar dirección
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(shippingAddressId);
    if (!address) return next(new NotFoundError('Dirección de envío no encontrada'));

    // Verificar productos y stock
    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return next(new NotFoundError(`Producto ${item.productId} no encontrado`));

      const stockForSize = product.stock?.[item.size];
      if (stockForSize !== undefined && stockForSize < item.quantity) {
        return next(new ValidationError(`Stock insuficiente para ${product.name} talla ${item.size}`));
      }

      orderItems.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        size: item.size,
        color: item.color || product.color,
        price: product.price,
        image: product.image,
      });

      totalAmount += product.price * item.quantity;

      // Descontar stock
      if (stockForSize !== undefined) {
        await Product.findByIdAndUpdate(product._id, {
          $inc: { [`stock.${item.size}`]: -item.quantity },
        });
      }
    }

    const deliveryDate = estimateDelivery(5);

    const order = await Order.create({
      userId: req.user._id,
      items: orderItems,
      totalAmount,
      shippingAddress: {
        name: address.name,
        street: address.street,
        city: address.city,
        postalCode: address.postalCode,
        country: address.country,
      },
      paymentMethod,
      notes,
      deliveryDate,
      status: 'pending',
      statusHistory: [{ status: 'pending', timestamp: new Date(), note: 'Pedido recibido' }],
    });

    // Vaciar carrito tras compra
    await CartItem.deleteMany({ userId: req.user._id });

    res.status(201).json({
      success: true,
      data: {
        orderId: order._id,
        totalAmount: order.totalAmount,
        status: order.status,
        estimatedDelivery: deliveryDate,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders
exports.getOrders = async (req, res, next) => {
  try {
    const { status, limit = 10, offset = 0 } = req.query;
    const filter = { userId: req.user._id };
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter).skip(Number(offset)).limit(Number(limit)).sort({ createdAt: -1 }),
      Order.countDocuments(filter),
    ]);

    res.json({ success: true, data: orders, total });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/:orderId
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, userId: req.user._id });
    if (!order) return next(new NotFoundError('Pedido no encontrado'));

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// PUT /api/orders/:orderId  — cliente puede confirmar entrega o cancelar (solo si está en pending)
exports.updateOrder = async (req, res, next) => {
  try {
    const { status } = req.body;

    const order = await Order.findOne({ _id: req.params.orderId, userId: req.user._id });
    if (!order) return next(new NotFoundError('Pedido no encontrado'));

    if (status === 'delivered') {
      if (order.status !== 'shipped') {
        return next(new ValidationError('El pedido debe estar en estado "Enviado" para confirmar la entrega'));
      }
      order.status = 'delivered';
      order.statusHistory.push({ status: 'delivered', timestamp: new Date(), note: 'Entrega confirmada por el cliente' });

    } else if (status === 'cancelled') {
      if (order.status !== 'pending') {
        return next(new ValidationError('Solo puedes cancelar el pedido mientras está pendiente de elaboración'));
      }
      order.status = 'cancelled';
      order.statusHistory.push({ status: 'cancelled', timestamp: new Date(), note: 'Pedido cancelado por el cliente' });

    } else {
      return next(new ValidationError('Acción no permitida'));
    }

    await order.save();
    scheduleMessageCleanup(order._id).catch(() => {});
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/:orderId/tracking
exports.getTracking = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, userId: req.user._id });
    if (!order) return next(new NotFoundError('Pedido no encontrado'));

    const allSteps = [
      { step: 0, key: 'pending',          name: 'Pedido recibido'   },
      { step: 1, key: 'processing',       name: 'En elaboración'    },
      { step: 2, key: 'awaiting_payment', name: 'Esperando pago'    },
      { step: 3, key: 'paid',             name: 'Pago confirmado'   },
      { step: 4, key: 'shipped',          name: 'Enviado'           },
      { step: 5, key: 'delivered',        name: 'Entregado'         },
    ];

    const statusToStep = {
      pending:          0,
      processing:       1,
      awaiting_payment: 2,
      paid:             3,
      shipped:          4,
      delivered:        5,
      cancelled:       -1,
    };

    const isCancelled = order.status === 'cancelled';
    const currentStep = statusToStep[order.status] ?? 0;

    const steps = allSteps.map((s) => {
      const historyEntry = order.statusHistory?.find((h) => h.status === s.key);
      return {
        ...s,
        completed: !isCancelled && s.step <= currentStep,
        timestamp: historyEntry?.timestamp || null,
      };
    });

    res.json({
      success: true,
      data: {
        orderId: order._id,
        status: order.status,
        isCancelled,
        trackingCode: order.trackingCode,
        estimatedDelivery: order.deliveryDate,
        currentStep,
        steps,
        items: order.items,
      },
    });
  } catch (error) {
    next(error);
  }
};
