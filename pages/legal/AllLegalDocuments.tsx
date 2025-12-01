import React, { useEffect, useState } from 'react';
import { FileText, Download, Printer, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { legalService, LegalDocument } from '../../services/legalService';
import { LegalDocumentViewer } from '../../components/LegalDocumentViewer';

export const AllLegalDocuments: React.FC = () => {
    const [documents, setDocuments] = useState<LegalDocument[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAllDocuments();
    }, []);

    const loadAllDocuments = async () => {
        try {
            const docs = await legalService.getAllDocuments();
            setDocuments(docs);
        } catch (error) {
            console.error('Error loading documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-trini-red"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to="/" className="text-gray-600 hover:text-gray-900">
                                <ArrowLeft className="h-6 w-6" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Legal Documents</h1>
                                <p className="text-sm text-gray-600">TriniBuild Terms, Policies & Agreements</p>
                            </div>
                        </div>

                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Printer className="h-4 w-4" />
                            Print All
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <FileText className="h-8 w-8 text-trini-red mb-3" />
                        <h3 className="font-bold text-gray-900 mb-1">{documents.length} Documents</h3>
                        <p className="text-sm text-gray-600">Comprehensive legal framework</p>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="text-2xl font-bold text-trini-red mb-1">v2.0.0</div>
                        <p className="text-sm text-gray-600">Current version</p>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="text-lg font-bold text-gray-900 mb-1">Jan 1, 2025</div>
                        <p className="text-sm text-gray-600">Effective date</p>
                    </div>
                </div>

                {/* Documents List */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">All Legal Agreements</h2>

                    {documents.map(doc => (
                        <LegalDocumentViewer
                            key={doc.id}
                            document={doc}
                            showAcceptButton={false}
                        />
                    ))}
                </div>

                {/* Footer Info */}
                <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-bold text-blue-900 mb-2">Questions about these documents?</h3>
                    <p className="text-sm text-blue-800 mb-4">
                        If you have any questions about our legal agreements, please contact us at{' '}
                        <a href="mailto:legal@trinibuild.com" className="underline font-medium">legal@trinibuild.com</a>
                    </p>
                    <p className="text-xs text-blue-700">
                        These documents are governed by the laws of Trinidad & Tobago and are subject to periodic updates.
                        Continued use of the platform constitutes acceptance of the then-current version.
                    </p>
                </div>
            </main>
        </div>
    );
};
