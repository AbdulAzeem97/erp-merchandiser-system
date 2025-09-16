import { Pool } from 'pg';

// PostgreSQL-only database adapter
class DatabaseAdapter {
    constructor() {
        this.type = 'postgresql';
        this.connection = null;
        this.initialized = false;
        // Don't initialize in constructor - wait for explicit call
    }

    async initialize() {
        await this.initializePostgreSQL();
        this.initialized = true;
    }

    async initializePostgreSQL() {
        console.log('🐘 Using PostgreSQL database');
        
        const pgConfig = {
            user: process.env.DB_USER || 'erp_user',
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'erp_merchandiser',
            password: process.env.DB_PASSWORD || 'secure_password_123',
            port: process.env.DB_PORT || 5432,
            max: parseInt(process.env.PG_MAX_CONNECTIONS) || 20,
            idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT) || 60000, // Increased timeout
            connectionTimeoutMillis: parseInt(process.env.PG_CONNECTION_TIMEOUT) || 30000, // Increased timeout
            acquireTimeoutMillis: 30000, // Add acquire timeout
            createTimeoutMillis: 30000, // Add create timeout
        };

        this.connection = new Pool(pgConfig);
        
        try {
            const client = await this.connection.connect();
            const result = await client.query('SELECT NOW()');
            console.log('✅ PostgreSQL database connected:', result.rows[0].now);
            client.release();
        } catch (error) {
            console.error('❌ PostgreSQL connection failed:', error.message);
            throw new Error('PostgreSQL connection is required. Please ensure PostgreSQL is running and properly configured.');
        }
    }

    // Query method for PostgreSQL
    async query(text, params = []) {
        // Wait for initialization if not ready
        while (!this.initialized) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        try {
            return await this.connection.query(text, params);
        } catch (error) {
            console.error('Database query error:', error.message);
            throw error;
        }
    }

    // Get connection for complex operations
    getConnection() {
        return this.connection;
    }

    // Close connection
    async close() {
        if (this.connection) {
            await this.connection.end();
        }
    }

    // Get database type
    getType() {
        return this.type;
    }
}

// Create singleton instance
const dbAdapter = new DatabaseAdapter();

export default dbAdapter;

