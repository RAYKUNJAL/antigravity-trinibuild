import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  CheckCircle, 
  Truck, 
  MapPin, 
  Phone, 
  Star,
  Clock,
  MessageCircle
} from 'lucide-react';
import { codService, CODTracking } from '../services/codService';

interface CODOrderTrackingProps {
  orderId: string;
}

export const CODOrderTracking: React.FC<CODOrderTrackingProps> = ({ orderId }) => {
  const [tracking, setTracking] = useState<CODTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTracking();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadTracking, 30000);
    return () => clearInterval(interval);
  }, [orderId]);

  const loadTracking = async () => {
    try {
      setLoading(true);
      const data = await codService.getOrderTracking(orderId);
      setTracking(data);
      setError(null);
    } catch (err) {
      console.error('Error loading tracking:', err);
      setError('Failed to load order tracking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      placed: 'bg-gray-100 text-gray-600',
      confirmed: 'bg-blue-100 text-blue-600',
      assigned: 'bg-purple-100 text-purple-600',
      out_for_delivery: 'bg-yellow-100 text-yellow-600',
      delivered: 'bg-green-100 text-green-600',
      cancelled: 'bg-red-100 text-red-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      placed: <Package className="w-5 h-5" />,
      confirmed: <CheckCircle className="w-5 h-5" />,
      assigned: <Truck className="w-5 h-5" />,
      out_for_delivery: <Truck className="w-5 h-5" />,
      delivered: <CheckCircle className="w-5 h-5" />,
    };
    return icons[status] || <Package className="w-5 h-5" />;
  };

  if (loading && !tracking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
          <button
            onClick={loadTracking}
            className="px-6 py-2 bg-juvay-red text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { order, timeline, driver } = tracking;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-black text-gray-900">
                Order {order.order_number}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Cash on Delivery (TTD ${order.total_amount.toFixed(2)})
              </p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(order.status)}`}>
              {order.status.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{order.customer_address}</span>
          </div>
        </motion.div>

        {/* Driver Info */}
        {driver && order.status !== 'delivered' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-juvay-red to-red-700 rounded-2xl p-6 text-white shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-lg font-black mb-1">Your Driver</h2>
                <p className="text-xl font-bold text-white/90">{driver.name}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Star className="w-4 h-4 fill-juvay-gold text-juvay-gold" />
                  <span className="text-sm font-semibold">{driver.rating.toFixed(1)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <a
                  href={`tel:${driver.phone}`}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-juvay-red rounded-lg font-bold hover:bg-gray-100 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Call
                </a>
                <a
                  href={codService.getWhatsAppLink(driver.phone, order.order_number, order.status)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white text-green-600 rounded-lg font-bold hover:bg-gray-100 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              </div>
            </div>

            {order.estimated_delivery && (
              <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  Estimated delivery: {new Date(order.estimated_delivery).toLocaleTimeString()}
                </span>
              </div>
            )}
          </motion.div>
        )}

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <h2 className="text-lg font-black text-gray-900 mb-6">Order Timeline</h2>
          
          <div className="space-y-4">
            {timeline.map((event, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex gap-4"
              >
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-juvay-red flex items-center justify-center text-white">
                    {getStatusIcon(event.status.toLowerCase().replace(/ /g, '_'))}
                  </div>
                  {index < timeline.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 my-2" />
                  )}
                </div>
                
                <div className="flex-1 pb-6">
                  <h3 className="font-bold text-gray-900">{event.status}</h3>
                  <p className="text-sm text-gray-600 mt-1">{event.note}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Delivery Instructions */}
        {order.status === 'out_for_delivery' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6"
          >
            <h3 className="font-black text-yellow-900 mb-2">Driver is on the way! 🚚</h3>
            <p className="text-sm text-yellow-800">
              Please have <span className="font-bold">TTD ${order.total_amount.toFixed(2)}</span> ready for the driver.
              Exact change is appreciated!
            </p>
          </motion.div>
        )}

        {/* Delivered */}
        {order.status === 'delivered' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center"
          >
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black text-green-900 mb-2">
              Order Delivered! 🎉
            </h2>
            <p className="text-green-700">
              Thank you for shopping with Juvay. We hope you enjoy your order!
            </p>
          </motion.div>
        )}

      </div>
    </div>
  );
};
