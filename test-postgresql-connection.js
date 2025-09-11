import { Pool } from 'pg';

// PostgreSQL connection configuration
const pgConfig = {
    user: 'erp_user',
    host: 'localhost',
    database: 'erp_merchandiser',
    password: 'secure_password_123',
    port: 5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: false
};

async function testPostgreSQLConnection() {
    console.log('🧪 Testing PostgreSQL Connection...');
    
    const pool = new Pool(pgConfig);
    
    try {
        const client = await pool.connect();
        console.log('✅ Connected to PostgreSQL successfully');
        
        // Test basic query
        const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
        console.log('📊 Current time:', result.rows[0].current_time);
        console.log('📊 PostgreSQL version:', result.rows[0].pg_version);
        
        // Test table access
        const tableResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        console.log(`📊 Found ${tableResult.rows.length} tables:`);
        tableResult.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });
        
        // Test user data
        const userResult = await client.query('SELECT COUNT(*) as user_count FROM users');
        console.log(`👥 Users in database: ${userResult.rows[0].user_count}`);
        
        client.release();
        await pool.end();
        
        console.log('✅ PostgreSQL connection test completed successfully');
        return true;
        
    } catch (error) {
        console.error('❌ PostgreSQL connection test failed:', error.message);
        await pool.end();
        return false;
    }
}

testPostgreSQLConnection();
