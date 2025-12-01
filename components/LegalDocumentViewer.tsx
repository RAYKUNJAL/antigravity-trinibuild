import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, Info, CheckCircle } from 'lucide-react';
import { LegalDocument } from '../services/legalService';

interface LegalDocumentViewerProps {
    document: LegalDocument;
    onAccept?: () => void;
    showAcceptButton?: boolean;
    isAccepted?: boolean;
}

export const LegalDocumentViewer: React.FC<LegalDocumentViewerProps> = ({
    document,
    onAccept,
    showAcceptButton = false,
    isAccepted = false
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const element = e.currentTarget;
        const atBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
        if (atBottom && !hasScrolledToBottom) {
            setHasScrolledToBottom(true);
        }
    };

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            {/* Header */}
            <div
                className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-trini-red" />
                    <div>
                        <h3 className="font-bold text-gray-900">{document.title}</h3>
                        <p className="text-xs text-gray-500">
                            Version {document.version} • Effective {new Date(document.effectiveDate).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isAccepted && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                </div>
            </div>

            {/* Content */}
            {isExpanded && (
                <div>
                    <div
                        className="p-6 max-h-96 overflow-y-auto bg-white"
                        onScroll={handleScroll}
                    >
                        <div className="prose prose-sm max-w-none">
                            {document.content.map((paragraph, index) => (
                                <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                                    {paragraph}
                                </p>
                            ))}
                        </div>
                    </div>

                    {/* Accept Button */}
                    {showAcceptButton && !isAccepted && (
                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                            {!hasScrolledToBottom && (
                                <div className="flex items-start gap-2 mb-3 text-xs text-amber-700 bg-amber-50 p-3 rounded">
                                    <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                    <span>Please scroll to the bottom to review the entire document before accepting.</span>
                                </div>
                            )}
                            <button
                                onClick={onAccept}
                                disabled={!hasScrolledToBottom}
                                className={`w-full py-3 px-4 rounded-lg font-bold transition-all ${hasScrolledToBottom
                                        ? 'bg-trini-red text-white hover:bg-red-700'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {hasScrolledToBottom ? 'I Accept This Agreement' : 'Scroll to Bottom to Accept'}
                            </button>
                        </div>
                    )}

                    {isAccepted && (
                        <div className="border-t border-green-200 p-4 bg-green-50">
                            <div className="flex items-center justify-center gap-2 text-green-700">
                                <CheckCircle className="h-5 w-5" />
                                <span className="font-bold">Accepted</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
