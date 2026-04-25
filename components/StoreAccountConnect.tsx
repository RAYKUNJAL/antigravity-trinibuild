/**
 * AGENT 10: Store Account Connect Component
 * 
 * UI for linking TriniBuild stores to AI listing system
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { linkTriniBuildStore, getLinkedAccounts } from '../services/storeOAuthService';
import { supabase } from '../services/supabaseClient';

interface StoreAccountConnectProps {
  onConnect?: () => void;
}

export default function StoreAccountConnect({ onConnect }: StoreAccountConnectProps) {
  const [user, setUser] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [linkedStoreIds, setLinkedStoreIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadStores();
  }, []);

  async function loadStores() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUser(user);

      // Get user's stores
      const { data: userStores } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .eq('status', 'active');

      setStores(userStores || []);

      // Get already linked stores
      const linkedAccounts = await getLinkedAccounts(user.id);
      const linkedIds = new Set(linkedAccounts.map(a => a.store_id));
      setLinkedStoreIds(linkedIds);
    } catch (error) {
      console.error('Failed to load stores:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect(storeId: string) {
    if (!user) return;

    setConnecting(storeId);
    try {
      const result = await linkTriniBuildStore(user.id, storeId);
      
      if (result.success) {
        // Update linked store IDs
        setLinkedStoreIds(prev => new Set([...prev, storeId]));
        
        // Close modal
        setShowModal(false);
        
        // Notify parent
        if (onConnect) {
          onConnect();
        }
      } else {
        alert(`Failed to connect store: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setConnecting(null);
    }
  }

  if (loading) {
    return <div className="text-gray-600">Loading stores...</div>;
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
      >
        + Connect Store
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Connect Your Store</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                Link your TriniBuild store to enable AI-powered listing optimization
              </p>
            </div>

            <div className="p-6">
              {stores.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">
                    You don't have any active stores yet
                  </p>
                  <a
                    href="/dashboard"
                    className="text-purple-600 hover:underline"
                  >
                    Create your first store →
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {stores.map(store => {
                    const isLinked = linkedStoreIds.has(store.id);
                    const isConnecting = connecting === store.id;

                    return (
                      <div
                        key={store.id}
                        className={`
                          flex items-center justify-between p-4 rounded-lg border-2 transition-all
                          ${isLinked
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-200 hover:border-purple-300'
                          }
                        `}
                      >
                        <div>
                          <div className="font-medium text-lg">
                            {store.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {store.category} • {store.plan_tier || 'Free'} Plan
                          </div>
                        </div>

                        {isLinked ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-green-600">✓</span>
                            <span className="text-green-600 font-medium">
                              Connected
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleConnect(store.id)}
                            disabled={isConnecting}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isConnecting ? 'Connecting...' : 'Connect'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                <strong>What happens when you connect?</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>AI can create and optimize product listings for this store</li>
                  <li>Batch upload CSV files to generate listings</li>
                  <li>Analytics and performance tracking</li>
                  <li>You can disconnect at any time</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
