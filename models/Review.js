const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    orderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Order',   required: true },
    rating:    { type: Number, required: true, min: 1, max: 5 },
    comment:   { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

// Una sola reseña por usuario, producto y pedido
reviewSchema.index({ userId: 1, productId: 1, orderId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
