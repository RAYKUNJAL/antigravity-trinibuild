/**
 * TriniBuild System Diagnostic Tool
 * Checks database connectivity, tables, and API endpoints
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Helper to read env variables from .env.local
function getEnvVars() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) return {};

        const content = fs.readFileSync(envPath, 'utf-8');
        const env: Record<string, string> = {};

        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
                env[key] = value;
            }
        });
        return env;
    } catch (e) {
        return {};
    }
}

const env = getEnvVars();
const supabaseUrl = env['VITE_SUPABASE_URL'] || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'] || process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('--- Debug ---');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? (supabaseKey.substring(0, 10) + '...') : 'MISSING');
console.log('-------------\n');

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  Could not load Supabase credentials from .env.local');
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface DiagnosticResult {
    category: string;
    test: string;
    status: 'PASS' | 'FAIL' | 'WARN';
    message: string;
    details?: any;
}

const results: DiagnosticResult[] = [];

async function checkDatabaseConnection() {
    console.log('\n🔍 Checking Database Connection...\n');

    try {
        const { data, error } = await supabase.from('profiles').select('count');

        if (error) {
            results.push({
                category: 'Database',
                test: 'Connection',
                status: 'FAIL',
                message: 'Failed to connect to database',
                details: error
            });
            return false;
        }

        results.push({
            category: 'Database',
            test: 'Connection',
            status: 'PASS',
            message: 'Successfully connected to Supabase'
        });
        return true;
    } catch (err) {
        results.push({
            category: 'Database',
            test: 'Connection',
            status: 'FAIL',
            message: 'Exception during connection test',
            details: err
        });
        return false;
    }
}

async function checkRequiredTables() {
    console.log('🔍 Checking Required Tables...\n');

    const requiredTables = [
        'profiles',
        'jobs',
        'real_estate_listings',
        'events',
        'tickets',
        'site_settings',
        'page_views',
        'support_messages',
        'location_keyword_heatmap',
        'rides',
        'drivers',
        'ad_campaigns'
    ];

    for (const table of requiredTables) {
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);

            if (error) {
                results.push({
                    category: 'Database',
                    test: `Table: ${table}`,
                    status: 'FAIL',
                    message: `Table does not exist or is not accessible`,
                    details: error
                });
            } else {
                results.push({
                    category: 'Database',
                    test: `Table: ${table}`,
                    status: 'PASS',
                    message: `Table exists and is accessible`
                });
            }
        } catch (err) {
            results.push({
                category: 'Database',
                test: `Table: ${table}`,
                status: 'FAIL',
                message: `Exception while checking table`,
                details: err
            });
        }
    }
}

async function checkDataCounts() {
    console.log('\n🔍 Checking Data Counts...\n');

    const tables = [
        { name: 'profiles', label: 'Users' },
        { name: 'jobs', label: 'Jobs' },
        { name: 'real_estate_listings', label: 'Properties' },
        { name: 'events', label: 'Events' },
        { name: 'tickets', label: 'Tickets' },
        { name: 'rides', label: 'Rides' },
        { name: 'ad_campaigns', label: 'Ad Campaigns' }
    ];

    for (const table of tables) {
        try {
            const { count, error } = await supabase
                .from(table.name)
                .select('*', { count: 'exact', head: true });

            if (error) {
                results.push({
                    category: 'Data',
                    test: table.label,
                    status: 'WARN',
                    message: `Could not count records`,
                    details: error
                });
            } else {
                const status = count === 0 ? 'WARN' : 'PASS';
                results.push({
                    category: 'Data',
                    test: table.label,
                    status,
                    message: `Found ${count} records`,
                    details: { count }
                });
            }
        } catch (err) {
            results.push({
                category: 'Data',
                test: table.label,
                status: 'FAIL',
                message: `Exception while counting`,
                details: err
            });
        }
    }
}

async function checkSiteSettings() {
    console.log('\n🔍 Checking Site Settings...\n');

    const requiredSettings = [
        'ai_boost_vendors',
        'ai_location_content',
        'ai_load_balancing'
    ];

    for (const key of requiredSettings) {
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('*')
                .eq('key', key)
                .single();

            if (error || !data) {
                results.push({
                    category: 'Settings',
                    test: key,
                    status: 'WARN',
                    message: `Setting not found - will use default`,
                    details: error
                });
            } else {
                results.push({
                    category: 'Settings',
                    test: key,
                    status: 'PASS',
                    message: `Setting exists: ${data.value}`,
                    details: data
                });
            }
        } catch (err) {
            results.push({
                category: 'Settings',
                test: key,
                status: 'FAIL',
                message: `Exception while checking setting`,
                details: err
            });
        }
    }
}

function printResults() {
    console.log('\n' + '='.repeat(80));
    console.log('DIAGNOSTIC RESULTS');
    console.log('='.repeat(80) + '\n');

    const categories = [...new Set(results.map(r => r.category))];

    for (const category of categories) {
        console.log(`\n📊 ${category}`);
        console.log('-'.repeat(80));

        const categoryResults = results.filter(r => r.category === category);

        for (const result of categoryResults) {
            const icon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌';
            console.log(`${icon} ${result.test}: ${result.message}`);

            if (result.details && result.status !== 'PASS') {
                console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
            }
        }
    }

    // Summary
    const passed = results.filter(r => r.status === 'PASS').length;
    const warned = results.filter(r => r.status === 'WARN').length;
    const failed = results.filter(r => r.status === 'FAIL').length;

    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Passed: ${passed}`);
    console.log(`⚠️  Warnings: ${warned}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total Tests: ${results.length}`);

    if (failed > 0) {
        console.log('\n🚨 CRITICAL ISSUES DETECTED - System is not production ready');
    } else if (warned > 0) {
        console.log('\n⚠️  WARNINGS DETECTED - System may have missing data');
    } else {
        console.log('\n✅ ALL TESTS PASSED - System is healthy');
    }

    console.log('='.repeat(80) + '\n');
}

async function runDiagnostics() {
    console.log('🚀 Starting TriniBuild System Diagnostics...\n');

    const connected = await checkDatabaseConnection();

    if (connected) {
        await checkRequiredTables();
        await checkDataCounts();
        await checkSiteSettings();
    } else {
        console.log('\n❌ Cannot proceed - Database connection failed');
        console.log('Please check your .env.local file and ensure:');
        console.log('  - VITE_SUPABASE_URL is set correctly');
        console.log('  - VITE_SUPABASE_ANON_KEY is set correctly');
    }

    printResults();

    // Return exit code
    const failed = results.filter(r => r.status === 'FAIL').length;
    process.exit(failed > 0 ? 1 : 0);
}

// Run diagnostics
runDiagnostics().catch(err => {
    console.error('Fatal error during diagnostics:', err);
    process.exit(1);
});
