import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';
import { authenticateToken } from './middleware/auth.js';
import { rateLimiter } from './middleware/rateLimiter.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import productRoutes from './routes/product.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/order.js';
import paymentRoutes from './routes/payment.js';
import reviewRoutes from './routes/review.js';
import messageRoutes from './routes/message.js';
import vendorRoutes from './routes/vendor.js';
import triniWorksRoutes from './routes/triniWorks.js';

// Socket handlers
import { setupMessageHandlers } from './sockets/messageHandlers.js';
import { setupNotificationHandlers } from './sockets/notificationHandlers.js';

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(morgan('combined')); // Logging
app.use(requestLogger);
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', authenticateToken, userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', authenticateToken, cartRoutes);
app.use('/api/orders', authenticateToken, orderRoutes);
app.use('/api/payments', authenticateToken, paymentRoutes);
app.use('/api/reviews', authenticateToken, reviewRoutes);
app.use('/api/messages', authenticateToken, messageRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/trini-works', triniWorksRoutes);

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Authenticate user
  const token = socket.handshake.auth.token;
  if (!token) {
    socket.disconnect();
    return;
  }
  
  // Setup handlers
  setupMessageHandlers(socket, io);
  setupNotificationHandlers(socket, io);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready at ws://localhost:${PORT}`);
  console.log(`🌍 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export { io };
