require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const readline = require('readline');

const User     = require('../models/User');
const Product  = require('../models/Product');
const Order    = require('../models/Order');
const CartItem = require('../models/CartItem');

const COLLECTIONS = [
  { model: User,     name: 'users'     },
  { model: Product,  name: 'products'  },
  { model: Order,    name: 'orders'    },
  { model: CartItem, name: 'cartitems' },
];

const confirm = (question) => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
};

const resetDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const dbName = mongoose.connection.db.databaseName;
    console.log(`\n⚠️  Vas a BORRAR todos los datos de la base de datos: "${dbName}"`);
    console.log(`   URI: ${process.env.MONGODB_URI}\n`);

    // Confirmación interactiva (se puede saltar con --force)
    if (!process.argv.includes('--force')) {
      const answer = await confirm('¿Confirmas el reset? Escribe "si" para continuar: ');
      if (answer !== 'si') {
        console.log('❌ Reset cancelado.');
        process.exit(0);
      }
    }

    console.log('\n🗑️  Borrando colecciones...');
    for (const { model, name } of COLLECTIONS) {
      await model.collection.drop().catch(() => {}); // ignorar si no existe
      console.log(`   ✓ ${name} eliminada`);
    }

    console.log('\n📦 Recreando colecciones e índices...');
    for (const { model, name } of COLLECTIONS) {
      await model.createCollection();
      await model.syncIndexes();
      console.log(`   ✓ ${name} lista`);
    }

    console.log('\n✅ Reset completado — base de datos vacía y lista para usar');

  } catch (err) {
    console.error('❌ Error en reset:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

resetDB();
