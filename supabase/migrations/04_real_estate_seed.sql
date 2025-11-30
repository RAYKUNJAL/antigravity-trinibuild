-- Seed Data for Real Estate Listings (Trinidad & Tobago)

-- Clear existing data to avoid duplicates during dev
truncate table public.real_estate_listings cascade;

-- 1. Luxury Condo in Westmoorings
insert into public.real_estate_listings (
    id, title, description, price, listing_type, property_type, status, 
    bedrooms, bathrooms, sqft, address, city, region, 
    latitude, longitude, features, images
) values (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Luxury Oceanfront Condo',
    'Experience the pinnacle of Caribbean living in this stunning Westmoorings apartment. Featuring panoramic views of the Gulf of Paria, this unit comes fully furnished with modern Italian cabinetry, marble floors, and smart home integration. The compound offers 24/7 security, a tennis court, and a private marina.',
    3500000, 'sale', 'condo', 'active',
    3, 2.5, 1800, '12 Western Main Road', 'Westmoorings', 'Diego Martin',
    10.675, -61.550,
    '{"amenities": ["Ocean View", "Pool", "Gym", "24/7 Security", "Elevator", "Marina Access"]}',
    '[{"url": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800"}, {"url": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800"}]'
);

-- 2. Family Home in Lange Park
insert into public.real_estate_listings (
    id, title, description, price, listing_type, property_type, status, 
    bedrooms, bathrooms, sqft, lot_size_sqft, address, city, region, 
    latitude, longitude, features, images
) values (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'Spacious Family Home in Gated Community',
    'Located in the prestigious Lange Park, this 4-bedroom home is perfect for a growing family. The property features a large backyard with fruit trees, a covered garage for 2 cars, and a dedicated home office. The master suite includes a walk-in closet and a jacuzzi tub.',
    2500000, 'sale', 'house', 'active',
    4, 3, 2200, 5000, '45 Palm Avenue', 'Chaguanas', 'Central',
    10.516, -61.412,
    '{"amenities": ["Gated Community", "Garden", "Pet Friendly", "Garage", "Home Office"]}',
    '[{"url": "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=800"}, {"url": "https://images.unsplash.com/photo-1484154218962-a1c002085d2f?q=80&w=800"}]'
);

-- 3. Apartment in Woodbrook (Rent)
insert into public.real_estate_listings (
    id, title, description, price, listing_type, property_type, status, 
    bedrooms, bathrooms, sqft, address, city, region, 
    latitude, longitude, features, images
) values (
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    'Modern Apartment near Ariapita Avenue',
    'Live in the heart of the action! This newly renovated 2-bedroom apartment is walking distance to the best restaurants and nightlife in Port of Spain. Features include air conditioning in all rooms, secure parking, and a modern kitchen.',
    4500, 'rent', 'apartment', 'active',
    2, 1, 850, '23 Roberts Street', 'Port of Spain', 'North',
    10.666, -61.525,
    '{"amenities": ["Air Conditioning", "Parking", "Water Tank", "Security Cameras", "Close to Amenities"]}',
    '[{"url": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800"}, {"url": "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?q=80&w=800"}]'
);

-- 4. Student Studio (Rent)
insert into public.real_estate_listings (
    id, title, description, price, listing_type, property_type, status, 
    bedrooms, bathrooms, sqft, address, city, region, 
    latitude, longitude, features, images
) values (
    'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
    'Cozy Studio near UWI',
    'Perfect for students or young professionals. This fully furnished studio is a 5-minute walk to UWI St. Augustine campus. Rent includes all utilities (Water, Electricity, WiFi). Shared laundry facilities on site.',
    2500, 'rent', 'apartment', 'active',
    1, 1, 400, '10 Watts Street', 'St. Augustine', 'East',
    10.640, -61.399,
    '{"amenities": ["Furnished", "WiFi Included", "Utilities Included", "Shared Laundry"]}',
    '[{"url": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800"}]'
);

-- 5. Commercial Space in San Fernando
insert into public.real_estate_listings (
    id, title, description, price, listing_type, property_type, status, 
    bedrooms, bathrooms, sqft, address, city, region, 
    latitude, longitude, features, images
) values (
    'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
    'Prime Retail Space on High Street',
    'High visibility commercial unit available for immediate lease. Located on the busy High Street in San Fernando, this space is ideal for a retail store, pharmacy, or office. Features a glass frontage, air conditioning, and a private restroom.',
    12000, 'rent', 'commercial', 'active',
    0, 1, 1200, '55 High Street', 'San Fernando', 'South',
    10.279, -61.462,
    '{"amenities": ["High Traffic", "Glass Front", "Air Conditioning", "Restroom"]}',
    '[{"url": "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800"}]'
);

-- 6. Fixer Upper in Arima
insert into public.real_estate_listings (
    id, title, description, price, listing_type, property_type, status, 
    bedrooms, bathrooms, sqft, lot_size_sqft, address, city, region, 
    latitude, longitude, features, images
) values (
    'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
    'Investment Opportunity - Fixer Upper',
    'Great potential for investors! This 3-bedroom house sits on a large lot of freehold land. The structure is solid but requires cosmetic renovations and a new roof. Cash buyers preferred.',
    850000, 'sale', 'house', 'active',
    3, 1, 1500, 6000, '12 Malabar Road', 'Arima', 'East',
    10.638, -61.282,
    '{"amenities": ["Large Lot", "Fixer Upper", "Freehold Land", "Investment Potential"]}',
    '[{"url": "https://images.unsplash.com/photo-1513584685908-95c9e2d01361?q=80&w=800"}]'
);

-- Insert Images into property_images table (normalizing the JSON above)
insert into public.property_images (listing_id, url, display_order)
select id, jsonb_array_elements(images::jsonb)->>'url', 0
from public.real_estate_listings;

-- Insert Features into property_features table
insert into public.property_features (listing_id, feature_name)
select id, jsonb_array_elements(features::jsonb->'amenities')->>0
from public.real_estate_listings;

-- Clean up the temporary JSON columns if we wanted to be strict, but for now we just leave them or ignore them in the select
