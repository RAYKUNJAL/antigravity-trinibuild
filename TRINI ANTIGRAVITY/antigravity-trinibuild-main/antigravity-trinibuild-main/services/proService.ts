import { get } from './apiClient';

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
        // Mock data for now
        return [
            {
                id: '1',
                name: 'Michael Scott',
                businessName: 'Scott\'s Plumbing & Heating',
                category: 'Plumbing',
                rating: 4.8,
                reviewCount: 124,
                location: 'Port of Spain',
                description: 'Licensed master plumber with 15 years of experience. Emergency services available 24/7.',
                services: ['Leak Repair', 'Pipe Installation', 'Drain Cleaning', 'Water Heater Repair'],
                hourlyRate: '$300 - $500',
                image: 'https://images.unsplash.com/photo-1581578731117-104f2a8d23e9?q=80&w=200&auto=format&fit=crop',
                isVerified: true,
                isPromoted: true,
                badges: ['Top Rated', 'Licensed', 'Insured'],
                portfolio: [
                    'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=400',
                    'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?q=80&w=400'
                ]
            },
            {
                id: '2',
                name: 'Sarah Jenkins',
                businessName: 'Sparkle Cleaners',
                category: 'Cleaning',
                rating: 4.9,
                reviewCount: 89,
                location: 'Chaguanas',
                description: 'Professional residential and commercial cleaning. We use eco-friendly products.',
                services: ['Deep Cleaning', 'Move-in/Move-out', 'Office Cleaning'],
                hourlyRate: '$150 - $250',
                image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop',
                isVerified: true,
                badges: ['Eco-Friendly', 'Background Checked'],
                portfolio: [
                    'https://images.unsplash.com/photo-1581578731117-104f2a8d23e9?q=80&w=400'
                ]
            },
            {
                id: '3',
                name: 'David Lee',
                businessName: 'Lee\'s Electrical Solutions',
                category: 'Electrical',
                rating: 4.7,
                reviewCount: 56,
                location: 'San Fernando',
                description: 'Certified electrician for all your wiring needs. Safety is our priority.',
                services: ['Wiring', 'Panel Upgrades', 'Lighting Installation'],
                hourlyRate: '$250 - $400',
                image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=200&auto=format&fit=crop',
                isVerified: true,
                badges: ['Certified'],
                portfolio: []
            },
            {
                id: '4',
                name: 'Maria Rodriguez',
                businessName: 'Elite Event Planning',
                category: 'Events',
                rating: 5.0,
                reviewCount: 42,
                location: 'Arima',
                description: 'Full-service event planning for weddings, corporate events, and parties.',
                services: ['Wedding Planning', 'Catering Coordination', 'Decor'],
                hourlyRate: 'Consultation',
                image: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=200&auto=format&fit=crop',
                isVerified: false,
                badges: ['Creative'],
                portfolio: []
            },
            {
                id: '5',
                name: 'James Carter',
                businessName: 'Carter Construction',
                category: 'General Contractor',
                rating: 4.6,
                reviewCount: 30,
                location: 'Tobago',
                description: 'Renovations, extensions, and new builds. Quality workmanship guaranteed.',
                services: ['Renovations', 'Roofing', 'Tiling'],
                hourlyRate: 'Project Based',
                image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=200&auto=format&fit=crop',
                isVerified: true,
                badges: ['Licensed'],
                portfolio: []
            },
            {
                id: '6',
                name: 'Tech Fix TT',
                businessName: 'Tech Fix TT',
                category: 'Tech Support',
                rating: 4.9,
                reviewCount: 210,
                location: 'Remote / Mobile',
                description: 'Computer repair, network setup, and IT support for small businesses.',
                services: ['PC Repair', 'Network Setup', 'Data Recovery'],
                hourlyRate: '$200',
                image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?q=80&w=200&auto=format&fit=crop',
                isVerified: true,
                isPromoted: true,
                badges: ['Tech Savvy', 'Fast Response'],
                portfolio: []
            }
        ];
    }
};
