import { get } from './apiClient';

export interface RealEstateListing {
    id: number;
    title: string;
    price: number;
    type: 'rent' | 'buy';
    beds: number;
    baths: number;
    sqft: number;
    location: string;
    description: string;
    images: string[];
    amenities: string[];
    agent: {
        name: string;
        photo: string;
        phone: string;
        isPremium: boolean;
    };
    isFeatured?: boolean;
    postedDate: string;
    coordinates?: { lat: number; lng: number };
}

export const realEstateService = {
    getListings: async (): Promise<RealEstateListing[]> => {
        // Mock data for now, would be GET /real-estate/listings
        return [
            {
                id: 1,
                title: "Modern Apartment in Woodbrook",
                price: 4500,
                type: "rent",
                beds: 2,
                baths: 1,
                sqft: 850,
                location: "Woodbrook, Port of Spain",
                description: "Newly renovated 2-bedroom apartment in the heart of Woodbrook. Close to Ariapita Avenue nightlife and restaurants. Features a modern kitchen, secure parking, and air conditioning in all bedrooms.",
                images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800", "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800"],
                amenities: ["Air Conditioning", "Parking", "Water Tank", "Security Cameras"],
                agent: { name: "Sarah Realty", photo: "https://images.unsplash.com/photo-1589386417686-0d34b5903d23?q=80&w=200&auto=format&fit=crop", phone: "868-555-0101", isPremium: true },
                isFeatured: true,
                postedDate: "2 days ago",
                coordinates: { lat: 10.666, lng: -61.525 }
            },
            {
                id: 2,
                title: "Family Home in Lange Park",
                price: 2500000,
                type: "buy",
                beds: 4,
                baths: 3,
                sqft: 2200,
                location: "Lange Park, Chaguanas",
                description: "Spacious family home in a quiet, gated community. Large backyard perfect for entertaining. Master suite includes a walk-in closet and jacuzzi tub.",
                images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=800"],
                amenities: ["Gated Community", "Garden", "Pet Friendly", "Garage"],
                agent: { name: "Massy Properties", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop", phone: "868-555-0202", isPremium: false },
                postedDate: "1 week ago",
                coordinates: { lat: 10.516, lng: -61.412 }
            },
            {
                id: 3,
                title: "Cozy Studio Near UWI",
                price: 2500,
                type: "rent",
                beds: 1,
                baths: 1,
                sqft: 400,
                location: "St. Augustine",
                description: "Perfect for students. Fully furnished studio apartment walking distance to UWI. Utilities included (Water, Lights, WiFi).",
                images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800"],
                amenities: ["Furnished", "WiFi Included", "Shared Laundry"],
                agent: { name: "Student Living TT", photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop", phone: "868-555-0303", isPremium: true },
                isFeatured: true,
                postedDate: "5 hours ago",
                coordinates: { lat: 10.640, lng: -61.399 }
            },
            {
                id: 4,
                title: "Luxury Condo with Sea View",
                price: 3500000,
                type: "buy",
                beds: 3,
                baths: 2.5,
                sqft: 1800,
                location: "Westmoorings",
                description: "Executive living at its finest. Panoramic views of the Gulf of Paria. 24/7 Concierge, Gym, and Pool access.",
                images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800"],
                amenities: ["Ocean View", "Pool", "Gym", "24/7 Security", "Elevator"],
                agent: { name: "Terra Caribbean", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop", phone: "868-555-0404", isPremium: true },
                isFeatured: true,
                postedDate: "3 days ago",
                coordinates: { lat: 10.675, lng: -61.550 }
            },
            {
                id: 5,
                title: "Commercial Space on High St",
                price: 12000,
                type: "rent",
                beds: 0,
                baths: 1,
                sqft: 1200,
                location: "San Fernando",
                description: "High visibility commercial unit on High Street. Ideal for retail or office. Glass frontage and ample storage.",
                images: ["https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800"],
                amenities: ["High Traffic", "Glass Front", "Air Conditioning"],
                agent: { name: "Business Spaces", photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop", phone: "868-555-0505", isPremium: false },
                postedDate: "2 weeks ago",
                coordinates: { lat: 10.279, lng: -61.462 }
            },
            {
                id: 6,
                title: "Unfinished Fixer Upper",
                price: 850000,
                type: "buy",
                beds: 3,
                baths: 1,
                sqft: 1500,
                location: "Arima",
                description: "Great investment opportunity. Structure is solid, just needs finishing touches. Cash buyers preferred.",
                images: ["https://images.unsplash.com/photo-1513584685908-95c9e2d01361?q=80&w=800"],
                amenities: ["Large Lot", "Fixer Upper", "Freehold Land"],
                agent: { name: "Quick Sale", photo: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=200&auto=format&fit=crop", phone: "868-555-0606", isPremium: false },
                postedDate: "1 month ago",
                coordinates: { lat: 10.638, lng: -61.282 }
            }
        ];
    },

    getListingById: async (id: number): Promise<RealEstateListing | undefined> => {
        const listings = await realEstateService.getListings();
        return listings.find(l => l.id === id);
    }
};
