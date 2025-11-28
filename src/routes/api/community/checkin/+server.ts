import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { dailyCheckins } from '$lib/server/schema';
import { getSupabaseAdmin } from '$lib/server/supabaseAdmin';

export async function POST({ request, locals }) {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const photo = formData.get('photo') as File;
        const mood = Number(formData.get('mood'));
        const caption = formData.get('caption') as string;

        if (!photo || !mood) {
            return json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Upload to Supabase Storage (if photo exists)
        let publicUrl = null;
        if (photo && photo.size > 0) {
            const fileExt = photo.name.split('.').pop();
            const fileName = `${locals.user.id}-${Date.now()}.${fileExt}`;

            const supabaseAdmin = getSupabaseAdmin();

            const { error: uploadError } = await supabaseAdmin
                .storage
                .from('daily-checkins')
                .upload(fileName, photo, {
                    contentType: photo.type,
                    upsert: true
                });

            if (uploadError) {
                console.error('Supabase upload error:', uploadError);
                throw new Error('Failed to upload image');
            }

            const { data } = supabaseAdmin
                .storage
                .from('daily-checkins')
                .getPublicUrl(fileName);

            publicUrl = data.publicUrl;
        } else if (!caption) {
            return json({ error: 'Must provide either photo or caption' }, { status: 400 });
        }

        // Save to DB
        await db.insert(dailyCheckins).values({
            userId: locals.user.id,
            photoUrl: publicUrl,
            mood,
            caption
        });

        return json({ success: true });
    } catch (e) {
        console.error('Check-in error:', e);
        return json({ error: 'Failed to check in' }, { status: 500 });
    }
}
