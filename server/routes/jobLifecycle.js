import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import EnhancedJobLifecycleService from '../services/enhancedJobLifecycleService.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Initialize the service
let lifecycleService = new EnhancedJobLifecycleService();

// Set socket handler when available
export const setLifecycleSocketHandler = (io) => {
  lifecycleService.setSocketHandler(io);
};

/**
 * @route GET /api/job-lifecycle/all
 * @desc Get all jobs with lifecycle data
 * @access ADMIN, HEAD_OF_MERCHANDISER, HOD_PREPRESS
 */
router.get('/all', 
  requirePermission('VIEW_JOBS'),
  async (req, res) => {
    try {
      const { status, priority, department } = req.query;
      
      const filters = {};
      if (status) filters.status = status;
      if (priority) filters.priority = priority;
      if (department) filters.department = department;

      const jobs = await lifecycleService.getAllJobsWithLifecycle(filters);

      res.json({
        success: true,
        data: jobs,
        count: jobs.length
      });
    } catch (error) {
      console.error('Error getting all jobs with lifecycle:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get jobs with lifecycle data'
      });
    }
  }
);

/**
 * @route GET /api/job-lifecycle/:jobCardId
 * @desc Get specific job lifecycle data
 * @access ADMIN, HEAD_OF_MERCHANDISER, HOD_PREPRESS, DESIGNER
 */
router.get('/:jobCardId', 
  requirePermission('VIEW_JOBS'),
  async (req, res) => {
    try {
      const { jobCardId } = req.params;
      
      const lifecycle = await lifecycleService.getJobLifecycle(jobCardId);

      if (!lifecycle) {
        return res.status(404).json({
          success: false,
          error: 'Job lifecycle not found'
        });
      }

      res.json({
        success: true,
        data: lifecycle
      });
    } catch (error) {
      console.error('Error getting job lifecycle:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get job lifecycle data'
      });
    }
  }
);

/**
 * @route POST /api/job-lifecycle/create
 * @desc Create job lifecycle entry
 * @access MERCHANDISER, HEAD_OF_MERCHANDISER, ADMIN
 */
router.post('/create', 
  requirePermission('CREATE_JOBS'),
  [
    body('jobCardId').isString().notEmpty().withMessage('Job card ID is required'),
    body('productType').isString().notEmpty().withMessage('Product type is required'),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Invalid priority')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: errors.array()
        });
      }

      const { jobCardId, productType, priority = 'MEDIUM' } = req.body;
      const createdBy = req.user.id;

      const result = await lifecycleService.createJobLifecycle(
        jobCardId, 
        productType, 
        createdBy, 
        priority
      );

      res.json({
        success: true,
        data: result,
        message: 'Job lifecycle created successfully'
      });
    } catch (error) {
      console.error('Error creating job lifecycle:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create job lifecycle'
      });
    }
  }
);

/**
 * @route PUT /api/job-lifecycle/:jobCardId/status
 * @desc Update job status
 * @access ADMIN, HEAD_OF_MERCHANDISER, HOD_PREPRESS, DESIGNER
 */
router.put('/:jobCardId/status', 
  requirePermission('UPDATE_JOBS'),
  [
    body('status').isString().notEmpty().withMessage('Status is required'),
    body('notes').optional().isString().withMessage('Notes must be a string')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: errors.array()
        });
      }

      const { jobCardId } = req.params;
      const { status, notes = '', metadata = {} } = req.body;
      const updatedBy = req.user.id;

      const result = await lifecycleService.updateJobStatus(
        jobCardId, 
        status, 
        updatedBy, 
        notes, 
        metadata
      );

      res.json({
        success: true,
        data: result,
        message: 'Job status updated successfully'
      });
    } catch (error) {
      console.error('Error updating job status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update job status'
      });
    }
  }
);

/**
 * @route GET /api/job-lifecycle/stats/dashboard
 * @desc Get dashboard statistics
 * @access ADMIN, HEAD_OF_MERCHANDISER, HOD_PREPRESS
 */
router.get('/stats/dashboard', 
  requirePermission('VIEW_JOBS'),
  async (req, res) => {
    try {
      const stats = await lifecycleService.getDashboardStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get dashboard statistics'
      });
    }
  }
);

/**
 * @route GET /api/job-lifecycle/my-jobs
 * @desc Get jobs assigned to current user
 * @access DESIGNER, HOD_PREPRESS
 */
router.get('/my-jobs', 
  requirePermission('VIEW_JOBS'),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      let jobs = [];

      if (userRole === 'DESIGNER') {
        // Get jobs assigned to this designer
        const query = `
          SELECT 
            jl.*,
            jc.quantity,
            jc.delivery_date,
            p.product_item_code,
            p.brand as product_name,
            c.name as company_name,
            u.first_name as created_by_name,
            u.last_name as created_by_lastname
          FROM job_lifecycle jl
          JOIN job_cards jc ON jl.job_card_id = jc.job_card_id
          LEFT JOIN products p ON jc.product_id = p.id
          LEFT JOIN companies c ON jc.company_id = c.id
          LEFT JOIN users u ON jl.created_by = u.id
          JOIN prepress_jobs pj ON jl.job_card_id = pj.job_card_id
          WHERE pj.assigned_designer_id = ?
          ORDER BY jl.updated_at DESC
        `;

        const dbAdapter = (await import('../database/adapter.js')).default;
        const result = await dbAdapter.query(query, [userId]);
        jobs = result.rows || result;
      } else {
        // For HOD and other roles, get all jobs
        jobs = await lifecycleService.getAllJobsWithLifecycle();
      }

      // Add progress calculation
      jobs = jobs.map(job => ({
        ...job,
        progress: lifecycleService.calculateProgress(job.status)
      }));

      res.json({
        success: true,
        data: jobs,
        count: jobs.length
      });
    } catch (error) {
      console.error('Error getting my jobs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get assigned jobs'
      });
    }
  }
);

export default router;