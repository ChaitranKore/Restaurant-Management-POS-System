const asyncHandler = require('../utils/asyncHandler');
const Table = require('../models/Table');

const listTables = asyncHandler(async (req, res) => {
  const tables = await Table.find().sort({ number: 1 });
  res.json(tables);
});

const createTable = asyncHandler(async (req, res) => {
  const { number, capacity } = req.body;
  if (number === undefined) return res.status(400).json({ message: 'number is required' });
  const table = await Table.create({ number, capacity });
  res.status(201).json(table);
});

const updateTable = asyncHandler(async (req, res) => {
  const table = await Table.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!table) return res.status(404).json({ message: 'Table not found' });
  res.json(table);
});

const deleteTable = asyncHandler(async (req, res) => {
  const table = await Table.findByIdAndDelete(req.params.id);
  if (!table) return res.status(404).json({ message: 'Table not found' });
  res.json({ message: 'Table deleted' });
});

module.exports = { listTables, createTable, updateTable, deleteTable };
