import React, { useState, useEffect } from 'react';
import { FileSignature, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { legalService, DocumentType, LegalDocument } from '../services/legalService';
import { LegalDocumentViewer } from './LegalDocumentViewer';

interface SignatureFlowProps {
    serviceType: string; // 'marketplace', 'rideshare', 'real-estate', etc.
    userId: string;
    onComplete: () => void;
    onCancel?: () => void;
}

export const SignatureFlow: React.FC<SignatureFlowProps> = ({
    serviceType,
    userId,
    onComplete,
    onCancel
}) => {
    const [documents, setDocuments] = useState<LegalDocument[]>([]);
    const [acceptedDocs, setAcceptedDocs] = useState<Set<DocumentType>>(new Set());
    const [signatureName, setSignatureName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRequiredDocuments();
    }, [serviceType]);

    const loadRequiredDocuments = async () => {
        try {
            setLoading(true);
            const docs = await legalService.getRequiredDocuments(serviceType);
            setDocuments(docs);

            // Check which documents are already signed
            const signedStatuses = await Promise.all(
                docs.map(doc => legalService.hasSigned(userId, doc.type))
            );

            const alreadySigned = new Set<DocumentType>();
            docs.forEach((doc, index) => {
                if (signedStatuses[index]) {
                    alreadySigned.add(doc.type);
                }
            });

            setAcceptedDocs(alreadySigned);
        } catch (err) {
            console.error('Error loading documents:', err);
            setError('Failed to load legal documents. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptDocument = (docType: DocumentType) => {
        setAcceptedDocs(prev => new Set([...prev, docType]));
    };

    const handleSubmit = async () => {
        if (acceptedDocs.size < documents.length) {
            setError('Please accept all required documents before continuing.');
            return;
        }

        if (!signatureName.trim()) {
            setError('Please enter your full name as your signature.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Sign all documents
            const signaturePromises = documents.map(doc =>
                legalService.signDocument(userId, doc.type, signatureName, serviceType)
            );

            await Promise.all(signaturePromises);
            onComplete();
        } catch (err) {
            console.error('Error submitting signatures:', err);
            setError('Failed to submit signatures. Please try again.');
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-trini-red" />
            </div>
        );
    }

    const allAccepted = acceptedDocs.size === documents.length;
    const pendingDocs = documents.filter(doc => !acceptedDocs.has(doc.type));

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Header */}
            <div className="text-center mb-8">
                <FileSignature className="h-12 w-12 text-trini-red mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Legal Agreements Required</h2>
                <p className="text-gray-600">
                    Please review and accept the following documents to use {serviceType} services on TriniBuild.
                </p>
            </div>

            {/* Progress */}
            <div className="mb-8">
                <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium text-gray-700">Progress</span>
                    <span className="text-gray-500">{acceptedDocs.size} of {documents.length} accepted</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-trini-red h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(acceptedDocs.size / documents.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {/* Documents to Review */}
            <div className="space-y-4 mb-8">
                {documents.map(doc => (
                    <LegalDocumentViewer
                        key={doc.id}
                        document={doc}
                        onAccept={() => handleAcceptDocument(doc.type)}
                        showAcceptButton={!acceptedDocs.has(doc.type)}
                        isAccepted={acceptedDocs.has(doc.type)}
                    />
                ))}
            </div>

            {/* Signature Section */}
            {allAccepted && (
                <div className="border-t border-gray-200 pt-8">
                    <h3 className="font-bold text-gray-900 mb-4">Sign All Documents</h3>
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type your full legal name as your electronic signature:
                        </label>
                        <input
                            type="text"
                            value={signatureName}
                            onChange={(e) => setSignatureName(e.target.value)}
                            placeholder="Full Legal Name"
                            className="w-full p-3 border border-gray-300 rounded-lg mb-4 font-serif text-lg"
                            disabled={isSubmitting}
                        />

                        <p className="text-xs text-gray-600 mb-6">
                            By typing your name above and clicking "Sign All Documents", you electronically sign and agree to all displayed agreements.
                            Your signature, IP address, and timestamp will be recorded for legal compliance.
                        </p>

                        <div className="flex gap-3">
                            {onCancel && (
                                <button
                                    onClick={onCancel}
                                    disabled={isSubmitting}
                                    className="px-6 py-3 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !signatureName.trim()}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-trini-red text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Signing Documents...
                                    </>
                                ) : (
                                    <>
                                        <FileSignature className="h-5 w-5" />
                                        Sign All Documents ({documents.length})
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pending Notice */}
            {!allAccepted && pendingDocs.length > 0 && (
                <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                        <span className="font-bold">{pendingDocs.length} document(s) pending.</span> Please review and accept all documents above to continue.
                    </p>
                </div>
            )}
        </div>
    );
};
