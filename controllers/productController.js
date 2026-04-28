const Product = require('../models/Product');
const { NotFoundError } = require('../utils/errors');
const { recommendSize } = require('../utils/helpers');

// GET /api/products
exports.getProducts = async (req, res, next) => {
  try {
    const { category, badge, search, limit = 20, offset = 0, minPrice, maxPrice, size, color } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (badge)    filter.badge    = badge;
    if (size) filter[`stock.${size}`] = { $gt: 0 };
    if (color) filter.color = color;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) {
      filter.$text = { $search: search };
    }

    // strength:1 → ignores case AND diacritics (ó=o, á=a, etc.)
    const collation = { locale: 'es', strength: 1 };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .collation(collation)
        .skip(Number(offset))
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Product.countDocuments(filter).collation(collation),
    ]);

    res.json({
      success: true,
      data: products,
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/badges — valores de badge distintos que existen en la BD
exports.getBadges = async (req, res, next) => {
  try {
    const badges = await Product.distinct('badge', { badge: { $nin: [null, ''] } });
    res.json({ success: true, data: badges.filter(Boolean) });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id
exports.getProduct = async (req, res, next) => {
  try {
    // Buscar por _id de Mongo o por el campo 'id' (slug)
    const product = await Product.findOne({
      $or: [
        ...(req.params.id.match(/^[a-f\d]{24}$/i) ? [{ _id: req.params.id }] : []),
        { id: req.params.id },
      ],
    });

    if (!product) return next(new NotFoundError('Producto no encontrado'));

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id/recommended-size
exports.getRecommendedSize = async (req, res, next) => {
  try {
    const { pecho, cintura, cadera } = req.query;

    const product = await Product.findOne({
      $or: [
        ...(req.params.id.match(/^[a-f\d]{24}$/i) ? [{ _id: req.params.id }] : []),
        { id: req.params.id },
      ],
    });
    if (!product) return next(new NotFoundError('Producto no encontrado'));

    const userMeasurements = {
      pecho: pecho ? Number(pecho) : null,
      cintura: cintura ? Number(cintura) : null,
      cadera: cadera ? Number(cadera) : null,
    };

    const sizesObj = product.sizes ? product.sizes.toObject() : {};
    // Limpiar campos internos de Mongoose
    const cleanSizes = {};
    for (const [k, v] of Object.entries(sizesObj)) {
      if (v) cleanSizes[k] = v;
    }

    const measuresToConsider = product.measuresToConsider?.length
      ? product.measuresToConsider
      : ['pecho', 'cintura', 'cadera', 'hombros', 'largo'];

    const result = recommendSize(userMeasurements, cleanSizes, measuresToConsider);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
