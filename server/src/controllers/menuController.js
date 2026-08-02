const asyncHandler = require('../utils/asyncHandler');
const MenuItem = require('../models/MenuItem');

const listMenuItems = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.all !== 'true') filter.isAvailable = true;

  const items = await MenuItem.find(filter).populate('category', 'name').sort({ name: 1 });
  res.json(items);
});

const getMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id).populate('category', 'name');
  if (!item) return res.status(404).json({ message: 'Menu item not found' });
  res.json(item);
});

const createMenuItem = asyncHandler(async (req, res) => {
  const { name, description, price, category, imageUrl, isVeg, prepTimeMinutes } = req.body;
  if (!name || price === undefined || !category) {
    return res.status(400).json({ message: 'name, price and category are required' });
  }
  const item = await MenuItem.create({ name, description, price, category, imageUrl, isVeg, prepTimeMinutes });
  res.status(201).json(item);
});

const updateMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!item) return res.status(404).json({ message: 'Menu item not found' });
  res.json(item);
});

const deleteMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Menu item not found' });
  res.json({ message: 'Menu item deleted' });
});

module.exports = { listMenuItems, getMenuItem, createMenuItem, updateMenuItem, deleteMenuItem };
