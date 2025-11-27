import { supabase } from './supabaseClient';

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

    // Get a document template (Still mocked for content as we don't have a CMS yet, but could be DB driven later)
    getDocument: async (type: LegalDocument['type']): Promise<LegalDocument> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    id: `${type}_v1.0`,
                    type,
                    version: '1.0.0',
                    content: 'This is a placeholder for the full legal text. In a production environment, this would be fetched from a CMS or database.'
                });
            }, 500);
        });
    },

    // Sign a document and save to Supabase
    signDocument: async (userId: string, documentType: LegalDocument['type'], signatureData: string): Promise<SignedDocument> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('signed_agreements')
            .insert({
                user_id: user.id,
                document_type: documentType,
                document_version: '1.0.0', // Should match getDocument version
                signature_data: signatureData,
                ip_address: '127.0.0.1' // In a real app, get this from edge function or headers
            })
            .select()
            .single();

        if (error) {
            console.error('Error signing document:', error);
            throw error;
        }

        return {
            documentId: `${data.document_type}_v${data.document_version}`,
            userId: data.user_id,
            signedAt: data.signed_at,
            signature: data.signature_data,
            ipAddress: data.ip_address
        };
    },

    // Check if a user has signed a specific document in Supabase
    hasSigned: async (userId: string, documentType: LegalDocument['type']): Promise<boolean> => {
        const { data, error } = await supabase
            .from('signed_agreements')
            .select('id')
            .eq('user_id', userId)
            .eq('document_type', documentType)
            .limit(1);

        if (error) {
            console.error('Error checking signature:', error);
            return false;
        }

        return data && data.length > 0;
    }
};

