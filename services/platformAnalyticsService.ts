import { supabase } from './supabaseClient';

export interface PlatformStats {
    totalRevenue: number;
    totalUsers: number;
    activeStores: number;
    totalOrders: number;
    revenueGrowth: number;
    userGrowth: number;
}

export interface RevenueByVertical {
    vertical: string;
    revenue: number;
    orders: number;
    growth: number;
}

export interface UserGrowth {
    date: string;
    newUsers: number;
    totalUsers: number;
}

export interface TopPerformer {
    id: string;
    name: string;
    revenue: number;
    orders: number;
    type: 'store' | 'event' | 'property' | 'driver';
}

export const platformAnalyticsService = {
    // Overall Platform Statistics
    async getPlatformStats(): Promise<PlatformStats> {
        try {
            // Get total revenue from orders
            const { data: orders } = await supabase
                .from('orders')
                .select('total');
            const totalRevenue = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

            // Get total users
            const { count: totalUsers } = await supabase
                .from('user_profiles')
                .select('*', { count: 'exact', head: true });

            // Get active stores
            const { count: activeStores } = await supabase
                .from('user_stores')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            // Get total orders
            const { count: totalOrders } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true });

            // Calculate growth (last 30 days vs previous 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const sixtyDaysAgo = new Date();
            sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

            const { data: recentOrders } = await supabase
                .from('orders')
                .select('total')
                .gte('created_at', thirtyDaysAgo.toISOString());
            const recentRevenue = recentOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

            const { data: previousOrders } = await supabase
                .from('orders')
                .select('total')
                .gte('created_at', sixtyDaysAgo.toISOString())
                .lt('created_at', thirtyDaysAgo.toISOString());
            const previousRevenue = previousOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

            const revenueGrowth = previousRevenue > 0
                ? ((recentRevenue - previousRevenue) / previousRevenue) * 100
                : 0;

            // User growth
            const { count: recentUsers } = await supabase
                .from('user_profiles')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', thirtyDaysAgo.toISOString());

            const { count: previousUsers } = await supabase
                .from('user_profiles')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', sixtyDaysAgo.toISOString())
                .lt('created_at', thirtyDaysAgo.toISOString());

            const userGrowth = (previousUsers || 0) > 0
                ? (((recentUsers || 0) - (previousUsers || 0)) / (previousUsers || 0)) * 100
                : 0;

            return {
                totalRevenue,
                totalUsers: totalUsers || 0,
                activeStores: activeStores || 0,
                totalOrders: totalOrders || 0,
                revenueGrowth,
                userGrowth
            };
        } catch (error) {
            console.error('Error fetching platform stats:', error);
            return {
                totalRevenue: 0,
                totalUsers: 0,
                activeStores: 0,
                totalOrders: 0,
                revenueGrowth: 0,
                userGrowth: 0
            };
        }
    },

    // Revenue by Vertical
    async getRevenueByVertical(): Promise<RevenueByVertical[]> {
        try {
            const verticals: RevenueByVertical[] = [];

            // Marketplace/Stores
            const { data: storeOrders } = await supabase
                .from('orders')
                .select('total');
            const storeRevenue = storeOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

            verticals.push({
                vertical: 'Marketplace',
                revenue: storeRevenue,
                orders: storeOrders?.length || 0,
                growth: 0 // TODO: Calculate growth
            });

            // Events/Tickets
            const { data: ticketSales } = await supabase
                .from('ticket_purchases')
                .select('total_amount');
            const ticketRevenue = ticketSales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;

            verticals.push({
                vertical: 'Events & Tickets',
                revenue: ticketRevenue,
                orders: ticketSales?.length || 0,
                growth: 0
            });

            // Real Estate (count active listings as metric)
            const { count: propertyCount } = await supabase
                .from('properties')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');

            verticals.push({
                vertical: 'Real Estate',
                revenue: 0, // Commission-based, tracked separately
                orders: propertyCount || 0,
                growth: 0
            });

            // Jobs
            const { count: jobCount } = await supabase
                .from('jobs')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'open');

            verticals.push({
                vertical: 'Jobs',
                revenue: 0, // Job posting fees
                orders: jobCount || 0,
                growth: 0
            });

            // Rides
            const { count: rideCount } = await supabase
                .from('rides')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'completed');

            verticals.push({
                vertical: 'Rides',
                revenue: 0, // Ride revenue
                orders: rideCount || 0,
                growth: 0
            });

            return verticals;
        } catch (error) {
            console.error('Error fetching revenue by vertical:', error);
            return [];
        }
    },

    // User Growth Over Time
    async getUserGrowth(days: number = 30): Promise<UserGrowth[]> {
        try {
            const growth: UserGrowth[] = [];
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const { data: users } = await supabase
                .from('user_profiles')
                .select('created_at')
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: true });

            if (!users) return [];

            // Group by date
            const dateMap: Record<string, number> = {};
            users.forEach(user => {
                const date = new Date(user.created_at).toISOString().split('T')[0];
                dateMap[date] = (dateMap[date] || 0) + 1;
            });

            let cumulativeTotal = 0;
            Object.entries(dateMap).forEach(([date, newUsers]) => {
                cumulativeTotal += newUsers;
                growth.push({
                    date,
                    newUsers,
                    totalUsers: cumulativeTotal
                });
            });

            return growth;
        } catch (error) {
            console.error('Error fetching user growth:', error);
            return [];
        }
    },

    // Top Performers
    async getTopPerformers(limit: number = 10): Promise<TopPerformer[]> {
        try {
            const performers: TopPerformer[] = [];

            // Top stores by revenue
            const { data: stores } = await supabase
                .from('user_stores')
                .select(`
                    id,
                    business_name,
                    orders (total)
                `)
                .limit(limit);

            stores?.forEach(store => {
                const revenue = (store.orders as any[])?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
                performers.push({
                    id: store.id,
                    name: store.business_name,
                    revenue,
                    orders: (store.orders as any[])?.length || 0,
                    type: 'store'
                });
            });

            // Sort by revenue and limit
            performers.sort((a, b) => b.revenue - a.revenue);
            return performers.slice(0, limit);
        } catch (error) {
            console.error('Error fetching top performers:', error);
            return [];
        }
    },

    // Revenue Trend (daily for last 30 days)
    async getRevenueTrend(days: number = 30): Promise<{ date: string; revenue: number }[]> {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const { data: orders } = await supabase
                .from('orders')
                .select('created_at, total')
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: true });

            if (!orders) return [];

            // Group by date
            const dateMap: Record<string, number> = {};
            orders.forEach(order => {
                const date = new Date(order.created_at).toISOString().split('T')[0];
                dateMap[date] = (dateMap[date] || 0) + (order.total || 0);
            });

            return Object.entries(dateMap).map(([date, revenue]) => ({
                date,
                revenue
            }));
        } catch (error) {
            console.error('Error fetching revenue trend:', error);
            return [];
        }
    }
};
