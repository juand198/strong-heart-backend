const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario es obligatorio'],
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'El producto es obligatorio'],
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    size: { type: String, required: true },
    color: { type: String },
  },
  { timestamps: true }
);

// Índice compuesto para evitar duplicados (mismo producto + talla en el carrito)
cartItemSchema.index({ userId: 1, productId: 1, size: 1 }, { unique: true });

module.exports = mongoose.model('CartItem', cartItemSchema);
