/**
 * PayPal API Integration - Backend Routes
 * 
 * These routes should be implemented in your backend (Node.js/Express, Deno, etc.)
 * Place these in your backend/api folder
 */

import { Request, Response } from 'express';

// PayPal SDK (install: npm install @paypal/checkout-server-sdk)
const paypal = require('@paypal/checkout-server-sdk');

// PayPal environment setup
function environment() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    // Use sandbox for testing, live for production
    if (process.env.NODE_ENV === 'production') {
        return new paypal.core.LiveEnvironment(clientId, clientSecret);
    } else {
        return new paypal.core.SandboxEnvironment(clientId, clientSecret);
    }
}

function client() {
    return new paypal.core.PayPalHttpClient(environment());
}

/**
 * POST /api/paypal/create-order
 * Create a PayPal order
 */
export async function createPayPalOrder(req: Request, res: Response) {
    try {
        const { amount, currency, description, order_id, return_url, cancel_url } = req.body;

        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer('return=representation');
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                reference_id: order_id,
                description: description,
                amount: {
                    currency_code: currency || 'TTD',
                    value: amount.toFixed(2),
                },
            }],
            application_context: {
                brand_name: 'TriniBuild',
                landing_page: 'BILLING',
                user_action: 'PAY_NOW',
                return_url: return_url,
                cancel_url: cancel_url,
            },
        });

        const order = await client().execute(request);

        // Get approval URL
        const approvalUrl = order.result.links.find((link: any) => link.rel === 'approve')?.href;

        res.json({
            paypalOrderId: order.result.id,
            approvalUrl: approvalUrl,
        });
    } catch (error) {
        console.error('PayPal create order error:', error);
        res.status(500).json({ message: 'Failed to create PayPal order', error: error.message });
    }
}

/**
 * POST /api/paypal/capture-order
 * Capture a PayPal payment
 */
export async function capturePayPalOrder(req: Request, res: Response) {
    try {
        const { paypalOrderId } = req.body;

        const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
        request.requestBody({});

        const capture = await client().execute(request);

        res.json({
            orderId: capture.result.id,
            status: capture.result.status,
            payer: capture.result.payer,
            purchase_units: capture.result.purchase_units,
        });
    } catch (error) {
        console.error('PayPal capture error:', error);
        res.status(500).json({ message: 'Failed to capture PayPal payment', error: error.message });
    }
}

/**
 * POST /api/paypal/webhook
 * Handle PayPal webhooks
 */
export async function handlePayPalWebhook(req: Request, res: Response) {
    try {
        const event = req.body;

        // Verify webhook signature (important for security)
        // Implementation depends on PayPal's webhook verification

        switch (event.event_type) {
            case 'PAYMENT.CAPTURE.COMPLETED':
                // Handle successful payment
                console.log('Payment captured:', event.resource.id);
                // Update your database here
                break;

            case 'PAYMENT.CAPTURE.DENIED':
                // Handle denied payment
                console.log('Payment denied:', event.resource.id);
                break;

            default:
                console.log('Unhandled event type:', event.event_type);
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('PayPal webhook error:', error);
        res.status(500).json({ message: 'Webhook processing failed' });
    }
}

/**
 * Example Express.js route setup:
 * 
 * import express from 'express';
 * import { createPayPalOrder, capturePayPalOrder, handlePayPalWebhook } from './paypal';
 * 
 * const app = express();
 * app.use(express.json());
 * 
 * app.post('/api/paypal/create-order', createPayPalOrder);
 * app.post('/api/paypal/capture-order', capturePayPalOrder);
 * app.post('/api/paypal/webhook', handlePayPalWebhook);
 * 
 * app.listen(5000, () => console.log('Server running on port 5000'));
 */
