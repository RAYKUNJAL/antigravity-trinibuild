import { supabase } from './supabaseClient';
import { revenueMetricsService } from './revenueMetricsService';

export interface ExtendedSaaSMetrics {
    // Financial Metrics
    ebitda: number;                 // Earnings Before Interest, Taxes, Depreciation, Amortization
    operatingCashFlow: number;      // Cash generated from operations
    runway: number;                 // Months of cash remaining (based on burn rate)

    // Growth & Retention
    retentionRate: number;          // Customer retention rate (%)
    growthRate: number;            // Month-over-month growth (%)
    aiSearchVisibility: number;     // AI search ranking/visibility score (0-100)

    // Supporting Data
    currentCashBalance: number;
    monthlyBurn: number;
    monthlyRevenue: number;
}

export const extendedMetricsService = {
    /**
     * Calculate EBITDA
     * Formula: Revenue - Operating Expenses (excluding interest, taxes, depreciation, amortization)
     */
    async calculateEBITDA(): Promise<number> {
        try {
            const now = new Date();
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

            // Get monthly revenue from subscriptions
            const mrr = await revenueMetricsService.calculateMRR();

            // Get revenue from orders in last month
            const { data: orders } = await supabase
                .from('orders')
                .select('total')
                .gte('created_at', lastMonth.toISOString())
                .lt('created_at', now.toISOString());

            const orderRevenue = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
            const totalRevenue = mrr + orderRevenue;

            // Operating expenses (should come from expense tracking)
            // For now, using estimates: Server ($200), Marketing ($500), Operations ($300)
            const operatingExpenses = 1000;

            // EBITDA = Revenue - Operating Expenses
            const ebitda = totalRevenue - operatingExpenses;

            return ebitda;
        } catch (error) {
            console.error('Error calculating EBITDA:', error);
            return 0;
        }
    },

    /**
     * Calculate Operating Cash Flow
     * Formula: Cash from operations = Revenue - Operating Expenses + Non-cash adjustments
     */
    async calculateOperatingCashFlow(): Promise<number> {
        try {
            const ebitda = await this.calculateEBITDA();

            // Adjust for actual cash collection (simplified - assumes 100% cash collection)
            // In reality, would account for AR, AP, inventory changes
            const operatingCashFlow = ebitda;

            return operatingCashFlow;
        } catch (error) {
            console.error('Error calculating operating cash flow:', error);
            return 0;
        }
    },

    /**
     * Calculate Runway (months of cash remaining)
     * Formula: Current Cash Balance / Monthly Burn Rate
     */
    async calculateRunway(): Promise<number> {
        try {
            // Current cash balance (should come from bank integration/manual input)
            // For demo: assuming $50,000 starting capital
            const currentCashBalance = 50000;

            const mrr = await revenueMetricsService.calculateMRR();
            const monthlyExpenses = 2000; // From burn multiple calculation
            const monthlyBurn = Math.max(0, monthlyExpenses - mrr);

            if (monthlyBurn === 0) return 999; // Profitable - infinite runway

            const runway = currentCashBalance / monthlyBurn;

            return Math.max(0, runway);
        } catch (error) {
            console.error('Error calculating runway:', error);
            return 0;
        }
    },

    /**
     * Calculate Retention Rate
     * Formula: (Customers at End - New Customers) / Customers at Start * 100
     */
    async calculateRetentionRate(): Promise<number> {
        try {
            const now = new Date();
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

            // Customers at start of month
            const { count: startCustomers } = await supabase
                .from('user_stores')
                .select('*', { count: 'exact', head: true })
                .lt('created_at', lastMonth.toISOString())
                .eq('is_active', true);

            // New customers during month
            const { count: newCustomers } = await supabase
                .from('user_stores')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', lastMonth.toISOString())
                .lt('created_at', now.toISOString());

            // Current active customers
            const { count: currentCustomers } = await supabase
                .from('user_stores')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            if (!startCustomers || startCustomers === 0) return 100;

            // Retention = (Current - New) / Start * 100
            const retainedCustomers = (currentCustomers || 0) - (newCustomers || 0);
            const retentionRate = (retainedCustomers / startCustomers) * 100;

            return Math.max(0, Math.min(100, retentionRate));
        } catch (error) {
            console.error('Error calculating retention rate:', error);
            return 0;
        }
    },

    /**
     * Calculate Growth Rate (MoM)
     * Formula: (Current Month MRR - Last Month MRR) / Last Month MRR * 100
     */
    async calculateGrowthRate(): Promise<number> {
        try {
            const now = new Date();
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

            const currentMRR = await revenueMetricsService.calculateMRR();
            const previousMRR = await revenueMetricsService.getMRRAtDate(lastMonth);

            if (previousMRR === 0) return currentMRR > 0 ? 100 : 0;

            const growthRate = ((currentMRR - previousMRR) / previousMRR) * 100;

            return growthRate;
        } catch (error) {
            console.error('Error calculating growth rate:', error);
            return 0;
        }
    },

    /**
     * Calculate AI Search Visibility Score
     * Based on: content quality, backlinks, brand mentions, structured data
     * Score from 0-100
     */
    async calculateAISearchVisibility(): Promise<number> {
        try {
            let score = 0;

            // Factor 1: Content Volume (blog posts, pages)
            const { count: blogCount } = await supabase
                .from('blog_posts')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'published');

            score += Math.min(30, (blogCount || 0) * 2); // Max 30 points for content

            // Factor 2: Active listings (indicates platform activity)
            const { count: storeCount } = await supabase
                .from('user_stores')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            score += Math.min(20, (storeCount || 0) * 4); // Max 20 points for stores

            // Factor 3: User engagement (orders, reviews)
            const { count: orderCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true });

            score += Math.min(25, (orderCount || 0) * 0.5); // Max 25 points for engagement

            // Factor 4:  Schema markup & SEO (assumed implemented)
            score += 15; // Static 15 points for having structured data

            // Factor 5: Social signals (user count as proxy)
            const { count: userCount } = await supabase
                .from('user_profiles')
                .select('*', { count: 'exact', head: true });

            score += Math.min(10, (userCount || 0) * 0.1); // Max 10 points for users

            return Math.min(100, score);
        } catch (error) {
            console.error('Error calculating AI search visibility:', error);
            return 0;
        }
    },

    /**
     * Get all extended metrics
     */
    async getAllExtendedMetrics(): Promise<ExtendedSaaSMetrics> {
        try {
            const [
                ebitda,
                operatingCashFlow,
                runway,
                retentionRate,
                growthRate,
                aiSearchVisibility
            ] = await Promise.all([
                this.calculateEBITDA(),
                this.calculateOperatingCashFlow(),
                this.calculateRunway(),
                this.calculateRetentionRate(),
                this.calculateGrowthRate(),
                this.calculateAISearchVisibility()
            ]);

            const mrr = await revenueMetricsService.calculateMRR();
            const monthlyExpenses = 2000;
            const monthlyBurn = Math.max(0, monthlyExpenses - mrr);

            return {
                ebitda,
                operatingCashFlow,
                runway,
                retentionRate,
                growthRate,
                aiSearchVisibility,
                currentCashBalance: 50000, // Should come from actual cash tracking
                monthlyBurn,
                monthlyRevenue: mrr
            };
        } catch (error) {
            console.error('Error getting extended metrics:', error);
            return {
                ebitda: 0,
                operatingCashFlow: 0,
                runway: 0,
                retentionRate: 0,
                growthRate: 0,
                aiSearchVisibility: 0,
                currentCashBalance: 0,
                monthlyBurn: 0,
                monthlyRevenue: 0
            };
        }
    }
};
