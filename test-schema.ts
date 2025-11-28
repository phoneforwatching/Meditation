import { users, profiles } from './src/lib/server/schema';
import { db } from './src/lib/server/db';

console.log('Users table:', users);
console.log('Profiles table:', profiles);

async function testQuery() {
    try {
        console.log('Testing query...');
        const result = await db.select({ user: users, profile: profiles }).from(users).leftJoin(profiles, users.id.eq(profiles.userId)).limit(1);
        console.log('Query successful:', result);
    } catch (e) {
        console.error('Query failed:', e);
    }
}

testQuery();
