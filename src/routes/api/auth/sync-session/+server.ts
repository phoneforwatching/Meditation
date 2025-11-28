import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import { db } from '$lib/server/db';
import { users, profiles, accounts } from '$lib/server/schema';
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
            emailVerified: new Date(),
        }).returning();
        user = newUser;

        // Create profile
        await db.insert(profiles).values({
            userId: user.id,
            displayName: supabaseUser.user_metadata.full_name || supabaseUser.email.split('@')[0],
            avatarUrl: supabaseUser.user_metadata.avatar_url,
        });

        // Create account
        await db.insert(accounts).values({
            userId: user.id,
            provider: 'google', // Assuming Google for now, or extract from identities
            providerAccountId: supabaseUser.id,
            accessToken: accessToken,
        });
    } else {
        // Check/Create Profile if missing
        const existingProfile = await db.query.profiles.findFirst({
            where: eq(profiles.userId, user.id)
        });

        if (!existingProfile) {
            await db.insert(profiles).values({
                userId: user.id,
                displayName: supabaseUser.user_metadata.full_name || supabaseUser.email.split('@')[0],
                avatarUrl: supabaseUser.user_metadata.avatar_url,
            });
        } else if (!existingProfile.avatarUrl && supabaseUser.user_metadata.avatar_url) {
            // Update avatar if missing locally but available in auth
            await db.update(profiles)
                .set({ avatarUrl: supabaseUser.user_metadata.avatar_url })
                .where(eq(profiles.userId, user.id));
        }

        // Check/Create Account
        const existingAccount = await db.query.accounts.findFirst({
            where: eq(accounts.userId, user.id)
        });

        if (!existingAccount) {
            await db.insert(accounts).values({
                userId: user.id,
                provider: 'google',
                providerAccountId: supabaseUser.id,
                accessToken: accessToken,
            });
        }
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
