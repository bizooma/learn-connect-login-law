-- Clean up hanging sessions for this user to resolve authentication issues
UPDATE user_sessions 
SET session_end = session_start + INTERVAL '1 hour',
    duration_seconds = 3600,
    exit_point = 'admin_cleanup',
    updated_at = now()
WHERE user_id = '09519a85-32ee-4f0c-a5ae-095414fa6bf6' 
  AND session_end IS NULL;