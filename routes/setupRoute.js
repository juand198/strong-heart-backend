const User = require('../models/User');

// POST /api/setup/admin
// Crea el primer administrador. Se desactiva automáticamente si ya existe uno.
module.exports = async (req, res) => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      return res.status(403).json({
        success: false,
        message: 'Setup desactivado: ya existe un administrador.',
      });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'name, email y password son obligatorios.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres.',
      });
    }

    const user = await User.create({ name, email, password, role: 'admin' });

    res.status(201).json({
      success: true,
      message: '✅ Administrador creado. Este endpoint ya no estará disponible.',
      data: { email: user.email, name: user.name },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Ese email ya está en uso.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};
