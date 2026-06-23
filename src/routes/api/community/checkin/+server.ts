import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { dailyCheckins, profiles } from '$lib/server/schema';
import { getSupabaseAdmin } from '$lib/server/supabaseAdmin';
import { broadcastNotification } from '$lib/server/notifications';
import { validateImageUpload } from '$lib/server/upload';
import { eq } from 'drizzle-orm';

import type { RequestEvent } from './$types';

const MAX_CAPTION_LENGTH = 280;

export async function POST({ request, locals }: RequestEvent) {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const photo = formData.get('photo') as File | null;
        const mood = Number(formData.get('mood'));
        const caption = ((formData.get('caption') as string) || '').trim();

        if ((!photo || photo.size === 0) && !caption) {
            return json({ error: 'Must provide either photo or caption' }, { status: 400 });
        }
        if (caption.length > MAX_CAPTION_LENGTH) {
            return json({ error: `Caption must be ${MAX_CAPTION_LENGTH} characters or fewer` }, { status: 400 });
        }
        if (!Number.isInteger(mood) || mood < 1 || mood > 5) {
            return json({ error: 'Invalid mood' }, { status: 400 });
        }

        // Upload to Supabase Storage (if photo exists)
        let publicUrl: string | null = null;
        if (photo && photo.size > 0) {
            const { buffer, contentType, ext } = await validateImageUpload(photo);
            const fileName = `${locals.user.id}-${Date.now()}.${ext}`;

            const supabaseAdmin = getSupabaseAdmin();
            const { error: uploadError } = await supabaseAdmin
                .storage
                .from('daily-checkins')
                .upload(fileName, buffer, { contentType, upsert: true });

            if (uploadError) {
                console.error('Supabase upload error:', uploadError);
                throw new Error(`Failed to upload image: ${uploadError.message}`);
            }

            const { data } = supabaseAdmin
                .storage
                .from('daily-checkins')
                .getPublicUrl(fileName);

            publicUrl = data.publicUrl;
        }

        // Save to DB
        await db.insert(dailyCheckins).values({
            userId: locals.user.id,
            photoUrl: publicUrl,
            mood,
            caption: caption || null
        });

        // Broadcast notification (fire-and-forget: don't block the response on
        // a fan-out write to every other user).
        const [userProfile] = await db.select({ displayName: profiles.displayName })
            .from(profiles)
            .where(eq(profiles.userId, locals.user.id));

        const userName = userProfile?.displayName || 'Someone';
        const notificationMessage = caption
            ? `${userName} posted a check-in: "${caption.substring(0, 30)}${caption.length > 30 ? '...' : ''}"`
            : `${userName} posted a daily check-in`;

        void broadcastNotification(
            locals.user.id,
            'activity',
            'New Check-in',
            notificationMessage,
            '/community'
        ).catch((e) => console.error('broadcastNotification failed:', e));

        return json({ success: true });
    } catch (e: any) {
        console.error('Check-in error:', e);
        return json({ error: e.message || 'Failed to check in' }, { status: 500 });
    }
}
