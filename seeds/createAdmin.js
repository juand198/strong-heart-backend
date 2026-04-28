require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

// ── Configura aquí las credenciales del admin ─────────────────────────────────
const ADMIN = {
  name:     process.env.ADMIN_NAME     || 'Administrador Strong Heart',
  email:    process.env.ADMIN_EMAIL    || 'admin@strongheart.com',
  password: process.env.ADMIN_PASSWORD || 'Admin1234!',
  role:     'admin',
};
// ─────────────────────────────────────────────────────────────────────────────

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const exists = await User.findOne({ email: ADMIN.email });
    if (exists) {
      if (exists.role === 'admin') {
        console.log(`ℹ️  Ya existe un admin con ese email: ${ADMIN.email}`);
      } else {
        exists.role = 'admin';
        await exists.save();
        console.log(`✅ Usuario existente promocionado a admin: ${ADMIN.email}`);
      }
    } else {
      await User.create(ADMIN);
      console.log('✅ Admin creado correctamente:');
      console.log(`   Email:    ${ADMIN.email}`);
      console.log(`   Password: ${ADMIN.password}`);
      console.log('\n⚠️  Cambia la contraseña después del primer login.');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdmin();
