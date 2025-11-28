import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import { db } from '$lib/server/db';
import { users } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { createToken } from '$lib/server/auth';
import { dev } from '$app/environment';

export async function POST({ request, cookies }) {
    const { accessToken } = await request.json();

    if (!accessToken) {
        return json({ error: 'No access token provided' }, { status: 400 });
    }

    // Verify the token with Supabase
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(accessToken);

    if (error || !supabaseUser || !supabaseUser.email) {
        console.error('Supabase Token Verification Failed:', error);
        return json({ error: 'Invalid token' }, { status: 401 });
    }

    // Sync with local DB
    let user = await db.query.users.findFirst({
        where: eq(users.email, supabaseUser.email),
    });

    if (!user) {
        // Create new user
        const [newUser] = await db.insert(users).values({
            email: supabaseUser.email,
            displayName: supabaseUser.user_metadata.full_name || supabaseUser.email.split('@')[0],
            googleId: supabaseUser.id,
        }).returning();
        user = newUser;
    } else if (!user.googleId) {
        // Link existing user
        await db.update(users)
            .set({ googleId: supabaseUser.id })
            .where(eq(users.id, user.id));
    }

    // Create local session
    const token = createToken(user.id);
    cookies.set('session', token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: !dev,
        maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return json({ success: true });
}
