const { AppError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Siempre loguear en servidor, nunca exponer al cliente
  console.error('❌ Error:', err.message, err.stack ? `\n${err.stack}` : '');

  // Mongoose: ID inválido
  if (err.name === 'CastError') {
    error = new AppError('ID inválido', 400);
  }

  // Mongoose: clave duplicada
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new AppError(`Ya existe un registro con ese ${field}`, 409);
  }

  // Mongoose: validación
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e) => e.message).join(', ');
    error = new AppError(message, 400);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Error interno del servidor';

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
