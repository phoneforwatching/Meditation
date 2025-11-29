import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { dailyCheckins, profiles } from '$lib/server/schema';
import { getSupabaseAdmin } from '$lib/server/supabaseAdmin';
import { broadcastNotification } from '$lib/server/notifications';
import { eq } from 'drizzle-orm';

import type { RequestEvent } from './$types';

export async function POST({ request, locals }: RequestEvent) {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const photo = formData.get('photo') as File;
        const mood = Number(formData.get('mood'));
        const caption = formData.get('caption') as string;

        if ((!photo || photo.size === 0) && !caption) {
            return json({ error: 'Must provide either photo or caption' }, { status: 400 });
        }

        // Upload to Supabase Storage (if photo exists)
        let publicUrl = null;
        if (photo && photo.size > 0) {
            const fileExt = photo.name.split('.').pop();
            const fileName = `${locals.user.id}-${Date.now()}.${fileExt}`;

            const supabaseAdmin = getSupabaseAdmin();

            const arrayBuffer = await photo.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const { error: uploadError } = await supabaseAdmin
                .storage
                .from('daily-checkins')
                .upload(fileName, buffer, {
                    contentType: photo.type,
                    upsert: true
                });

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
            caption
        });

        // Broadcast Notification
        const [userProfile] = await db.select({ displayName: profiles.displayName })
            .from(profiles)
            .where(eq(profiles.userId, locals.user.id));

        const userName = userProfile?.displayName || 'Someone';
        const notificationMessage = caption
            ? `${userName} posted a check-in: "${caption.substring(0, 30)}${caption.length > 30 ? '...' : ''}"`
            : `${userName} posted a daily check-in`;

        await broadcastNotification(
            locals.user.id,
            'activity',
            'New Check-in',
            notificationMessage,
            '/community'
        );

        return json({ success: true });
    } catch (e: any) {
        console.error('Check-in error:', e);
        return json({ error: e.message || 'Failed to check in' }, { status: 500 });
    }
}
