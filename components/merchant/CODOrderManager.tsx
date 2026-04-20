import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Truck, 
  Phone,
  MessageCircle,
  DollarSign,
  User,
  MapPin
} from 'lucide-react';
import { codService, CODOrder } from '../../services/codService';

interface CODOrderManagerProps {
  order: CODOrder;
  onUpdate: () => void;
}

export const CODOrderManager: React.FC<CODOrderManagerProps> = ({ order: initialOrder, onUpdate }) => {
  const [order, setOrder] = useState(initialOrder);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [statusNote, setStatusNote] = useState('');

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    // Mock - replace with actual driver fetch
    // const { data } = await supabase.from('drivers').select('*').eq('driver_status', 'available')
    setDrivers([]);
  };

  const handleStatusUpdate = async (newStatus: CODOrder['status']) => {
    try {
      setProcessing(true);
      await codService.updateOrderStatus(order.id, newStatus, statusNote);
      setOrder({ ...order, status: newStatus });
      setStatusNote('');
      onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update order status');
    } finally {
      setProcessing(false);
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedDriver) {
      alert('Please select a driver');
      return;
    }

    try {
      setProcessing(true);
      await codService.assignDriver(order.id, selectedDriver);
      setOrder({ ...order, status: 'assigned', driver_id: selectedDriver });
      onUpdate();
    } catch (error) {
      console.error('Error assigning driver:', error);
      alert('Failed to assign driver');
    } finally {
      setProcessing(false);
    }
  };

  const getActionButtons = () => {
    const buttons = [];

    if (order.status === 'placed') {
      buttons.push(
        <motion.button
          key="confirm"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleStatusUpdate('confirmed')}
          disabled={processing}
          className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle className="w-5 h-5 inline mr-2" />
          Confirm Order
        </motion.button>
      );
    }

    if (order.status === 'confirmed' && !order.driver_id) {
      buttons.push(
        <div key="assign-driver" className="flex-1 flex gap-2">
          <select
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
          >
            <option value="">Select Driver</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.driver_name}</option>
            ))}
          </select>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAssignDriver}
            disabled={!selectedDriver || processing}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Truck className="w-5 h-5 inline mr-2" />
            Assign
          </motion.button>
        </div>
      );
    }

    if (order.status === 'assigned') {
      buttons.push(
        <motion.button
          key="out-for-delivery"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleStatusUpdate('out_for_delivery')}
          disabled={processing}
          className="flex-1 px-6 py-3 bg-yellow-600 text-white rounded-lg font-bold hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Truck className="w-5 h-5 inline mr-2" />
          Mark Out for Delivery
        </motion.button>
      );
    }

    if (order.status !== 'delivered' && order.status !== 'cancelled') {
      buttons.push(
        <motion.button
          key="cancel"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleStatusUpdate('cancelled')}
          disabled={processing}
          className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <XCircle className="w-5 h-5 inline mr-2" />
          Cancel
        </motion.button>
      );
    }

    return buttons;
  };

  return (
    <div className="space-y-6">
      
      {/* Order Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900">
              {order.order_number}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Placed {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-trini-red">
              ${order.total_amount.toFixed(2)}
            </div>
            <p className="text-sm text-gray-600">Cash on Delivery</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <User className="w-4 h-4" />
              <span className="font-bold">Customer</span>
            </div>
            <p className="text-gray-900 font-semibold">{order.customer_name}</p>
            <div className="flex items-center gap-2 mt-2">
              <a
                href={`tel:${order.customer_phone}`}
                className="px-3 py-1 bg-trini-red text-white text-sm rounded-lg hover:bg-red-700"
              >
                <Phone className="w-3 h-3 inline mr-1" />
                Call
              </a>
              <a
                href={codService.getWhatsAppLink(order.customer_phone, order.order_number, order.status)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
              >
                <MessageCircle className="w-3 h-3 inline mr-1" />
                WhatsApp
              </a>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <MapPin className="w-4 h-4" />
              <span className="font-bold">Delivery Address</span>
            </div>
            <p className="text-gray-900">{order.customer_address}</p>
          </div>
        </div>
      </div>

      {/* Driver Info (if assigned) */}
      {order.driver_name && (
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-sm">
          <h3 className="text-lg font-black mb-2">Assigned Driver</h3>
          <p className="text-xl font-bold">{order.driver_name}</p>
          <p className="text-sm text-purple-100 mt-1">{order.driver_phone}</p>
        </div>
      )}

      {/* Status Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-black text-gray-900 mb-4">
          Order Actions
        </h3>

        {/* Status Note */}
        {order.status !== 'delivered' && order.status !== 'cancelled' && (
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Note (Optional)
            </label>
            <textarea
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Add a note about this status change..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
            />
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-3">
          {getActionButtons()}
        </div>
      </div>

      {/* Payment Status */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-black text-gray-900 mb-4">
          Payment Status
        </h3>
        <div className="flex items-center gap-4">
          <DollarSign className={`w-10 h-10 ${
            order.payment_status === 'collected' ? 'text-green-600' : 'text-yellow-600'
          }`} />
          <div>
            <p className="font-bold text-gray-900">
              {order.payment_status === 'collected' ? 'Cash Collected' : 'Pending Collection'}
            </p>
            <p className="text-sm text-gray-600">
              {order.payment_status === 'collected' 
                ? 'Driver has collected the cash'
                : 'Waiting for driver to collect cash from customer'
              }
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
