/**
 * Formatea precio en centavos a string con símbolo €
 * @param {number} centavos
 * @returns {string}
 */
const formatPrice = (centavos) => {
  return `${(centavos / 100).toFixed(2)} €`;
};

/**
 * Algoritmo de recomendación de talla.
 *
 * El admin debe introducir el valor MÁXIMO de cuerpo que cabe en cada talla
 * (límite superior del rango). Ejemplo: M.pecho = 92 significa que la talla M
 * cabe hasta 92cm de pecho.
 *
 * Lógica:
 *   1. Descarta tallas sin medidas definidas.
 *   2. Una talla "cabe" si TODOS los valores del producto >= medidas del usuario.
 *   3. Entre las tallas que caben, recomienda la más pequeña (mejor ajuste).
 *   4. Si ninguna cabe (usuario muy grande), recomienda la que menos se queda corta.
 *
 * @param {object} userMeasurements - { pecho, cintura, cadera, hombros, largo }
 * @param {object} productSizes     - { XS: { pecho, cintura, ... }, S: {...}, ... }
 * @param {string[]} measuresToConsider
 * @returns {{ recommendedSize: string|null, details: object }}
 */
const recommendSize = (userMeasurements, productSizes, measuresToConsider) => {
  const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const details = {};

  // Calcular para cada talla si cabe y cuánto le falta/sobra
  for (const [sizeName, sizeMeasures] of Object.entries(productSizes)) {
    let fits = true;
    let totalShortfall = 0; // suma de lo que le falta cuando no cabe
    let comparedCount = 0;

    for (const measure of measuresToConsider) {
      const userVal = userMeasurements[measure];
      const sizeVal = sizeMeasures[measure];

      if (userVal != null && userVal > 0 && sizeVal != null && sizeVal > 0) {
        comparedCount++;
        if (sizeVal < userVal) {
          fits = false;
          totalShortfall += userVal - sizeVal;
        }
      }
    }

    if (comparedCount === 0) continue; // talla sin medidas → ignorar

    details[sizeName] = { fits, totalShortfall, comparedCount };
  }

  // 1. Intentar recomendar la talla más pequeña que cabe (en orden XS→XXL)
  for (const size of SIZE_ORDER) {
    if (details[size]?.fits) return { recommendedSize: size, details };
  }

  // 2. Fallback: la talla que menos se queda corta
  let fallback = null;
  let minShortfall = Infinity;
  for (const size of SIZE_ORDER) {
    if (details[size] && details[size].totalShortfall < minShortfall) {
      minShortfall = details[size].totalShortfall;
      fallback = size;
    }
  }

  return { recommendedSize: fallback, details };
};

/**
 * Genera un código de seguimiento aleatorio
 */
const generateTrackingCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'SH';
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Calcula fecha estimada de entrega (días laborables)
 */
const estimateDelivery = (businessDays = 5) => {
  const date = new Date();
  let added = 0;
  while (added < businessDays) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return date;
};

module.exports = { formatPrice, recommendSize, generateTrackingCode, estimateDelivery };
