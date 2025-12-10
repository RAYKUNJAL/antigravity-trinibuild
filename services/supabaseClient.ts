
import { createClient } from '@supabase/supabase-js';

// These environment variables will need to be set in your .env file
// For development, we'll use placeholders if they aren't present
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables!');
    console.error('Please check your .env.local file and ensure:');
    console.error('  - VITE_SUPABASE_URL is set');
    console.error('  - VITE_SUPABASE_ANON_KEY is set');
} else {
    console.log('✅ Supabase configuration loaded');
    console.log('📍 URL:', supabaseUrl);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    }
});

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
    return supabaseUrl !== '' && supabaseAnonKey !== '';
};

// Test database connection
export const testConnection = async () => {
    if (!isSupabaseConfigured()) {
        return {
            success: false,
            error: 'Supabase not configured - missing environment variables'
        };
    }

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);

        if (error) {
            console.error('❌ Database connection test failed:', error);
            return {
                success: false,
                error: error.message
            };
        }

        console.log('✅ Database connection successful');
        return {
            success: true,
            message: 'Connected to Supabase'
        };
    } catch (err: any) {
        console.error('❌ Database connection exception:', err);
        return {
            success: false,
            error: err.message || 'Unknown error'
        };
    }
};

// Check if a specific table exists and is accessible
export const checkTable = async (tableName: string) => {
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

        if (error) {
            return {
                exists: false,
                accessible: false,
                error: error.message
            };
        }

        return {
            exists: true,
            accessible: true,
            hasData: data && data.length > 0
        };
    } catch (err: any) {
        return {
            exists: false,
            accessible: false,
            error: err.message || 'Unknown error'
        };
    }
};

// Get database health status
export const getDatabaseHealth = async () => {
    const connectionTest = await testConnection();

    if (!connectionTest.success) {
        return {
            status: 'unhealthy' as const,
            message: connectionTest.error || 'Cannot connect to database',
            details: null
        };
    }

    // Check critical tables
    const criticalTables = ['profiles', 'jobs', 'real_estate_listings', 'events'];
    const tableChecks = await Promise.all(
        criticalTables.map(async (table) => ({
            table,
            ...(await checkTable(table))
        }))
    );

    const allTablesAccessible = tableChecks.every(check => check.accessible);
    const missingTables = tableChecks.filter(check => !check.exists).map(c => c.table);

    if (missingTables.length > 0) {
        return {
            status: 'degraded' as const,
            message: `Missing tables: ${missingTables.join(', ')}`,
            details: tableChecks
        };
    }

    if (!allTablesAccessible) {
        return {
            status: 'degraded' as const,
            message: 'Some tables are not accessible',
            details: tableChecks
        };
    }

    return {
        status: 'healthy' as const,
        message: 'All systems operational',
        details: tableChecks
    };
};
