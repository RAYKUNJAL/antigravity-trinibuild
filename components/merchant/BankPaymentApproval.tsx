import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  DollarSign,
  Building,
  Eye,
  AlertCircle
} from 'lucide-react';
import { bankTransferService, BankTransferProof } from '../../services/bankTransferService';

export const BankPaymentApproval: React.FC = () => {
  const [proofs, setProofs] = useState<BankTransferProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [selectedProof, setSelectedProof] = useState<BankTransferProof | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadProofs();
    // Auto-refresh every minute
    const interval = setInterval(loadProofs, 60000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadProofs = async () => {
    try {
      setLoading(true);
      // Get store ID from context/props in real implementation
      const storeId = 'YOUR_STORE_ID';
      const data = filter === 'pending'
        ? await bankTransferService.getPendingProofs(storeId)
        : await bankTransferService.getStoreProofs(storeId);
      setProofs(data);
    } catch (error) {
      console.error('Error loading proofs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedProof) return;

    try {
      setProcessing(true);
      await bankTransferService.approveProof(selectedProof.id, approvalNotes);
      setSelectedProof(null);
      setApprovalNotes('');
      await loadProofs();
    } catch (error) {
      console.error('Error approving proof:', error);
      alert('Failed to approve payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProof) return;
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(true);
      await bankTransferService.rejectProof(selectedProof.id, rejectReason);
      setSelectedProof(null);
      setRejectReason('');
      await loadProofs();
    } catch (error) {
      console.error('Error rejecting proof:', error);
      alert('Failed to reject payment');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            Bank Transfer Approvals
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Review and verify customer payment proofs
          </p>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${
              filter === 'pending'
                ? 'bg-trini-red text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pending ({proofs.filter(p => p.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${
              filter === 'all'
                ? 'bg-trini-red text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Proofs List */}
      {proofs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">
            {filter === 'pending' ? 'No pending approvals' : 'No bank transfer proofs'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {proofs.map((proof) => (
            <motion.div
              key={proof.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              {/* Proof Image */}
              <div className="relative mb-4 rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={proof.proof_image_url}
                  alt="Payment Proof"
                  className="w-full h-64 object-contain"
                />
                <button
                  onClick={() => window.open(proof.proof_image_url, '_blank')}
                  className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-lg hover:bg-black/70"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-600">Amount</span>
                  <span className="text-xl font-black text-trini-red">
                    ${proof.amount.toFixed(2)} {proof.currency}
                  </span>
                </div>

                {proof.bank_name && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      <Building className="w-4 h-4 inline mr-1" />
                      Bank
                    </span>
                    <span className="font-semibold text-gray-900">{proof.bank_name}</span>
                  </div>
                )}

                {proof.reference_number && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Reference</span>
                    <span className="font-mono text-gray-900">{proof.reference_number}</span>
                  </div>
                )}

                {proof.account_last_four && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Account</span>
                    <span className="font-mono text-gray-900">****{proof.account_last_four}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Uploaded</span>
                  <span className="text-gray-900">
                    {new Date(proof.uploaded_at).toLocaleString()}
                  </span>
                </div>

                {/* Status Badge */}
                <div className="pt-3 border-t border-gray-100">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                    proof.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                    proof.status === 'approved' ? 'bg-green-100 text-green-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {proof.status.toUpperCase()}
                  </span>
                </div>

                {/* Actions (for pending only) */}
                {proof.status === 'pending' && (
                  <div className="pt-3 flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedProof(proof)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      Approve
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedProof(proof)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
                    >
                      <XCircle className="w-4 h-4 inline mr-1" />
                      Reject
                    </motion.button>
                  </div>
                )}

                {/* Verification Info (for processed) */}
                {proof.status !== 'pending' && proof.verification_notes && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-bold text-gray-600 mb-1">
                      {proof.status === 'approved' ? 'Approval' : 'Rejection'} Note:
                    </p>
                    <p className="text-sm text-gray-900">{proof.verification_notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Approval/Rejection Modal */}
      <AnimatePresence>
        {selectedProof && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
            onClick={() => !processing && setSelectedProof(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-black text-gray-900 mb-4">
                Verify Payment
              </h3>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Amount</p>
                <p className="text-2xl font-black text-trini-red">
                  ${selectedProof.amount.toFixed(2)}
                </p>
              </div>

              {/* Approval Notes */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add notes about this verification..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                />
              </div>

              {/* Rejection Reason */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Rejection Reason (Required if rejecting)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why you're rejecting this payment..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleApprove}
                  disabled={processing}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing...' : 'Approve'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReject}
                  disabled={processing}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing...' : 'Reject'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
