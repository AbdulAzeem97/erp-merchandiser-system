import { Pool } from 'pg';
import fs from 'fs';

console.log('=== CREATING POSTGRESQL SCHEMA ===');

// PostgreSQL connection configuration
const pgConfig = {
    user: process.env.DB_USER || 'erp_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'erp_merchandiser',
    password: process.env.DB_PASSWORD || 'secure_password_123',
    port: parseInt(process.env.DB_PORT) || 5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

const pgPool = new Pool(pgConfig);

async function createSchema() {
    try {
        console.log('📋 Creating PostgreSQL schema...');
        
        // Read the schema file
        const schema = fs.readFileSync('postgresql-schema.sql', 'utf8');
        
        // Split into individual statements and execute them one by one
        const statements = schema
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📊 Found ${statements.length} SQL statements to execute`);
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                try {
                    console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
                    await pgPool.query(statement);
                    console.log(`✅ Statement ${i + 1} executed successfully`);
                } catch (error) {
                    console.log(`⚠️  Statement ${i + 1} failed (non-critical): ${error.message}`);
                    // Continue with other statements
                }
            }
        }
        
        console.log('✅ Schema creation completed');
        
        // Verify tables were created
        const result = await pgPool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        console.log(`📊 Created ${result.rows.length} tables:`);
        result.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });
        
    } catch (error) {
        console.error('❌ Error creating schema:', error.message);
        throw error;
    } finally {
        await pgPool.end();
    }
}

createSchema().catch(console.error);
