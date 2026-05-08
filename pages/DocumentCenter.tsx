/**
 * DocumentCenter.tsx — AI Banking & Visa Document Generator
 * Proof of Income, Bank Letters, Visa Support, Job Letters,
 * Loan Support, Financial Statements, VAT Certificates
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, Copy, Check, ArrowLeft, Sparkles,
  Lock, Shield, AlertCircle, CheckCircle, Clock, Star,
  Printer, Share2, ChevronRight, Eye
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { documentCenterService, DOCUMENT_CATALOG } from '../services/documentCenterService';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  { id: 'all', label: 'All Documents' },
  { id: 'banking', label: '🏦 Banking' },
  { id: 'visa', label: '✈️ Visa' },
  { id: 'employment', label: '💼 Employment' },
  { id: 'tax', label: '📊 Tax' },
];

export default function DocumentCenter() {
  const [user, setUser] = useState<any>(null);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [category, setCategory] = useState('all');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [orderId, setOrderId] = useState('');
  const [copied, setCopied] = useState(false);
  const [pastDocs, setPastDocs] = useState<any[]>([]);
  const [viewPast, setViewPast] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { navigate('/login'); return; }
      setUser(user);
      // Check plan
      const { data: sub } = await supabase.from('user_plan_subscriptions').select('plan_slug').eq('user_id', user.id).single();
      if (sub) setUserPlan(sub.plan_slug);
      const docs = await documentCenterService.getUserDocuments(user.id);
      setPastDocs(docs);
    });
  }, [navigate]);

  const selectDocument = (doc: any) => {
    // Check if user has access
    if (!doc.is_free && userPlan === 'free') {
      // Show upgrade prompt instead
      setSelectedDoc({ ...doc, locked: true });
      return;
    }
    setSelectedDoc(doc);
    setFields({});
    setGeneratedContent('');
    setError('');
  };

  const generateDocument = async () => {
    if (!user || !selectedDoc) return;
    setGenerating(true);
    setError('');
    try {
      const { content, order_id } = await documentCenterService.generateDocument(
        selectedDoc.id,
        fields,
        user.id
      );
      setGeneratedContent(content);
      setOrderId(order_id);
    } catch (e: any) {
      setError(e.message || 'Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const copyDocument = () => {
    const full = documentCenterService.formatDocumentForPrint(generatedContent, selectedDoc?.id);
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const printDocument = () => {
    const full = documentCenterService.formatDocumentForPrint(generatedContent, selectedDoc?.id);
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(`
        <html><head><title>${selectedDoc?.title}</title>
        <style>
          body { font-family: 'Times New Roman', serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.8; color: #000; }
          pre { white-space: pre-wrap; font-family: inherit; }
          @media print { button { display: none; } }
        </style></head>
        <body><pre>${full}</pre>
        <button onclick="window.print()" style="margin-top:20px; padding: 10px 20px; background: #E61E2B; color: white; border: none; cursor: pointer; border-radius: 6px; font-size: 14px;">Print Document</button>
        </body></html>
      `);
      w.document.close();
    }
  };

  const filteredDocs = DOCUMENT_CATALOG.filter(d => category === 'all' || d.category === category);

  const isFormValid = selectedDoc && selectedDoc.fields
    .filter((f: any) => f.required)
    .every((f: any) => fields[f.key]?.trim());

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-2">
            {selectedDoc ? (
              <button onClick={() => { setSelectedDoc(null); setGeneratedContent(''); }} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-4 h-4" />Back
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={() => setViewPast(!viewPast)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Clock className="w-4 h-4" />
              Past Documents ({pastDocs.length})
            </button>
          </div>
          {!selectedDoc && (
            <div>
              <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                <Sparkles className="w-7 h-7 text-red-600" />
                AI Document Center
              </h1>
              <p className="text-gray-500 mt-1">Generate official documents for banks, embassies, and employers — powered by AI, ready in 30 seconds</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Past Documents Panel */}
        <AnimatePresence>
          {viewPast && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden mb-6">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 font-semibold text-gray-700">Previously Generated</div>
                {pastDocs.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">No documents generated yet</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {pastDocs.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.document_type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</p>
                          <p className="text-xs text-gray-400">{new Date(doc.created_at).toLocaleDateString('en-TT')}</p>
                        </div>
                        <button
                          onClick={() => { setSelectedDoc(DOCUMENT_CATALOG.find(d => d.id === doc.document_type)); setGeneratedContent(doc.generated_content || ''); setViewPast(false); }}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          View →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!selectedDoc ? (
          /* Document catalog */
          <div className="space-y-6">
            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    category === cat.id ? 'bg-red-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Free tier notice */}
            {userPlan === 'free' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                <Star className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-800">2 documents free with your account</p>
                  <p className="text-xs text-yellow-700 mt-0.5">Upgrade to Pro for unlimited AI document generation — TT$199/month</p>
                </div>
              </div>
            )}

            {/* Document grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map(doc => (
                <motion.button
                  key={doc.id}
                  whileHover={{ y: -2 }}
                  onClick={() => selectDocument(doc)}
                  className="bg-white rounded-2xl border border-gray-200 p-5 text-left hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-3xl">{doc.icon}</div>
                    <div className="flex items-center gap-2">
                      {doc.is_free ? (
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">FREE</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full">TT${doc.price_ttd}</span>
                      )}
                      {!doc.is_free && userPlan === 'free' && <Lock className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{doc.title}</h3>
                  <p className="text-xs text-gray-500 mb-3">{doc.subtitle}</p>
                  <p className="text-xs text-gray-400 line-clamp-2">{doc.description}</p>
                  <div className="mt-4 flex items-center gap-1 text-xs text-red-600 font-medium">
                    Generate <ChevronRight className="w-3 h-3" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        ) : selectedDoc.locked ? (
          /* Upgrade prompt */
          <div className="max-w-lg mx-auto text-center py-12">
            <div className="text-5xl mb-4">{selectedDoc.icon}</div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">{selectedDoc.title}</h2>
            <p className="text-gray-500 mb-6">{selectedDoc.description}</p>
            <div className="bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl p-6 mb-4">
              <p className="font-bold text-lg mb-1">Upgrade to Pro</p>
              <p className="text-red-100 text-sm mb-4">Unlimited AI document generation + all Pro features</p>
              <p className="text-3xl font-black mb-1">TT$199<span className="text-sm font-normal">/month</span></p>
              <a href="/pricing" className="block mt-4 bg-white text-red-600 font-bold py-3 rounded-xl hover:bg-red-50 transition-colors">
                Upgrade Now →
              </a>
            </div>
            <button onClick={() => setSelectedDoc(null)} className="text-sm text-gray-500 hover:text-gray-700">← Back to documents</button>
          </div>
        ) : !generatedContent ? (
          /* Form */
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{selectedDoc.icon}</div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900">{selectedDoc.title}</h2>
                    <p className="text-gray-500 text-sm">{selectedDoc.description}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {selectedDoc.fields.map((field: any) => (
                  <div key={field.key}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        value={fields[field.key] || ''}
                        onChange={e => setFields(f => ({ ...f, [field.key]: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="">Select...</option>
                        {field.options?.map((o: string) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : field.type === 'date' ? (
                      <input
                        type="date"
                        value={fields[field.key] || ''}
                        onChange={e => setFields(f => ({ ...f, [field.key]: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={fields[field.key] || ''}
                        onChange={e => setFields(f => ({ ...f, [field.key]: e.target.value }))}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    )}
                  </div>
                ))}

                {error && (
                  <div className="flex items-start gap-3 bg-red-50 rounded-xl p-4">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
                  <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>Your information is used only to generate this document and is stored securely. Not shared with third parties.</p>
                </div>

                <button
                  disabled={!isFormValid || generating}
                  onClick={generateDocument}
                  className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-base hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {generating ? (
                    <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Sparkles className="w-5 h-5" /></motion.div>Generating Document...</>
                  ) : (
                    <><Sparkles className="w-5 h-5" />Generate {selectedDoc.title}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Generated document */
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-bold text-gray-900">Document Generated</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyDocument}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    copied ? 'bg-green-100 text-green-700' : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {copied ? <><Check className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy</>}
                </button>
                <button
                  onClick={printDocument}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <Printer className="w-4 h-4" />Print / Save PDF
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Official header */}
              <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">TriniBuild Platform — Official Document</p>
                  <p className="text-gray-400 text-xs">R&R Digital Solutions Ltd · trinibuild.com</p>
                </div>
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
              <div className="p-8 font-mono text-sm text-gray-800 leading-relaxed whitespace-pre-wrap bg-white">
                {generatedContent}
              </div>
              <div className="border-t border-gray-200 px-8 py-4 bg-gray-50">
                <p className="text-xs text-gray-500">
                  Generated: {new Date().toLocaleString('en-TT')} · Order: {orderId} · 
                  This document represents accurate information provided by the merchant. 
                  For legal purposes, obtain a notarized copy from a T&T notary public.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setGeneratedContent(''); setFields({}); }}
                className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Generate Another
              </button>
              <button
                onClick={() => setSelectedDoc(null)}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
              >
                Back to Documents
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
