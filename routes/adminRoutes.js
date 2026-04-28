const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const admin = require('../controllers/adminController');
const chat  = require('../controllers/chatController');

// Todas las rutas admin requieren estar logueado Y ser admin
router.use(protect, adminOnly);

// Dashboard
router.get('/dashboard', admin.getDashboard);

// Pedidos
router.get('/orders',                      admin.getAllOrders);
router.get('/orders/:orderId',             admin.getOrderDetail);
router.put('/orders/:orderId/status',      admin.updateOrderStatus);

// Usuarios
router.get('/users',                       admin.getAllUsers);
router.get('/users/:userId',               admin.getUserDetail);
router.put('/users/:userId/role',          admin.changeUserRole);
router.delete('/users/:userId',            admin.deleteUser);

// Chat
router.get('/chat/unread-orders',   chat.getUnreadOrders);
router.get('/chat/:orderId',         chat.adminGetMessages);
router.post('/chat/:orderId',        chat.adminSendMessage);

// Productos (CRUD completo — los GET públicos siguen en /api/products)
router.post('/products',                   admin.createProduct);
router.put('/products/:productId',         admin.updateProduct);
router.delete('/products/:productId',      admin.deleteProduct);
router.put('/products/:productId/stock',   admin.updateStock);

module.exports = router;
