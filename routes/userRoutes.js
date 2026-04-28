const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  saveMeasurements,
  getMeasurements,
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { measurementsRules, addressRules, validate } = require('../middleware/validators');

router.use(protect); // Todas las rutas de usuario requieren auth

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

router.get('/measurements', getMeasurements);
router.post('/measurements', measurementsRules, validate, saveMeasurements);

router.get('/addresses', getAddresses);
router.post('/addresses', addressRules, validate, addAddress);
router.put('/addresses/:addressId', updateAddress);
router.delete('/addresses/:addressId', deleteAddress);

module.exports = router;
