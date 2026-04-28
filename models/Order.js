const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String, required: true },
    color: { type: String },
    price: { type: Number, required: true }, // precio al momento de compra (centavos)
    image: { type: String },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario es obligatorio'],
    },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true }, // centavos
    status: {
      type: String,
      enum: ['pending', 'processing', 'awaiting_payment', 'paid', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    trackingCode: { type: String },
    deliveryDate: { type: Date },
    shippingAddress: {
      name: String,
      street: String,
      city: String,
      postalCode: String,
      country: String,
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'paypal', 'bank_transfer', null],
    },
    notes: { type: String },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
