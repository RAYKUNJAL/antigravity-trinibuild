export interface ServicePro {
    id: string;
    name: string;
    businessName: string;
    category: string;
    rating: number;
    reviewCount: number;
    location: string;
    description: string;
    services: string[];
    hourlyRate: string;
    image: string;
    isVerified: boolean;
    isPromoted?: boolean;
    badges: string[];
    portfolio: string[];
}

export const proService = {
    getPros: async (): Promise<ServicePro[]> => {
        return [];
    }
};
