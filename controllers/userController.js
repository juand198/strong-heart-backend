const User = require('../models/User');
const { NotFoundError } = require('../utils/errors');

// GET /api/users/profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return next(new NotFoundError('Usuario no encontrado'));

    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        measurements: user.measurements,
        addresses: user.addresses,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });

    res.json({ success: true, data: user.toPublicJSON() });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/measurements
exports.saveMeasurements = async (req, res, next) => {
  try {
    const { pecho, cintura, cadera, hombros, largo } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { measurements: { pecho, cintura, cadera, hombros, largo } },
      { new: true }
    );

    res.json({ success: true, data: user.measurements });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/measurements
exports.getMeasurements = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('measurements');
    res.json({ success: true, data: user.measurements || {} });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/addresses
exports.addAddress = async (req, res, next) => {
  try {
    const { name, street, city, postalCode, country, isDefault } = req.body;
    const user = await User.findById(req.user._id);

    // Si isDefault, quitar default de las demás
    if (isDefault) {
      user.addresses.forEach((addr) => { addr.isDefault = false; });
    }

    user.addresses.push({ name, street, city, postalCode, country, isDefault: isDefault || false });
    await user.save();

    const newAddress = user.addresses[user.addresses.length - 1];
    res.status(201).json({ success: true, data: newAddress });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/addresses
exports.getAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('addresses');
    res.json({ success: true, data: user.addresses });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/addresses/:addressId
exports.updateAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(req.params.addressId);

    if (!address) return next(new NotFoundError('Dirección no encontrada'));

    const { name, street, city, postalCode, country, isDefault } = req.body;

    if (isDefault) {
      user.addresses.forEach((addr) => { addr.isDefault = false; });
    }

    if (name !== undefined) address.name = name;
    if (street !== undefined) address.street = street;
    if (city !== undefined) address.city = city;
    if (postalCode !== undefined) address.postalCode = postalCode;
    if (country !== undefined) address.country = country;
    if (isDefault !== undefined) address.isDefault = isDefault;

    await user.save();
    res.json({ success: true, data: address });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/addresses/:addressId
exports.deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(req.params.addressId);

    if (!address) return next(new NotFoundError('Dirección no encontrada'));

    address.deleteOne();
    await user.save();

    res.json({ success: true, message: 'Dirección eliminada' });
  } catch (error) {
    next(error);
  }
};
