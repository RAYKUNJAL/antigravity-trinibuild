import { Router } from 'express';
import { AuthService } from '../services/authService.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Register
router.post('/register', authLimiter, asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, phone } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const user = await AuthService.register(email, password, firstName, lastName, phone);
    res.status(201).json({ status: 'success', data: user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

// Login
router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const result = await AuthService.login(email, password);
    res.status(200).json({ status: 'success', data: result });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
}));

// Refresh Token
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    const result = await AuthService.refreshToken(refreshToken);
    res.status(200).json({ status: 'success', data: result });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
}));

export default router;
