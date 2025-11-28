export interface LegalDocument {
    id: string;
    type: 'contractor_agreement' | 'liability_waiver' | 'affiliate_terms' | 'privacy_policy' | 'terms_of_service';
    version: string;
    content: string;
}

export interface SignedDocument {
    documentId: string;
    userId: string;
    signedAt: string;
    signature: string; // Base64 or text representation
    ipAddress: string;
}

export const legalService = {
    // Simulate fetching a document template
    getDocument: async (type: LegalDocument['type']): Promise<LegalDocument> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    id: `${type}_v1.0`,
                    type,
                    version: '1.0.0',
                    content: 'This is a placeholder for the full legal text...' // In a real app, fetch from backend
                });
            }, 500);
        });
    },

    // Simulate signing a document via DocuSign
    signDocument: async (userId: string, documentType: LegalDocument['type'], signatureData: string): Promise<SignedDocument> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const signedDoc: SignedDocument = {
                    documentId: `${documentType}_v1.0`,
                    userId,
                    signedAt: new Date().toISOString(),
                    signature: signatureData,
                    ipAddress: '192.168.1.1' // Mock IP
                };

                // Persist to local storage for demo purposes
                const existingSignatures = JSON.parse(localStorage.getItem('trinibuild_signatures') || '[]');
                existingSignatures.push(signedDoc);
                localStorage.setItem('trinibuild_signatures', JSON.stringify(existingSignatures));

                resolve(signedDoc);
            }, 1500);
        });
    },

    // Check if a user has signed a specific document
    hasSigned: (userId: string, documentType: LegalDocument['type']): boolean => {
        const signatures = JSON.parse(localStorage.getItem('trinibuild_signatures') || '[]');
        return signatures.some((s: SignedDocument) => s.userId === userId && s.documentId.startsWith(documentType));
    }
};
