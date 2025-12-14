/**
 * Insert Sample Data Script (Simplified)
 * Run this to populate all marketplace tables with sample data
 * 
 * Usage: node scripts/insert-sample-data-simple.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertSampleData() {
    console.log('🚀 Starting sample data insertion...\n');

    try {
        // 1. Insert classified listings
        console.log('📋 Step 1: Inserting classified listings...');
        const classifieds = [
            { title: '2018 Toyota Hilux for Sale', description: 'Excellent condition, low mileage, fully loaded Hilux. Contact for viewing.', price: 250000, category: 'Vehicles', location: 'San Fernando', is_featured: true, image_urls: ['https://images.unsplash.com/photo-1627050019688-a28a1a1f0a2e'] },
            { title: 'Samsung Galaxy S23 Ultra', description: 'Like new, unlocked, 256GB, with box and accessories.', price: 6000, category: 'Electronics', location: 'Port of Spain', is_featured: false, image_urls: ['https://images.unsplash.com/photo-1610792516301-ea102c32021c'] },
            { title: '3 Bedroom House for Rent - Arima', description: 'Spacious 3 bedroom, 2 bath house in a quiet Arima neighborhood. Parking for 2 cars.', price: 6500, category: 'Real Estate', location: 'Arima', is_featured: true, image_urls: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750'] },
            { title: 'Web Developer Needed', description: 'Looking for a skilled web developer for a short-term project. Remote work possible.', price: 8000, category: 'Jobs', location: 'Remote', is_featured: false, image_urls: [] },
            { title: 'Graphic Design Services', description: 'Professional graphic design for logos, flyers, and social media content. Affordable rates.', price: 500, category: 'Services', location: 'Chaguanas', is_featured: false, image_urls: ['https://images.unsplash.com/photo-1626785774573-4b799315345d'] },
            { title: 'iPhone 14 Pro Max', description: 'Mint condition, 512GB, unlocked. Includes charger and case.', price: 7500, category: 'Electronics', location: 'Port of Spain', is_featured: true, image_urls: ['https://images.unsplash.com/photo-1632661674596-df8be070a5c5'] },
            { title: 'Apartment for Rent - Westmoorings', description: 'Modern 2 bedroom apartment with pool and gym access. Gated community.', price: 8000, category: 'Real Estate', location: 'Westmoorings', is_featured: true, image_urls: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'] },
            { title: 'Gaming PC Setup', description: 'High-end gaming PC with RTX 4070, 32GB RAM, RGB everything!', price: 15000, category: 'Electronics', location: 'Chaguanas', is_featured: false, image_urls: ['https://images.unsplash.com/photo-1587202372634-32705e3bf49c'] },
            { title: 'Marketing Manager Position', description: 'Established company seeking experienced marketing manager. Great benefits.', price: 12000, category: 'Jobs', location: 'Port of Spain', is_featured: true, image_urls: [] },
            { title: 'Landscaping Services', description: 'Professional landscaping and garden maintenance. Free quotes.', price: 800, category: 'Services', location: 'San Fernando', is_featured: false, image_urls: ['https://images.unsplash.com/photo-1558904541-efa843a96f01'] }
        ];

        for (const classified of classifieds) {
            const { error } = await supabase
                .from('classified_listings')
                .insert(classified);

            if (error && !error.message.includes('duplicate')) {
                console.error(`  ❌ Error inserting "${classified.title}":`, error.message);
            }
        }
        console.log(`✅ Inserted ${classifieds.length} classified listings\n`);

        // 2. Insert jobs
        console.log('📋 Step 2: Inserting jobs...');
        const jobs = [
            { title: 'Senior Software Developer', company: 'Tech Solutions TT', description: 'Join our growing team as a Senior Software Developer. Work on exciting projects using modern tech stack including React, Node.js, and cloud technologies.', location: 'Port of Spain', salary_min: 12000, salary_max: 18000, job_type: 'Full-time', category: 'Technology', requirements: ['5+ years experience', 'React/Node.js expertise', 'Cloud platform knowledge'], benefits: ['Health insurance', 'Remote work options', 'Professional development'] },
            { title: 'Marketing Manager', company: 'Caribbean Marketing Group', description: 'Lead our marketing team in developing and executing strategic campaigns for local and regional clients.', location: 'Port of Spain', salary_min: 10000, salary_max: 15000, job_type: 'Full-time', category: 'Marketing', requirements: ['Marketing degree', '3+ years management experience', 'Digital marketing skills'], benefits: ['Competitive salary', 'Performance bonuses', 'Career growth'] },
            { title: 'Customer Service Representative', company: 'TriniBuild', description: 'Provide excellent customer support to our growing user base. Help businesses succeed on our platform.', location: 'Remote', salary_min: 5000, salary_max: 7000, job_type: 'Full-time', category: 'Customer Service', requirements: ['Excellent communication', 'Problem-solving skills', 'Tech-savvy'], benefits: ['Work from home', 'Flexible hours', 'Training provided'] },
            { title: 'Sales Executive', company: 'Auto Paradise', description: 'Drive sales growth by building relationships with customers and closing deals. Commission-based earnings.', location: 'San Fernando', salary_min: 6000, salary_max: 12000, job_type: 'Full-time', category: 'Sales', requirements: ['Sales experience', 'Valid driver license', 'Excellent communication'], benefits: ['High commission', 'Company vehicle', 'Sales training'] },
            { title: 'Graphic Designer', company: 'Creative Studio TT', description: 'Create stunning visual content for our diverse client portfolio. Must have strong portfolio.', location: 'Chaguanas', salary_min: 5000, salary_max: 8000, job_type: 'Contract', category: 'Design', requirements: ['Adobe Creative Suite', 'Portfolio required', '2+ years experience'], benefits: ['Flexible schedule', 'Creative environment', 'Portfolio building'] },
            { title: 'Delivery Driver', company: 'TriniBuild Logistics', description: 'Join our delivery team! Flexible hours, competitive pay, and be your own boss.', location: 'Trinidad-wide', salary_min: 4000, salary_max: 8000, job_type: 'Part-time', category: 'Transportation', requirements: ['Valid license', 'Own vehicle', 'Good driving record'], benefits: ['Flexible hours', 'Weekly pay', 'Fuel allowance'] }
        ];

        for (const job of jobs) {
            const { error } = await supabase
                .from('jobs')
                .insert(job);

            if (error && !error.message.includes('duplicate')) {
                console.error(`  ❌ Error inserting "${job.title}":`, error.message);
            }
        }
        console.log(`✅ Inserted ${jobs.length} jobs\n`);

        // 3. Insert real estate listings
        console.log('📋 Step 3: Inserting real estate listings...');
        const realEstate = [
            { title: 'Luxury 4 Bedroom House - Westmoorings', description: 'Stunning modern home in prestigious Westmoorings. Features include pool, home theater, and smart home technology.', price: 4500000, property_type: 'House', bedrooms: 4, bathrooms: 3, square_feet: 3500, location: 'Westmoorings', address: 'Westmoorings, Diego Martin', latitude: 10.6918, longitude: -61.5424, image_urls: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811'], features: ['Pool', 'Smart Home', 'Home Theater', 'Garage'], is_featured: true },
            { title: 'Modern 2 Bedroom Apartment - Trincity', description: 'Brand new apartment in gated community with gym, pool, and 24/7 security.', price: 1800000, property_type: 'Apartment', bedrooms: 2, bathrooms: 2, square_feet: 1200, location: 'Trincity', address: 'Trincity Mall Area', latitude: 10.6525, longitude: -61.3925, image_urls: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'], features: ['Gym', 'Pool', 'Security', 'Parking'], is_featured: true },
            { title: 'Commercial Property - San Fernando', description: 'Prime commercial space perfect for retail or office. High foot traffic area.', price: 3200000, property_type: 'Commercial', bedrooms: 0, bathrooms: 2, square_feet: 2000, location: 'San Fernando', address: 'High Street, San Fernando', latitude: 10.2797, longitude: -61.4647, image_urls: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab'], features: ['Prime Location', 'Parking', 'Modern Facilities'], is_featured: false },
            { title: '3 Bedroom Townhouse - Chaguanas', description: 'Spacious townhouse in family-friendly neighborhood. Close to schools and shopping.', price: 2100000, property_type: 'Townhouse', bedrooms: 3, bathrooms: 2, square_feet: 1800, location: 'Chaguanas', address: 'Chaguanas Main Road', latitude: 10.5167, longitude: -61.4111, image_urls: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c'], features: ['Family Friendly', 'Near Schools', 'Parking'], is_featured: false },
            { title: 'Land for Sale - Arima', description: '5000 sq ft residential lot in developing area. Perfect for building your dream home.', price: 800000, property_type: 'Land', bedrooms: 0, bathrooms: 0, square_feet: 5000, location: 'Arima', address: 'Arima Heights', latitude: 10.6372, longitude: -61.2828, image_urls: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef'], features: ['Residential', 'Developing Area', 'Utilities Available'], is_featured: false }
        ];

        for (const property of realEstate) {
            const { error } = await supabase
                .from('real_estate_listings')
                .insert(property);

            if (error && !error.message.includes('duplicate')) {
                console.error(`  ❌ Error inserting "${property.title}":`, error.message);
            }
        }
        console.log(`✅ Inserted ${realEstate.length} real estate listings\n`);

        // 4. Insert events
        console.log('📋 Step 4: Inserting events...');
        const events = [
            { title: 'Trinidad Tech Meetup - January 2025', description: 'Monthly gathering of tech enthusiasts, developers, and entrepreneurs. Network, learn, and share ideas!', event_date: '2025-01-15', event_time: '18:00', location: 'MovieTowne, Port of Spain', category: 'technology', price: 0, max_attendees: 100, organizer_name: 'TriniBuild Community', image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87' },
            { title: 'Caribbean Food Festival', description: 'Celebrate the flavors of Trinidad & Tobago! Food vendors, live music, and cultural performances.', event_date: '2025-01-20', event_time: '12:00', location: "Queen's Park Savannah", category: 'food', price: 50, max_attendees: 500, organizer_name: 'T&T Food Association', image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1' },
            { title: 'Business Networking Mixer', description: 'Connect with local entrepreneurs and business owners. Grow your network and find opportunities.', event_date: '2025-01-25', event_time: '17:30', location: 'Hyatt Regency, Port of Spain', category: 'business', price: 100, max_attendees: 75, organizer_name: 'Trinidad Business Network', image_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865' },
            { title: 'Fitness Bootcamp - Free Trial', description: 'Try our outdoor fitness bootcamp! All fitness levels welcome. Bring water and towel.', event_date: '2025-01-18', event_time: '06:00', location: "Queen's Park Savannah", category: 'sports', price: 0, max_attendees: 30, organizer_name: 'FitLife TT', image_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438' },
            { title: 'Art Exhibition - Local Artists', description: "Showcase of Trinidad & Tobago's finest artists. Paintings, sculptures, and mixed media.", event_date: '2025-02-01', event_time: '19:00', location: 'National Museum, Port of Spain', category: 'arts', price: 25, max_attendees: 150, organizer_name: 'T&T Arts Council', image_url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b' }
        ];

        for (const event of events) {
            const { error } = await supabase
                .from('events')
                .insert(event);

            if (error && !error.message.includes('duplicate')) {
                console.error(`  ❌ Error inserting "${event.title}":`, error.message);
            }
        }
        console.log(`✅ Inserted ${events.length} events\n`);

        // 5. Insert products
        console.log('📋 Step 5: Inserting products...');
        const products = [
            { name: 'Wireless Bluetooth Headphones', description: 'Premium sound quality, 30-hour battery life, noise cancellation. Perfect for music lovers!', price: 599, category: 'Electronics', image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e', stock_quantity: 50, is_featured: true },
            { name: 'Organic Coffee Beans - 1lb', description: 'Locally roasted Trinidad coffee. Rich, smooth flavor. Support local!', price: 120, category: 'Food & Beverage', image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e', stock_quantity: 100, is_featured: false },
            { name: 'Fitness Resistance Bands Set', description: 'Complete set of 5 resistance bands for home workouts. Includes carry bag.', price: 250, category: 'Sports & Fitness', image_url: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc', stock_quantity: 75, is_featured: true },
            { name: 'Handmade Leather Wallet', description: 'Genuine leather, handcrafted in Trinidad. RFID protection included.', price: 350, category: 'Fashion & Accessories', image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93', stock_quantity: 30, is_featured: false },
            { name: 'Smart LED Light Bulbs - 4 Pack', description: 'WiFi-enabled, color-changing LED bulbs. Control with your phone!', price: 480, category: 'Home & Garden', image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64', stock_quantity: 60, is_featured: true },
            { name: 'Natural Skincare Set', description: 'All-natural, locally made skincare products. Perfect for Caribbean climate.', price: 420, category: 'Beauty & Personal Care', image_url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571', stock_quantity: 40, is_featured: false },
            { name: 'Kids Educational Tablet', description: 'Pre-loaded with educational games and apps. Parental controls included.', price: 1200, category: 'Electronics', image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', stock_quantity: 25, is_featured: true },
            { name: 'Yoga Mat - Premium Quality', description: 'Extra thick, non-slip yoga mat. Includes carrying strap.', price: 280, category: 'Sports & Fitness', image_url: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f', stock_quantity: 80, is_featured: false }
        ];

        for (const product of products) {
            const { error } = await supabase
                .from('products')
                .insert(product);

            if (error && !error.message.includes('duplicate')) {
                console.error(`  ❌ Error inserting "${product.name}":`, error.message);
            }
        }
        console.log(`✅ Inserted ${products.length} products\n`);

        // 6. Insert success stories
        console.log('📋 Step 6: Inserting success stories...');
        const successStories = [
            { business_name: 'Island Fashion Boutique', owner_name: 'Sarah Mohammed', story: 'I started my online boutique with TriniBuild 6 months ago. The platform made it so easy to set up my store, and the built-in marketing tools helped me reach customers across Trinidad. My sales have tripled!', revenue_growth: 300, image_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8', category: 'Fashion' },
            { business_name: 'Tech Paradise Trinidad', owner_name: 'Rajesh Sharma', story: 'TriniBuild transformed my electronics business. The inventory management and analytics features are game-changers. I went from a small shop to serving customers nationwide.', revenue_growth: 250, image_url: 'https://images.unsplash.com/photo-1556761175-b413da4baf72', category: 'Electronics' },
            { business_name: 'Trini Food Hub', owner_name: 'Michelle Chen', story: 'As a food vendor, I needed an easy way to take online orders. TriniBuild gave me everything I needed - a beautiful storefront, payment processing, and delivery management. Business is booming!', revenue_growth: 400, image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0', category: 'Food & Beverage' }
        ];

        for (const story of successStories) {
            const { error } = await supabase
                .from('success_stories')
                .insert(story);

            if (error && !error.message.includes('duplicate')) {
                console.error(`  ❌ Error inserting "${story.business_name}":`, error.message);
            }
        }
        console.log(`✅ Inserted ${successStories.length} success stories\n`);

        // 7. Insert video placements
        console.log('📋 Step 7: Inserting video placements...');
        const videoPlacements = [
            { video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', title: 'Build Your Dream Business', description: 'See how TriniBuild helps local entrepreneurs succeed', placement_page: 'home', placement_section: 'hero', is_active: true, priority: 1 },
            { video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', title: 'Success Stories', description: 'Real businesses, real results with TriniBuild', placement_page: 'home', placement_section: 'testimonials', is_active: true, priority: 2 },
            { video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', title: 'Platform Tour', description: 'Discover all the features that make TriniBuild powerful', placement_page: 'home', placement_section: 'features', is_active: true, priority: 3 }
        ];

        for (const video of videoPlacements) {
            const { error } = await supabase
                .from('video_placements')
                .insert(video);

            if (error && !error.message.includes('duplicate')) {
                console.error(`  ❌ Error inserting "${video.title}":`, error.message);
            }
        }
        console.log(`✅ Inserted ${videoPlacements.length} video placements\n`);

        // Verification
        console.log('📊 Verifying data counts...\n');
        const tables = ['blogs', 'stores', 'classified_listings', 'jobs', 'real_estate_listings', 'events', 'products', 'success_stories', 'video_placements'];

        for (const table of tables) {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.error(`❌ Error counting ${table}:`, error.message);
            } else {
                console.log(`✅ ${table}: ${count} rows`);
            }
        }

        console.log('\n🎉 Sample data insertion complete!');

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run the script
insertSampleData();
