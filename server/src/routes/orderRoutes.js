const express = require('express');
const {
  createOrder,
  listOrders,
  listMyOrders,
  getOrder,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // every order route requires an authenticated user

router.post('/', createOrder); // customer, staff, or admin can place an order
router.get('/', authorize('admin', 'staff'), listOrders);
router.get('/my', authorize('customer'), listMyOrders);
router.get('/:id', getOrder); // ownership/role check happens inside the controller
router.patch('/:id/status', authorize('admin', 'staff'), updateOrderStatus);

module.exports = router;
