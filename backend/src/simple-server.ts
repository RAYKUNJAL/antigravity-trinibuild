import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(cors());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        role: 'customer'
      }
    });

    // Create cart
    await prisma.cart.create({
      data: { userId: user.id }
    });

    res.status(201).json({
      status: 'success',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate tokens
    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
      expiresIn: process.env.JWT_EXPIRY || '7d'
    } as any);
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'refresh_secret', {
      expiresIn: '30d'
    } as any);

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

// JWT Middleware
const verifyToken = (req: any, res: any, next: any): void => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    next();
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Vendor endpoints (seller store creation)
app.post('/api/vendors', verifyToken, async (req, res) => {
  try {
    const { storeName, storeDescription, logo, bannerColor, theme } = req.body;
    if (!storeName) {
      return res.status(400).json({ error: 'Store name required' });
    }
    const storeUrl = storeName.toLowerCase().replace(/\s+/g, '-');
    const vendor = await prisma.vendor.create({
      data: {
        userId: req.user.id,
        storeName,
        storeUrl,
        storeDescription,
        logo,
        bannerColor,
        theme
      }
    });
    res.status(201).json({ status: 'success', data: vendor });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vendors/:id', async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.params.id },
      include: { products: true }
    });
    res.json({ status: 'success', data: vendor });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/vendors/:id', verifyToken, async (req, res) => {
  try {
    const vendor = await prisma.vendor.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: req.body
    });
    res.json({ status: 'success', data: vendor });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Product endpoints
app.post('/api/products', verifyToken, async (req, res) => {
  try {
    const { vendorId, name, price, description, category, imageUrl, stock } = req.body;
    const product = await prisma.product.create({
      data: {
        vendorId,
        name,
        price,
        description,
        category,
        imageUrl,
        stock: stock || 0,
        isActive: true
      }
    });
    res.status(201).json({ status: 'success', data: product });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { vendor: true }
    });
    res.json({ status: 'success', data: products });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cart endpoints
app.post('/api/cart/items', verifyToken, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }
    const item = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity: quantity || 1
      }
    });
    res.json({ status: 'success', data: item });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cart', verifyToken, async (req, res) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: { items: { include: { product: true } } }
    });
    res.json({ status: 'success', data: cart });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Order endpoints (COD)
app.post('/api/orders', verifyToken, async (req, res) => {
  try {
    const { vendorId, items, totalAmount, shippingAddress, shippingCity, customerName, customerEmail, customerPhone } = req.body;

    const orderNumber = `ORD-${Date.now()}`;
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: req.user.id,
        vendorId,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        shippingCity,
        totalAmount,
        paymentMethod: 'COD',
        status: 'PENDING',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            vendorId: item.vendorId,
            quantity: item.quantity,
            price: item.price,
            priceAtPurchase: item.price,
            subtotal: item.quantity * item.price,
            status: 'pending'
          }))
        }
      },
      include: { items: true }
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        userId: req.user.id,
        amount: totalAmount,
        method: 'COD',
        status: 'PENDING'
      }
    });

    res.status(201).json({ status: 'success', data: order });
  } catch (error: any) {
    console.error('Order error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders/:id', verifyToken, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { product: true } }, payment: true }
    });
    res.json({ status: 'success', data: order });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders', verifyToken, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: true, payment: true }
    });
    res.json({ status: 'success', data: orders });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
