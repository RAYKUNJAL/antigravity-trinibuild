import { supabase } from './supabaseClient';

export interface SaaSMetrics {
    // Core Revenue Metrics
    mrr: number;                    // Monthly Recurring Revenue
    arr: number;                    // Annual Recurring Revenue
    nrr: number;                    // Net Revenue Retention (%)

    // Customer Economics
    ltv: number;                    // Lifetime Value
    cac: number;                    // Customer Acquisition Cost
    ltvCacRatio: number;           // LTV:CAC Ratio (target: 3:1)

    // Engagement & Retention
    stickiness: number;             // DAU/MAU ratio (%)
    churnRate: number;              // Monthly churn rate (%)

    // Capital Efficiency
    burnMultiple: number;           // Net Burn / Net New ARR

    // Supporting Data
    activeUsers: number;
    newUsers: number;
    totalRevenue: number;
    costOfAcquisition: number;
}

export interface RevenueBreakdown {
    newMRR: number;
    expansionMRR: number;
    contractionMRR: number;
    churnedMRR: number;
}

export interface CohortData {
    month: string;
    users: number;
    revenue: number;
    retentionRate: number;
}

export const revenueMetricsService = {
    /**
     * Calculate Monthly Recurring Revenue from active subscriptions
     */
    async calculateMRR(): Promise<number> {
        try {
            // Get all active store subscriptions
            const { data: stores } = await supabase
                .from('user_stores')
                .select('subscription_tier')
                .eq('is_active', true);

            if (!stores) return 0;

            // Subscription pricing (based on your tiers)
            const tierPricing: Record<string, number> = {
                'FREE': 0,
                'STARTER': 25,      // $25/month
                'PROFESSIONAL': 75, // $75/month
                'ENTERPRISE': 199   // $199/month
            };

            const mrr = stores.reduce((sum, store) => {
                const tier = store.subscription_tier?.toUpperCase() || 'FREE';
                return sum + (tierPricing[tier] || 0);
            }, 0);

            return mrr;
        } catch (error) {
            console.error('Error calculating MRR:', error);
            return 0;
        }
    },

    /**
     * Calculate Net Revenue Retention (NRR)
     * Formula: (Starting MRR + Expansion - Contraction - Churn) / Starting MRR * 100
     */
    async calculateNRR(): Promise<number> {
        try {
            const now = new Date();
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

            // Get MRR breakdown for last month
            const breakdown = await this.getMRRBreakdown(lastMonth, now);
            const previousMRR = await this.getMRRAtDate(twoMonthsAgo);

            if (previousMRR === 0) return 100;

            const nrr = ((previousMRR + breakdown.expansionMRR - breakdown.contractionMRR - breakdown.churnedMRR) / previousMRR) * 100;

            return Math.max(0, nrr);
        } catch (error) {
            console.error('Error calculating NRR:', error);
            return 0;
        }
    },

    /**
     * Calculate Lifetime Value (LTV)
     * Formula: ARPU / Churn Rate
     */
    async calculateLTV(): Promise<number> {
        try {
            const arpu = await this.calculateARPU();
            const churnRate = await this.calculateChurnRate();

            if (churnRate === 0) return arpu * 36; // Assume 3 years if no churn

            // LTV = ARPU / Monthly Churn Rate
            const ltv = arpu / (churnRate / 100);

            return ltv;
        } catch (error) {
            console.error('Error calculating LTV:', error);
            return 0;
        }
    },

    /**
     * Calculate Customer Acquisition Cost (CAC)
     * Formula: Total Sales & Marketing Spend / New Customers Acquired
     */
    async calculateCAC(): Promise<number> {
        try {
            const now = new Date();
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

            // Get new customers in last month
            const { count: newCustomers } = await supabase
                .from('user_stores')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', lastMonth.toISOString())
                .lt('created_at', now.toISOString());

            if (!newCustomers || newCustomers === 0) return 0;

            // Estimated marketing spend (you can customize this)
            // This should come from actual expense tracking
            const estimatedMonthlyMarketingSpend = 500; // $500/month in ads, promotions, etc.

            const cac = estimatedMonthlyMarketingSpend / newCustomers;

            return cac;
        } catch (error) {
            console.error('Error calculating CAC:', error);
            return 0;
        }
    },

    /**
     * Calculate Stickiness (DAU/MAU)
     * Measures how often users come back
     */
    async calculateStickiness(): Promise<number> {
        try {
            const now = new Date();
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            // Get Daily Active Users (users who logged in last 24h)
            // Using orders as proxy for activity
            const { data: dailyActive } = await supabase
                .from('orders')
                .select('user_id')
                .gte('created_at', oneDayAgo.toISOString())
                .select('user_id');

            const dau = new Set(dailyActive?.map(o => o.user_id)).size;

            // Get Monthly Active Users (users who logged in last 30 days)
            const { data: monthlyActive } = await supabase
                .from('orders')
                .select('user_id')
                .gte('created_at', thirtyDaysAgo.toISOString())
                .select('user_id');

            const mau = new Set(monthlyActive?.map(o => o.user_id)).size;

            if (mau === 0) return 0;

            const stickiness = (dau / mau) * 100;

            return stickiness;
        } catch (error) {
            console.error('Error calculating stickiness:', error);
            return 0;
        }
    },

    /**
     * Calculate Monthly Churn Rate
     * Formula: (Customers Lost / Starting Customers) * 100
     */
    async calculateChurnRate(): Promise<number> {
        try {
            const now = new Date();
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

            // Customers at start of last month
            const { count: startCustomers } = await supabase
                .from('user_stores')
                .select('*', { count: 'exact', head: true })
                .lt('created_at', lastMonth.toISOString())
                .eq('is_active', true);

            // Customers who churned during last month (became inactive)
            const { count: churnedCustomers } = await supabase
                .from('user_stores')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', false)
                .gte('updated_at', lastMonth.toISOString())
                .lt('updated_at', now.toISOString());

            if (!startCustomers || startCustomers === 0) return 0;

            const churnRate = ((churnedCustomers || 0) / startCustomers) * 100;

            return churnRate;
        } catch (error) {
            console.error('Error calculating churn rate:', error);
            return 0;
        }
    },

    /**
     * Calculate Burn Multiple
     * Formula: Net Burn / Net New ARR
     * Lower is better - indicates capital efficiency
     */
    async calculateBurnMultiple(): Promise<number> {
        try {
            // Net Burn = Monthly expenses - Monthly revenue
            // This requires expense tracking - using estimated values
            const mrr = await this.calculateMRR();
            const estimatedMonthlyExpenses = 2000; // Server costs, marketing, etc.
            const netBurn = Math.max(0, estimatedMonthlyExpenses - mrr);

            // Get Net New ARR (Annual Run Rate change)
            const now = new Date();
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

            const currentARR = mrr * 12;
            const previousMRR = await this.getMRRAtDate(lastMonth);
            const previousARR = previousMRR * 12;

            const netNewARR = currentARR - previousARR;

            if (netNewARR <= 0) return 0; // Not growing

            const burnMultiple = netBurn / (netNewARR / 12); // Monthly basis

            return Math.max(0, burnMultiple);
        } catch (error) {
            console.error('Error calculating burn multiple:', error);
            return 0;
        }
    },

    /**
     * Get comprehensive SaaS metrics
     */
    async getAllMetrics(): Promise<SaaSMetrics> {
        try {
            const [
                mrr,
                nrr,
                ltv,
                cac,
                stickiness,
                churnRate,
                burnMultiple,
                activeUsers,
                newUsers,
                totalRevenue
            ] = await Promise.all([
                this.calculateMRR(),
                this.calculateNRR(),
                this.calculateLTV(),
                this.calculateCAC(),
                this.calculateStickiness(),
                this.calculateChurnRate(),
                this.calculateBurnMultiple(),
                this.getActiveUsers(),
                this.getNewUsers(),
                this.getTotalRevenue()
            ]);

            const arr = mrr * 12;
            const ltvCacRatio = cac > 0 ? ltv / cac : 0;

            return {
                mrr,
                arr,
                nrr,
                ltv,
                cac,
                ltvCacRatio,
                stickiness,
                churnRate,
                burnMultiple,
                activeUsers,
                newUsers,
                totalRevenue,
                costOfAcquisition: cac * newUsers
            };
        } catch (error) {
            console.error('Error getting all metrics:', error);
            return {
                mrr: 0,
                arr: 0,
                nrr: 0,
                ltv: 0,
                cac: 0,
                ltvCacRatio: 0,
                stickiness: 0,
                churnRate: 0,
                burnMultiple: 0,
                activeUsers: 0,
                newUsers: 0,
                totalRevenue: 0,
                costOfAcquisition: 0
            };
        }
    },

    // Helper functions
    async getMRRAtDate(date: Date): Promise<number> {
        const { data } = await supabase
            .from('user_stores')
            .select('subscription_tier')
            .eq('is_active', true)
            .lt('created_at', date.toISOString());

        if (!data) return 0;

        const tierPricing: Record<string, number> = {
            'FREE': 0,
            'STARTER': 25,
            'PROFESSIONAL': 75,
            'ENTERPRISE': 199
        };

        return data.reduce((sum, store) => {
            const tier = store.subscription_tier?.toUpperCase() || 'FREE';
            return sum + (tierPricing[tier] || 0);
        }, 0);
    },

    async getMRRBreakdown(startDate: Date, endDate: Date): Promise<RevenueBreakdown> {
        // This would track upgrades, downgrades, and cancellations
        // For now, returning zeros - implement based on subscription change tracking
        return {
            newMRR: 0,
            expansionMRR: 0,
            contractionMRR: 0,
            churnedMRR: 0
        };
    },

    async calculateARPU(): Promise<number> {
        const mrr = await this.calculateMRR();
        const { count } = await supabase
            .from('user_stores')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true)
            .neq('subscription_tier', 'FREE');

        return (count || 0) > 0 ? mrr / (count || 1) : 0;
    },

    async getActiveUsers(): Promise<number> {
        const { count } = await supabase
            .from('user_profiles')
            .select('*', { count: 'exact', head: true });

        return count || 0;
    },

    async getNewUsers(): Promise<number> {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const { count } = await supabase
            .from('user_profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', lastMonth.toISOString());

        return count || 0;
    },

    async getTotalRevenue(): Promise<number> {
        const { data } = await supabase
            .from('orders')
            .select('total');

        return data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
    },

    /**
     * Get historical metrics for charting
     */
    async getHistoricalMetrics(months: number = 12): Promise<Array<{
        month: string;
        mrr: number;
        churn: number;
        newCustomers: number;
    }>> {
        const history = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

            const mrr = await this.getMRRAtDate(nextMonth);

            const { count: newCustomers } = await supabase
                .from('user_stores')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', month.toISOString())
                .lt('created_at', nextMonth.toISOString());

            history.push({
                month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                mrr,
                churn: 0, // Calculate based on subscription changes
                newCustomers: newCustomers || 0
            });
        }

        return history;
    }
};
