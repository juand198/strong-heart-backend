require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');

const products = [
  {
    id: 'conjunto-entrenamiento-elite',
    name: 'Conjunto Entrenamiento Elite',
    price: 12900,
    formattedPrice: '129.00 €',
    badge: 'Top Ventas',
    color: 'Negro/Dorado',
    category: 'Conjuntos',
    image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600',
    description:
      'Conjunto de alto rendimiento fabricado con tejido técnico de compresión. Perfecto para entrenamiento intenso. Incluye top de sujeción media y malla de cintura alta con bolsillo lateral.',
    measuresToConsider: ['pecho', 'cintura', 'cadera'],
    sizes: {
      XS: { pecho: 76, cintura: 58, cadera: 82 },
      S:  { pecho: 82, cintura: 62, cadera: 88 },
      M:  { pecho: 88, cintura: 68, cadera: 94 },
      L:  { pecho: 94, cintura: 74, cadera: 100 },
      XL: { pecho: 100, cintura: 80, cadera: 106 },
      XXL:{ pecho: 106, cintura: 86, cadera: 112 },
    },
    stock: { XS: 5, S: 12, M: 20, L: 15, XL: 8, XXL: 4 },
    rating: 4.8,
    reviews: 142,
  },
  {
    id: 'camiseta-dry-fit-pro',
    name: 'Camiseta Dry-Fit Pro',
    price: 4900,
    formattedPrice: '49.00 €',
    badge: 'Nueva Colección',
    color: 'Blanco',
    category: 'Camisetas',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
    description:
      'Camiseta técnica de secado ultra-rápido con tecnología Dry-Fit. Tejido transpirable con protección UPF 30+. Ideal para running, gym y cualquier actividad de alta intensidad.',
    measuresToConsider: ['pecho'],
    sizes: {
      XS: { pecho: 84 },
      S:  { pecho: 90 },
      M:  { pecho: 96 },
      L:  { pecho: 102 },
      XL: { pecho: 108 },
      XXL:{ pecho: 116 },
    },
    stock: { XS: 10, S: 25, M: 30, L: 22, XL: 12, XXL: 6 },
    rating: 4.6,
    reviews: 98,
  },
  {
    id: 'sudadera-premium-zip',
    name: 'Sudadera Premium Zip',
    price: 8500,
    formattedPrice: '85.00 €',
    badge: 'Pieza única',
    color: 'Gris Marengo',
    category: 'Sudaderas',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600',
    description:
      'Sudadera con cremallera completa en tejido french terry premium. Interior suave y cálido con exterior resistiente al viento. Bolsillos frontales con cremallera y capucha ajustable.',
    measuresToConsider: ['pecho', 'cintura'],
    sizes: {
      XS: { pecho: 88, cintura: 66 },
      S:  { pecho: 94, cintura: 72 },
      M:  { pecho: 100, cintura: 78 },
      L:  { pecho: 106, cintura: 84 },
      XL: { pecho: 114, cintura: 92 },
      XXL:{ pecho: 122, cintura: 100 },
    },
    stock: { XS: 3, S: 8, M: 14, L: 10, XL: 6, XXL: 2 },
    rating: 4.9,
    reviews: 67,
  },
  {
    id: 'mallas-compresion-7-8',
    name: 'Mallas Compresión 7/8',
    price: 7200,
    formattedPrice: '72.00 €',
    badge: 'Top Ventas',
    color: 'Azul Marino',
    category: 'Mallas',
    image: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600',
    description:
      'Mallas de compresión 7/8 con cintura alta moldeadora. Tejido opaco de 4 vías con bolsillo lateral para smartphone. Costura plana sin rozaduras. Tiro reforzado para mayor durabilidad.',
    measuresToConsider: ['cintura', 'cadera'],
    sizes: {
      XS: { cintura: 58, cadera: 82 },
      S:  { cintura: 62, cadera: 88 },
      M:  { cintura: 68, cadera: 94 },
      L:  { cintura: 74, cadera: 100 },
      XL: { cintura: 80, cadera: 106 },
      XXL:{ cintura: 86, cadera: 112 },
    },
    stock: { XS: 8, S: 18, M: 24, L: 16, XL: 9, XXL: 3 },
    rating: 4.7,
    reviews: 215,
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    await Product.deleteMany({});
    console.log('🗑️  Colección de productos limpiada');

    const inserted = await Product.insertMany(products);
    console.log(`🌱 ${inserted.length} productos insertados:`);
    inserted.forEach((p) => console.log(`   • ${p.name} (${p.id})`));

    console.log('\n✅ Seed completado con éxito');
  } catch (err) {
    console.error('❌ Error en seed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();
