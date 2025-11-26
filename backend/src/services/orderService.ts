import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const OrderService = {
  // Create order from cart
  async createOrder(userId: string, shippingAddressId: string, paymentMethod: string) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } }
    });

    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const itemTotal = item.product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        vendorId: item.product.vendorId,
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        subtotal: itemTotal
      });
    }

    const shippingCost = subtotal > 500 ? 0 : 50;
    const taxAmount = subtotal * 0.15;
    const total = subtotal + shippingCost + taxAmount;

    // Create order
    const order = await prisma.order.create({
      data: {
        userId,
        shippingAddressId,
        paymentMethod,
        subtotal,
        shippingCost,
        taxAmount,
        total,
        items: {
          create: orderItems.map(item => ({
            ...item,
            status: 'PENDING'
          }))
        }
      },
      include: { items: true }
    });

    // Clear cart
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    return order;
  },

  // Get order by ID
  async getOrder(orderId: string) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true, vendor: true } },
        user: true
      }
    });
  },

  // Get user orders
  async getUserOrders(userId: string, limit: number = 20, offset: number = 0) {
    return prisma.order.findMany({
      where: { userId },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } } }
    });
  },

  // Update order status
  async updateOrderStatus(orderId: string, status: string) {
    return prisma.order.update({
      where: { id: orderId },
      data: { status: status as any }
    });
  },

  // Cancel order
  async cancelOrder(orderId: string, reason: string) {
    return prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancelReason: reason,
        canceledAt: new Date()
      }
    });
  }
};
