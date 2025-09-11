const { query, transaction, testConnection } = require('../database/postgresql');

// Database configuration
const config = {
    // Connection settings
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT || 5432,
    database: process.env.PG_DATABASE || 'erp_merchandiser',
    user: process.env.PG_USER || 'erp_user',
    password: process.env.PG_PASSWORD || 'secure_password_123',
    
    // Pool settings
    maxConnections: parseInt(process.env.PG_MAX_CONNECTIONS) || 20,
    idleTimeout: parseInt(process.env.PG_IDLE_TIMEOUT) || 30000,
    connectionTimeout: parseInt(process.env.PG_CONNECTION_TIMEOUT) || 2000,
    
    // Performance settings
    enableSSL: process.env.NODE_ENV === 'production',
    enableLogging: process.env.NODE_ENV === 'development'
};

// Initialize database connection
async function initializeDatabase() {
    try {
        console.log('🔌 Initializing PostgreSQL database connection...');
        
        const isConnected = await testConnection();
        if (!isConnected) {
            throw new Error('Failed to connect to PostgreSQL database');
        }
        
        console.log('✅ PostgreSQL database initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        return false;
    }
}

// Common query helpers
const dbHelpers = {
    
    // Get user by email
    async getUserByEmail(email) {
        const result = await query(
            'SELECT * FROM users WHERE email = $1 AND is_active = true',
            [email]
        );
        return result.rows[0] || null;
    },
    
    // Get user by ID
    async getUserById(id) {
        const result = await query(
            'SELECT * FROM users WHERE id = $1 AND is_active = true',
            [id]
        );
        return result.rows[0] || null;
    },
    
    // Get job card by ID
    async getJobCardById(jobCardId) {
        const result = await query(`
            SELECT jc.*, p.product_item_code, p.brand, c.name as company_name
            FROM job_cards jc
            LEFT JOIN products p ON jc.product_id = p.id
            LEFT JOIN companies c ON jc.company_id = c.id
            WHERE jc.job_card_id = $1
        `, [jobCardId]);
        return result.rows[0] || null;
    },
    
    // Get job lifecycle by job card ID
    async getJobLifecycle(jobCardId) {
        const result = await query(`
            SELECT jl.*, u.first_name, u.last_name
            FROM job_lifecycle jl
            LEFT JOIN users u ON jl.assigned_designer_id = u.id
            WHERE jl.job_card_id = $1
        `, [jobCardId]);
        return result.rows[0] || null;
    },
    
    // Get all jobs with lifecycle data
    async getAllJobsWithLifecycle() {
        const result = await query(`
            SELECT 
                jc.job_card_id,
                jc.quantity,
                jc.delivery_date,
                jc.status as job_status,
                jc.priority,
                p.product_item_code,
                p.brand as product_name,
                c.name as company_name,
                jl.status as lifecycle_status,
                jl.current_stage,
                u.first_name || ' ' || u.last_name as created_by_name
            FROM job_cards jc
            LEFT JOIN products p ON jc.product_id = p.id
            LEFT JOIN companies c ON jc.company_id = c.id
            LEFT JOIN job_lifecycle jl ON jc.job_card_id = jl.job_card_id
            LEFT JOIN users u ON jc.created_by = u.id
            ORDER BY jc.created_at DESC
        `);
        return result.rows;
    },
    
    // Update job lifecycle status
    async updateJobLifecycleStatus(jobCardId, newStatus, notes, changedBy) {
        return await transaction(async (client) => {
            // Update lifecycle
            const updateResult = await client.query(`
                UPDATE job_lifecycle 
                SET status = $1, updated_at = CURRENT_TIMESTAMP
                WHERE job_card_id = $2
                RETURNING *
            `, [newStatus, jobCardId]);
            
            if (updateResult.rows.length === 0) {
                throw new Error('Job lifecycle not found');
            }
            
            // Add history entry
            await client.query(`
                INSERT INTO job_lifecycle_history (job_lifecycle_id, status_to, notes, changed_by)
                VALUES ($1, $2, $3, $4)
            `, [updateResult.rows[0].id, newStatus, notes, changedBy]);
            
            return updateResult.rows[0];
        });
    },
    
    // Get dashboard statistics
    async getDashboardStats() {
        const result = await query(`
            SELECT 
                COUNT(*) as total_jobs,
                COUNT(CASE WHEN jl.status = 'CREATED' THEN 1 END) as created_jobs,
                COUNT(CASE WHEN jl.status = 'ASSIGNED_TO_PREPRESS' THEN 1 END) as prepress_jobs,
                COUNT(CASE WHEN jl.status = 'PREPRESS_IN_PROGRESS' THEN 1 END) as in_progress_jobs,
                COUNT(CASE WHEN jl.status = 'COMPLETED' THEN 1 END) as completed_jobs,
                COUNT(CASE WHEN jl.priority = 'HIGH' THEN 1 END) as high_priority_jobs,
                COUNT(CASE WHEN jl.priority = 'CRITICAL' THEN 1 END) as critical_jobs
            FROM job_lifecycle jl
        `);
        return result.rows[0];
    }
};

module.exports = {
    config,
    initializeDatabase,
    query,
    transaction,
    ...dbHelpers
};

