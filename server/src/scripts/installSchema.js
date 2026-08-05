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
  // A hosted environment supplies its config through real environment
  // variables. Writing a .env there is worse than useless: `.env.example`
  // carries localhost defaults and the literal JWT_SECRET=change_this_secret,
  // so any variable the platform *didn't* set would silently fall back to a
  // value that is public in this repository — signing production tokens with a
  // known secret rather than failing loudly. Only scaffold for local dev.
  if (process.env.MONGO_URI || process.env.NODE_ENV === 'production') {
    console.log('Environment already configured — not writing a .env file.');
    return;
  }

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
// `override` is false by default, so real environment variables always win over
// anything in the file. Kept explicit because the whole safety of the above
// depends on it.
require('dotenv').config({ path: ENV_PATH, override: false });

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

  // The customer menu is photo-first, so every seeded item carries an image.
  // Sources are Unsplash's CDN and Wikimedia Commons — both hotlinkable and
  // freely licensed. Each URL below was checked to be the dish it claims to be;
  // an item with no imageUrl falls back to a placeholder card in the UI rather
  // than a broken image, so admin-created items degrade gracefully.
  const unsplash = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=70`;
  const commons = (path) => `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}`;

  await MenuItem.insertMany([
    { name: 'Spring Rolls', description: 'Crispy vegetable spring rolls', price: 5.99, category: byName['Appetizers'], prepTimeMinutes: 8, imageUrl: commons('4/4e/Golden_Vegetable_Spring_Rolls_Served_with_Dipping_Sauce.jpg/960px-Golden_Vegetable_Spring_Rolls_Served_with_Dipping_Sauce.jpg') },
    { name: 'Garlic Bread', description: 'Toasted bread with garlic butter', price: 4.49, category: byName['Appetizers'], prepTimeMinutes: 6, imageUrl: commons('e/ee/Garlic_bread_-_on_plate%2C_ready_to_eat.jpg/960px-Garlic_bread_-_on_plate%2C_ready_to_eat.jpg') },
    { name: 'Margherita Pizza', description: 'Classic tomato, mozzarella and basil', price: 11.99, category: byName['Main Course'], prepTimeMinutes: 15, imageUrl: unsplash('1604068549290-dea0e4a305ca') },
    { name: 'Grilled Chicken', description: 'Grilled chicken breast with roasted vegetables', price: 13.49, category: byName['Main Course'], isVeg: false, prepTimeMinutes: 18, imageUrl: commons('d/d6/Liat_Portal_for_Foodie_Disorder_-_Grilled_Chicken_with_Roasted_Vegetables.jpg/960px-Liat_Portal_for_Foodie_Disorder_-_Grilled_Chicken_with_Roasted_Vegetables.jpg') },
    { name: 'Paneer Tikka Masala', description: 'Paneer in a rich tomato gravy', price: 10.99, category: byName['Main Course'], prepTimeMinutes: 16, imageUrl: unsplash('1631452180519-c014fe946bc7') },
    { name: 'Iced Tea', description: 'Freshly brewed iced tea', price: 2.99, category: byName['Beverages'], prepTimeMinutes: 3, imageUrl: unsplash('1499638673689-79a0b5115d87') },
    { name: 'Fresh Lime Soda', description: 'Sweet, salted, or plain', price: 2.49, category: byName['Beverages'], prepTimeMinutes: 3, imageUrl: commons('b/ba/Glass_sparkling_lemonade.jpg/960px-Glass_sparkling_lemonade.jpg') },
    { name: 'Chocolate Brownie', description: 'Warm brownie with vanilla ice cream', price: 5.49, category: byName['Desserts'], prepTimeMinutes: 7, imageUrl: unsplash('1606313564200-e75d5e30476c') },
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
