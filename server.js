require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Rutas
const authRoutes    = require('./routes/authRoutes');
const userRoutes    = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const favoritesRoutes = require('./routes/favoritesRoutes');
const cartRoutes    = require('./routes/cartRoutes');
const orderRoutes   = require('./routes/orderRoutes');
const adminRoutes   = require('./routes/adminRoutes');
const reviewRoutes  = require('./routes/reviewRoutes');
const chatRoutes    = require('./routes/chatRoutes');

// Validar variables críticas al arrancar
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET no configurado o demasiado corto (mínimo 32 caracteres). Abortando.');
  process.exit(1);
}

const app = express();

// Render (y la mayoría de plataformas cloud) usan un proxy inverso
app.set('trust proxy', 1);

// ─── Conexión a base de datos ───────────────────────────────────────────────
connectDB();

// ─── Seguridad: cabeceras HTTP ───────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-site' },
  contentSecurityPolicy: false, // Lo gestiona el frontend
}));

// ─── CORS ───────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS: origen no permitido'));
  },
  credentials: true,
}));

// ─── Rate limiting ───────────────────────────────────────────────────────────
// General: 150 peticiones por 15 minutos por IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiadas peticiones. Inténtalo más tarde.' },
});

// Estricto para auth: 10 intentos por 15 minutos por IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos de acceso. Espera 15 minutos.' },
  skipSuccessfulRequests: true,
});

app.use('/api', generalLimiter);
app.use('/api/auth/login',   authLimiter);
app.use('/api/auth/register', authLimiter);

// ─── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Sanitización NoSQL ──────────────────────────────────────────────────────
app.use(mongoSanitize());

// ─── Log de peticiones en desarrollo ────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`→ ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ─── Rutas API ───────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/cart',     cartRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/reviews',  reviewRoutes);
app.use('/api/chat',     chatRoutes);

// Setup inicial — solo disponible en desarrollo
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/setup/admin', require('./routes/setupRoute'));
}

// Health check — sin información sensible
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'OK' });
});

// Ruta no encontrada
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint no encontrado' });
});

// ─── Manejador global de errores ─────────────────────────────────────────────
app.use(errorHandler);

// ─── Iniciar servidor ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Strong Heart API corriendo en http://localhost:${PORT}`);
  console.log(`   Entorno: ${process.env.NODE_ENV}\n`);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Error no manejado:', err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('❌ Excepción no capturada:', err.message);
  process.exit(1);
});

module.exports = app;
