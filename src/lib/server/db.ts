import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from '$env/dynamic/private';

import * as schema from './schema';

// Optimized connection pool settings
const pool = new pg.Pool({
    connectionString: env.DATABASE_URL,
    // Connection pool optimization
    max: 20,                    // Maximum connections in pool
    min: 2,                     // Minimum connections to keep
    idleTimeoutMillis: 30000,   // Close idle connections after 30s
    connectionTimeoutMillis: 5000, // Timeout for new connections
    maxUses: 7500,              // Close connection after N uses (prevents memory leaks)
});

// Log pool errors
pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
});

export const db = drizzle(pool, { schema });

// Simple in-memory cache for user sessions
const userCache = new Map<number, { data: any; expiry: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute cache

export function getCachedUser(userId: number) {
    const cached = userCache.get(userId);
    if (cached && cached.expiry > Date.now()) {
        return cached.data;
    }
    userCache.delete(userId);
    return null;
}

export function setCachedUser(userId: number, data: any) {
    userCache.set(userId, {
        data,
        expiry: Date.now() + CACHE_TTL
    });
}

export function invalidateUserCache(userId: number) {
    userCache.delete(userId);
}
