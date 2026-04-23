import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Copy, Check } from 'lucide-react';

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateName: string;
  templateComponent: React.ReactNode;
  templateJSON?: string;
}

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  isOpen,
  onClose,
  templateName,
  templateComponent,
  templateJSON
}) => {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const handleCopyJSON = () => {
    if (templateJSON) {
      navigator.clipboard.writeText(templateJSON);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-8 bg-white rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">{templateName}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-4 p-6">
              {/* Preview */}
              <div className="flex-1 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                <div className="w-full h-full overflow-auto">
                  <div className="min-h-full bg-white">
                    {templateComponent}
                  </div>
                </div>
              </div>

              {/* Info Panel */}
              <div className="w-full md:w-64 flex flex-col gap-4">
                {/* Live Demo Button */}
                <button className="w-full bg-trini-red text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                  <Eye className="w-5 h-5" />
                  View Live Demo
                </button>

                {/* Use Template Button */}
                <button className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors">
                  Use This Template
                </button>

                {/* Toggle Code View */}
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  {showCode ? 'Hide Code' : 'Show Code'}
                </button>

                {/* Template Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold text-gray-900 mb-2">Features</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>✓ Mobile responsive</li>
                    <li>✓ Dark mode ready</li>
                    <li>✓ SEO optimized</li>
                    <li>✓ Payment ready</li>
                  </ul>
                </div>

                {/* Copy JSON Button */}
                {templateJSON && (
                  <button
                    onClick={handleCopyJSON}
                    className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Template
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Code View */}
            {showCode && templateJSON && (
              <div className="border-t border-gray-200 p-6 bg-gray-50 max-h-40 overflow-auto">
                <pre className="text-xs text-gray-600 font-mono overflow-x-auto">
                  {templateJSON}
                </pre>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
              <button className="px-6 py-2 bg-trini-red text-white rounded-lg font-bold hover:bg-red-700 transition-colors">
                Use Template
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
