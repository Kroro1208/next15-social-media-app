-- Apply search_path fixes to remote/production database
-- This ensures both local and remote databases have the same security configuration

-- Force apply search_path to all functions (even if already set)
-- This handles any edge cases or inconsistencies

DO $$
DECLARE
    func_record RECORD;
    sql_statement TEXT;
    success_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting search_path security fix for all functions...';
    
    -- Loop through all functions in the public schema
    FOR func_record IN
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as function_args,
            p.oid,
            CASE 
                WHEN p.proconfig IS NULL THEN 'NOT_SET'
                WHEN 'search_path=public' = ANY(p.proconfig) THEN 'ALREADY_SET'
                ELSE 'CUSTOM_SET'
            END as current_status
        FROM pg_proc p
        LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prokind = 'f'
        ORDER BY p.proname
    LOOP
        -- Build the ALTER FUNCTION statement
        IF func_record.function_args IS NOT NULL AND func_record.function_args != '' THEN
            sql_statement := format('ALTER FUNCTION %I.%I(%s) SET search_path = public', 
                func_record.schema_name, func_record.function_name, func_record.function_args);
        ELSE
            sql_statement := format('ALTER FUNCTION %I.%I() SET search_path = public', 
                func_record.schema_name, func_record.function_name);
        END IF;
        
        BEGIN
            -- Execute the ALTER FUNCTION statement
            EXECUTE sql_statement;
            success_count := success_count + 1;
            
            CASE func_record.current_status
                WHEN 'NOT_SET' THEN 
                    RAISE NOTICE '[FIXED] %(%): search_path was not set, now protected', 
                        func_record.function_name, func_record.function_args;
                WHEN 'ALREADY_SET' THEN 
                    RAISE NOTICE '[CONFIRMED] %(%): search_path already correctly set', 
                        func_record.function_name, func_record.function_args;
                ELSE 
                    RAISE NOTICE '[UPDATED] %(%): search_path updated to public', 
                        func_record.function_name, func_record.function_args;
            END CASE;
            
        EXCEPTION
            WHEN OTHERS THEN
                error_count := error_count + 1;
                RAISE WARNING '[ERROR] Failed to fix %(%): %', 
                    func_record.function_name, func_record.function_args, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Search path security fix completed!';
    RAISE NOTICE 'Successfully processed: % functions', success_count;
    
    IF error_count > 0 THEN
        RAISE NOTICE 'Errors encountered: % functions', error_count;
    ELSE
        RAISE NOTICE 'All functions processed without errors!';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== SECURITY STATUS ===';
    RAISE NOTICE 'All % public schema functions are now protected against search_path manipulation attacks', success_count;
    RAISE NOTICE 'This should resolve the Supabase Linter warnings about function_search_path_mutable';
    
END $$;

-- Final verification
SELECT 
    'FINAL VERIFICATION: ' || 
    CASE 
        WHEN COUNT(CASE WHEN p.proconfig IS NULL THEN 1 END) = 0 THEN
            '✅ ALL ' || COUNT(*) || ' FUNCTIONS PROTECTED'
        ELSE
            '❌ ' || COUNT(CASE WHEN p.proconfig IS NULL THEN 1 END) || ' VULNERABLE FUNCTIONS REMAIN'
    END as final_status
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prokind = 'f';