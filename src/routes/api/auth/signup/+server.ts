import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/schema';
import { hashPassword, createToken } from '$lib/server/auth';
import { eq } from 'drizzle-orm';

export async function POST({ request, cookies }) {
    const { email, password, displayName } = await request.json();

    if (!email || !password) {
        return json({ error: 'Email and password are required' }, { status: 400 });
    }

    try {
        const existingUser = await db.select().from(users).where(eq(users.email, email));
        if (existingUser.length > 0) {
            return json({ error: 'User already exists' }, { status: 400 });
        }

        const passwordHash = await hashPassword(password);
        const [newUser] = await db.insert(users).values({
            email,
            passwordHash,
            displayName,
        }).returning();

        const token = createToken(newUser.id);
        cookies.set('session', token, {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return json({ user: { id: newUser.id, email: newUser.email, displayName: newUser.displayName } });
    } catch (e) {
        console.error(e);
        return json({ error: 'Server error' }, { status: 500 });
    }
}
