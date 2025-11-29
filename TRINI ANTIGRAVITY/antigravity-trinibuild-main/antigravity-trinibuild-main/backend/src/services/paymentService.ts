import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

export const PaymentService = {
  // Create payment intent for Stripe
  async createPaymentIntent(amount: number, currency: string = 'usd', metadata: any = {}) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata
      });
      return paymentIntent;
    } catch (error) {
      throw new Error(`Stripe error: ${error}`);
    }
  },

  // Process TTD payment (local gateway)
  async processTTDPayment(
    amount: number,
    gateway: string, // FCIB, REPUBLIC_BANK, FLOW_MOBILE, NATIONAL_SECURE
    paymentDetails: any
  ) {
    const gatewayConfig = {
      FCIB: process.env.FCIB_API_KEY,
      REPUBLIC_BANK: process.env.REPUBLIC_BANK_API_KEY,
      FLOW_MOBILE: process.env.FLOW_MOBILE_API_KEY,
      NATIONAL_SECURE: process.env.NATIONAL_SECURE_API_KEY
    };

    const apiKey = gatewayConfig[gateway as keyof typeof gatewayConfig];
    if (!apiKey) {
      throw new Error(`Invalid payment gateway: ${gateway}`);
    }

    // TODO: Implement actual gateway API calls
    // For now, return mock response
    return {
      transactionId: `TTD_${gateway}_${Date.now()}`,
      status: 'PENDING',
      amount,
      currency: 'TTD',
      gateway,
      timestamp: new Date()
    };
  },

  // Create order payment
  async createOrderPayment(orderId: string, amount: number, method: string) {
    const payment = await prisma.payment.create({
      data: {
        transactionId: `TXN_${Date.now()}`,
        amount,
        currency: 'TTD',
        method: method as any,
        status: 'PENDING',
        orders: {
          connect: { id: orderId }
        }
      }
    });
    return payment;
  },

  // Update payment status
  async updatePaymentStatus(paymentId: string, status: string) {
    return prisma.payment.update({
      where: { id: paymentId },
      data: { status: status as any }
    });
  },

  // Process refund
  async processRefund(paymentId: string, amount: number, reason: string) {
    const refund = await prisma.refund.create({
      data: {
        paymentId,
        amount,
        reason,
        status: 'PENDING'
      }
    });

    // If Stripe payment, process refund
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (payment?.paymentIntentId) {
      try {
        await stripe.refunds.create({
          payment_intent: payment.paymentIntentId,
          amount: Math.round(amount * 100)
        });
      } catch (error) {
        console.error('Stripe refund error:', error);
      }
    }

    return refund;
  },

  // Webhook handler for Stripe
  async handleStripeWebhook(event: any) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        return await this.handlePaymentSuccess(event.data.object);
      case 'payment_intent.payment_failed':
        return await this.handlePaymentFailure(event.data.object);
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  },

  // Handle successful payment
  async handlePaymentSuccess(paymentIntent: any) {
    const payment = await prisma.payment.findFirst({
      where: { paymentIntentId: paymentIntent.id }
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'COMPLETED' }
      });

      // Update order status
      await prisma.order.updateMany({
        where: { paymentId: payment.id },
        data: { paymentStatus: 'COMPLETED', status: 'CONFIRMED' }
      });
    }
  },

  // Handle failed payment
  async handlePaymentFailure(paymentIntent: any) {
    const payment = await prisma.payment.findFirst({
      where: { paymentIntentId: paymentIntent.id }
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { 
          status: 'FAILED',
          failureMessage: paymentIntent.last_payment_error?.message
        }
      });
    }
  }
};
