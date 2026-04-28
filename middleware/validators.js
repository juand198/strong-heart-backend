const { body, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg).join(', ');
    return next(new ValidationError(messages));
  }
  next();
};

const registerRules = [
  body('email')
    .isEmail().withMessage('Email inválido')
    .isLength({ max: 254 }).withMessage('Email demasiado largo')
    .normalizeEmail()
    .trim(),
  body('password')
    .isLength({ min: 8, max: 128 }).withMessage('La contraseña debe tener entre 8 y 128 caracteres')
    .matches(/[A-Z]/).withMessage('La contraseña debe tener al menos una mayúscula')
    .matches(/[0-9]/).withMessage('La contraseña debe tener al menos un número'),
  body('name')
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ max: 100 }).withMessage('El nombre no puede superar 100 caracteres')
    .trim(),
  body('phone')
    .optional()
    .isLength({ max: 20 }).withMessage('El teléfono no puede superar 20 caracteres')
    .trim(),
];

const loginRules = [
  body('email').isEmail().withMessage('Email inválido').normalizeEmail().trim(),
  body('password').notEmpty().withMessage('La contraseña es obligatoria').isLength({ max: 128 }),
];

const measurementsRules = [
  body('pecho').optional({ nullable: true }).isFloat({ min: 0, max: 300 }).withMessage('Medida de pecho inválida'),
  body('cintura').optional({ nullable: true }).isFloat({ min: 0, max: 300 }).withMessage('Medida de cintura inválida'),
  body('cadera').optional({ nullable: true }).isFloat({ min: 0, max: 300 }).withMessage('Medida de cadera inválida'),
  body('hombros').optional({ nullable: true }).isFloat({ min: 0, max: 200 }).withMessage('Medida de hombros inválida'),
  body('largo').optional({ nullable: true }).isFloat({ min: 0, max: 300 }).withMessage('Medida de largo inválida'),
];

const addressRules = [
  body('name')
    .notEmpty().withMessage('El nombre de la dirección es obligatorio')
    .isLength({ max: 100 }).withMessage('El nombre no puede superar 100 caracteres')
    .trim(),
  body('street')
    .notEmpty().withMessage('La calle es obligatoria')
    .isLength({ max: 256 }).withMessage('La calle no puede superar 256 caracteres')
    .trim(),
  body('city')
    .notEmpty().withMessage('La ciudad es obligatoria')
    .isLength({ max: 100 }).withMessage('La ciudad no puede superar 100 caracteres')
    .trim(),
  body('postalCode')
    .notEmpty().withMessage('El código postal es obligatorio')
    .isLength({ max: 20 }).withMessage('El código postal no puede superar 20 caracteres')
    .trim(),
  body('country')
    .notEmpty().withMessage('El país es obligatorio')
    .isLength({ max: 100 }).withMessage('El país no puede superar 100 caracteres')
    .trim(),
  body('isDefault').optional().isBoolean(),
];

const cartItemRules = [
  body('productId').notEmpty().withMessage('El productId es obligatorio').isLength({ max: 100 }),
  body('quantity').isInt({ min: 1, max: 100 }).withMessage('La cantidad debe estar entre 1 y 100'),
  body('size')
    .notEmpty().withMessage('La talla es obligatoria')
    .isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL']).withMessage('Talla inválida'),
];

const orderRules = [
  body('items')
    .isArray({ min: 1, max: 50 }).withMessage('Debe incluir entre 1 y 50 productos'),
  body('items.*.productId')
    .notEmpty().withMessage('Cada item necesita productId')
    .isLength({ max: 100 }),
  body('items.*.quantity')
    .isInt({ min: 1, max: 100 }).withMessage('Cantidad inválida (máx. 100)'),
  body('items.*.size')
    .notEmpty().withMessage('Cada item necesita talla')
    .isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL']).withMessage('Talla inválida'),
  body('shippingAddressId').notEmpty().withMessage('La dirección de envío es obligatoria').isLength({ max: 100 }),
  body('paymentMethod')
    .optional({ nullable: true })
    .isIn(['credit_card', 'paypal', 'bank_transfer'])
    .withMessage('Método de pago inválido'),
  body('notes')
    .optional()
    .isLength({ max: 500 }).withMessage('Las notas no pueden superar 500 caracteres')
    .trim(),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  measurementsRules,
  addressRules,
  cartItemRules,
  orderRules,
};
