import express from 'express';
import dbAdapter from '../database/adapter.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken, requirePermission } from '../middleware/rbac.js';

const router = express.Router();

// Health check endpoint for sequence monitoring
// GET /api/health/sequences
router.get('/sequences', authenticateToken, requirePermission(['ADMIN', 'HEAD_OF_PRODUCTION']), asyncHandler(async (req, res) => {
  try {
    const results = [];
    
    // Get all sequences
    const sequences = await dbAdapter.query(`
      SELECT sequencename
      FROM pg_sequences 
      WHERE schemaname = 'public' 
      AND sequencename LIKE '%_id_seq'
      ORDER BY sequencename
    `);
    
    for (const seq of sequences.rows) {
      const tableName = seq.sequencename.replace('_id_seq', '');
      
      // Check if table exists
      const tableExists = await dbAdapter.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        )
      `, [tableName]);
      
      if (tableExists.rows[0].exists) {
        try {
          const result = await dbAdapter.query(`
            SELECT 
              (SELECT COALESCE(MAX(id), 0) FROM ${tableName}) as max_id,
              (SELECT last_value FROM ${seq.sequencename}) as sequence_value,
              (SELECT last_value FROM ${seq.sequencename}) - (SELECT COALESCE(MAX(id), 0) FROM ${tableName}) as difference
          `);
          
          const { max_id, sequence_value, difference } = result.rows[0];
          results.push({
            table: tableName,
            sequence: seq.sequencename,
            max_id: parseInt(max_id),
            sequence_value: parseInt(sequence_value),
            difference: parseInt(difference),
            healthy: parseInt(difference) >= 0
          });
        } catch (error) {
          // Skip tables that don't have an id column or have errors
          results.push({
            table: tableName,
            sequence: seq.sequencename,
            error: error.message,
            healthy: false
          });
        }
      }
    }
    
    const unhealthy = results.filter(r => !r.healthy);
    
    res.json({
      healthy: unhealthy.length === 0,
      total_tables: results.length,
      unhealthy_count: unhealthy.length,
      unhealthy_tables: unhealthy,
      all_sequences: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}));

// General health check endpoint
// GET /api/health
router.get('/', asyncHandler(async (req, res) => {
  try {
    // Simple database connectivity check
    await dbAdapter.query('SELECT 1');
    
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}));

export default router;

