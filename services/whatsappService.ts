import { supabase } from './supabaseClient';

const AI_SERVER = import.meta.env.VITE_AI_SERVER_URL || 'https://juvay.app/ai';

export interface OrderNotification {
  merchantPhone: string;  // merchant's WhatsApp number
  merchantName: string;
  storeName: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  paymentMethod: string;
  deliveryAddress?: string;
}

export const notifyMerchantNewOrder = async (notification: OrderNotification): Promise<boolean> => {
  try {
    const { merchantPhone, storeName, orderNumber, customerName, customerPhone, items, total, paymentMethod, deliveryAddress } = notification;

    // Format the WhatsApp message — clear, actionable
    const itemsList = items.map(i => `  • ${i.name} x${i.qty} — TT$${(i.price * i.qty).toFixed(2)}`).join('\n');

    const message = [
      `🛍️ *New Order on Juvay!*`,
      ``,
      `*Store:* ${storeName}`,
      `*Order:* #${orderNumber}`,
      ``,
      `*Customer:* ${customerName}`,
      `*Phone:* ${customerPhone}`,
      deliveryAddress ? `*Deliver to:* ${deliveryAddress}` : '',
      ``,
      `*Items:*`,
      itemsList,
      ``,
      `*Total: TT$${total.toFixed(2)}*`,
      `*Payment:* ${paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod}`,
      ``,
      `Reply to this message or call the customer to confirm.`,
      `View in dashboard: https://juvay.app/dashboard`,
    ].filter(Boolean).join('\n');

    const resp = await fetch(`${AI_SERVER}/send-whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: merchantPhone.replace(/[^0-9]/g, ''), message, order_id: orderNumber })
    });

    const data = await resp.json();
    return data.success === true;
  } catch (err) {
    console.error('WhatsApp notify failed:', err);
    return false; // never block the order flow
  }
};

export const notifyCustomerOrderConfirmed = async (customerPhone: string, orderNumber: string, storeName: string): Promise<boolean> => {
  try {
    const message = [
      `✅ *Order Confirmed!*`,
      ``,
      `Your order #${orderNumber} from *${storeName}* has been confirmed.`,
      ``,
      `The merchant will contact you to arrange delivery.`,
      `Track your order: https://juvay.app/cod-tracking/${orderNumber}`,
    ].join('\n');

    const resp = await fetch(`${AI_SERVER}/send-whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: customerPhone.replace(/[^0-9]/g, ''), message })
    });
    const data = await resp.json();
    return data.success === true;
  } catch {
    return false;
  }
};
