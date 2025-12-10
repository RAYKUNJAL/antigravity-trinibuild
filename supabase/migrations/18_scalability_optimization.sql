-- Migration: 18_scalability_optimization.sql
-- Description: Performance optimization for 50,000+ stores
-- Run this AFTER migrations 13-17

-- ============================================
-- PART 1: PERFORMANCE INDEXES
-- ============================================

-- Products table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS products_store_id_status_idx ON products(store_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS products_store_id_created_idx ON products(store_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS products_category_status_idx ON products(category, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS active_products_idx ON products(store_id) WHERE status = 'active';

-- Orders table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS orders_store_id_status_idx ON orders(store_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS orders_store_id_created_idx ON orders(store_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS orders_user_id_created_idx ON orders(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS orders_status_created_idx ON orders(status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS pending_orders_idx ON orders(store_id) WHERE status = 'pending';
CREATE INDEX CONCURRENTLY IF NOT EXISTS completed_orders_idx ON orders(store_id) WHERE status = 'completed';

-- Product views tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS product_views_product_id_created_idx ON product_views(product_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS product_views_store_id_created_idx ON product_views(store_id, created_at DESC);

-- Notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS notifications_user_id_read_idx ON notifications(user_id, read);
CREATE INDEX CONCURRENTLY IF NOT EXISTS notifications_user_id_created_idx ON notifications(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS unread_notifications_idx ON notifications(user_id) WHERE read = false;

-- Messages
CREATE INDEX CONCURRENTLY IF NOT EXISTS messages_conversation_id_created_idx ON messages(conversation_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS messages_sender_id_idx ON messages(sender_id);

-- Reviews
CREATE INDEX CONCURRENTLY IF NOT EXISTS reviews_product_id_created_idx ON product_reviews(product_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS reviews_store_id_rating_idx ON product_reviews(store_id, rating);

-- Delivery requests
CREATE INDEX CONCURRENTLY IF NOT EXISTS delivery_requests_driver_id_status_idx ON delivery_requests(driver_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS delivery_requests_order_id_idx ON delivery_requests(order_id);

-- ============================================
-- PART 2: MATERIALIZED VIEWS FOR ANALYTICS
-- ============================================

-- Store analytics (refreshed every hour)
CREATE MATERIALIZED VIEW IF NOT EXISTS store_analytics AS
SELECT 
    s.id as store_id,
    s.name as store_name,
    s.slug,
    s.status,
    s.created_at as store_created_at,
    COUNT(DISTINCT p.id) as product_count,
    COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as active_product_count,
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) as completed_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'pending' THEN o.id END) as pending_orders,
    COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total ELSE 0 END), 0) as total_revenue,
    COALESCE(AVG(CASE WHEN o.status = 'completed' THEN o.total END), 0) as avg_order_value,
    COALESCE(AVG(pr.rating), 0) as avg_rating,
    COUNT(DISTINCT pr.id) as review_count,
    COUNT(DISTINCT pv.id) as total_views,
    COUNT(DISTINCT c.id) as customer_count
FROM stores s
LEFT JOIN products p ON p.store_id = s.id
LEFT JOIN orders o ON o.store_id = s.id
LEFT JOIN product_reviews pr ON pr.store_id = s.id
LEFT JOIN product_views pv ON pv.store_id = s.id
LEFT JOIN LATERAL (
    SELECT DISTINCT user_id FROM orders WHERE store_id = s.id
) c ON true
GROUP BY s.id, s.name, s.slug, s.status, s.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS store_analytics_store_id_idx ON store_analytics(store_id);
CREATE INDEX IF NOT EXISTS store_analytics_revenue_idx ON store_analytics(total_revenue DESC);
CREATE INDEX IF NOT EXISTS store_analytics_orders_idx ON store_analytics(total_orders DESC);

-- Product analytics (refreshed every hour)
CREATE MATERIALIZED VIEW IF NOT EXISTS product_analytics AS
SELECT 
    p.id as product_id,
    p.store_id,
    p.name as product_name,
    p.slug,
    p.base_price,
    p.status,
    p.created_at,
    COUNT(DISTINCT oi.id) as times_ordered,
    COALESCE(SUM(oi.quantity), 0) as total_quantity_sold,
    COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue,
    COALESCE(AVG(pr.rating), 0) as avg_rating,
    COUNT(DISTINCT pr.id) as review_count,
    COUNT(DISTINCT pv.id) as view_count,
    COUNT(DISTINCT w.id) as wishlist_count
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.id
LEFT JOIN product_reviews pr ON pr.product_id = p.id
LEFT JOIN product_views pv ON pv.product_id = p.id
LEFT JOIN wishlist_items w ON w.product_id = p.id
GROUP BY p.id, p.store_id, p.name, p.slug, p.base_price, p.status, p.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS product_analytics_product_id_idx ON product_analytics(product_id);
CREATE INDEX IF NOT EXISTS product_analytics_store_id_idx ON product_analytics(store_id);
CREATE INDEX IF NOT EXISTS product_analytics_revenue_idx ON product_analytics(total_revenue DESC);
CREATE INDEX IF NOT EXISTS product_analytics_views_idx ON product_analytics(view_count DESC);

-- ============================================
-- PART 3: AUTO-REFRESH FUNCTIONS
-- ============================================

-- Function to refresh store analytics
CREATE OR REPLACE FUNCTION refresh_store_analytics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY store_analytics;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh product analytics
CREATE OR REPLACE FUNCTION refresh_product_analytics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY product_analytics;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh every hour (requires pg_cron extension)
-- Run this in Supabase SQL Editor if pg_cron is available:
-- SELECT cron.schedule('refresh-store-analytics', '0 * * * *', 'SELECT refresh_store_analytics()');
-- SELECT cron.schedule('refresh-product-analytics', '0 * * * *', 'SELECT refresh_product_analytics()');

-- ============================================
-- PART 4: QUERY OPTIMIZATION FUNCTIONS
-- ============================================

-- Fast store dashboard data
CREATE OR REPLACE FUNCTION get_store_dashboard(p_store_id UUID)
RETURNS TABLE (
    total_products BIGINT,
    active_products BIGINT,
    total_orders BIGINT,
    pending_orders BIGINT,
    completed_orders BIGINT,
    total_revenue NUMERIC,
    avg_order_value NUMERIC,
    total_customers BIGINT,
    avg_rating NUMERIC,
    total_reviews BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        product_count,
        active_product_count,
        total_orders,
        pending_orders,
        completed_orders,
        total_revenue,
        avg_order_value,
        customer_count,
        avg_rating,
        review_count
    FROM store_analytics
    WHERE store_id = p_store_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Fast product search with filters
CREATE OR REPLACE FUNCTION search_products(
    p_store_id UUID,
    p_search_term TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_min_price NUMERIC DEFAULT NULL,
    p_max_price NUMERIC DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    base_price NUMERIC,
    image_url TEXT,
    stock INTEGER,
    status TEXT,
    avg_rating NUMERIC,
    review_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.slug,
        p.base_price,
        p.image_url,
        p.stock,
        p.status,
        COALESCE(pa.avg_rating, 0) as avg_rating,
        COALESCE(pa.review_count, 0) as review_count
    FROM products p
    LEFT JOIN product_analytics pa ON pa.product_id = p.id
    WHERE p.store_id = p_store_id
        AND p.status = 'active'
        AND (p_search_term IS NULL OR p.name ILIKE '%' || p_search_term || '%')
        AND (p_category IS NULL OR p.category = p_category)
        AND (p_min_price IS NULL OR p.base_price >= p_min_price)
        AND (p_max_price IS NULL OR p.base_price <= p_max_price)
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- PART 5: DATABASE CONFIGURATION
-- ============================================

-- Optimize autovacuum for high-traffic tables
ALTER TABLE products SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE orders SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE product_views SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE notifications SET (autovacuum_vacuum_scale_factor = 0.1);

-- Set statistics target for better query planning
ALTER TABLE products ALTER COLUMN store_id SET STATISTICS 1000;
ALTER TABLE orders ALTER COLUMN store_id SET STATISTICS 1000;
ALTER TABLE products ALTER COLUMN status SET STATISTICS 1000;
ALTER TABLE orders ALTER COLUMN status SET STATISTICS 1000;

-- ============================================
-- PART 6: PARTITIONING PREPARATION
-- ============================================

-- Create partitioned table for product_views (by month)
-- This will be useful when you have millions of views
CREATE TABLE IF NOT EXISTS product_views_partitioned (
    id UUID DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL,
    store_id UUID NOT NULL,
    user_id UUID,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
) PARTITION BY RANGE (created_at);

-- Create partitions for current and next 6 months
-- Run this monthly to create new partitions
CREATE TABLE IF NOT EXISTS product_views_2025_12 PARTITION OF product_views_partitioned
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

CREATE TABLE IF NOT EXISTS product_views_2026_01 PARTITION OF product_views_partitioned
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Indexes on partitioned table
CREATE INDEX IF NOT EXISTS product_views_part_product_id_idx ON product_views_partitioned(product_id);
CREATE INDEX IF NOT EXISTS product_views_part_store_id_idx ON product_views_partitioned(store_id);
CREATE INDEX IF NOT EXISTS product_views_part_created_idx ON product_views_partitioned(created_at DESC);

-- ============================================
-- PART 7: RATE LIMITING
-- ============================================

-- API rate limiting table
CREATE TABLE IF NOT EXISTS api_rate_limits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    ip_address INET,
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 0,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS api_rate_limits_user_id_idx ON api_rate_limits(user_id, endpoint, window_start);
CREATE INDEX IF NOT EXISTS api_rate_limits_ip_idx ON api_rate_limits(ip_address, endpoint, window_start);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_user_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_endpoint TEXT DEFAULT 'default',
    p_max_requests INTEGER DEFAULT 100,
    p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
    v_identifier TEXT;
BEGIN
    -- Use user_id if available, otherwise IP
    v_identifier := COALESCE(p_user_id::TEXT, p_ip_address::TEXT);
    
    -- Get request count in current window
    SELECT request_count INTO v_count
    FROM api_rate_limits
    WHERE (user_id = p_user_id OR ip_address = p_ip_address)
        AND endpoint = p_endpoint
        AND window_start > NOW() - (p_window_minutes || ' minutes')::INTERVAL
    ORDER BY window_start DESC
    LIMIT 1;

    -- If no record or window expired, create new
    IF v_count IS NULL THEN
        INSERT INTO api_rate_limits (user_id, ip_address, endpoint, request_count)
        VALUES (p_user_id, p_ip_address, p_endpoint, 1);
        RETURN TRUE;
    END IF;

    -- Check if limit exceeded
    IF v_count >= p_max_requests THEN
        RETURN FALSE;
    END IF;

    -- Increment counter
    UPDATE api_rate_limits
    SET request_count = request_count + 1
    WHERE (user_id = p_user_id OR ip_address = p_ip_address)
        AND endpoint = p_endpoint
        AND window_start > NOW() - (p_window_minutes || ' minutes')::INTERVAL;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 8: CLEANUP OLD DATA
-- ============================================

-- Function to archive old product views (keep last 90 days)
CREATE OR REPLACE FUNCTION archive_old_product_views()
RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM product_views
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old notifications (keep last 30 days for read, 90 for unread)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE (read = true AND created_at < NOW() - INTERVAL '30 days')
        OR (read = false AND created_at < NOW() - INTERVAL '90 days');
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (requires pg_cron)
-- SELECT cron.schedule('archive-product-views', '0 2 * * *', 'SELECT archive_old_product_views()');
-- SELECT cron.schedule('cleanup-notifications', '0 3 * * *', 'SELECT cleanup_old_notifications()');

-- ============================================
-- PART 9: MONITORING QUERIES
-- ============================================

-- View to monitor slow queries
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
WHERE mean_time > 100 -- queries taking more than 100ms on average
ORDER BY mean_time DESC
LIMIT 50;

-- View to monitor table sizes
CREATE OR REPLACE VIEW table_sizes AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;

-- View to monitor index usage
CREATE OR REPLACE VIEW index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON MATERIALIZED VIEW store_analytics IS 'Aggregated store metrics, refreshed hourly';
COMMENT ON MATERIALIZED VIEW product_analytics IS 'Aggregated product metrics, refreshed hourly';
COMMENT ON FUNCTION get_store_dashboard IS 'Fast dashboard data retrieval using materialized views';
COMMENT ON FUNCTION search_products IS 'Optimized product search with filters and pagination';
COMMENT ON FUNCTION check_rate_limit IS 'Rate limiting for API endpoints';
COMMENT ON TABLE api_rate_limits IS 'Rate limiting tracking for API abuse prevention';

-- ============================================
-- INITIAL DATA REFRESH
-- ============================================

-- Refresh materialized views after creation
SELECT refresh_store_analytics();
SELECT refresh_product_analytics();

-- ============================================
-- VERIFICATION
-- ============================================

-- Check that all indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('products', 'orders', 'product_views', 'notifications', 'messages')
ORDER BY tablename, indexname;

-- Check materialized views
SELECT 
    schemaname,
    matviewname,
    ispopulated
FROM pg_matviews
WHERE schemaname = 'public';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Scalability optimization complete!';
    RAISE NOTICE '✅ All performance indexes created';
    RAISE NOTICE '✅ Materialized views created and populated';
    RAISE NOTICE '✅ Optimization functions created';
    RAISE NOTICE '✅ Rate limiting implemented';
    RAISE NOTICE '✅ System ready for 50,000+ stores!';
END $$;
