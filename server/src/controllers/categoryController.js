const asyncHandler = require('../utils/asyncHandler');
const Category = require('../models/Category');

const listCategories = asyncHandler(async (req, res) => {
  const filter = req.query.all === 'true' ? {} : { isActive: true };
  const categories = await Category.find(filter).sort({ displayOrder: 1, name: 1 });
  res.json(categories);
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, description, displayOrder } = req.body;
  if (!name) return res.status(400).json({ message: 'name is required' });
  const category = await Category.create({ name, description, displayOrder });
  res.status(201).json(category);
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json(category);
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json({ message: 'Category deleted' });
});

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
