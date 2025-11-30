// Trinidad and Tobago Pricing Calculator
// Based on market research and competitor analysis (2025)

export interface PricingConfig {
    service_name: string;
    base_fare_ttd: number;
    minimum_fare_ttd: number;
    per_km_ttd: number;
    per_min_ttd: number;
    platform_commission_pct: number;
    driver_earnings_pct: number;
    night_surcharge_multiplier?: number;
    peak_surcharge_multiplier?: number;
    holiday_surcharge_multiplier?: number;
}

// Rideshare Rates (Trinidad & Tobago market-tested)
export const RIDESHARE_RATES: Record<string, PricingConfig> = {
    economy: {
        service_name: "Economy",
        base_fare_ttd: 15,
        minimum_fare_ttd: 25,
        per_km_ttd: 4.5,
        per_min_ttd: 1.0,
        platform_commission_pct: 20,
        driver_earnings_pct: 80,
        night_surcharge_multiplier: 1.15,
        peak_surcharge_multiplier: 1.10,
        holiday_surcharge_multiplier: 1.20
    },
    standard: {
        service_name: "Standard",
        base_fare_ttd: 20,
        minimum_fare_ttd: 30,
        per_km_ttd: 5.0,
        per_min_ttd: 1.2,
        platform_commission_pct: 22,
        driver_earnings_pct: 78,
        night_surcharge_multiplier: 1.20,
        peak_surcharge_multiplier: 1.10,
        holiday_surcharge_multiplier: 1.25
    },
    premium: {
        service_name: "Premium",
        base_fare_ttd: 30,
        minimum_fare_ttd: 45,
        per_km_ttd: 6.0,
        per_min_ttd: 1.5,
        platform_commission_pct: 25,
        driver_earnings_pct: 75,
        night_surcharge_multiplier: 1.25,
        peak_surcharge_multiplier: 1.15,
        holiday_surcharge_multiplier: 1.35
    },
    xl: {
        service_name: "XL",
        base_fare_ttd: 35,
        minimum_fare_ttd: 50,
        per_km_ttd: 6.5,
        per_min_ttd: 1.5,
        platform_commission_pct: 25,
        driver_earnings_pct: 75,
        night_surcharge_multiplier: 1.20,
        peak_surcharge_multiplier: 1.15,
        holiday_surcharge_multiplier: 1.30
    }
};

// Courier Rates
export const COURIER_RATES: Record<string, PricingConfig> = {
    bike: {
        service_name: "Bike Courier",
        base_fare_ttd: 20,
        minimum_fare_ttd: 25,
        per_km_ttd: 4.0,
        per_min_ttd: 0.8,
        platform_commission_pct: 18,
        driver_earnings_pct: 82
    },
    car: {
        service_name: "Car Courier",
        base_fare_ttd: 25,
        minimum_fare_ttd: 35,
        per_km_ttd: 5.0,
        per_min_ttd: 1.0,
        platform_commission_pct: 20,
        driver_earnings_pct: 80
    },
    van: {
        service_name: "Van Courier",
        base_fare_ttd: 40,
        minimum_fare_ttd: 60,
        per_km_ttd: 7.0,
        per_min_ttd: 1.5,
        platform_commission_pct: 22,
        driver_earnings_pct: 78
    }
};

// Delivery Rates
export const DELIVERY_RATES: Record<string, PricingConfig> = {
    food: {
        service_name: "Food Delivery",
        base_fare_ttd: 12,
        minimum_fare_ttd: 18,
        per_km_ttd: 3.5,
        per_min_ttd: 0.7,
        platform_commission_pct: 25,
        driver_earnings_pct: 75
    },
    grocery: {
        service_name: "Grocery Delivery",
        base_fare_ttd: 20,
        minimum_fare_ttd: 30,
        per_km_ttd: 4.0,
        per_min_ttd: 0.9,
        platform_commission_pct: 25,
        driver_earnings_pct: 75
    },
    small_parcel: {
        service_name: "Small Parcel",
        base_fare_ttd: 15,
        minimum_fare_ttd: 20,
        per_km_ttd: 4.0,
        per_min_ttd: 0.9,
        platform_commission_pct: 20,
        driver_earnings_pct: 80
    },
    large_parcel: {
        service_name: "Large Parcel",
        base_fare_ttd: 25,
        minimum_fare_ttd: 35,
        per_km_ttd: 5.5,
        per_min_ttd: 1.2,
        platform_commission_pct: 22,
        driver_earnings_pct: 78
    }
};

interface FareCalculation {
    distance_km: number;
    duration_minutes: number;
    base_fare: number;
    distance_fare: number;
    time_fare: number;
    subtotal: number;
    surcharge_multiplier: number;
    surcharge_amount: number;
    total_fare: number;
    minimum_fare: number;
    actual_fare: number;
    commission_amount: number;
    driver_earnings: number;
    breakdown: string[];
}

export class TrinidadPricingService {
    // Check if current time is night hours (10pm - 5am)
    private isNightTime(): boolean {
        const hour = new Date().getHours();
        return hour >= 22 || hour < 5;
    }

    // Check if current time is peak hours (6-9am, 3-7pm)
    private isPeakTime(): boolean {
        const hour = new Date().getHours();
        return (hour >= 6 && hour < 9) || (hour >= 15 && hour < 19);
    }

    // Check if today is a Trinidad holiday
    private isHoliday(): boolean {
        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();

        const holidays = [
            '1-1', '2-14', '3-30', '12-24', '12-25', '12-26', '12-31'
        ];

        return holidays.includes(`${month}-${day}`);
    }

    // Calculate fare for any service type
    calculateFare(
        serviceType: 'rideshare' | 'courier' | 'delivery',
        serviceTier: string,
        distanceKm: number,
        durationMinutes: number
    ): FareCalculation {
        // Get rate config
        let rateConfig: PricingConfig;
        if (serviceType === 'rideshare') {
            rateConfig = RIDESHARE_RATES[serviceTier] || RIDESHARE_RATES.economy;
        } else if (serviceType === 'courier') {
            rateConfig = COURIER_RATES[serviceTier] || COURIER_RATES.car;
        } else {
            rateConfig = DELIVERY_RATES[serviceTier] || DELIVERY_RATES.food;
        }

        // Base calculation
        const baseFare = rateConfig.base_fare_ttd;
        const distanceFare = distanceKm * rateConfig.per_km_ttd;
        const timeFare = durationMinutes * rateConfig.per_min_ttd;
        const subtotal = baseFare + distanceFare + timeFare;

        // Apply surcharges
        let surchargeMultiplier = 1.0;
        const breakdown: string[] = [];

        if (this.isHoliday() && rateConfig.holiday_surcharge_multiplier) {
            surchargeMultiplier = rateConfig.holiday_surcharge_multiplier;
            breakdown.push(`Holiday Surcharge (${((surchargeMultiplier - 1) * 100).toFixed(0)}%)`);
        } else if (this.isNightTime() && rateConfig.night_surcharge_multiplier) {
            surchargeMultiplier = rateConfig.night_surcharge_multiplier;
            breakdown.push(`Night Surcharge (${((surchargeMultiplier - 1) * 100).toFixed(0)}%)`);
        } else if (this.isPeakTime() && rateConfig.peak_surcharge_multiplier) {
            surchargeMultiplier = rateConfig.peak_surcharge_multiplier;
            breakdown.push(`Peak Hours (${((surchargeMultiplier - 1) * 100).toFixed(0)}%)`);
        }

        const surchargeAmount = subtotal * (surchargeMultiplier - 1);
        const totalFare = subtotal * surchargeMultiplier;

        // Apply minimum fare
        const actualFare = Math.max(totalFare, rateConfig.minimum_fare_ttd);

        // Calculate commission split
        const commissionAmount = actualFare * (rateConfig.platform_commission_pct / 100);
        const driverEarnings = actualFare - commissionAmount;

        // Build breakdown
        if (breakdown.length === 0) {
            breakdown.push('Standard Rate');
        }
        breakdown.push(`Base: $${baseFare.toFixed(2)} TTD`);
        breakdown.push(`Distance: ${distanceKm.toFixed(1)} km × $${rateConfig.per_km_ttd} = $${distanceFare.toFixed(2)}`);
        breakdown.push(`Time: ${durationMinutes} min × $${rateConfig.per_min_ttd} = $${timeFare.toFixed(2)}`);
        if (actualFare === rateConfig.minimum_fare_ttd) {
            breakdown.push(`Minimum Fare Applied: $${rateConfig.minimum_fare_ttd.toFixed(2)}`);
        }
        breakdown.push(`Platform Fee (${rateConfig.platform_commission_pct}%): -$${commissionAmount.toFixed(2)}`);
        breakdown.push(`Driver Earns: $${driverEarnings.toFixed(2)} TTD`);

        return {
            distance_km: distanceKm,
            duration_minutes: durationMinutes,
            base_fare: baseFare,
            distance_fare: distanceFare,
            time_fare: timeFare,
            subtotal,
            surcharge_multiplier: surchargeMultiplier,
            surcharge_amount: surchargeAmount,
            total_fare: totalFare,
            minimum_fare: rateConfig.minimum_fare_ttd,
            actual_fare: actualFare,
            commission_amount: commissionAmount,
            driver_earnings: driverEarnings,
            breakdown
        };
    }

    // Get all available rideshare options for a trip
    getRideshareOptions(distanceKm: number, durationMinutes: number) {
        return Object.keys(RIDESHARE_RATES).map(tier => {
            const fare = this.calculateFare('rideshare', tier, distanceKm, durationMinutes);
            return {
                tier,
                ...RIDESHARE_RATES[tier],
                fare
            };
        });
    }

    // Quick estimate for display (without full calculation)
    quickEstimate(
        serviceType: 'rideshare' | 'courier' | 'delivery',
        serviceTier: string,
        distanceKm: number
    ): number {
        let rateConfig: PricingConfig;
        if (serviceType === 'rideshare') {
            rateConfig = RIDESHARE_RATES[serviceTier] || RIDESHARE_RATES.economy;
        } else if (serviceType === 'courier') {
            rateConfig = COURIER_RATES[serviceTier] || COURIER_RATES.car;
        } else {
            rateConfig = DELIVERY_RATES[serviceTier] || DELIVERY_RATES.food;
        }

        // Estimate: base + distance (assuming 3 min per km average speed of 20 km/h)
        const estimatedMinutes = distanceKm * 3;
        const estimate = rateConfig.base_fare_ttd +
            (distanceKm * rateConfig.per_km_ttd) +
            (estimatedMinutes * rateConfig.per_min_ttd);

        return Math.max(estimate, rateConfig.minimum_fare_ttd);
    }
}

// Export singleton instance
export const trinidadPricing = new TrinidadPricingService();
