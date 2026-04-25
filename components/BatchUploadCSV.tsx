/**
 * AGENT 11: Batch Upload CSV Component
 * 
 * Upload CSV files to batch process 50-1000 products
 * - Drag-and-drop interface
 * - CSV preview
 * - Cost estimation
 * - Progress tracking
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { createBatchJob, estimateBatchCost, getBatchJobStatus } from '../services/batchProcessor';

interface BatchUploadCSVProps {
  userId: string;
  accounts: any[];
  onComplete?: () => void;
}

export default function BatchUploadCSV({ userId, accounts, onComplete }: BatchUploadCSVProps) {
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [csvText, setCsvText] = useState('');
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvText(text);
      previewCSV(text);
    };
    reader.readAsText(file);
  };

  function previewCSV(text: string) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const preview = [];
    for (let i = 1; i < Math.min(6, lines.length); i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx];
      });
      preview.push(row);
    }

    setCsvPreview(preview);
    
    // Estimate cost
    const itemCount = lines.length - 1; // Exclude header
    const cost = estimateBatchCost(itemCount);
    setEstimatedCost(cost);
  }

  async function handleSubmit() {
    if (!selectedAccount || !csvText) {
      alert('Please select a store and upload a CSV file');
      return;
    }

    setUploading(true);
    try {
      const result = await createBatchJob(userId, selectedAccount, csvText);
      
      if (result.success && result.jobId) {
        setJobId(result.jobId);
        // Start polling for progress
        pollProgress(result.jobId);
      } else {
        alert(`Failed to create batch job: ${result.error}`);
        setUploading(false);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
      setUploading(false);
    }
  }

  async function pollProgress(id: string) {
    const interval = setInterval(async () => {
      const status = await getBatchJobStatus(id);
      if (status) {
        setProgress(status);
        
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(interval);
          setUploading(false);
          
          if (onComplete) {
            onComplete();
          }
        }
      }
    }, 2000); // Poll every 2 seconds
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-4">Batch Upload CSV</h3>
        <p className="text-gray-600 mb-6">
          Upload a CSV file with product images to generate professional listings in bulk
        </p>
      </div>

      {/* Account Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Store
        </label>
        <select
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          disabled={uploading}
        >
          <option value="">Choose a store...</option>
          {accounts.map(account => (
            <option key={account.id} value={account.id}>
              {account.store_name}
            </option>
          ))}
        </select>
      </div>

      {/* CSV Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload CSV File
        </label>
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center transition-all
            ${dragActive
              ? 'border-purple-600 bg-purple-50'
              : 'border-gray-300 hover:border-purple-400'
            }
            ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
            id="csv-upload"
            disabled={uploading}
          />
          <label htmlFor="csv-upload" className="cursor-pointer">
            <div className="text-6xl mb-4">📄</div>
            <div className="text-lg font-medium text-gray-700 mb-2">
              Drop your CSV file here
            </div>
            <div className="text-sm text-gray-500">
              or click to browse
            </div>
          </label>
        </div>
      </div>

      {/* CSV Preview */}
      {csvPreview.length > 0 && !uploading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-lg p-6"
        >
          <h4 className="font-medium mb-3">Preview (first 5 rows)</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  {Object.keys(csvPreview[0]).map(header => (
                    <th key={header} className="text-left py-2 px-3 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvPreview.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    {Object.values(row).map((value: any, i) => (
                      <td key={i} className="py-2 px-3 text-gray-700">
                        {String(value).substring(0, 50)}
                        {String(value).length > 50 ? '...' : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium">Total Items:</span> {csvPreview.length + 1}+
              </div>
              <div>
                <span className="font-medium">Estimated Cost:</span> ${estimatedCost.toFixed(2)} USD
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Progress */}
      {uploading && progress && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-50 rounded-lg p-6"
        >
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Processing...</span>
              <span className="text-gray-600">
                {progress.processed_items}/{progress.total_items} items
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all"
                style={{
                  width: `${(progress.processed_items / progress.total_items) * 100}%`
                }}
              />
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            Status: {progress.status}
          </div>
        </motion.div>
      )}

      {/* Submit Button */}
      {csvPreview.length > 0 && !uploading && (
        <button
          onClick={handleSubmit}
          className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium text-lg hover:shadow-lg transition-all"
        >
          Start Batch Processing
        </button>
      )}

      {/* CSV Format Guide */}
      <div className="bg-gray-50 rounded-lg p-6 text-sm">
        <h4 className="font-medium mb-2">Required CSV Format:</h4>
        <pre className="bg-white p-3 rounded border border-gray-200 overflow-x-auto">
          image_url,existing_title,existing_description,category,merchant_note
        </pre>
        <ul className="list-disc list-inside mt-3 space-y-1 text-gray-600">
          <li><strong>image_url</strong>: Required - Direct URL to product image</li>
          <li><strong>existing_title</strong>: Optional - Current product title</li>
          <li><strong>existing_description</strong>: Optional - Current description</li>
          <li><strong>category</strong>: Optional - Product category</li>
          <li><strong>merchant_note</strong>: Optional - Additional notes for AI</li>
        </ul>
      </div>
    </div>
  );
}
