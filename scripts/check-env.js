/**
 * Diagnostic script to check environment variables in production
 * 
 * Usage: node scripts/check-env.js
 * 
 * NOTE: This script is intended to be run in the production environment console if possible,
 * or used as a reference for what to check.
 */

console.log('--- Environment Variable Diagnostic ---');

const requiredVars = [
    'PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
];

// Check process.env
console.log('\nChecking process.env:');
requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        console.log(`✅ ${varName} is set (length: ${value.length})`);
    } else {
        console.log(`❌ ${varName} is MISSING`);
    }
});

console.log('\n--- End Diagnostic ---');
