/**
 * Zero-config schema installation & seed script.
 *
 * Running `npm run setup` will:
 *   1. Generate a .env file (with a random JWT secret) if one doesn't exist yet.
 *   2. Connect to MongoDB and build indexes for every collection.
 *   3. Seed a default admin account, sample categories/menu items and tables
 *      — but only the pieces that don't already exist, so it's safe to re-run
 *      against an existing database without duplicating or wiping data.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ENV_PATH = path.resolve(__dirname, '../../.env');
const ENV_EXAMPLE_PATH = path.resolve(__dirname, '../../.env.example');

function ensureEnvFile() {
  if (fs.existsSync(ENV_PATH)) {
    console.log('.env already exists — leaving it untouched.');
    return;
  }

  console.log('No .env found — generating one with safe local defaults...');
  let contents = fs.readFileSync(ENV_EXAMPLE_PATH, 'utf8');
  const generatedSecret = crypto.randomBytes(48).toString('hex');
  contents = contents.replace('JWT_SECRET=change_this_secret', `JWT_SECRET=${generatedSecret}`);
  fs.writeFileSync(ENV_PATH, contents);
  console.log(`Created ${ENV_PATH}`);
}

ensureEnvFile();
require('dotenv').config({ path: ENV_PATH });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_pos';

async function buildIndexes() {
  console.log('Building indexes for all collections...');
  await Promise.all([User, Category, MenuItem, Table].map((model) => model.init()));
  console.log('Indexes ready.');
}

async function seedAdmin() {
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    console.log(`Admin account already exists (${existingAdmin.email}) — skipping.`);
    return;
  }

  const name = process.env.DEFAULT_ADMIN_NAME || 'Restaurant Admin';
  const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@restaurant.local';
  const password = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';

  await User.create({ name, email, password, role: 'admin' });
  console.log(`Created default admin account -> email: ${email} / password: ${password}`);
  console.log('IMPORTANT: change this password after first login.');
}

async function seedCategoriesAndMenu() {
  const count = await Category.countDocuments();
  if (count > 0) {
    console.log(`${count} categories already exist — skipping menu seed.`);
    return;
  }

  console.log('Seeding sample categories and menu items...');
  const categories = await Category.insertMany([
    { name: 'Appetizers', displayOrder: 1 },
    { name: 'Main Course', displayOrder: 2 },
    { name: 'Beverages', displayOrder: 3 },
    { name: 'Desserts', displayOrder: 4 },
  ]);
  const byName = Object.fromEntries(categories.map((c) => [c.name, c._id]));

  await MenuItem.insertMany([
    { name: 'Spring Rolls', description: 'Crispy vegetable spring rolls', price: 5.99, category: byName['Appetizers'], prepTimeMinutes: 8 },
    { name: 'Garlic Bread', description: 'Toasted bread with garlic butter', price: 4.49, category: byName['Appetizers'], prepTimeMinutes: 6 },
    { name: 'Margherita Pizza', description: 'Classic tomato, mozzarella and basil', price: 11.99, category: byName['Main Course'], prepTimeMinutes: 15 },
    { name: 'Grilled Chicken', description: 'Grilled chicken breast with roasted vegetables', price: 13.49, category: byName['Main Course'], isVeg: false, prepTimeMinutes: 18 },
    { name: 'Paneer Tikka Masala', description: 'Paneer in a rich tomato gravy', price: 10.99, category: byName['Main Course'], prepTimeMinutes: 16 },
    { name: 'Iced Tea', description: 'Freshly brewed iced tea', price: 2.99, category: byName['Beverages'], prepTimeMinutes: 3 },
    { name: 'Fresh Lime Soda', description: 'Sweet, salted, or plain', price: 2.49, category: byName['Beverages'], prepTimeMinutes: 3 },
    { name: 'Chocolate Brownie', description: 'Warm brownie with vanilla ice cream', price: 5.49, category: byName['Desserts'], prepTimeMinutes: 7 },
  ]);
  console.log('Sample menu seeded.');
}

async function seedTables() {
  const count = await Table.countDocuments();
  if (count > 0) {
    console.log(`${count} tables already exist — skipping table seed.`);
    return;
  }
  console.log('Seeding sample tables...');
  const tables = Array.from({ length: 10 }, (_, i) => ({
    number: i + 1,
    capacity: i % 3 === 0 ? 6 : 4,
  }));
  await Table.insertMany(tables);
  console.log('Sample tables seeded.');
}

async function run() {
  try {
    await connectDB(MONGO_URI);
    await buildIndexes();
    await seedAdmin();
    await seedCategoriesAndMenu();
    await seedTables();
    console.log('\nSetup complete. Start the API with `npm run dev` (or `npm start`).');
  } catch (err) {
    console.error('Setup failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
