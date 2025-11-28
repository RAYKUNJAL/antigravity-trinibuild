import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'SendGrid',
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY || ''
  }
});

export const NotificationService = {
  // Create notification
  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: any
  ) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: type as any,
        title,
        message,
        relatedOrderId: data?.orderId,
        relatedJobId: data?.jobId,
        relatedUserId: data?.userId,
        actionUrl: data?.actionUrl,
        actionLabel: data?.actionLabel
      }
    });

    // Send email notification if enabled
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.notificationEmail) {
      await this.sendEmailNotification(user.email, title, message);
    }

    return notification;
  },

  // Get user notifications
  async getUserNotifications(userId: string, limit: number = 20, offset: number = 0) {
    return prisma.notification.findMany({
      where: { userId },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' }
    });
  },

  // Mark as read
  async markAsRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { read: true, readAt: new Date() }
    });
  },

  // Mark all as read
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() }
    });
  },

  // Get unread count
  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, read: false }
    });
  },

  // Send email notification
  async sendEmailNotification(email: string, subject: string, message: string) {
    try {
      await transporter.sendMail({
        from: process.env.SENDER_EMAIL || 'noreply@trinibuild.com',
        to: email,
        subject,
        html: `
          <h2>${subject}</h2>
          <p>${message}</p>
          <p>Visit TriniBuild to manage your account.</p>
        `
      });
    } catch (error) {
      console.error('Email send error:', error);
    }
  },

  // Notify order status change
  async notifyOrderStatusChange(orderId: string, status: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true }
    });

    if (!order) return;

    const messages: Record<string, string> = {
      CONFIRMED: 'Your order has been confirmed!',
      PROCESSING: 'Your order is being processed.',
      SHIPPED: 'Your order has been shipped!',
      DELIVERED: 'Your order has been delivered!',
      CANCELLED: 'Your order has been cancelled.'
    };

    await this.createNotification(
      order.userId,
      'ORDER_' + status,
      `Order ${order.orderNumber} ${status}`,
      messages[status] || 'Order status updated',
      { orderId: order.id }
    );
  },

  // Notify payment
  async notifyPayment(userId: string, amount: number, status: string) {
    const message = status === 'COMPLETED'
      ? `Payment of TTD $${amount.toLocaleString()} has been received.`
      : `Payment of TTD $${amount.toLocaleString()} failed. Please try again.`;

    await this.createNotification(
      userId,
      'PAYMENT_' + status,
      `Payment ${status}`,
      message
    );
  },

  // Notify TriniWorks proposal
  async notifyTriniWorksProposal(professionalId: string, jobTitle: string) {
    const professional = await prisma.triniWorksProfessional.findUnique({
      where: { id: professionalId },
      include: { user: true }
    });

    if (!professional) return;

    await this.createNotification(
      professional.user.id,
      'TRINIWORKS_PROPOSAL',
      'New Job Opportunity',
      `New job available: ${jobTitle}. View and submit your proposal!`
    );
  },

  // Notify review received
  async notifyReview(vendorId: string, productTitle: string, rating: number) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: { user: true }
    });

    if (!vendor) return;

    await this.createNotification(
      vendor.user.id,
      'REVIEW_REQUESTED',
      'New Review',
      `Your product "${productTitle}" received a ${rating}-star review.`
    );
  }
};
