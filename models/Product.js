const mongoose = require('mongoose');

const sizeMetricsSchema = new mongoose.Schema(
  {
    pecho: Number,
    cintura: Number,
    cadera: Number,
    hombros: Number,
    largo: Number,
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: [true, 'El id de producto es obligatorio'],
      unique: true,
      trim: true,
    },
    name: { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
    price: { type: Number, required: [true, 'El precio es obligatorio'], min: 0 }, // centavos
    formattedPrice: { type: String },
    badge: { type: String, trim: true },
    color: { type: String, trim: true },
    category: {
      type: String,
      trim: true,
      enum: ['Conjuntos', 'Camisetas', 'Sudaderas', 'Mallas', 'Otros'],
      default: 'Otros',
    },
    image: { type: String },
    description: { type: String },
    story: { type: String },
    careInstructions: [{ type: String }],
    measuresToConsider: [{ type: String }],
    sizes: {
      XS: sizeMetricsSchema,
      S: sizeMetricsSchema,
      M: sizeMetricsSchema,
      L: sizeMetricsSchema,
      XL: sizeMetricsSchema,
      XXL: sizeMetricsSchema,
    },
    stock: {
      XS: { type: Number, default: 0 },
      S: { type: Number, default: 0 },
      M: { type: Number, default: 0 },
      L: { type: Number, default: 0 },
      XL: { type: Number, default: 0 },
      XXL: { type: Number, default: 0 },
    },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Índice de texto para búsqueda
productSchema.index({ name: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);
