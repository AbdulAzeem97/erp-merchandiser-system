import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dbAdapter from './adapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateDatabase() {
  try {
    console.log('🐘 Starting PostgreSQL database migration...');

    // PostgreSQL schema is handled by Docker init scripts
    // This migration script is mainly for development/testing

    // Check if we're running in Docker (schema already applied)
    const isDocker = process.env.DB_HOST && process.env.DB_HOST !== 'localhost';

    if (isDocker) {
      console.log('✅ Running in Docker - schema handled by init scripts');
      return;
    }

    // For local development, apply schema manually
    const schemaPath = path.join(__dirname, 'init', '01-create-schema.sql');
    const seedPath = path.join(__dirname, 'init', '02-seed-data.sql');

    if (fs.existsSync(schemaPath)) {
      console.log('📝 Applying database schema...');
      const schema = fs.readFileSync(schemaPath, 'utf8');

      // Split schema into individual statements and execute
      const statements = schema.split(';').filter(stmt => stmt.trim());

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await dbAdapter.query(statement.trim());
          } catch (error) {
            // Ignore table exists errors
            if (!error.message.includes('already exists')) {
              throw error;
            }
          }
        }
      }
      console.log('✅ Schema applied successfully');
    }

    if (fs.existsSync(seedPath)) {
      console.log('🌱 Applying seed data...');
      const seedData = fs.readFileSync(seedPath, 'utf8');

      // Split seed data into individual statements and execute
      const statements = seedData.split(';').filter(stmt => stmt.trim());

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await dbAdapter.query(statement.trim());
          } catch (error) {
            // Ignore duplicate key errors from seed data
            if (!error.message.includes('duplicate key') && !error.message.includes('already exists')) {
              console.warn('Seed warning:', error.message);
            }
          }
        }
      }
      console.log('✅ Seed data applied successfully');
    }

    console.log('✅ PostgreSQL database migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}


migrateDatabase();
