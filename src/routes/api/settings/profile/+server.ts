import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { profiles } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

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
            const buffer = await avatarFile.arrayBuffer();
            const fileName = `${locals.user.id}-${Date.now()}-${avatarFile.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
            const uploadDir = join(process.cwd(), 'static', 'uploads', 'avatars');

            // Ensure directory exists
            mkdirSync(uploadDir, { recursive: true });

            const filePath = join(uploadDir, fileName);
            writeFileSync(filePath, Buffer.from(buffer));

            updateData.avatarUrl = `/uploads/avatars/${fileName}`;
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
