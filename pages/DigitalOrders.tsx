import React, { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { EmptyState } from '../components/dashboard/EmptyState';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';

export const DigitalOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const { data } = await supabase
          .from('digital_product_orders')
          .select('*, digital_products(*)')
          .eq('user_id', user.user.id)
          .order('created_at', { ascending: false });
        setOrders(data || []);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Digital Product Orders</h1>
      {orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          description="When you purchase digital products, they'll appear here."
        />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-800">{o.digital_products?.title}</h4>
                <p className="text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-800">${o.amount}</span>
                <Badge color={o.payment_status === 'paid' ? 'green' : 'yellow'}>{o.payment_status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
