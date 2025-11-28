import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/schema';
import { comparePassword, createToken } from '$lib/server/auth';
import { eq } from 'drizzle-orm';

export async function POST({ request, cookies }) {
    const { email, password } = await request.json();

    if (!email || !password) {
        return json({ error: 'Email and password are required' }, { status: 400 });
    }

    try {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        if (!user) {
            return json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const valid = await comparePassword(password, user.passwordHash);
        if (!valid) {
            return json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const token = createToken(user.id);
        cookies.set('session', token, {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return json({ user: { id: user.id, email: user.email, displayName: user.displayName } });
    } catch (e) {
        console.error(e);
        return json({ error: 'Server error' }, { status: 500 });
    }
}
