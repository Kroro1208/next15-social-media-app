-- Fix Auth security settings
-- These settings need to be applied via Supabase CLI or Dashboard

-- Note: These settings are typically configured through the Supabase Dashboard
-- or via the Supabase CLI, not through SQL directly.

-- Instructions for fixing the security warnings:

-- 1. Fix OTP Expiry (reduce from current setting to less than 1 hour)
--    Dashboard: Authentication > Settings > Email Auth
--    Set "Email OTP expiry" to 3600 seconds (1 hour) or less
--    Recommended: 1800 seconds (30 minutes)

-- 2. Enable Leaked Password Protection
--    Dashboard: Authentication > Settings > Password Protection
--    Toggle "Enable password breach detection" to ON

-- Alternative: Use Supabase CLI commands:
-- supabase projects api-settings --project-ref YOUR_PROJECT_REF update --custom-claims '{"password_breach_detection": true}'

-- For documentation purposes, here's what we want to achieve:
-- - OTP expiry: 1800 seconds (30 minutes) instead of current >3600
-- - Password breach detection: enabled

-- Log the recommended changes
DO $$
BEGIN
    RAISE NOTICE 'Auth Security Configuration Recommendations:';
    RAISE NOTICE '1. Reduce Email OTP expiry to 1800 seconds (30 minutes)';
    RAISE NOTICE '2. Enable password breach detection against HaveIBeenPwned';
    RAISE NOTICE 'These settings must be configured via Supabase Dashboard or CLI';
END $$;

-- Create a function to check current auth configuration (if possible)
CREATE OR REPLACE FUNCTION check_auth_security_status()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN 'Auth security settings must be configured via Supabase Dashboard:
    1. Go to Authentication > Settings > Email Auth
    2. Set Email OTP expiry to 1800 seconds or less
    3. Go to Authentication > Settings > Password Protection  
    4. Enable password breach detection
    
    Current warnings indicate:
    - OTP expiry is set to more than 1 hour (needs to be ≤ 1 hour)
    - Password breach detection is disabled (should be enabled)';
END $$;