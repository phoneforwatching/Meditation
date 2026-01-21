import pg from 'pg';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runIndexMigration() {
    const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        console.log('🚀 Running index migration for performance...');
        
        const sql = readFileSync(
            join(__dirname, '../drizzle/0001_add_indexes.sql'),
            'utf-8'
        );
        
        await pool.query(sql);
        
        console.log('✅ Indexes created successfully!');
        console.log('📊 Your queries should now be much faster.');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await pool.end();
    }
}

runIndexMigration();
