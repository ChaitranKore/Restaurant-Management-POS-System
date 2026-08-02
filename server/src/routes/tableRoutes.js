const express = require('express');
const { listTables, createTable, updateTable, deleteTable } = require('../controllers/tableController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', listTables); // public — customers pick a table number when ordering dine-in
router.post('/', protect, authorize('admin'), createTable);
router.put('/:id', protect, authorize('admin', 'staff'), updateTable);
router.delete('/:id', protect, authorize('admin'), deleteTable);

module.exports = router;
