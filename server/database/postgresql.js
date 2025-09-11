const { Pool } = require('pg');

// PostgreSQL connection configuration
const pgConfig = {
    user: process.env.PG_USER || 'erp_user',
    host: process.env.PG_HOST || 'localhost',
    database: process.env.PG_DATABASE || 'erp_merchandiser',
    password: process.env.PG_PASSWORD || 'secure_password_123',
    port: process.env.PG_PORT || 5432,
    max: parseInt(process.env.PG_MAX_CONNECTIONS) || 20, // Maximum connections in pool
    idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis: parseInt(process.env.PG_CONNECTION_TIMEOUT) || 2000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Create connection pool
const pool = new Pool(pgConfig);

// Handle pool errors
pool.on('error', (err) => {
    console.error('❌ PostgreSQL pool error:', err);
});

// Test connection
async function testConnection() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('✅ PostgreSQL connection successful:', result.rows[0].now);
        client.release();
        return true;
    } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error.message);
        return false;
    }
}

// Enhanced query function with error handling
async function query(text, params = []) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('📊 Query executed:', { text: text.substring(0, 100), duration, rows: result.rowCount });
        return result;
    } catch (error) {
        console.error('❌ Query error:', { text: text.substring(0, 100), error: error.message });
        throw error;
    }
}

// Transaction helper
async function transaction(callback) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// Get client for complex operations
async function getClient() {
    return await pool.connect();
}

// Close pool
async function closePool() {
    await pool.end();
}

module.exports = {
    pool,
    query,
    transaction,
    getClient,
    closePool,
    testConnection
};

