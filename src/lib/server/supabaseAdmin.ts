import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

let cachedClient: SupabaseClient | null = null;

/**
 * Lazily create a Supabase client using the service role key.
 * We throw if the key is missing so uploads fail loudly instead of using
 * an invalid placeholder token.
 */
export function getSupabaseAdmin(): SupabaseClient {
    if (cachedClient) return cachedClient;

    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
    }

    cachedClient = createClient(PUBLIC_SUPABASE_URL, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    return cachedClient;
}
