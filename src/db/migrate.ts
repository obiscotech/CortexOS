import { Pool } from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  try {
    console.log('Running database migrations...');
    
    // Read and execute the schema.sql file
    const schemaPath = join(__dirname, '../../schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    await pool.query(schema);
    
    console.log('Migrations completed successfully');
    console.log('- Users table created with RLS');
    console.log('- Tasks table created with RLS');
    console.log('- Steps table created with RLS');
    console.log('- Memories table created with RLS');
    console.log('- Logs table created with RLS');
    console.log('- Default master user created');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
