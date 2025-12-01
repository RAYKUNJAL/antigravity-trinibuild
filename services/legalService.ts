import { supabase } from './supabaseClient';

// All legal document types supported by TriniBuild
export type DocumentType =
    | 'terms_of_service'
    | 'privacy_policy'
    | 'contractor_agreement'
    | 'affiliate_agreement'
    | 'vendor_agreement'
    | 'rideshare_driver_agreement'
    | 'real_estate_agreement'
    | 'ticketing_agreement'
    | 'job_board_agreement'
    | 'data_marketing_consent'
    | 'financial_docs_consent'
    | 'liability_shield'
    | 'termination_policy'
    | 'dispute_resolution';

export interface LegalDocument {
    id: string;
    type: DocumentType;
    version: string;
    title: string;
    content: string[];
    effectiveDate: string;
}

export interface SignedDocument {
    documentId: string;
    userId: string;
    signedAt: string;
    signature: string;
    ipAddress: string;
    serviceType?: string;
}

// Complete legal document library
const LEGAL_DOCUMENTS: Record<DocumentType, Omit<LegalDocument, 'id'>> = {
    terms_of_service: {
        type: 'terms_of_service',
        version: '2.0.0',
        title: 'TriniBuild Terms of Service',
        effectiveDate: '2025-01-01',
        content: [
            'Welcome to TriniBuild. By creating an account or using any part of the platform (marketplace, job board, rideshare, real estate, ticketing, storefronts, webpages, or affiliate tools), you agree to these Terms of Service.',
            'TriniBuild is a digital platform that allows users to create webpages, conduct business, post listings, sell tickets, offer services, and earn as independent contractors.',
            'By using the platform, you acknowledge: (1) You are at least 18 years old; (2) You accept all policies listed within this document; (3) You understand TriniBuild provides tools and connections but is not responsible for the actions of independent users.'
        ]
    },

    privacy_policy: {
        type: 'privacy_policy',
        version: '2.0.0',
        title: 'TriniBuild Privacy Policy',
        effectiveDate: '2025-01-01',
        content: [
            'TriniBuild collects, stores, and processes data to operate the platform, improve services, and enable your business activity.',
            'Data We Collect: Personal details, contact information, business information, listing data, messages, browsing activity, sales history, rideshare trips, ticket purchases, job interactions, and AI-generated content.',
            'Data Ownership: TriniBuild owns all data stored or created on the platform. You grant us full rights to store, use, analyze, and process this data.',
            'Marketing Usage: By using TriniBuild, you consent to receiving marketing emails, SMS notifications, push notifications, and platform promotions.',
            'Third-Party Sharing: We may share data with payment processors, verification services, analytics partners, or legal authorities when required.',
            'Cookies: TriniBuild uses cookies and tracking technologies to improve user experience and platform performance.',
            'AI Processing: Your data may be used to train and improve internal algorithms, recommendation systems, or fraud detection.',
            'Your Rights: You may request copies of your data or request account deletion. Deleting your account does not remove platform-owned operational or historical data.',
            'Security: We use industry-standard security systems but cannot guarantee absolute data protection.'
        ]
    },

    contractor_agreement: {
        type: 'contractor_agreement',
        version: '2.0.0',
        title: 'Independent Contractor Agreement',
        effectiveDate: '2025-01-01',
        content: [
            'By using TriniBuild to offer services, ride services, deliveries, listings, or digital goods, you acknowledge you are an Independent Contractor, not an employee.',
            'You handle your own taxes, NIS contributions, business registration, licensing, and compliance.',
            'You waive all employment claims, including paid leave, NIS employer contributions, insurance, health benefits, severance, and vacation pay.',
            'TriniBuild does not guarantee work, earnings, bookings, clients, or transactions.',
            'You operate entirely at your own risk and accept full responsibility for interactions with customers or third parties.'
        ]
    },

    affiliate_agreement: {
        type: 'affiliate_agreement',
        version: '2.0.0',
        title: 'TriniBuild Affiliate Program Agreement',
        effectiveDate: '2025-01-01',
        content: [
            'All users are automatically enrolled as affiliate earners.',
            'You may earn commissions for referring new users or customers to TriniBuild.',
            'Affiliate commissions are not wages—they are independent contractor earnings.',
            'TriniBuild may modify payout rates or program rules at any time.',
            'Commissions may be withheld if fraud, misuse, or policy violations occur.'
        ]
    },

    vendor_agreement: {
        type: 'vendor_agreement',
        version: '2.0.0',
        title: 'Marketplace Vendor Agreement',
        effectiveDate: '2025-01-01',
        content: [
            'Vendors may sell products, services, food, digital goods, or listings on the platform.',
            'You are responsible for product accuracy, delivery, safety, legality, refunds, and customer communication.',
            'TriniBuild is not responsible for disputes between vendors and customers.',
            'Prohibited items include weapons, contraband, counterfeit goods, illegal substances, and unauthorized financial services.'
        ]
    },

    rideshare_driver_agreement: {
        type: 'rideshare_driver_agreement',
        version: '2.0.0',
        title: 'Rideshare & Delivery Driver Agreement',
        effectiveDate: '2025-01-01',
        content: [
            'Drivers operate as independent contractors.',
            'You must maintain a valid driver\'s license, insurance, inspection, and safe working vehicle.',
            'TriniBuild is not responsible for accidents, injuries, damages, theft, or incidents involving drivers or passengers.',
            'Drivers accept full responsibility for compliance with transportation laws.'
        ]
    },

    real_estate_agreement: {
        type: 'real_estate_agreement',
        version: '2.0.0',
        title: 'Real Estate Listing Agreement',
        effectiveDate: '2025-01-01',
        content: [
            'Users may post properties for rent, sale, or lease.',
            'You confirm that you are the legal owner, authorized agent, or have permission to list the property.',
            'TriniBuild is not responsible for fraudulent listings, landlord disputes, tenant issues, deposits, or contracts.'
        ]
    },

    ticketing_agreement: {
        type: 'ticketing_agreement',
        version: '2.0.0',
        title: 'Event Ticketing Agreement',
        effectiveDate: '2025-01-01',
        content: [
            'Event creators are responsible for event safety, legality, refunds, and attendee communication.',
            'TriniBuild only provides the digital infrastructure to sell tickets.',
            'No refunds will be issued by TriniBuild unless required by law.',
            'Event owners must comply with local regulations and venue requirements.'
        ]
    },

    job_board_agreement: {
        type: 'job_board_agreement',
        version: '2.0.0',
        title: 'Job Posting &Employment Listing Agreement',
        effectiveDate: '2025-01-01',
        content: [
            'Job posters must provide accurate descriptions and comply with all labor laws.',
            'TriniBuild is not an employer and does not verify job legitimacy.',
            'Users must exercise caution when applying, interviewing, or submitting documents.'
        ]
    },

    data_marketing_consent: {
        type: 'data_marketing_consent',
        version: '2.0.0',
        title: 'Data Ownership & Marketing Consent',
        effectiveDate: '2025-01-01',
        content: [
            'By using TriniBuild, you grant the platform full rights to store, process, analyze, and utilize all user-generated data.',
            'TriniBuild may use your data for advertising, internal analytics, AI training, remarketing, SMS, and email campaigns.',
            'You consent to receiving promotional messages unless explicitly opted out.',
            'Operational messages cannot be opted out of.'
        ]
    },

    financial_docs_consent: {
        type: 'financial_docs_consent',
        version: '2.0.0',
        title: 'Financial Document Generation Consent',
        effectiveDate: '2025-01-01',
        content: [
            'TriniBuild may generate job letters, proof-of-income documents, tax summaries, earnings reports, and contractor verification letters.',
            'These documents are based solely on your platform activity.',
            'You authorize TriniBuild to produce these documents for your personal use or to send to banks, embassies, or third parties upon request.'
        ]
    },

    liability_shield: {
        type: 'liability_shield',
        version: '2.0.0',
        title: 'Limitation of Liability',
        effectiveDate: '2025-01-01',
        content: [
            'TriniBuild is not responsible for loss of income, damages, accidents, fraud, injuries, disputes, or failed transactions.',
            'Users accept full responsibility for their actions inside and outside the platform.',
            'Use of the platform is at your own risk.'
        ]
    },

    termination_policy: {
        type: 'termination_policy',
        version: '2.0.0',
        title: 'Account Suspension & Termination Policy',
        effectiveDate: '2025-01-01',
        content: [
            'TriniBuild may suspend or terminate accounts for fraud, abuse, illegal activity, harassment, non-payment, chargebacks, or policy violations.',
            'Users may delete their account at any time, but operational data remains archived for security and compliance.'
        ]
    },

    dispute_resolution: {
        type: 'dispute_resolution',
        version: '2.0.0',
        title: 'Dispute Resolution',
        effectiveDate: '2025-01-01',
        content: [
            'All disputes must first be submitted to TriniBuild Support.',
            'If unresolved, matters will be handled under the laws of Trinidad & Tobago.',
            'Users agree to arbitration before legal action.'
        ]
    }
};

// Required documents by service type
export const SERVICE_REQUIREMENTS: Record<string, DocumentType[]> = {
    base: ['terms_of_service', 'privacy_policy', 'contractor_agreement', 'affiliate_agreement'],
    marketplace: ['vendor_agreement', 'data_marketing_consent'],
    rideshare: ['rideshare_driver_agreement', 'liability_shield'],
    'real-estate': ['real_estate_agreement'],
    ticketing: ['ticketing_agreement', 'liability_shield'],
    jobs: ['job_board_agreement'],
    financial: ['financial_docs_consent']
};

export const legalService = {

    // Get a specific document
    getDocument: async (type: DocumentType): Promise<LegalDocument> => {
        const doc = LEGAL_DOCUMENTS[type];
        if (!doc) {
            throw new Error(`Document type ${type} not found`);
        }

        return {
            id: `${type}_v${doc.version}`,
            ...doc
        };
    },

    // Get all documents
    getAllDocuments: async (): Promise<LegalDocument[]> => {
        return Object.keys(LEGAL_DOCUMENTS).map(type => ({
            id: `${type}_v${LEGAL_DOCUMENTS[type as DocumentType].version}`,
            ...LEGAL_DOCUMENTS[type as DocumentType]
        }));
    },

    // Get required documents for a service
    getRequiredDocuments: async (serviceType: string): Promise<LegalDocument[]> => {
        const baseTypes = SERVICE_REQUIREMENTS.base;
        const serviceTypes = SERVICE_REQUIREMENTS[serviceType] || [];
        const allTypes = [...baseTypes, ...serviceTypes];

        return Promise.all(allTypes.map(type => legalService.getDocument(type)));
    },

    // Sign a document
    signDocument: async (
        userId: string,
        documentType: DocumentType,
        signatureData: string,
        serviceType?: string
    ): Promise<SignedDocument> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const doc = LEGAL_DOCUMENTS[documentType];
        if (!doc) throw new Error(`Invalid document type: ${documentType}`);

        const { data, error } = await supabase
            .from('signed_agreements')
            .insert({
                user_id: user.id,
                document_type: documentType,
                document_version: doc.version,
                signature_data: signatureData,
                service_type: serviceType,
                ip_address: '127.0.0.1' // Should be captured from request in production
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
            ipAddress: data.ip_address,
            serviceType: data.service_type
        };
    },

    // Check if user has signed a specific document
    hasSigned: async (userId: string, documentType: DocumentType): Promise<boolean> => {
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
    },

    // Check if user has completed all required signatures for a service
    hasCompletedService: async (userId: string, serviceType: string): Promise<boolean> => {
        const required = await legalService.getRequiredDocuments(serviceType);
        const checks = await Promise.all(
            required.map(doc => legalService.hasSigned(userId, doc.type))
        );

        return checks.every(result => result === true);
    },

    // Get all signed documents for a user
    getUserSignatures: async (userId: string): Promise<SignedDocument[]> => {
        const { data, error } = await supabase
            .from('signed_agreements')
            .select('*')
            .eq('user_id', userId)
            .order('signed_at', { ascending: false });

        if (error) {
            console.error('Error fetching signatures:', error);
            return [];
        }

        return data.map(record => ({
            documentId: `${record.document_type}_v${record.document_version}`,
            userId: record.user_id,
            signedAt: record.signed_at,
            signature: record.signature_data,
            ipAddress: record.ip_address || 'unknown',
            serviceType: record.service_type
        }));
    }
};
