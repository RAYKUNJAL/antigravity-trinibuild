import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Camera, CheckCircle, AlertCircle, DollarSign, Building } from 'lucide-react';
import { bankTransferService } from '../services/bankTransferService';

interface BankTransferUploadProps {
  orderId: string;
  storeId: string;
  amount: number;
  onSuccess?: () => void;
}

export const BankTransferUpload: React.FC<BankTransferUploadProps> = ({
  orderId,
  storeId,
  amount,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountLastFour, setAccountLastFour] = useState('');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a proof of payment image');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      await bankTransferService.uploadProof(
        orderId,
        storeId,
        amount,
        file,
        {
          reference_number: referenceNumber || undefined,
          bank_name: bankName || undefined,
          account_last_four: accountLastFour || undefined,
        }
      );

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload proof of payment. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center"
      >
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-black text-green-900 mb-2">
          Proof Uploaded Successfully! 📋
        </h2>
        <p className="text-green-700">
          The merchant will verify your payment shortly. You'll be notified once confirmed.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-xl font-black text-gray-900 mb-2">
        Upload Payment Proof
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Amount to pay: <span className="font-bold text-juvay-red">TTD ${amount.toFixed(2)}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* File Upload */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Payment Receipt or Screenshot
          </label>
          
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="proof-upload"
          />
          
          <label
            htmlFor="proof-upload"
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-juvay-red transition-colors"
          >
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            ) : (
              <div className="text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-600">
                  Click to upload receipt
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PNG, JPG up to 10MB
                </p>
              </div>
            )}
          </label>
        </div>

        {/* Reference Number (Optional) */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Transaction Reference (Optional)
          </label>
          <input
            type="text"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="e.g., TXN123456789"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-juvay-red focus:border-transparent"
          />
        </div>

        {/* Bank Name (Optional) */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <Building className="w-4 h-4 inline mr-1" />
            Bank Name (Optional)
          </label>
          <select
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-juvay-red focus:border-transparent"
          >
            <option value="">Select bank</option>
            <option value="First Citizens Bank">First Citizens Bank</option>
            <option value="Republic Bank">Republic Bank</option>
            <option value="Scotiabank">Scotiabank</option>
            <option value="RBC">RBC Royal Bank</option>
            <option value="JMMB">JMMB Bank</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Last 4 Digits (Optional) */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Last 4 Digits of Account (Optional)
          </label>
          <input
            type="text"
            value={accountLastFour}
            onChange={(e) => setAccountLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="1234"
            maxLength={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-juvay-red focus:border-transparent"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={!file || uploading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
            !file || uploading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-juvay-red hover:bg-red-700'
          }`}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Uploading...</span>
            </div>
          ) : (
            'Submit Proof of Payment'
          )}
        </motion.button>

      </form>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Take a clear photo of your bank receipt or screenshot
          showing the transaction amount and date. The merchant will verify it within 24 hours.
        </p>
      </div>
    </div>
  );
};
