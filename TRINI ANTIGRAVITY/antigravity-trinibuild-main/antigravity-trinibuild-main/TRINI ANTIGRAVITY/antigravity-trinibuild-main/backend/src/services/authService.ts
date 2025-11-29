import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const AuthService = {
  // Register new user
  async register(email: string, password: string, firstName: string, lastName: string, phone?: string) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: 'CUSTOMER'
      }
    });

    // Create cart
    await prisma.cart.create({
      data: { userId: user.id }
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };
  },

  // Login user
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    return this.generateTokens(user);
  },

  // Generate JWT tokens
  generateTokens(user: any) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
      expiresIn: process.env.JWT_EXPIRY || '7d'
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'refresh_secret', {
      expiresIn: '30d'
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar
      },
      accessToken,
      refreshToken
    };
  },

  // Refresh access token
  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret') as any;
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) {
        throw new Error('User not found');
      }
      return this.generateTokens(user);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  },

  // Verify email
  async verifyEmail(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() }
    });
  },

  // Reset password
  async resetPassword(email: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });
  }
};
