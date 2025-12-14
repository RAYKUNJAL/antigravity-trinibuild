-- ================================================
-- VERIFY VIDEO ADS MIGRATION
-- Run this after executing 40_video_ads_system.sql
-- ================================================

-- Check if all tables exist
SELECT 
    'ad_campaigns' as table_name,
    COUNT(*) as record_count
FROM ad_campaigns
UNION ALL
SELECT 
    'video_ads' as table_name,
    COUNT(*) as record_count
FROM video_ads
UNION ALL
SELECT 
    'ad_placements' as table_name,
    COUNT(*) as record_count
FROM ad_placements
UNION ALL
SELECT 
    'ad_analytics' as table_name,
    COUNT(*) as record_count
FROM ad_analytics
UNION ALL
SELECT 
    'ad_creative_variants' as table_name,
    COUNT(*) as record_count
FROM ad_creative_variants
UNION ALL
SELECT 
    'ad_budget_logs' as table_name,
    COUNT(*) as record_count
FROM ad_budget_logs;

-- Expected output:
-- All 6 tables should show with 0 or 1 records
-- (ad_campaigns might have 1 record from the sample data)
