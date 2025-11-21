import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import ProductionWorkflowService from '../services/productionWorkflowService.js';
import dbAdapter from '../database/adapter.js';

const router = express.Router();

// Initialize service
let productionService = new ProductionWorkflowService();

// Set socket handler when available
router.use((req, res, next) => {
  const io = req.app.get('io');
  if (io) {
    productionService.setSocketHandler(io);
  }
  next();
});

/**
 * GET /production/jobs
 * Get all production jobs
 * Access: HOD_PRODUCTION, PRODUCTION_OPERATOR, ADMIN, SUPER_ADMIN
 */
router.get('/jobs', authenticateToken, requirePermission(['HOD_PRODUCTION', 'PRODUCTION_OPERATOR', 'ADMIN', 'SUPER_ADMIN']), asyncHandler(async (req, res) => {
  try {
    console.log('🏭 Production: GET /jobs - User:', req.user?.email, 'Role:', req.user?.role);
    
    const { status, priority, assignedTo, stepType, startDate, endDate } = req.query;
    
    const filters = {
      status: status || null,
      priority: priority || null,
      assignedTo: assignedTo ? parseInt(assignedTo) : null,
      stepType: stepType || null,
      dateRange: (startDate || endDate) ? {
        start: startDate || null,
        end: endDate || null
      } : null
    };

    console.log('🏭 Production: Filters:', filters);

    const jobs = await productionService.getProductionJobs(filters);

    console.log(`🏭 Production: Found ${jobs.length} jobs`);

    res.json({
      success: true,
      jobs,
      count: jobs.length
    });
  } catch (error) {
    console.error('❌ Error fetching production jobs:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to fetch production jobs',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
}));

/**
 * GET /production/jobs/:jobId
 * Get specific production job details
 * Access: HOD_PRODUCTION, PRODUCTION_OPERATOR, ADMIN, SUPER_ADMIN
 */
router.get('/jobs/:jobId', authenticateToken, requirePermission(['HOD_PRODUCTION', 'PRODUCTION_OPERATOR', 'ADMIN', 'SUPER_ADMIN']), asyncHandler(async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const jobs = await productionService.getProductionJobs({});
    const job = jobs.find(j => j.id === parseInt(jobId) || j.job_card_id === parseInt(jobId));
    
    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        message: 'Production job not found'
      });
    }

    const assignment = await productionService.getAssignment(parseInt(jobId));

    res.json({
      success: true,
      job: {
        ...job,
        assignment
      }
    });
  } catch (error) {
    console.error('Error fetching production job:', error);
    res.status(500).json({
      error: 'Failed to fetch production job',
      message: error.message
    });
  }
}));

/**
 * POST /production/assign
 * Assign job to production operator
 * Access: HOD_PRODUCTION, ADMIN, SUPER_ADMIN
 */
router.post('/assign', authenticateToken, requirePermission(['HOD_PRODUCTION', 'ADMIN', 'SUPER_ADMIN']), asyncHandler(async (req, res) => {
  try {
    console.log('🏭 Production: POST /assign - User:', req.user?.email, 'Role:', req.user?.role);
    console.log('🏭 Production: Request body:', req.body);
    
    const { jobId, assignedTo, machineId } = req.body;
    const assignedBy = req.user?.id;

    if (!jobId || !assignedTo || !machineId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'jobId, assignedTo, and machineId are required'
      });
    }

    const result = await productionService.assignJob(jobId, assignedTo, machineId, assignedBy);

    console.log('🏭 Production: Assignment successful:', result);

    res.json({
      success: true,
      message: 'Job assigned successfully',
      ...result
    });
  } catch (error) {
    console.error('❌ Error assigning production job:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to assign job',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
}));

/**
 * PATCH /production/update-status
 * Update production job status
 * Access: HOD_PRODUCTION, PRODUCTION_OPERATOR, ADMIN, SUPER_ADMIN
 */
router.patch('/update-status', authenticateToken, requirePermission(['HOD_PRODUCTION', 'PRODUCTION_OPERATOR', 'ADMIN', 'SUPER_ADMIN']), asyncHandler(async (req, res) => {
  try {
    console.log('🏭 Production: PATCH /update-status - User:', req.user?.email, 'Role:', req.user?.role);
    console.log('🏭 Production: Request body:', req.body);
    
    const { jobId, status, comments, materialConsumed, qualityMetrics } = req.body;
    const updatedBy = req.user?.id;

    if (!jobId || !status) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'jobId and status are required'
      });
    }

    const metadata = {};
    if (materialConsumed) metadata.material_consumed = materialConsumed;
    if (qualityMetrics) metadata.quality_metrics = qualityMetrics;

    const result = await productionService.updateStatus(jobId, status, updatedBy, comments, metadata);

    console.log('🏭 Production: Status update successful:', result);

    res.json({
      success: true,
      message: 'Status updated successfully',
      ...result
    });
  } catch (error) {
    console.error('❌ Error updating production status:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to update status',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
}));

/**
 * POST /production/comments
 * Add comment to production assignment
 * Access: HOD_PRODUCTION, PRODUCTION_OPERATOR, ADMIN, SUPER_ADMIN
 */
router.post('/comments', authenticateToken, requirePermission(['HOD_PRODUCTION', 'PRODUCTION_OPERATOR', 'ADMIN', 'SUPER_ADMIN']), asyncHandler(async (req, res) => {
  try {
    const { jobId, comment } = req.body;
    const userId = req.user?.id;

    if (!jobId || !comment) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'jobId and comment are required'
      });
    }

    const result = await productionService.addComment(jobId, comment, userId);

    res.json({
      success: true,
      message: 'Comment added successfully',
      ...result
    });
  } catch (error) {
    console.error('Error adding production comment:', error);
    res.status(500).json({
      error: 'Failed to add comment',
      message: error.message
    });
  }
}));

/**
 * GET /production/machines
 * Get available production machines
 * Access: HOD_PRODUCTION, PRODUCTION_OPERATOR, ADMIN, SUPER_ADMIN
 */
router.get('/machines', authenticateToken, requirePermission(['HOD_PRODUCTION', 'PRODUCTION_OPERATOR', 'ADMIN', 'SUPER_ADMIN']), asyncHandler(async (req, res) => {
  try {
    const { machineType } = req.query;
    const machines = await productionService.getAvailableMachines(machineType || null);

    res.json({
      success: true,
      machines
    });
  } catch (error) {
    console.error('Error fetching production machines:', error);
    res.status(500).json({
      error: 'Failed to fetch machines',
      message: error.message
    });
  }
}));

/**
 * GET /production/operators
 * Get production operators
 * Access: HOD_PRODUCTION, ADMIN, SUPER_ADMIN
 */
router.get('/operators', authenticateToken, requirePermission(['HOD_PRODUCTION', 'ADMIN', 'SUPER_ADMIN']), asyncHandler(async (req, res) => {
  try {
    const operators = await productionService.getProductionOperators();

    res.json({
      success: true,
      operators
    });
  } catch (error) {
    console.error('Error fetching production operators:', error);
    res.status(500).json({
      error: 'Failed to fetch operators',
      message: error.message
    });
  }
}));

/**
 * GET /production/live
 * Get live updates via polling (WebSocket alternative)
 * Access: HOD_PRODUCTION, PRODUCTION_OPERATOR, ADMIN, SUPER_ADMIN
 */
router.get('/live', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    let filters = {};
    
    // Operators can only see assigned jobs
    if (userRole === 'PRODUCTION_OPERATOR' || userRole === 'OPERATOR') {
      filters.assignedTo = userId;
    }

    const jobs = await productionService.getProductionJobs(filters);

    res.json({
      success: true,
      jobs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching live production jobs:', error);
    res.status(500).json({
      error: 'Failed to fetch live jobs',
      message: error.message
    });
  }
}));

export default router;
