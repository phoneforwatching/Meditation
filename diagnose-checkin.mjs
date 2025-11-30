#!/usr/bin/env node

/**
 * Quick Diagnostic Script for Daily Check-in Upload
 * 
 * Run this to verify your environment is set up correctly
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔍 Checking Daily Check-in Upload Configuration...\n');

// Check .env file
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    process.exit(1);
}

console.log('✅ .env file exists');

// Load env vars
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        env[match[1].trim()] = match[2].trim();
    }
});

// Check required vars
const requiredVars = ['PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingVars = requiredVars.filter(v => !env[v]);

if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars.join(', '));
    process.exit(1);
}

console.log('✅ Environment variables configured');

const supabaseUrl = env['PUBLIC_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Check bucket
console.log('\n📦 Checking Supabase bucket...');
const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

if (bucketsError) {
    console.error('❌ Error listing buckets:', bucketsError);
    process.exit(1);
}

const bucket = buckets.find(b => b.name === 'daily-checkins');
if (!bucket) {
    console.error('❌ Bucket "daily-checkins" not found!');
    console.log('Available buckets:', buckets.map(b => b.name).join(', '));
    process.exit(1);
}

console.log('✅ Bucket "daily-checkins" exists');
console.log('   - Public:', bucket.public);
console.log('   - File size limit:', bucket.file_size_limit || 'unlimited');

// Test upload
console.log('\n📤 Testing upload...');
const testFileName = `diagnostic-test-${Date.now()}.txt`;
const testContent = Buffer.from('Daily check-in upload test');

const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('daily-checkins')
    .upload(testFileName, testContent, {
        contentType: 'text/plain',
        upsert: true
    });

if (uploadError) {
    console.error('❌ Upload test failed:', uploadError);
    process.exit(1);
}

console.log('✅ Upload test successful');
console.log('   - Path:', uploadData.path);

// Get public URL
const { data: urlData } = supabase
    .storage
    .from('daily-checkins')
    .getPublicUrl(testFileName);

console.log('✅ Public URL generated:', urlData.publicUrl);

// Clean up test file
const { error: deleteError } = await supabase
    .storage
    .from('daily-checkins')
    .remove([testFileName]);

if (!deleteError) {
    console.log('✅ Cleanup successful');
}

console.log('\n╔═══════════════════════════════════════════════════╗');
console.log('║  ✅ ALL CHECKS PASSED!                            ║');
console.log('║                                                   ║');
console.log('║  Your check-in upload should work correctly.     ║');
console.log('║  If you still have issues, check:                ║');
console.log('║  1. Browser console for frontend errors          ║');
console.log('║  2. Server logs for backend errors               ║');
console.log('║  3. Network tab for request details              ║');
console.log('╚═══════════════════════════════════════════════════╝');
