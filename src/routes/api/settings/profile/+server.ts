import { json } from '@sveltejs/kit';
import { db, invalidateUserCache } from '$lib/server/db';
import { profiles } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { getSupabaseAdmin } from '$lib/server/supabaseAdmin';

const AVATAR_BUCKET = 'avatars';

async function ensureAvatarBucketExists() {
    const supabase = getSupabaseAdmin();

    // Create the bucket if it's missing (idempotent on Supabase side)
    const { data, error } = await supabase.storage.getBucket(AVATAR_BUCKET);
    if (!error && data) {
        return supabase;
    }

    const { error: createError } = await supabase.storage.createBucket(AVATAR_BUCKET, {
        public: true
    });

    if (createError) {
        throw new Error(`Failed to ensure avatar bucket: ${createError.message}`);
    }

    return supabase;
}

export async function POST({ request, locals }) {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const displayName = formData.get('displayName') as string;
        const bio = formData.get('bio') as string;
        const avatarFile = formData.get('avatar') as File;

        const supabase = await ensureAvatarBucketExists();

        const updateData: Record<string, string> = {};
        if (displayName) updateData.displayName = displayName;
        if (bio) updateData.bio = bio;

        if (avatarFile && avatarFile.size > 0) {
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${locals.user.id}-${Date.now()}.${fileExt}`;

            // Upload to Supabase Storage
            const { data, error } = await supabase
                .storage
                .from(AVATAR_BUCKET)
                .upload(fileName, avatarFile, {
                    contentType: avatarFile.type,
                    upsert: true
                });

            if (error) {
                console.error('Supabase upload error:', error);
                throw new Error('Failed to upload image to Supabase');
            }

            // Get public URL
            const { data: { publicUrl } } = supabase
                .storage
                .from(AVATAR_BUCKET)
                .getPublicUrl(fileName);

            updateData.avatarUrl = publicUrl;
        }

        await db.update(profiles)
            .set(updateData)
            .where(eq(profiles.userId, locals.user.id));

        invalidateUserCache(locals.user.id);

        return json({ success: true, avatarUrl: updateData.avatarUrl });
    } catch (e) {
        console.error('Profile update error:', e);
        const message = e instanceof Error ? e.message : 'Failed to update profile';
        return json({ error: message }, { status: 500 });
    }
}
