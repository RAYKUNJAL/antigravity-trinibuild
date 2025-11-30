import { supabase } from './supabaseClient';

// Commission rates by job type
const COMMISSION_RATES = {
    rideshare: 0.15,      // 15%
    delivery: 0.20,       // 20%
    courier: 0.15,        // 15%
    rideshare_premium: 0.10  // 10% for H-Cars
};

// Subscription discounts
const SUBSCRIPTION_DISCOUNTS = {
    free: 0,
    pro: 0.05,   // 5% discount
    elite: 0.08  // 8% discount
};

export interface Driver {
    id: string;
    rideshare_enabled: boolean;
    delivery_enabled: boolean;
    courier_enabled: boolean;
    status: 'offline' | 'online' | 'busy' | 'on_break';
    current_location_lat?: number;
    current_location_lng?: number;
    vehicle_type?: string;
    vehicle_plate?: string;
    is_h_car: boolean;
    subscription_tier: 'free' | 'pro' | 'elite';
    rating: number;
    total_earnings: number;
}

export interface GigJob {
    id: string;
    job_type: 'rideshare' | 'delivery' | 'courier';
    customer_id: string;
    driver_id?: string;
    status: string;
    pickup_location: string;
    pickup_lat?: number;
    pickup_lng?: number;
    dropoff_location: string;
    dropoff_lat?: number;
    dropoff_lng?: number;
    base_price: number;
    surge_multiplier: number;
    total_price: number;
    commission_rate: number;
    trinibuild_commission: number;
    driver_earnings: number;
    payment_method: string;
    tip_amount: number;
}

export const driverService = {
    // Register as a driver
    async registerDriver(data: {
        vehicleType: string;
        vehicleMake: string;
        vehicleModel: string;
        vehicleYear: number;
        vehiclePlate: string;
        vehicleColor: string;
        licenseNumber: string;
        licenseExpiry: string;
        servicesEnabled: {
            rideshare: boolean;
            delivery: boolean;
            courier: boolean;
        };
    }) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data: driver, error } = await supabase
            .from('drivers')
            .insert({
                id: user.id,
                vehicle_type: data.vehicleType,
                vehicle_make: data.vehicleMake,
                vehicle_model: data.vehicleModel,
                vehicle_year: data.vehicleYear,
                vehicle_plate: data.vehiclePlate,
                vehicle_color: data.vehicleColor,
                license_number: data.licenseNumber,
                license_expiry: data.licenseExpiry,
                rideshare_enabled: data.servicesEnabled.rideshare,
                delivery_enabled: data.servicesEnabled.delivery,
                courier_enabled: data.servicesEnabled.courier,
                status: 'offline'
            })
            .select()
            .single();

        if (error) throw error;
        return driver;
    },

    // Get driver profile
    async getDriverProfile() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('drivers')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Error fetching driver profile:', error);
            return null;
        }
        return data as Driver;
    },

    // Update driver status (online/offline/busy)
    async updateStatus(status: 'offline' | 'online' | 'busy' | 'on_break') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('drivers')
            .update({
                status,
                last_active_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (error) throw error;
    },

    // Update driver location in real-time
    async updateLocation(lat: number, lng: number) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('drivers')
            .update({
                current_location_lat: lat,
                current_location_lng: lng,
                last_location_update: new Date().toISOString()
            })
            .eq('id', user.id);

        if (error) console.error('Failed to update location:', error);
    },

    // Toggle service availability
    async toggleService(serviceType: 'rideshare' | 'delivery' | 'courier', enabled: boolean) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const field = `${serviceType}_enabled`;
        const { error } = await supabase
            .from('drivers')
            .update({ [field]: enabled })
            .eq('id', user.id);

        if (error) throw error;
    },

    // Calculate earnings for a job (with monetization logic)
    calculateJobEarnings(
        basePrice: number,
        jobType: 'rideshare' | 'delivery' | 'courier',
        driver: Driver,
        surgeMultiplier: number = 1.0,
        tipAmount: number = 0
    ) {
        // Start with base commission rate
        let commissionRate = COMMISSION_RATES[jobType];

        // Premium service (H-Car) gets lower commission
        if (jobType === 'rideshare' && driver.is_h_car) {
            commissionRate = COMMISSION_RATES.rideshare_premium;
        }

        // Apply subscription discount
        const subscriptionDiscount = SUBSCRIPTION_DISCOUNTS[driver.subscription_tier] || 0;
        commissionRate = Math.max(0, commissionRate - subscriptionDiscount);

        // Calculate totals
        const totalPrice = basePrice * surgeMultiplier;
        const commission = totalPrice * commissionRate;
        const driverEarnings = totalPrice - commission + tipAmount;

        return {
            base_price: basePrice,
            surge_multiplier: surgeMultiplier,
            total_price: totalPrice,
            commission_rate: commissionRate * 100, // Convert to percentage
            trinibuild_commission: Math.round(commission * 100) / 100,
            driver_earnings: Math.round(driverEarnings * 100) / 100,
            tip_amount: tipAmount
        };
    },

    // Create a gig job
    async createGigJob(data: {
        jobType: 'rideshare' | 'delivery' | 'courier';
        pickupLocation: string;
        pickupLat?: number;
        pickupLng?: number;
        dropoffLocation: string;
        dropoffLat?: number;
        dropoffLng?: number;
        basePrice: number;
        surgeMultiplier?: number;
        paymentMethod?: string;
        orderDetails?: any;
        packageType?: string;
    }) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Get driver profile to calculate earnings (for now use default, will match driver later)
        const defaultDriver: Partial<Driver> = {
            subscription_tier: 'free',
            is_h_car: false
        };

        const earnings = this.calculateJobEarnings(
            data.basePrice,
            data.jobType,
            defaultDriver as Driver,
            data.surgeMultiplier || 1.0
        );

        const { data: job, error } = await supabase
            .from('gig_jobs')
            .insert({
                job_type: data.jobType,
                customer_id: user.id,
                status: 'searching',
                pickup_location: data.pickupLocation,
                pickup_lat: data.pickupLat,
                pickup_lng: data.pickupLng,
                dropoff_location: data.dropoffLocation,
                dropoff_lat: data.dropoffLat,
                dropoff_lng: data.dropoffLng,
                base_price: data.basePrice,
                surge_multiplier: data.surgeMultiplier || 1.0,
                total_price: earnings.total_price,
                commission_rate: earnings.commission_rate,
                trinibuild_commission: earnings.trinibuild_commission,
                driver_earnings: earnings.driver_earnings,
                payment_method: data.paymentMethod || 'cash',
                order_details: data.orderDetails,
                package_type: data.packageType
            })
            .select()
            .single();

        if (error) throw error;
        return job;
    },

    // Get available jobs for driver (based on enabled services)
    async getAvailableJobs() {
        const driver = await this.getDriverProfile();
        if (!driver || driver.status !== 'online') return [];

        // Build filter for enabled services
        const enabledServices = [];
        if (driver.rideshare_enabled) enabledServices.push('rideshare');
        if (driver.delivery_enabled) enabledServices.push('delivery');
        if (driver.courier_enabled) enabledServices.push('courier');

        if (enabledServices.length === 0) return [];

        const { data, error } = await supabase
            .from('gig_jobs')
            .select('*')
            .in('job_type', enabledServices)
            .eq('status', 'searching')
            .is('driver_id', null)
            .order('created_at', { ascending: true })
            .limit(10);

        if (error) {
            console.error('Error fetching available jobs:', error);
            return [];
        }

        return data;
    },

    // Accept a job
    async acceptJob(jobId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('gig_jobs')
            .update({
                driver_id: user.id,
                status: 'accepted',
                accepted_at: new Date().toISOString()
            })
            .eq('id', jobId)
            .is('driver_id', null) // Ensure no other driver accepted it
            .select()
            .single();

        if (error) throw error;

        // Update driver status to busy
        await this.updateStatus('busy');

        return data;
    },

    // Update job status
    async updateJobStatus(jobId: string, status: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const updates: any = { status };

        // Add timestamp based on status
        if (status === 'picked_up') {
            updates.picked_up_at = new Date().toISOString();
        } else if (status === 'completed') {
            updates.completed_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('gig_jobs')
            .update(updates)
            .eq('id', jobId)
            .eq('driver_id', user.id)
            .select()
            .single();

        if (error) throw error;

        // If completed, update driver status back to online
        if (status === 'completed') {
            await this.updateStatus('online');
            await this.completeJob(jobId);
        }

        return data;
    },

    // Complete job and update earnings
    async completeJob(jobId: string) {
        const { data: job } = await supabase
            .from('gig_jobs')
            .select('*')
            .eq('id', jobId)
            .single();

        if (!job) return;

        // Add to driver's total earnings
        const { error } = await supabase.rpc('increment_driver_earnings', {
            driver_uuid: job.driver_id,
            amount: job.driver_earnings,
            job_type_col: `total_${job.job_type === 'rideshare' ? 'rides' : job.job_type === 'delivery' ? 'deliveries' : 'courier_jobs'}`
        });

        if (error) console.error('Failed to update earnings:', error);
    },

    // Get driver's active job
    async getActiveJob() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('gig_jobs')
            .select('*')
            .eq('driver_id', user.id)
            .in('status', ['accepted', 'picked_up', 'in_transit'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) return null;
        return data;
    },

    // Get driver earnings summary
    async getEarningsSummary() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const driver = await this.getDriverProfile();
        if (!driver) return null;

        // Get today's earnings
        const today = new Date().toISOString().split('T')[0];
        const { data: todayJobs } = await supabase
            .from('gig_jobs')
            .select('driver_earnings, job_type')
            .eq('driver_id', user.id)
            .eq('status', 'completed')
            .gte('completed_at', `${today}T00:00:00`)
            .lte('completed_at', `${today}T23:59:59`);

        const todayTotal = todayJobs?.reduce((sum, job) => sum + Number(job.driver_earnings), 0) || 0;

        return {
            today: todayTotal,
            weekly: driver.weekly_earnings || 0,
            monthly: driver.monthly_earnings || 0,
            total: driver.total_earnings || 0,
            rating: driver.rating,
            total_jobs: driver.total_rides + driver.total_deliveries + driver.total_courier_jobs
        };
    },

    // Subscribe to real-time job updates
    subscribeToJobs(callback: (job: any) => void) {
        const subscription = supabase
            .channel('available_jobs')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'gig_jobs',
                    filter: 'status=eq.searching'
                },
                (payload) => callback(payload.new)
            )
            .subscribe();

        return subscription;
    }
};
