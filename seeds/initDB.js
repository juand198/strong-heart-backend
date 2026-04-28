require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

// Importar todos los modelos para que Mongoose registre los schemas
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const CartItem = require('../models/CartItem');

const initDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB:', process.env.MONGODB_URI);
    console.log('');

    // ── Crear colecciones vacías con sus índices ──────────────────────────────
    const collections = [
      { model: User,     name: 'users'     },
      { model: Product,  name: 'products'  },
      { model: Order,    name: 'orders'    },
      { model: CartItem, name: 'cartitems' },
    ];

    for (const { model, name } of collections) {
      // createCollection no falla si ya existe
      await model.createCollection();
      console.log(`📦 Colección creada: ${name}`);

      // Sincronizar índices definidos en el schema
      await model.syncIndexes();
      console.log(`🔑 Índices sincronizados: ${name}`);

      // Listar índices creados
      const indexes = await model.collection.indexes();
      indexes.forEach(idx => {
        const keys = Object.keys(idx.key).join(', ');
        const flags = [
          idx.unique ? 'UNIQUE' : '',
          idx.sparse ? 'SPARSE' : '',
        ].filter(Boolean).join(' ');
        console.log(`   └─ [${keys}]${flags ? ' ' + flags : ''}`);
      });
      console.log('');
    }

    // ── Verificación final ────────────────────────────────────────────────────
    const db = mongoose.connection.db;
    const existingCollections = await db.listCollections().toArray();
    const names = existingCollections.map(c => c.name);

    console.log('─'.repeat(45));
    console.log('✅ Base de datos inicializada correctamente');
    console.log(`   DB: ${db.databaseName}`);
    console.log(`   Colecciones: ${names.join(', ')}`);
    console.log('─'.repeat(45));

  } catch (err) {
    console.error('❌ Error al inicializar la base de datos:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

initDB();
