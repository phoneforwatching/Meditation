import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkBucket() {
    console.log('Checking buckets...');
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error('Error listing buckets:', error);
        return;
    }

    const bucket = data.find(b => b.name === 'daily-checkins');
    if (bucket) {
        console.log('Bucket "daily-checkins" exists.');
        console.log('Public:', bucket.public);
    } else {
        console.log('Bucket "daily-checkins" DOES NOT exist.');

        // Try to create it
        console.log('Attempting to create bucket...');
        const { data: created, error: createError } = await supabase.storage.createBucket('daily-checkins', {
            public: true,
            fileSizeLimit: 5242880, // 5MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
        });

        if (createError) {
            console.error('Error creating bucket:', createError);
        } else {
            console.log('Bucket created successfully:', created);
        }
    }
}

checkBucket();
