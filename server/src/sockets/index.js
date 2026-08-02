const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Order = require('../models/Order');

let io = null;

const KITCHEN_ROOM = 'kitchen';
const ADMIN_ROOM = 'admin';
const orderRoom = (orderId) => `order:${orderId}`;

// Authenticates the socket handshake using the same JWT issued by /api/auth/login,
// then drops the connection into role-appropriate rooms so events only reach
// the audiences that should see them:
//  - kitchen/admin staff: 'kitchen' + 'admin' rooms (every order, live)
//  - customers: nothing by default; they explicitly subscribe to their own order
async function authenticateSocket(socket) {
  const token = socket.handshake.auth?.token;
  if (!token) throw new Error('Missing auth token');

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) throw new Error('Invalid or inactive user');
  return user;
}

function initSocket(httpServer, corsOrigins) {
  io = new Server(httpServer, {
    cors: { origin: corsOrigins, credentials: true },
  });

  io.on('connection', async (socket) => {
    let user;
    try {
      user = await authenticateSocket(socket);
    } catch (err) {
      socket.emit('error', { message: 'Authentication failed' });
      socket.disconnect(true);
      return;
    }

    socket.data.user = user;

    if (user.role === 'admin' || user.role === 'staff') {
      socket.join(KITCHEN_ROOM);
      socket.join(ADMIN_ROOM);
    }

    // Customers ask to watch a specific order (e.g. their order-tracking page).
    // We verify ownership server-side before letting them join that room.
    socket.on('order:subscribe', async (orderId) => {
      try {
        const order = await Order.findById(orderId).select('customer');
        if (!order) return;
        const isOwner = order.customer && String(order.customer) === String(user._id);
        const isStaff = user.role === 'admin' || user.role === 'staff';
        if (isOwner || isStaff) {
          socket.join(orderRoom(orderId));
        }
      } catch (err) {
        // invalid id — ignore silently, nothing to subscribe to
      }
    });

    socket.on('order:unsubscribe', (orderId) => {
      socket.leave(orderRoom(orderId));
    });
  });

  return io;
}

function emitToKitchen(event, payload) {
  if (!io) return;
  io.to(KITCHEN_ROOM).emit(event, payload);
}

function emitOrderUpdate(order) {
  if (!io) return;
  io.to(ADMIN_ROOM).to(KITCHEN_ROOM).to(orderRoom(order._id)).emit('order:statusUpdate', order);
}

module.exports = { initSocket, emitToKitchen, emitOrderUpdate };
