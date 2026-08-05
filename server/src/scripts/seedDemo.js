/**
 * Demo data seeder — `npm run seed:demo`.
 *
 * Builds the dataset the public demo is judged on: three signed-in-ready demo
 * accounts, a week of trading history so the dashboard charts have a shape, and
 * a handful of live tickets sitting on the kitchen board at varying ages so the
 * colour-coded timers are actually demonstrating something.
 *
 * Destructive but *scoped*: it removes only the orders and payments it created
 * (matched on the demo order-number shape and transaction-id prefix) plus the
 * demo accounts, so re-running it resets the demo without touching a real menu,
 * tables or staff. Pass --force-all to clear every order and payment instead.
 *
 * Re-run it on a schedule for a public demo. The live kitchen tickets are
 * seeded at fixed ages, so they keep ageing after the seed — leave it a few
 * hours and every ticket on the board reads red.
 */
const path = require('path');
const fs = require('fs');

const ENV_PATH = path.resolve(__dirname, '../../.env');
if (fs.existsSync(ENV_PATH)) require('dotenv').config({ path: ENV_PATH });
else require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

// Demo orders are identified by their order-number shape (…-D000) rather than
// by a marker in `notes`, which is customer-visible text rendered on the
// kitchen ticket and the order detail.
const DEMO_ORDER_RE = /^ORD-\d{8}-D\d{3}$/;
const DEMO_TXN_PREFIX = 'DEMO-';
const DAY_MS = 24 * 60 * 60 * 1000;

const DEMO_ACCOUNTS = [
  {
    name: 'Demo Admin',
    email: 'admin@tableside.demo',
    password: 'demo1234',
    role: 'admin',
    phone: '+1 555 0100',
  },
  {
    name: 'Demo Staff',
    email: 'staff@tableside.demo',
    password: 'demo1234',
    role: 'staff',
    phone: '+1 555 0101',
  },
  {
    name: 'Demo Diner',
    email: 'diner@tableside.demo',
    password: 'demo1234',
    role: 'customer',
    phone: '+1 555 0102',
  },
];

/* Deterministic pseudo-randomness: the demo should look the same every time
   it's reset, so screenshots and the recorded walkthrough stay accurate. */
let seed = 20260805;
function random() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
const pick = (list) => list[Math.floor(random() * list.length)];
const between = (min, max) => min + Math.floor(random() * (max - min + 1));

function orderNumberFor(date, index) {
  const day = date.toISOString().slice(0, 10).replace(/-/g, '');
  return `ORD-${day}-D${String(index).padStart(3, '0')}`;
}

/**
 * Lunch and dinner peaks rather than a flat spread — the chart should show a
 * rush. For today, hours that haven't happened yet are excluded: clamping a
 * future timestamp back to "now" instead piles every one of today's orders into
 * whatever hour the seed ran, and the orders-by-hour chart becomes one bar.
 */
function serviceHour(isToday) {
  const latest = isToday ? new Date().getHours() : 23;

  const candidates = [];
  const push = (from, to, weight) => {
    for (let hour = from; hour <= Math.min(to, latest); hour += 1) {
      for (let n = 0; n < weight; n += 1) candidates.push(hour);
    }
  };
  push(12, 14, 5); // lunch service
  push(19, 21, 6); // dinner service
  push(15, 18, 1); // the quiet middle
  push(9, 11, 1); // early trade

  // Before the first service of the day there is nothing to draw from.
  if (candidates.length === 0) return Math.max(7, latest);
  return pick(candidates);
}

function buildItems(menu) {
  const count = between(1, 4);
  const chosen = [];
  for (let i = 0; i < count; i += 1) {
    const item = pick(menu);
    if (chosen.some((line) => line.menuItem.equals(item._id))) continue;
    chosen.push({
      menuItem: item._id,
      name: item.name,
      price: item.price,
      quantity: between(1, 3),
      notes: '',
    });
  }
  // between() can collide on the same item; guarantee at least one line.
  if (chosen.length === 0) {
    const item = pick(menu);
    chosen.push({ menuItem: item._id, name: item.name, price: item.price, quantity: 1, notes: '' });
  }
  return chosen;
}

function priceOrder(items) {
  const subtotal = Number(items.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2));
  const tax = Number((subtotal * 0.05).toFixed(2));
  return { subtotal, tax, grandTotal: Number((subtotal + tax).toFixed(2)) };
}

async function clearPreviousDemoData(forceAll) {
  if (forceAll) {
    const [orders, payments] = await Promise.all([Order.deleteMany({}), Payment.deleteMany({})]);
    console.log(`Cleared ALL data: ${orders.deletedCount} orders, ${payments.deletedCount} payments.`);
    return;
  }

  const [orders, payments] = await Promise.all([
    Order.deleteMany({ orderNumber: { $regex: DEMO_ORDER_RE } }),
    Payment.deleteMany({ transactionId: { $regex: `^${DEMO_TXN_PREFIX}` } }),
  ]);
  console.log(
    `Cleared previous demo data: ${orders.deletedCount} orders, ${payments.deletedCount} payments.`
  );
}

async function upsertDemoAccounts() {
  const accounts = {};
  for (const spec of DEMO_ACCOUNTS) {
    // Update in place rather than delete-and-recreate. A JWT identifies its user
    // by _id, so recreating the account invalidates every token issued against
    // it — on a scheduled reset that signs out whoever is exploring the demo at
    // the time. Assigning through the document keeps the pre-save hash hook.
    let user = await User.findOne({ email: spec.email });
    if (user) {
      Object.assign(user, spec);
      await user.save();
    } else {
      user = await User.create(spec);
    }
    accounts[spec.role] = user;
    console.log(`  ${spec.role.padEnd(8)} ${spec.email}  /  ${spec.password}`);
  }
  return accounts;
}

async function seedHistory(menu, tables, accounts) {
  const orders = [];
  const payments = [];
  let counter = 0;

  // Six days of closed-out history, then today's trade. Yesterday matters
  // because the dashboard shows a vs-yesterday delta.
  for (let daysAgo = 6; daysAgo >= 0; daysAgo -= 1) {
    const isToday = daysAgo === 0;
    // A gentle upward trend with weekend-ish variation so the area chart has
    // a story rather than noise.
    const volume = isToday ? between(6, 9) : between(8, 16);

    for (let i = 0; i < volume; i += 1) {
      counter += 1;
      const placedAt = new Date(Date.now() - daysAgo * DAY_MS);
      placedAt.setHours(serviceHour(isToday), between(0, 59), between(0, 59), 0);
      // serviceHour already excludes future hours today, but the minute within
      // the current hour can still overshoot.
      if (placedAt.getTime() > Date.now()) placedAt.setTime(Date.now() - between(60, 900) * 1000);

      const items = buildItems(menu);
      const totals = priceOrder(items);
      const dineIn = random() < 0.72;
      const table = dineIn ? pick(tables) : null;

      const statusFlow = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed'];
      const statusHistory = statusFlow.map((status, index) => ({
        status,
        at: new Date(placedAt.getTime() + index * between(3, 8) * 60 * 1000),
        by: accounts.staff._id,
      }));

      const order = new Order({
        orderNumber: orderNumberFor(placedAt, counter),
        customer: random() < 0.5 ? accounts.customer._id : undefined,
        guestName: dineIn ? '' : pick(['Alex', 'Priya', 'Sam', 'Noor', 'Diego']),
        table: table?._id,
        orderType: dineIn ? 'dine-in' : 'takeaway',
        items,
        status: 'completed',
        statusHistory,
        subtotal: totals.subtotal,
        tax: totals.tax,
        grandTotal: totals.grandTotal,
        paymentStatus: 'paid',
        createdBy: accounts.staff._id,
        notes: '',
      });

      // Alternate as the base so both methods always appear on any given day
      // (pure chance can hand a low-volume day a single-slice donut), then flip
      // some of them so the split isn't a suspiciously exact 50/50.
      const alternating = counter % 2 === 0;
      const flip = random() < 0.22;
      const method = alternating !== flip ? 'card' : 'cash';
      const payment = new Payment({
        order: order._id,
        method,
        amount: totals.grandTotal,
        status: 'completed',
        transactionId: `${DEMO_TXN_PREFIX}${method.toUpperCase()}-${counter.toString().padStart(4, '0')}`,
        processedBy: accounts.staff._id,
        ...(method === 'card'
          ? { cardBrand: pick(['Visa', 'Mastercard']), cardLast4: String(between(1000, 9999)) }
          : {
              tenderedAmount: Math.ceil(totals.grandTotal / 5) * 5,
              changeDue: Number((Math.ceil(totals.grandTotal / 5) * 5 - totals.grandTotal).toFixed(2)),
            }),
      });

      order.payment = payment._id;
      // createdAt is immutable through the normal path; the demo needs the
      // documents backdated so the 7-day chart isn't a single spike.
      order.set('createdAt', placedAt, { strict: false });
      order.set('updatedAt', placedAt, { strict: false });
      payment.set('createdAt', statusHistory.at(-1).at, { strict: false });
      payment.set('updatedAt', statusHistory.at(-1).at, { strict: false });

      orders.push(order);
      payments.push(payment);
    }
  }

  await Order.insertMany(orders, { timestamps: false });
  await Payment.insertMany(payments, { timestamps: false });
  console.log(`Seeded ${orders.length} completed orders and ${payments.length} payments.`);
}

/** Live tickets spread across the board, aged so the KDS timers show all three colours. */
async function seedLiveBoard(menu, tables, accounts) {
  const board = [
    { status: 'pending', minutesAgo: 1 },
    { status: 'pending', minutesAgo: 4 },
    { status: 'confirmed', minutesAgo: 7 },
    { status: 'preparing', minutesAgo: 12 },
    { status: 'preparing', minutesAgo: 6 },
    { status: 'ready', minutesAgo: 15 },
  ];

  const flow = ['pending', 'confirmed', 'preparing', 'ready'];
  const orders = [];

  board.forEach((spec, index) => {
    const placedAt = new Date(Date.now() - spec.minutesAgo * 60 * 1000);
    const items = buildItems(menu);
    const totals = priceOrder(items);
    const dineIn = random() < 0.8;
    const table = dineIn ? pick(tables) : null;

    const reached = flow.slice(0, flow.indexOf(spec.status) + 1);
    const statusHistory = reached.map((status, i) => ({
      status,
      at: new Date(placedAt.getTime() + i * 90 * 1000),
      by: accounts.staff._id,
    }));

    const order = new Order({
      orderNumber: orderNumberFor(placedAt, 900 + index),
      customer: accounts.customer._id,
      guestName: dineIn ? '' : pick(['Rae', 'Ines', 'Tom']),
      table: table?._id,
      orderType: dineIn ? 'dine-in' : 'takeaway',
      items,
      status: spec.status,
      statusHistory,
      subtotal: totals.subtotal,
      tax: totals.tax,
      grandTotal: totals.grandTotal,
      paymentStatus: 'unpaid',
      createdBy: accounts.staff._id,
      notes: index === 0 ? 'No onions please' : '',
    });

    order.set('createdAt', placedAt, { strict: false });
    order.set('updatedAt', placedAt, { strict: false });
    orders.push(order);
  });

  await Order.insertMany(orders, { timestamps: false });
  console.log(`Seeded ${orders.length} live tickets on the kitchen board.`);
}

async function main() {
  const forceAll = process.argv.includes('--force-all');

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not set. Run this with the server\'s environment loaded.');
    process.exit(1);
  }
  await connectDB(uri);

  const [menu, tables, categoryCount] = await Promise.all([
    MenuItem.find({ isAvailable: true }),
    Table.find(),
    Category.countDocuments(),
  ]);

  if (menu.length === 0 || tables.length === 0 || categoryCount === 0) {
    console.error('No menu, categories or tables found. Run `npm run setup` first.');
    await mongoose.connection.close();
    process.exit(1);
  }

  console.log('\nDemo accounts (all password: demo1234)');
  const accounts = await upsertDemoAccounts();

  await clearPreviousDemoData(forceAll);
  await seedHistory(menu, tables, accounts);
  await seedLiveBoard(menu, tables, accounts);

  // Make the floor plan look like a service in progress.
  const occupied = tables.slice(0, Math.min(3, tables.length)).map((t) => t._id);
  await Table.updateMany({}, { status: 'available' });
  await Table.updateMany({ _id: { $in: occupied } }, { status: 'occupied' });

  console.log('\nDemo data ready.\n');
  await mongoose.connection.close();
}

main().catch(async (error) => {
  console.error('Demo seed failed:', error);
  await mongoose.connection.close();
  process.exit(1);
});
