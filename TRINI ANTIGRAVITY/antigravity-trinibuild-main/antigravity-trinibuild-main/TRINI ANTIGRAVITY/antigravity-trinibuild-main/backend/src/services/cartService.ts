import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const CartService = {
  // Get cart
  async getCart(userId: string) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: { items: { include: { product: true } } }
      });
    }

    return cart;
  },

  // Add to cart
  async addToCart(userId: string, productId: string, quantity: number = 1) {
    let cart = await this.getCart(userId);

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId
        }
      }
    });

    if (existingItem) {
      return prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      });
    }

    return prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity
      }
    });
  },

  // Remove from cart
  async removeFromCart(userId: string, productId: string) {
    const cart = await this.getCart(userId);
    return prisma.cartItem.delete({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId
        }
      }
    });
  },

  // Update cart item quantity
  async updateCartItemQuantity(userId: string, productId: string, quantity: number) {
    const cart = await this.getCart(userId);
    return prisma.cartItem.update({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId
        }
      },
      data: { quantity }
    });
  },

  // Clear cart
  async clearCart(userId: string) {
    const cart = await this.getCart(userId);
    return prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });
  },

  // Calculate cart totals
  async getCartTotals(userId: string) {
    const cart = await this.getCart(userId);
    
    let subtotal = 0;
    let totalItems = 0;
    const items = [];

    for (const item of cart.items) {
      const itemTotal = item.product.price * item.quantity;
      subtotal += itemTotal;
      totalItems += item.quantity;
      items.push({
        ...item,
        itemTotal
      });
    }

    const shippingCost = subtotal > 500 ? 0 : 50; // Free shipping over TTD 500
    const taxAmount = subtotal * 0.15; // 15% VAT
    const total = subtotal + shippingCost + taxAmount;

    return {
      items,
      subtotal,
      shippingCost,
      taxAmount,
      total,
      totalItems
    };
  }
};
