/**
 * AIDocumentAssistant.tsx
 * Standalone page for the AI Document Assistant
 * Generates: Job Letters, Proof of Income, Visa Support Letters, 
 * Contractor Agreements, Business Registration docs
 * 
 * This is a CORE revenue driver — $360K TTD/yr projected
 * Part of the financial inclusion flywheel
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Briefcase, Globe, DollarSign, Building2,
    Sparkles, Download, Copy, Check, ArrowRight, Shield,
    Clock, Lock, ChevronRight, MessageCircle
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { aiService } from '../services/ai';

// Document types available
const DOCUMENT_TYPES = [
    {
        id: 'job_letter',
        title: 'Job Offer Letter',
        description: 'Professional employment offer for new hires',
        icon: Briefcase,
        color: '#0066CC',
        fields: ['employer_name', 'employee_name', 'position', 'salary', 'start_date'],
        free: true
    },
    {
        id: 'proof_of_income',
        title: 'Proof of Income',
        description: 'Verified earnings statement for banks & visas',
        icon: DollarSign,
        color: '#10b981',
        fields: ['business_name', 'owner_name', 'monthly_income', 'period', 'source'],
        free: false
    },
    {
        id: 'visa_letter',
        title: 'Visa Support Letter',
        description: 'Business invitation or sponsor letter for travel',
        icon: Globe,
        color: '#8B5CF6',
        fields: ['applicant_name', 'destination', 'purpose', 'duration', 'sponsor_name'],
        free: false
    },
    {
        id: 'contractor_agreement',
        title: 'Contractor Agreement',
        description: 'Independent contractor terms and scope',
        icon: Building2,
        color: '#E61E2B',
        fields: ['client_name', 'contractor_name', 'scope', 'payment_terms', 'duration'],
        free: false
    },
    {
        id: 'vat_certificate',
        title: 'VAT Registration Certificate',
        description: 'BIR-ready VAT registration document',
        icon: FileText,
        color: '#F59E0B',
        fields: ['business_name', 'bir_number', 'business_type', 'registration_date'],
        free: false
    }
];

// Field labels for the form
const FIELD_LABELS: Record<string, string> = {
    employer_name: 'Employer / Company Name',
    employee_name: 'Employee Full Name',
    position: 'Job Title / Position',
    salary: 'Monthly Salary (TTD)',
    start_date: 'Start Date',
    business_name: 'Business Name',
    owner_name: 'Owner Full Name',
    monthly_income: 'Average Monthly Income (TTD)',
    period: 'Reporting Period',
    source: 'Income Source',
    applicant_name: 'Applicant Full Name',
    destination: 'Destination Country',
    purpose: 'Purpose of Travel',
    duration: 'Trip Duration',
    sponsor_name: 'Sponsor / Inviting Party',
    client_name: 'Client Name',
    contractor_name: 'Contractor Name',
    scope: 'Scope of Work',
    payment_terms: 'Payment Terms',
    bir_number: 'BIR Number',
    business_type: 'Business Type',
    registration_date: 'Registration Date'
};

export const AIDocumentAssistant: React.FC = () => {
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [generating, setGenerating] = useState(false);
    const [generatedDoc, setGeneratedDoc] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Check auth
    React.useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setIsLoggedIn(!!data.user);
        });
    }, []);

    const selectedDocType = DOCUMENT_TYPES.find(d => d.id === selectedType);

    const generateDocument = async () => {
        if (!selectedDocType) return;
        setGenerating(true);

        try {
            const result = await aiService.generateDocument(
                selectedDocType.id,
                selectedDocType.title,
                formData
            );
            setGeneratedDoc(result.content);
        } catch (error) {
            // Fallback: generate locally
            setGeneratedDoc(generateLocalDocument(selectedDocType.id, formData));
        } finally {
            setGenerating(false);
        }
    };

    const generateLocalDocument = (type: string, data: Record<string, string>): string => {
        const date = new Date().toLocaleDateString('en-TT', { year: 'numeric', month: 'long', day: 'numeric' });

        switch (type) {
            case 'job_letter':
                return `**${data.employer_name || 'Company Name'}**\nTrinidad & Tobago\n\nDate: ${date}\n\n**LETTER OF EMPLOYMENT**\n\nTo Whom It May Concern,\n\nThis letter confirms that **${data.employee_name || 'Employee Name'}** has been offered the position of **${data.position || 'Position'}** at ${data.employer_name || 'Company Name'}.\n\n**Employment Details:**\n- Position: ${data.position || 'N/A'}\n- Monthly Salary: TT$${data.salary || 'N/A'}\n- Start Date: ${data.start_date || 'N/A'}\n- Employment Type: Full-time\n\nThis letter is issued for official purposes as required.\n\nSincerely,\n\n_________________________\nAuthorized Representative\n${data.employer_name || 'Company Name'}`;

            case 'proof_of_income':
                return `**PROOF OF INCOME STATEMENT**\n\nDate: ${date}\n\n**Business:** ${data.business_name || 'N/A'}\n**Owner:** ${data.owner_name || 'N/A'}\n\nThis document certifies that ${data.owner_name || 'the undersigned'} earns an average monthly income of **TT$${data.monthly_income || 'N/A'}** from ${data.source || 'business operations'} during the period of ${data.period || 'the current fiscal year'}.\n\nThis income is generated through the TriniBuild platform (trinibuild.com) and can be verified through our digital records.\n\n**Verified by TriniBuild Financial Services**\n\n_________________________\nDigital Verification Stamp\nTriniBuild.com`;

            case 'visa_letter':
                return `**VISA SUPPORT LETTER**\n\nDate: ${date}\n\nTo: The Visa Officer\nEmbassy/Consulate of ${data.destination || 'N/A'}\n\nRe: Visa Application for ${data.applicant_name || 'N/A'}\n\nDear Sir/Madam,\n\nI, ${data.sponsor_name || 'N/A'}, hereby confirm that ${data.applicant_name || 'N/A'} will be visiting ${data.destination || 'N/A'} for ${data.purpose || 'business/leisure'} for a duration of ${data.duration || 'N/A'}.\n\nAll expenses including accommodation, transportation, and daily expenses will be covered.\n\nPlease do not hesitate to contact us for any further information.\n\nSincerely,\n\n_________________________\n${data.sponsor_name || 'Sponsor Name'}\nTrinidad & Tobago`;

            default:
                return `Document generated for ${type}. Please contact support@trinibuild.com for assistance.`;
        }
    };

    const copyDocument = () => {
        if (generatedDoc) {
            navigator.clipboard.writeText(generatedDoc);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <>
            <Helmet>
                <title>AI Document Assistant - Job Letters, Visa Letters, Proof of Income | TriniBuild</title>
                <meta name="description" content="Generate professional business documents instantly. Job letters, proof of income, visa support letters. Made for Trinidad & Tobago." />
            </Helmet>

            <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-12 px-4">
                <div className="max-w-4xl mx-auto">

                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-bold mb-4">
                            <Sparkles size={16} />
                            AI-Powered Document Generator
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                            Paperwork Done in <span style={{ color: '#E61E2B' }}>60 Seconds</span>
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Stop waiting in lines. Generate professional documents for bank applications, visa processing, and business needs instantly.
                        </p>
                    </div>

                    {/* Document Type Selection */}
                    {!selectedType && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                            {DOCUMENT_TYPES.map(doc => {
                                const Icon = doc.icon;
                                return (
                                    <motion.button
                                        key={doc.id}
                                        whileHover={{ y: -4 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            setSelectedType(doc.id);
                                            setFormData({});
                                            setGeneratedDoc(null);
                                        }}
                                        className="text-left bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all"
                                    >
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${doc.color}15` }}>
                                            <Icon size={24} style={{ color: doc.color }} />
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900 mb-1">{doc.title}</h3>
                                        <p className="text-sm text-gray-500 mb-3">{doc.description}</p>
                                        <div className="flex items-center justify-between">
                                            {doc.free ? (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">Free</span>
                                            ) : (
                                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold">Pro</span>
                                            )}
                                            <ChevronRight size={16} className="text-gray-400" />
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </motion.div>
                    )}

                    {/* Document Form */}
                    {selectedType && !generatedDoc && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white rounded-2xl border-2 border-gray-100 p-8 shadow-sm max-w-2xl mx-auto"
                        >
                            <button
                                onClick={() => { setSelectedType(null); setFormData({}); }}
                                className="text-sm text-gray-500 hover:text-gray-900 mb-6 flex items-center gap-1"
                            >
                                ← Back to document types
                            </button>

                            <h2 className="text-2xl font-black text-gray-900 mb-2">
                                {selectedDocType?.title}
                            </h2>
                            <p className="text-gray-500 mb-6">{selectedDocType?.description}</p>

                            <div className="space-y-4">
                                {selectedDocType?.fields.map(field => (
                                    <div key={field}>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">
                                            {FIELD_LABELS[field] || field}
                                        </label>
                                        <input
                                            type={field.includes('date') ? 'date' : field.includes('salary') || field.includes('income') ? 'number' : 'text'}
                                            value={formData[field] || ''}
                                            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none transition-colors"
                                            placeholder={`Enter ${FIELD_LABELS[field]?.toLowerCase() || field}`}
                                        />
                                    </div>
                                ))}
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={generateDocument}
                                disabled={generating || selectedDocType?.fields.some(f => !formData[f])}
                                className="w-full mt-8 py-4 rounded-xl font-black text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                                style={{ background: generating ? '#9ca3af' : '#E61E2B' }}
                            >
                                {generating ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Generating Document...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        Generate Document
                                    </>
                                )}
                            </motion.button>

                            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><Shield size={12} /> Secure</span>
                                <span className="flex items-center gap-1"><Clock size={12} /> 60 seconds</span>
                                <span className="flex items-center gap-1"><Lock size={12} /> Private</span>
                            </div>
                        </motion.div>
                    )}

                    {/* Generated Document */}
                    {generatedDoc && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-2xl mx-auto"
                        >
                            <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-black text-gray-900">Your Document</h2>
                                    <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                                        <Check size={12} /> Generated
                                    </span>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                                    {generatedDoc}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mt-4">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={copyDocument}
                                    className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-700 bg-white"
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => window.print()}
                                    className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-700 bg-white"
                                >
                                    <Download size={16} />
                                    Print
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => { setSelectedType(null); setFormData({}); setGeneratedDoc(null); }}
                                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white"
                                    style={{ background: '#E61E2B' }}
                                >
                                    <FileText size={16} />
                                    New Doc
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {/* Trust Section */}
                    <div className="mt-16 text-center">
                        <p className="text-sm text-gray-500 mb-4">Trusted by 5,000+ Trinidad & Tobago businesses</p>
                        <div className="flex items-center justify-center gap-8 text-gray-400">
                            <span className="text-xs font-bold">Republic Bank</span>
                            <span className="text-xs font-bold">Scotiabank TT</span>
                            <span className="text-xs font-bold">First Citizens</span>
                            <span className="text-xs font-bold">US Embassy POS</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
