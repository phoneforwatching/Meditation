import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from '$env/dynamic/private';

import * as schema from './schema';

// On Vercel serverless every function instance gets its own pool, so a large
// pool per instance multiplies into hundreds of Postgres connections under
// load. Keep it tiny per instance and rely on Supabase's transaction pooler
// (port 6543) in DATABASE_URL to multiplex.
const pool = new pg.Pool({
    connectionString: env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
});

// Log pool errors
pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
});

export const db = drizzle(pool, { schema });
