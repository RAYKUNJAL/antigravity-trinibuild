import { get } from './apiClient';

export interface DocumentRequest {
    type: 'job_letter' | 'proof_of_income' | 'visa_letter' | 'invoice';
    recipientName?: string;
    recipientAddress?: string;
    amount?: number;
    date?: string;
    details?: string;
}

export const documentService = {
    generateDocument: async (request: DocumentRequest): Promise<string> => {
        // In a real app, this would call a backend to generate a PDF.
        // For now, we simulate the generation delay and return a success message.
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(`Document generated: ${request.type.replace(/_/g, ' ').toUpperCase()}`);
            }, 2000);
        });
    }
};
