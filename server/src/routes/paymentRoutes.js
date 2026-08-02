const express = require('express');
const { createPayment, listPayments } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', createPayment); // customer (card, self-checkout) or staff/admin (cash/card at POS)
router.get('/', authorize('admin'), listPayments);

module.exports = router;
