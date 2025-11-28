import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

// Use a fallback or ensure the key exists. During build, private env vars might be empty.
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key-for-build';

export const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
