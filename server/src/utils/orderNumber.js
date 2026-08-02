// Generates a human-friendly, sufficiently-unique order number, e.g. ORD-20260802-4F91
function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `ORD-${date}-${random}`;
}

module.exports = generateOrderNumber;
