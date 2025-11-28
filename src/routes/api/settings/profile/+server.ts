import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { profiles } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

export async function POST({ request, locals }) {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const displayName = formData.get('displayName') as string;
        const bio = formData.get('bio') as string;
        const avatarFile = formData.get('avatar') as File;

        const updateData: any = {};
        if (displayName) updateData.displayName = displayName;
        if (bio) updateData.bio = bio;

        if (avatarFile && avatarFile.size > 0) {
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${locals.user.id}-${Date.now()}.${fileExt}`;

            // Upload to Supabase Storage
            const { data, error } = await supabaseAdmin
                .storage
                .from('avatars')
                .upload(fileName, avatarFile, {
                    contentType: avatarFile.type,
                    upsert: true
                });

            if (error) {
                console.error('Supabase upload error:', error);
                throw new Error('Failed to upload image to Supabase');
            }

            // Get public URL
            const { data: { publicUrl } } = supabaseAdmin
                .storage
                .from('avatars')
                .getPublicUrl(fileName);

            updateData.avatarUrl = publicUrl;
        }

        await db.update(profiles)
            .set(updateData)
            .where(eq(profiles.userId, locals.user.id));

        return json({ success: true, avatarUrl: updateData.avatarUrl });
    } catch (e) {
        console.error('Profile update error:', e);
        return json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
