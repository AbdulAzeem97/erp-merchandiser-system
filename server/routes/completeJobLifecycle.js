import express from 'express';
import { body, validationResult } from 'express-validator';
import CompleteJobLifecycleService from '../services/completeJobLifecycleService.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = express.Router();
const jobLifecycleService = new CompleteJobLifecycleService();

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Get all job lifecycles with filters
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      department: req.query.department
    };

    const jobs = await jobLifecycleService.getAllJobLifecycles(filters);
    
    res.json({
      success: true,
      data: jobs,
      count: jobs.length
    });
  } catch (error) {
    console.error('Error fetching job lifecycles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job lifecycles',
      error: error.message
    });
  }
});

// Get specific job lifecycle
router.get('/:jobCardId', authenticateToken, async (req, res) => {
  try {
    const { jobCardId } = req.params;
    const job = await jobLifecycleService.getJobLifecycle(jobCardId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job lifecycle not found'
      });
    }

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error fetching job lifecycle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job lifecycle',
      error: error.message
    });
  }
});

// Get dashboard statistics
router.get('/stats/dashboard', authenticateToken, async (req, res) => {
  try {
    const stats = await jobLifecycleService.getDashboardStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
});

// Update job status to Prepress
router.post('/:jobCardId/prepress', 
  authenticateToken,
  requirePermission('PREPRESS_MANAGEMENT'),
  [
    body('prepressJobId').notEmpty().withMessage('Prepress job ID is required'),
    body('assignedDesignerId').notEmpty().withMessage('Assigned designer ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { jobCardId } = req.params;
      const { prepressJobId, assignedDesignerId } = req.body;
      const updatedBy = req.user.id;

      const result = await jobLifecycleService.updateJobStatusToPrepress(
        jobCardId, 
        prepressJobId, 
        assignedDesignerId, 
        updatedBy
      );

      res.json({
        success: true,
        message: 'Job assigned to prepress successfully',
        data: result
      });
    } catch (error) {
      console.error('Error assigning job to prepress:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign job to prepress',
        error: error.message
      });
    }
  }
);

// Update Prepress status
router.put('/:jobCardId/prepress/status',
  authenticateToken,
  requirePermission('PREPRESS_MANAGEMENT'),
  [
    body('prepressStatus').notEmpty().withMessage('Prepress status is required'),
    body('category').notEmpty().withMessage('Category is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { jobCardId } = req.params;
      const { prepressStatus, category, notes } = req.body;
      const updatedBy = req.user.id;

      const result = await jobLifecycleService.updatePrepressStatus(
        jobCardId,
        prepressStatus,
        category,
        updatedBy,
        notes
      );

      res.json({
        success: true,
        message: 'Prepress status updated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error updating prepress status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update prepress status',
        error: error.message
      });
    }
  }
);

// Update Inventory status
router.put('/:jobCardId/inventory/status',
  authenticateToken,
  requirePermission('INVENTORY_MANAGEMENT'),
  [
    body('inventoryStatus').notEmpty().withMessage('Inventory status is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { jobCardId } = req.params;
      const { inventoryStatus, notes } = req.body;
      const updatedBy = req.user.id;

      const result = await jobLifecycleService.updateInventoryStatus(
        jobCardId,
        inventoryStatus,
        updatedBy,
        notes
      );

      res.json({
        success: true,
        message: 'Inventory status updated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error updating inventory status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update inventory status',
        error: error.message
      });
    }
  }
);

// Update Production status
router.put('/:jobCardId/production/status',
  authenticateToken,
  requirePermission('PRODUCTION_MANAGEMENT'),
  [
    body('productionStatus').notEmpty().withMessage('Production status is required'),
    body('departmentId').notEmpty().withMessage('Department ID is required'),
    body('processId').notEmpty().withMessage('Process ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { jobCardId } = req.params;
      const { productionStatus, departmentId, processId, notes } = req.body;
      const updatedBy = req.user.id;

      const result = await jobLifecycleService.updateProductionStatus(
        jobCardId,
        productionStatus,
        departmentId,
        processId,
        updatedBy,
        notes
      );

      res.json({
        success: true,
        message: 'Production status updated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error updating production status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update production status',
        error: error.message
      });
    }
  }
);

// Update QA status
router.put('/:jobCardId/qa/status',
  authenticateToken,
  requirePermission('QA_MANAGEMENT'),
  [
    body('qaStatus').notEmpty().withMessage('QA status is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { jobCardId } = req.params;
      const { qaStatus, notes } = req.body;
      const updatedBy = req.user.id;

      const result = await jobLifecycleService.updateQAStatus(
        jobCardId,
        qaStatus,
        updatedBy,
        notes
      );

      res.json({
        success: true,
        message: 'QA status updated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error updating QA status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update QA status',
        error: error.message
      });
    }
  }
);

// Update Dispatch status
router.put('/:jobCardId/dispatch/status',
  authenticateToken,
  requirePermission('DISPATCH_MANAGEMENT'),
  [
    body('dispatchStatus').notEmpty().withMessage('Dispatch status is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { jobCardId } = req.params;
      const { dispatchStatus, notes } = req.body;
      const updatedBy = req.user.id;

      const result = await jobLifecycleService.updateDispatchStatus(
        jobCardId,
        dispatchStatus,
        updatedBy,
        notes
      );

      res.json({
        success: true,
        message: 'Dispatch status updated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error updating dispatch status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update dispatch status',
        error: error.message
      });
    }
  }
);

// Complete job
router.post('/:jobCardId/complete',
  authenticateToken,
  requirePermission('JOB_MANAGEMENT'),
  async (req, res) => {
    try {
      const { jobCardId } = req.params;
      const updatedBy = req.user.id;

      const result = await jobLifecycleService.completeJob(jobCardId, updatedBy);

      res.json({
        success: true,
        message: 'Job completed successfully',
        data: result
      });
    } catch (error) {
      console.error('Error completing job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete job',
        error: error.message
      });
    }
  }
);

// Get job status history
router.get('/:jobCardId/history', authenticateToken, async (req, res) => {
  try {
    const { jobCardId } = req.params;
    
    // Get job lifecycle first
    const job = await jobLifecycleService.getJobLifecycle(jobCardId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Get history
    const query = `
      SELECT jlh.*, u.first_name || ' ' || u.last_name as changed_by_name
      FROM job_lifecycle_history jlh
      JOIN users u ON jlh.changed_by = u.id
      WHERE jlh.job_lifecycle_id = $1
      ORDER BY jlh.changed_at DESC
    `;

    const result = await dbAdapter.query(query, [job.id]);
    
    res.json({
      success: true,
      data: result.rows || []
    });
  } catch (error) {
    console.error('Error fetching job history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job history',
      error: error.message
    });
  }
});

export default router;
