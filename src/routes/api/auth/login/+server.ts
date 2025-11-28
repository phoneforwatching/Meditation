import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, profiles } from '$lib/server/schema';
import { comparePassword, createToken } from '$lib/server/auth';
import { eq } from 'drizzle-orm';

export async function POST({ request, cookies }) {
    const { email, password } = await request.json();

    if (!email || !password) {
        return json({ error: 'Email and password are required' }, { status: 400 });
    }

    try {
        const [result] = await db.select({
            user: users,
            profile: profiles
        })
            .from(users)
            .leftJoin(profiles, eq(users.id, profiles.userId))
            .where(eq(users.email, email));

        if (!result?.user) {
            return json({ error: 'Invalid credentials' }, { status: 401 });
        }

        if (!result.user.passwordHash) {
            return json({ error: 'This account does not support password login' }, { status: 401 });
        }

        const valid = await comparePassword(password, result.user.passwordHash);
        if (!valid) {
            return json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const token = createToken(result.user.id);
        cookies.set('session', token, {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return json({
            user: {
                id: result.user.id,
                email: result.user.email,
                displayName: result.profile?.displayName || null
            }
        });
    } catch (e) {
        console.error(e);
        return json({ error: 'Server error' }, { status: 500 });
    }
}
