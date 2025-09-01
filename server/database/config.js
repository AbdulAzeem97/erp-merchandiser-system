import pkg from 'pg';
const { Pool } = pkg;

// PostgreSQL Configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'erp_merchandiser',
  password: process.env.DB_PASSWORD || 'db123',
  port: process.env.DB_PORT || 5432,
  max: 10, // Reduced from 20 to prevent connection issues
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased timeout
  allowExitOnIdle: true,
  // Add connection retry logic
  connectionRetryAttempts: 3,
  connectionRetryDelay: 1000,
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit on error, just log it
});

// Handle pool errors gracefully
pool.on('acquire', (client) => {
  console.log('Client acquired from pool');
});

pool.on('release', (client) => {
  console.log('Client released back to pool');
});

export default pool;
