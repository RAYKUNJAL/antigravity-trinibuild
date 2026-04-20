import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  MapPin, 
  Phone, 
  DollarSign, 
  CheckCircle,
  Navigation,
  User,
  Clock
} from 'lucide-react';
import { codService } from '../../services/codService';

interface DriverCODDelivery {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  amount: number;
  status: string;
  pickup_location: string;
  delivery_notes?: string;
  estimated_time?: string;
}

export const DriverCODDeliveries: React.FC = () => {
  const [deliveries, setDeliveries] = useState<DriverCODDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<DriverCODDelivery | null>(null);

  useEffect(() => {
    loadDeliveries();
    const interval = setInterval(loadDeliveries, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDeliveries = async () => {
    try {
      // Mock implementation - replace with actual driver deliveries query
      // const { data } = await supabase.from('orders').select('*')
      //   .eq('driver_id', currentDriverId)
      //   .eq('payment_method', 'cod')
      //   .in('status', ['assigned', 'out_for_delivery'])
      setDeliveries([]);
      setLoading(false);
    } catch (error) {
      console.error('Error loading deliveries:', error);
      setLoading(false);
    }
  };

  const handleMarkCollected = async (deliveryId: string) => {
    try {
      // Get current driver ID from auth/context
      const driverId = 'CURRENT_DRIVER_ID';
      await codService.markCashCollected(deliveryId, driverId);
      await loadDeliveries();
    } catch (error) {
      console.error('Error marking collected:', error);
      alert('Failed to mark cash as collected');
    }
  };

  const handleStartNavigation = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">
            COD Deliveries
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {deliveries.length} active delivery{deliveries.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {/* Total Cash to Collect */}
        <div className="bg-gradient-to-br from-trini-red to-red-700 rounded-xl px-6 py-3 text-white">
          <p className="text-xs font-bold text-white/80">TO COLLECT</p>
          <p className="text-2xl font-black">
            ${deliveries.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Deliveries List */}
      {deliveries.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No active COD deliveries</p>
          <p className="text-sm text-gray-400 mt-1">
            New deliveries will appear here when assigned
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {deliveries.map((delivery) => (
            <motion.div
              key={delivery.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              {/* Order Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-black text-gray-900">
                    {delivery.order_number}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {delivery.pickup_location}
                  </p>
                </div>
                <div className="bg-trini-red text-white px-4 py-2 rounded-lg">
                  <p className="text-xs font-bold">COLLECT</p>
                  <p className="text-xl font-black">${delivery.amount.toFixed(2)}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-5 h-5 text-trini-red" />
                  <span className="font-bold text-gray-900">{delivery.customer_name}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{delivery.customer_address}</span>
                </div>

                {delivery.delivery_notes && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-3">
                    <p className="text-xs font-bold text-yellow-800 mb-1">
                      📝 Delivery Notes:
                    </p>
                    <p className="text-sm text-yellow-900">{delivery.delivery_notes}</p>
                  </div>
                )}

                {delivery.estimated_time && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Est. arrival: {delivery.estimated_time}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleStartNavigation(delivery.customer_address)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                >
                  <Navigation className="w-5 h-5" />
                  Navigate
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.location.href = `tel:${delivery.customer_phone}`}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
                >
                  <Phone className="w-5 h-5" />
                  Call
                </motion.button>
              </div>

              {/* Mark as Collected */}
              {delivery.status === 'out_for_delivery' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleMarkCollected(delivery.id)}
                  className="w-full mt-3 px-4 py-3 bg-gradient-to-r from-trini-red to-red-700 text-white rounded-lg font-bold hover:from-red-700 hover:to-red-800"
                >
                  <CheckCircle className="w-5 h-5 inline mr-2" />
                  Mark Cash Collected
                </motion.button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Daily Summary */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-black text-gray-900 mb-4">
          Today's COD Summary
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-600 mb-1">Completed</p>
            <p className="text-2xl font-black text-green-600">0</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Pending</p>
            <p className="text-2xl font-black text-yellow-600">{deliveries.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Total Collected</p>
            <p className="text-2xl font-black text-trini-red">$0.00</p>
          </div>
        </div>
      </div>

    </div>
  );
};
