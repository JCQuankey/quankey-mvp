-- 🗑️ QUANKEY DATABASE CLEANUP - Remove Test Data
-- ⚠️ WARNING: This will DELETE ALL test users and data
-- Only run this in development/staging environment

-- Check current data count before cleanup
SELECT 
  'users' as table_name, 
  COUNT(*) as record_count 
FROM users
UNION ALL
SELECT 
  'passwords' as table_name, 
  COUNT(*) as record_count 
FROM passwords
UNION ALL
SELECT 
  'user_sessions' as table_name, 
  COUNT(*) as record_count 
FROM user_sessions
UNION ALL
SELECT 
  'audit_logs' as table_name, 
  COUNT(*) as record_count 
FROM audit_logs;

-- Show sample users to confirm what will be deleted
SELECT 
  id,
  email,
  name,
  created_at,
  (SELECT COUNT(*) FROM passwords WHERE user_id = users.id) as password_count
FROM users 
LIMIT 10;

-- BEGIN CLEANUP TRANSACTION
BEGIN;

-- Delete all passwords first (foreign key dependency)
DELETE FROM passwords;
COMMIT;

-- Delete user sessions
BEGIN;
DELETE FROM user_sessions;
COMMIT;

-- Delete audit logs (optional - keep for security analysis)
-- BEGIN;
-- DELETE FROM audit_logs WHERE event_type LIKE '%TEST%' OR user_id IN (SELECT id FROM users);
-- COMMIT;

-- Delete all users
BEGIN;
DELETE FROM users;
COMMIT;

-- Reset auto-increment sequences (PostgreSQL)
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE passwords_id_seq RESTART WITH 1;
ALTER SEQUENCE user_sessions_id_seq RESTART WITH 1;
ALTER SEQUENCE audit_logs_id_seq RESTART WITH 1;

-- Verify cleanup completed
SELECT 
  'users' as table_name, 
  COUNT(*) as remaining_records 
FROM users
UNION ALL
SELECT 
  'passwords' as table_name, 
  COUNT(*) as remaining_records 
FROM passwords
UNION ALL
SELECT 
  'user_sessions' as table_name, 
  COUNT(*) as remaining_records 
FROM user_sessions
UNION ALL
SELECT 
  'audit_logs' as table_name, 
  COUNT(*) as remaining_records 
FROM audit_logs;

-- Show cleanup completion message
SELECT 'Database cleanup completed successfully!' as status;