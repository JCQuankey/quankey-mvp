-- QUANKEY SECURITY INITIALIZATION SCRIPT
-- PostgreSQL security setup with RLS, audit logging, and monitoring

-- ===========================================
-- EXTENSIONS AND BASIC SETUP
-- ===========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; 
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create application user (not superuser)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'quankey_app') THEN
        CREATE ROLE quankey_app WITH LOGIN PASSWORD 'CHANGE_THIS_IN_PRODUCTION';
        GRANT CONNECT ON DATABASE postgres TO quankey_app;
        GRANT USAGE ON SCHEMA public TO quankey_app;
        GRANT CREATE ON SCHEMA public TO quankey_app;
    END IF;
END
$$;

-- ===========================================
-- ROW LEVEL SECURITY SETUP
-- ===========================================

-- Enable RLS on all critical tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY; 
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE quantum_keys ENABLE ROW LEVEL SECURITY;

-- Users table policies
DROP POLICY IF EXISTS user_read_own_profile ON users;
CREATE POLICY user_read_own_profile ON users
    FOR SELECT
    USING (id = current_setting('app.current_user_id', true)::uuid);

DROP POLICY IF EXISTS user_update_own_profile ON users;
CREATE POLICY user_update_own_profile ON users
    FOR UPDATE
    USING (id = current_setting('app.current_user_id', true)::uuid);

-- Passwords table policies
DROP POLICY IF EXISTS user_isolation_passwords ON passwords;
CREATE POLICY user_isolation_passwords ON passwords
    FOR ALL
    USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Sessions table policies  
DROP POLICY IF EXISTS user_isolation_sessions ON sessions;
CREATE POLICY user_isolation_sessions ON sessions
    FOR ALL
    USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Audit logs policies
DROP POLICY IF EXISTS user_isolation_audit ON audit_logs;
CREATE POLICY user_isolation_audit ON audit_logs
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Recovery shares policies
DROP POLICY IF EXISTS user_isolation_recovery ON recovery_shares;
CREATE POLICY user_isolation_recovery ON recovery_shares
    FOR ALL
    USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Quantum keys policies
DROP POLICY IF EXISTS user_isolation_quantum_keys ON quantum_keys;
CREATE POLICY user_isolation_quantum_keys ON quantum_keys
    FOR ALL
    USING (
        user_id = current_setting('app.current_user_id', true)::uuid 
        OR user_id IS NULL -- System keys accessible by all
    );

-- ===========================================
-- AUDIT TRIGGERS
-- ===========================================

-- Create audit trigger function
CREATE OR REPLACE FUNCTION trigger_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    user_id_val uuid;
    ip_addr inet;
    user_agent_val text;
BEGIN
    -- Get current user context
    BEGIN
        user_id_val := current_setting('app.current_user_id', true)::uuid;
        ip_addr := current_setting('app.client_ip', true)::inet;
        user_agent_val := current_setting('app.user_agent', true);
    EXCEPTION WHEN OTHERS THEN
        user_id_val := NULL;
        ip_addr := NULL;
        user_agent_val := NULL;
    END;

    -- Insert audit log
    INSERT INTO audit_logs (
        user_id,
        action, 
        table_name,
        record_id,
        old_data,
        new_data,
        ip_address,
        user_agent,
        hash,
        timestamp
    ) VALUES (
        user_id_val,
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
        ip_addr,
        user_agent_val,
        encode(digest(
            CONCAT(
                COALESCE(user_id_val::text, 'anonymous'),
                ':',
                TG_OP,
                ':',
                TG_TABLE_NAME,
                ':',
                EXTRACT(EPOCH FROM NOW())::text
            ), 
            'sha256'
        ), 'hex'),
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_users ON users;
CREATE TRIGGER audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();

DROP TRIGGER IF EXISTS audit_passwords ON passwords;  
CREATE TRIGGER audit_passwords
    AFTER INSERT OR UPDATE OR DELETE ON passwords
    FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();

DROP TRIGGER IF EXISTS audit_sessions ON sessions;
CREATE TRIGGER audit_sessions
    AFTER INSERT OR UPDATE OR DELETE ON sessions
    FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();

DROP TRIGGER IF EXISTS audit_quantum_keys ON quantum_keys;
CREATE TRIGGER audit_quantum_keys
    AFTER INSERT OR UPDATE OR DELETE ON quantum_keys
    FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();

-- ===========================================
-- PERFORMANCE INDEXES
-- ===========================================

-- Users indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active 
    ON users(email) WHERE deleted_at IS NULL;
    
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_webauthn_id 
    ON users(webauthn_id) WHERE webauthn_id IS NOT NULL;

-- Passwords indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_passwords_user_category 
    ON passwords(user_id, category);
    
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_passwords_quantum 
    ON passwords(user_id) WHERE is_quantum = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_passwords_kem_encrypted 
    ON passwords(user_id) WHERE kem_encrypted = true;

-- Sessions indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_active 
    ON sessions(user_id, expires_at) WHERE active = true;
    
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_cleanup 
    ON sessions(expires_at) WHERE active = false OR revoked = true;

-- Audit logs indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_time 
    ON audit_logs(user_id, timestamp DESC);
    
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action 
    ON audit_logs(action, timestamp DESC);

-- Rate limits indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rate_limits_cleanup 
    ON rate_limits(window_end) WHERE window_end < NOW();

-- ===========================================
-- SECURITY FUNCTIONS
-- ===========================================

-- Function to securely delete expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
    -- Delete expired sessions
    DELETE FROM sessions 
    WHERE expires_at < NOW() - INTERVAL '7 days'
    OR (revoked = true AND revoked_at < NOW() - INTERVAL '1 day');
    
    -- Delete old rate limit records
    DELETE FROM rate_limits 
    WHERE window_end < NOW() - INTERVAL '1 hour';
    
    -- Archive old audit logs (keep 1 year)
    -- In production, move to archive table instead of delete
    DELETE FROM audit_logs 
    WHERE timestamp < NOW() - INTERVAL '1 year';
    
    -- Vacuum tables for performance
    PERFORM pg_stat_user_tables.schemaname 
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public';
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate secure passwords
CREATE OR REPLACE FUNCTION generate_secure_password(length int DEFAULT 32)
RETURNS text AS $$
DECLARE
    chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    result text := '';
    i int;
BEGIN
    IF length < 8 OR length > 128 THEN
        RAISE EXCEPTION 'Password length must be between 8 and 128 characters';
    END IF;
    
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to hash passwords securely
CREATE OR REPLACE FUNCTION hash_password(password text, salt text DEFAULT NULL)
RETURNS text AS $$
BEGIN
    IF salt IS NULL THEN
        salt := encode(gen_random_bytes(32), 'hex');
    END IF;
    
    RETURN crypt(password, concat('$2b$12$', salt));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- MONITORING VIEWS
-- ===========================================

-- Security monitoring view
CREATE OR REPLACE VIEW security_dashboard AS
SELECT 
    'active_sessions' as metric,
    count(*)::text as value,
    'Sessions currently active' as description
FROM sessions 
WHERE active = true AND expires_at > NOW()
UNION ALL
SELECT 
    'failed_logins_24h' as metric,
    count(*)::text as value,
    'Failed login attempts in last 24 hours' as description
FROM audit_logs 
WHERE action = 'AUTH_FAILED' 
AND timestamp > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
    'quantum_passwords' as metric,
    count(*)::text as value,
    'Passwords using quantum encryption' as description
FROM passwords 
WHERE is_quantum = true
UNION ALL
SELECT 
    'rate_limit_violations' as metric,
    count(*)::text as value,
    'Rate limit violations in last hour' as description
FROM audit_logs 
WHERE action = 'RATE_LIMIT_EXCEEDED'
AND timestamp > NOW() - INTERVAL '1 hour';

-- ===========================================
-- SCHEDULED TASKS
-- ===========================================

-- Note: In production, these should be handled by cron or pg_cron extension

-- Create maintenance function
CREATE OR REPLACE FUNCTION daily_maintenance()
RETURNS void AS $$
BEGIN
    -- Cleanup expired data
    PERFORM cleanup_expired_data();
    
    -- Update statistics
    ANALYZE;
    
    -- Log maintenance completion
    INSERT INTO audit_logs (
        user_id, 
        action, 
        metadata, 
        hash, 
        timestamp
    ) VALUES (
        NULL,
        'SYSTEM_MAINTENANCE',
        '{"type": "daily_cleanup"}',
        encode(digest('maintenance:' || EXTRACT(EPOCH FROM NOW())::text, 'sha256'), 'hex'),
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- GRANTS AND PERMISSIONS
-- ===========================================

-- Grant necessary permissions to application user
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO quankey_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO quankey_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO quankey_app;

-- Restrict direct access to sensitive functions
REVOKE EXECUTE ON FUNCTION cleanup_expired_data() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION daily_maintenance() FROM PUBLIC;

-- Grant specific permissions
GRANT EXECUTE ON FUNCTION generate_secure_password(int) TO quankey_app;
GRANT EXECUTE ON FUNCTION hash_password(text, text) TO quankey_app;

-- ===========================================
-- SECURITY CONFIGURATION
-- ===========================================

-- Configure PostgreSQL security settings
ALTER SYSTEM SET log_connections = 'on';
ALTER SYSTEM SET log_disconnections = 'on'; 
ALTER SYSTEM SET log_statement = 'mod'; -- Log all modifications
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log slow queries
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';

-- Reload configuration
SELECT pg_reload_conf();

-- Final security check
SELECT 'Security initialization completed successfully' AS status;