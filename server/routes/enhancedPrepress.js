import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticateToken, requireRole, requirePermission } from '../middleware/rbac.js';
import EnhancedPrepressService from '../services/enhancedPrepressService.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Initialize service with Socket.io instance
let prepressService;
export const initializePrepressService = (io) => {
  prepressService = new EnhancedPrepressService(io);
};

// Get the service instance
const getPrepressService = () => {
  if (!prepressService) {
    throw new Error('Prepress service not initialized');
  }
  return prepressService;
};

/**
 * @route POST /api/enhanced-prepress/jobs
 * @desc Create a new prepress job with real-time notifications
 * @access MERCHANDISER, HOD_PREPRESS, ADMIN
 */
router.post('/jobs', 
  requirePermission('CREATE_PREPRESS_JOBS'),
  [
    body('jobCardId').isUUID().withMessage('Valid job card ID is required'),
    body('assignedDesignerId').optional().isUUID().withMessage('Valid designer ID is required'),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Invalid priority'),
    body('dueDate').optional().isISO8601().withMessage('Valid due date is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { jobCardId, assignedDesignerId, priority, dueDate } = req.body;
      
      const prepressJob = await getPrepressService().createPrepressJob(
        jobCardId,
        assignedDesignerId,
        priority || 'MEDIUM',
        dueDate ? new Date(dueDate) : null,
        req.user.id
      );

      res.status(201).json({
        success: true,
        message: 'Prepress job created successfully',
        data: prepressJob
      });
    } catch (error) {
      console.error('Error creating prepress job:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/enhanced-prepress/jobs
 * @desc Get all prepress jobs with filtering
 * @access HOD_PREPRESS, DESIGNER, ADMIN
 */
router.get('/jobs',
  requirePermission('VIEW_PREPRESS_JOBS'),
  [
    query('status').optional().isIn(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'PAUSED', 'HOD_REVIEW', 'COMPLETED', 'REJECTED']),
    query('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    query('designer').optional().isUUID(),
    query('search').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        priority: req.query.priority,
        designer: req.query.designer,
        search: req.query.search,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined
      };

      // If user is a designer, only show their assigned jobs
      if (req.user.role === 'DESIGNER') {
        filters.designer = req.user.id;
      }

      const jobs = await getPrepressService().getPrepressJobs(filters);

      res.json({
        success: true,
        data: jobs
      });
    } catch (error) {
      console.error('Error getting prepress jobs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve prepress jobs'
      });
    }
  }
);

/**
 * @route GET /api/enhanced-prepress/jobs/:id
 * @desc Get prepress job by ID
 * @access HOD_PREPRESS, DESIGNER, ADMIN
 */
router.get('/jobs/:id',
  requirePermission('VIEW_PREPRESS_JOBS'),
  [
    param('id').isUUID().withMessage('Valid job ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const job = await getPrepressService().getPrepressJobById(req.params.id);

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Prepress job not found'
        });
      }

      // Check if designer can access this job
      if (req.user.role === 'DESIGNER' && job.assigned_designer_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: job
      });
    } catch (error) {
      console.error('Error getting prepress job:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve prepress job'
      });
    }
  }
);

/**
 * @route PUT /api/enhanced-prepress/jobs/:id/assign
 * @desc Assign designer to prepress job
 * @access HOD_PREPRESS, ADMIN
 */
router.put('/jobs/:id/assign',
  requirePermission('ASSIGN_PREPRESS_JOBS'),
  [
    param('id').isUUID().withMessage('Valid job ID is required'),
    body('designerId').isUUID().withMessage('Valid designer ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { designerId } = req.body;
      
      const updatedJob = await getPrepressService().assignDesigner(
        req.params.id,
        designerId,
        req.user.id
      );

      res.json({
        success: true,
        message: 'Designer assigned successfully',
        data: updatedJob
      });
    } catch (error) {
      console.error('Error assigning designer:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * @route PUT /api/enhanced-prepress/jobs/:id/start
 * @desc Start work on prepress job
 * @access DESIGNER
 */
router.put('/jobs/:id/start',
  requireRole('DESIGNER'),
  [
    param('id').isUUID().withMessage('Valid job ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const updatedJob = await getPrepressService().startWork(
        req.params.id,
        req.user.id
      );

      res.json({
        success: true,
        message: 'Work started successfully',
        data: updatedJob
      });
    } catch (error) {
      console.error('Error starting work:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * @route PUT /api/enhanced-prepress/jobs/:id/pause
 * @desc Pause work on prepress job
 * @access DESIGNER
 */
router.put('/jobs/:id/pause',
  requireRole('DESIGNER'),
  [
    param('id').isUUID().withMessage('Valid job ID is required'),
    body('remark').optional().isString().withMessage('Remark must be a string')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { remark } = req.body;
      
      const updatedJob = await getPrepressService().pauseWork(
        req.params.id,
        req.user.id,
        remark
      );

      res.json({
        success: true,
        message: 'Work paused successfully',
        data: updatedJob
      });
    } catch (error) {
      console.error('Error pausing work:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * @route PUT /api/enhanced-prepress/jobs/:id/resume
 * @desc Resume work on prepress job
 * @access DESIGNER
 */
router.put('/jobs/:id/resume',
  requireRole('DESIGNER'),
  [
    param('id').isUUID().withMessage('Valid job ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const updatedJob = await getPrepressService().resumeWork(
        req.params.id,
        req.user.id
      );

      res.json({
        success: true,
        message: 'Work resumed successfully',
        data: updatedJob
      });
    } catch (error) {
      console.error('Error resuming work:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * @route PUT /api/enhanced-prepress/jobs/:id/submit
 * @desc Submit job for HOD review
 * @access DESIGNER
 */
router.put('/jobs/:id/submit',
  requireRole('DESIGNER'),
  [
    param('id').isUUID().withMessage('Valid job ID is required'),
    body('remark').optional().isString().withMessage('Remark must be a string')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { remark } = req.body;
      
      const updatedJob = await getPrepressService().submitForReview(
        req.params.id,
        req.user.id,
        remark
      );

      res.json({
        success: true,
        message: 'Job submitted for review successfully',
        data: updatedJob
      });
    } catch (error) {
      console.error('Error submitting job:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * @route PUT /api/enhanced-prepress/jobs/:id/complete
 * @desc Complete prepress job
 * @access HOD_PREPRESS, ADMIN
 */
router.put('/jobs/:id/complete',
  requirePermission('COMPLETE_PREPRESS_JOBS'),
  [
    param('id').isUUID().withMessage('Valid job ID is required'),
    body('remark').optional().isString().withMessage('Remark must be a string')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { remark } = req.body;
      
      const updatedJob = await getPrepressService().completeJob(
        req.params.id,
        req.user.id,
        remark
      );

      res.json({
        success: true,
        message: 'Job completed successfully',
        data: updatedJob
      });
    } catch (error) {
      console.error('Error completing job:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * @route PUT /api/enhanced-prepress/jobs/:id/reject
 * @desc Reject prepress job
 * @access HOD_PREPRESS, ADMIN
 */
router.put('/jobs/:id/reject',
  requirePermission('REJECT_PREPRESS_JOBS'),
  [
    param('id').isUUID().withMessage('Valid job ID is required'),
    body('remark').isString().withMessage('Rejection remark is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { remark } = req.body;
      
      const updatedJob = await getPrepressService().updatePrepressJobStatus(
        req.params.id,
        'REJECTED',
        req.user.id,
        remark
      );

      res.json({
        success: true,
        message: 'Job rejected successfully',
        data: updatedJob
      });
    } catch (error) {
      console.error('Error rejecting job:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/enhanced-prepress/jobs/:id/remarks
 * @desc Add remark to prepress job
 * @access HOD_PREPRESS, DESIGNER, ADMIN
 */
router.post('/jobs/:id/remarks',
  requirePermission('ADD_PREPRESS_REMARKS'),
  [
    param('id').isUUID().withMessage('Valid job ID is required'),
    body('remark').isString().withMessage('Remark is required'),
    body('isHodRemark').optional().isBoolean().withMessage('isHodRemark must be boolean')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { remark, isHodRemark = false } = req.body;
      
      const updatedJob = await getPrepressService().addRemark(
        req.params.id,
        remark,
        req.user.id,
        isHodRemark
      );

      res.json({
        success: true,
        message: 'Remark added successfully',
        data: updatedJob
      });
    } catch (error) {
      console.error('Error adding remark:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/enhanced-prepress/jobs/:id/activity
 * @desc Get prepress job activity history
 * @access HOD_PREPRESS, DESIGNER, ADMIN
 */
router.get('/jobs/:id/activity',
  requirePermission('VIEW_PREPRESS_JOBS'),
  [
    param('id').isUUID().withMessage('Valid job ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const activity = await getPrepressService().getPrepressJobActivity(req.params.id);

      res.json({
        success: true,
        data: activity
      });
    } catch (error) {
      console.error('Error getting job activity:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve job activity'
      });
    }
  }
);

/**
 * @route GET /api/enhanced-prepress/statistics
 * @desc Get prepress statistics
 * @access HOD_PREPRESS, ADMIN
 */
router.get('/statistics',
  requirePermission('VIEW_PREPRESS_STATISTICS'),
  async (req, res) => {
    try {
      const statistics = await getPrepressService().getPrepressStatistics();

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Error getting statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve statistics'
      });
    }
  }
);

/**
 * @route GET /api/enhanced-prepress/designers/productivity
 * @desc Get designer productivity data
 * @access HOD_PREPRESS, ADMIN
 */
router.get('/designers/productivity',
  requirePermission('VIEW_PREPRESS_STATISTICS'),
  async (req, res) => {
    try {
      const productivity = await getPrepressService().getDesignerProductivity();

      res.json({
        success: true,
        data: productivity
      });
    } catch (error) {
      console.error('Error getting designer productivity:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve designer productivity'
      });
    }
  }
);

export default router;

