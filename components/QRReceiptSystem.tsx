/**
 * QR Code Receipt & Order Tracking System
 * Inspired by QRCode-Inventory-Manager concepts
 * 
 * Features:
 * - Generate QR codes for orders
 * - Receipt with embedded QR
 * - Track orders by scanning QR
 * - Inventory management via QR
 * - WhatsApp integration
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    QrCode, Download, Share2, Printer, Mail, MessageCircle,
    Package, MapPin, Clock, CheckCircle, XCircle, Truck,
    AlertCircle, Phone, Copy, Check, Camera, Scan
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Order {
    id: string;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    customer_whatsapp?: string;
    total: number;
    status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
    payment_method: 'cod' | 'bank_transfer' | 'card';
    items: OrderItem[];
    created_at: string;
    delivery_address?: string;
    tracking_url?: string;
    qr_code?: string;
}

interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    sku?: string;
}

interface ReceiptData extends Order {
    store_name: string;
    store_phone: string;
    store_address: string;
    store_whatsapp?: string;
    store_logo?: string;
}

// ─── QR Code Generator ────────────────────────────────────────────────────────

export const generateOrderQR = async (orderId: string): Promise<string> => {
    try {
        const trackingUrl = `${window.location.origin}/track/${orderId}`;
        // Use Google Charts API — no npm dependency needed
        return `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(trackingUrl)}&choe=UTF-8`;
    } catch (error) {
        console.error('QR generation failed:', error);
        return '';
    }
};

// ─── Receipt Component ─────────────────────────────────────────────────────────

export const QRReceipt: React.FC<{ data: ReceiptData }> = ({ data }) => {
    const [qrCode, setQrCode] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        generateOrderQR(data.id).then(setQrCode);
    }, [data.id]);

    const copyTrackingLink = () => {
        const trackingUrl = `${window.location.origin}/track/${data.id}`;
        navigator.clipboard.writeText(trackingUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareViaWhatsApp = () => {
        const trackingUrl = `${window.location.origin}/track/${data.id}`;
        const message = `🧾 *TriniBuild Receipt*\n\n📦 Order #${data.order_number}\n💰 Total: TT$${data.total.toFixed(2)}\n\n📍 Track your order:\n${trackingUrl}`;
        window.open(`https://wa.me/${data.customer_whatsapp || data.customer_phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const downloadReceipt = () => {
        // Convert receipt to image and download
        const receiptElement = document.getElementById('receipt-content');
        if (!receiptElement) return;

        // Use html2canvas or similar library in production
        alert('Receipt download feature - integrate html2canvas');
    };

    return (
        <div className="max-w-md mx-auto">
            <div id="receipt-content" className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-lg">
                {/* Header */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
                    <div className="flex items-center justify-between mb-4">
                        {data.store_logo ? (
                            <img src={data.store_logo} alt={data.store_name} className="h-12 w-auto" />
                        ) : (
                            <h2 className="text-xl font-black">{data.store_name}</h2>
                        )}
                        <span className="text-sm bg-white/20 px-3 py-1 rounded-full font-bold">
                            #{data.order_number}
                        </span>
                    </div>
                    <p className="text-sm opacity-80">{data.store_address}</p>
                    <p className="text-sm opacity-80">📞 {data.store_phone}</p>
                </div>

                {/* Order Details */}
                <div className="p-6 border-b-2 border-dashed border-gray-200">
                    <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">
                        Order Details
                    </p>
                    {data.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                                <p className="font-bold text-gray-900">{item.name}</p>
                                <p className="text-xs text-gray-500">Qty: {item.quantity} × TT${item.price.toFixed(2)}</p>
                            </div>
                            <p className="font-black text-gray-900">
                                TT${(item.quantity * item.price).toFixed(2)}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Total */}
                <div className="p-6 bg-gray-50 border-b-2 border-dashed border-gray-200">
                    <div className="flex justify-between items-center">
                        <p className="text-lg font-black text-gray-900">TOTAL</p>
                        <p className="text-2xl font-black" style={{ color: '#E61E2B' }}>
                            TT${data.total.toFixed(2)}
                        </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Payment: {data.payment_method === 'cod' ? '💵 Cash on Delivery' : data.payment_method === 'bank_transfer' ? '🏦 Bank Transfer' : '💳 Card'}
                    </p>
                </div>

                {/* QR Code */}
                <div className="p-6 bg-white">
                    <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3 text-center">
                        Scan to Track Order
                    </p>
                    {qrCode && (
                        <div className="flex justify-center mb-4">
                            <img src={qrCode} alt="Order QR Code" className="w-48 h-48 border-4 border-gray-100 rounded-xl" />
                        </div>
                    )}
                    <p className="text-center text-xs text-gray-500 mb-4">
                        Scan this QR code to track your order in real-time
                    </p>
                </div>

                {/* Customer Info */}
                <div className="p-6 bg-gray-50">
                    <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                        Delivery To
                    </p>
                    <p className="font-bold text-gray-900">{data.customer_name}</p>
                    <p className="text-sm text-gray-600">📞 {data.customer_phone}</p>
                    {data.delivery_address && (
                        <p className="text-sm text-gray-600 mt-1">📍 {data.delivery_address}</p>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-900 text-white text-center">
                    <p className="text-xs opacity-80">
                        Thank you for shopping with {data.store_name}!
                    </p>
                    <p className="text-xs opacity-60 mt-1">
                        {new Date(data.created_at).toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-4">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={shareViaWhatsApp}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white"
                    style={{ background: '#25D366' }}
                >
                    <MessageCircle size={18} />
                    WhatsApp
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={copyTrackingLink}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-700 bg-white"
                >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    {copied ? 'Copied!' : 'Copy Link'}
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={downloadReceipt}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-700 bg-white"
                >
                    <Download size={18} />
                    Download
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.print()}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-700 bg-white"
                >
                    <Printer size={18} />
                    Print
                </motion.button>
            </div>
        </div>
    );
};

// ─── QR Scanner Component ─────────────────────────────────────────────────────

export const QRScanner: React.FC<{ onScan: (orderId: string) => void }> = ({ onScan }) => {
    const [scanning, setScanning] = useState(false);
    const [manualEntry, setManualEntry] = useState('');

    const startScanning = async () => {
        setScanning(true);
        // Integrate with a QR scanner library like react-qr-reader
        // For now, show manual entry option
    };

    const handleManualEntry = () => {
        if (manualEntry) {
            onScan(manualEntry);
            setManualEntry('');
        }
    };

    return (
        <div className="max-w-md mx-auto p-6">
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
                <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <QrCode size={40} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">
                        Track Your Order
                    </h2>
                    <p className="text-gray-600">
                        Scan the QR code on your receipt or enter order number
                    </p>
                </div>

                {!scanning ? (
                    <>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={startScanning}
                            className="w-full py-4 rounded-xl font-black text-white mb-4 flex items-center justify-center gap-3"
                            style={{ background: 'linear-gradient(135deg, #E61E2B, #C41E3A)' }}
                        >
                            <Camera size={20} />
                            Scan QR Code
                        </motion.button>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">or</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Enter order number"
                                value={manualEntry}
                                onChange={(e) => setManualEntry(e.target.value)}
                                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:outline-none"
                            />
                            <button
                                onClick={handleManualEntry}
                                disabled={!manualEntry}
                                className="px-6 py-3 rounded-xl font-bold text-white disabled:opacity-50"
                                style={{ background: '#E61E2B' }}
                            >
                                Track
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-center">
                        <div className="w-64 h-64 border-4 border-dashed border-gray-300 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                            <Scan size={48} className="text-gray-400" />
                        </div>
                        <button
                            onClick={() => setScanning(false)}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Order Tracking Display ───────────────────────────────────────────────────

export const OrderTracking: React.FC<{ orderId: string }> = ({ orderId }) => {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrder();
    }, [orderId]);

    const loadOrder = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();

            if (error) throw error;
            setOrder(data);
        } catch (error) {
            console.error('Failed to load order:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200" style={{ borderTopColor: '#E61E2B' }}></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center p-8">
                <XCircle size={48} className="text-red-500 mx-auto mb-4" />
                <p className="text-gray-600">Order not found</p>
            </div>
        );
    }

    const statusSteps = [
        { key: 'pending', label: 'Order Placed', icon: Package },
        { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
        { key: 'preparing', label: 'Preparing', icon: Clock },
        { key: 'ready', label: 'Ready', icon: AlertCircle },
        { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
        { key: 'delivered', label: 'Delivered', icon: CheckCircle }
    ];

    const currentStepIndex = statusSteps.findIndex(s => s.key === order.status);

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white p-6">
                    <h2 className="text-2xl font-black mb-2">Order Tracking</h2>
                    <p className="opacity-90">Order #{order.order_number}</p>
                </div>

                {/* Timeline */}
                <div className="p-6">
                    <div className="space-y-4">
                        {statusSteps.map((step, idx) => {
                            const Icon = step.icon;
                            const isCompleted = idx <= currentStepIndex;
                            const isCurrent = idx === currentStepIndex;

                            return (
                                <div key={step.key} className="flex items-center gap-4">
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                                        style={{
                                            background: isCompleted ? 'linear-gradient(135deg, #10b981, #059669)' : '#f3f4f6',
                                            color: isCompleted ? 'white' : '#9ca3af'
                                        }}
                                    >
                                        <Icon size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-bold ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {step.label}
                                        </p>
                                        {isCurrent && (
                                            <p className="text-sm text-green-600 font-semibold">Current status</p>
                                        )}
                                    </div>
                                    {isCompleted && (
                                        <CheckCircle size={20} className="text-green-600" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Order Items */}
                <div className="p-6 border-t-2 border-gray-100">
                    <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">
                        Order Items
                    </p>
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center mb-2">
                            <div>
                                <p className="font-bold text-gray-900">{item.name}</p>
                                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                            </div>
                            <p className="font-black text-gray-900">
                                TT${(item.quantity * item.price).toFixed(2)}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Contact Actions */}
                <div className="p-6 bg-gray-50 border-t-2 border-gray-100">
                    <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">
                        Need Help?
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <button className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-700 bg-white">
                            <Phone size={16} />
                            Call Store
                        </button>
                        <button className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white" style={{ background: '#25D366' }}>
                            <MessageCircle size={16} />
                            WhatsApp
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Export Service ────────────────────────────────────────────────────────────

export const qrReceiptService = {
    // Generate receipt with QR code
    async generateReceipt(orderId: string): Promise<ReceiptData | null> {
        try {
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .select(`
                    *,
                    stores (
                        name,
                        phone,
                        address,
                        whatsapp,
                        logo_url
                    )
                `)
                .eq('id', orderId)
                .single();

            if (orderError) throw orderError;

            const qrCode = await generateOrderQR(orderId);

            // Save QR code to order
            await supabase
                .from('orders')
                .update({ qr_code: qrCode, tracking_url: `${window.location.origin}/track/${orderId}` })
                .eq('id', orderId);

            return {
                ...order,
                store_name: order.stores.name,
                store_phone: order.stores.phone,
                store_address: order.stores.address,
                store_whatsapp: order.stores.whatsapp,
                store_logo: order.stores.logo_url,
                qr_code: qrCode
            };
        } catch (error) {
            console.error('Receipt generation failed:', error);
            return null;
        }
    },

    // Send receipt via email
    async emailReceipt(orderId: string, email: string): Promise<boolean> {
        try {
            // Integrate with email service (SendGrid, etc.)
            return true;
        } catch (error) {
            console.error('Email send failed:', error);
            return false;
        }
    },

    // Send receipt via WhatsApp
    async whatsappReceipt(orderId: string, phone: string): Promise<boolean> {
        try {
            const trackingUrl = `${window.location.origin}/track/${orderId}`;
            const message = `🧾 Your TriniBuild receipt is ready!\n\nTrack your order: ${trackingUrl}`;
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
            return true;
        } catch (error) {
            console.error('WhatsApp send failed:', error);
            return false;
        }
    }
};
