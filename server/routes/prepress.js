import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticateToken, requireRole, requirePermission } from '../middleware/rbac.js';
import prepressService from '../services/prepressService.js';

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

/**
 * @route POST /api/prepress/jobs
 * @desc Create a new prepress job
 * @access MERCHANDISER, HOD_PREPRESS, ADMIN
 */
router.post('/jobs', 
  requirePermission('CREATE_PREPRESS_JOBS'),
  [
    body('jobCardId').isInt().withMessage('Valid job card ID is required'),
    body('assignedDesignerId').optional().isInt().withMessage('Valid designer ID is required'),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Invalid priority'),
    body('dueDate').optional().isISO8601().withMessage('Valid due date is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { jobCardId, assignedDesignerId, priority, dueDate } = req.body;
      
      const prepressJob = await prepressService.createPrepressJob(
        jobCardId,
        assignedDesignerId,
        priority || 'MEDIUM',
        dueDate ? new Date(dueDate) : null,
        req.user.id
      );

      res.status(201).json({
        success: true,
        data: prepressJob,
        message: 'Prepress job created successfully'
      });
    } catch (error) {
      console.error('Create prepress job error:', error);
      res.status(400).json({
        error: error.message || 'Failed to create prepress job'
      });
    }
  }
);

/**
 * @route GET /api/prepress/jobs
 * @desc Get prepress jobs with filters
 * @access HOD_PREPRESS, HEAD_OF_MERCHANDISER, HEAD_OF_PRODUCTION, ADMIN
 */
router.get('/jobs',
  requirePermission('VIEW_PREPRESS_JOBS'),
  [
    query('status').optional().isIn(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'PAUSED', 'HOD_REVIEW', 'COMPLETED', 'REJECTED']),
    query('assignedDesignerId').optional().isUUID(),
    query('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    query('companyId').optional().isUUID(),
    query('productType').optional().isString(),
    query('search').optional().isString(),
    query('dueDateFrom').optional().isISO8601(),
    query('dueDateTo').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        assignedDesignerId: req.query.assignedDesignerId,
        priority: req.query.priority,
        companyId: req.query.companyId,
        productType: req.query.productType,
        search: req.query.search,
        dueDateFrom: req.query.dueDateFrom,
        dueDateTo: req.query.dueDateTo,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
      };

      const prepressJobs = await prepressService.getPrepressJobs(filters);

      res.json({
        success: true,
        data: prepressJobs,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: prepressJobs.length
        }
      });
    } catch (error) {
      console.error('Get prepress jobs error:', error);
      res.status(500).json({
        error: 'Failed to fetch prepress jobs'
      });
    }
  }
);

/**
 * @route GET /api/prepress/jobs/my
 * @desc Get designer's own queue
 * @access DESIGNER
 */
router.get('/jobs/my',
  requireRole(['DESIGNER', 'ADMIN']),
  [
    query('status').optional().isIn(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'PAUSED', 'HOD_REVIEW', 'COMPLETED', 'REJECTED']),
    query('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        priority: req.query.priority,
        limit: parseInt(req.query.limit) || 50
      };

      const designerQueue = await prepressService.getDesignerQueue(req.user.id, filters);

      res.json({
        success: true,
        data: designerQueue,
        pagination: {
          limit: filters.limit,
          total: designerQueue.length
        }
      });
    } catch (error) {
      console.error('Get designer queue error:', error);
      res.status(500).json({
        error: 'Failed to fetch designer queue'
      });
    }
  }
);

/**
 * @route GET /api/prepress/jobs/:id
 * @desc Get prepress job by ID
 * @access HOD_PREPRESS, DESIGNER, ADMIN
 */
router.get('/jobs/:id',
  requirePermission('VIEW_PREPRESS_JOBS'),
  [
    param('id').isUUID().withMessage('Valid prepress job ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const prepressJob = await prepressService.getPrepressJobById(req.params.id);
      
      if (!prepressJob) {
        return res.status(404).json({
          error: 'Prepress job not found'
        });
      }

      // Check if designer can access this job
      if (req.user.role === 'DESIGNER' && prepressJob.assigned_designer_id !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied - job not assigned to you'
        });
      }

      res.json({
        success: true,
        data: prepressJob
      });
    } catch (error) {
      console.error('Get prepress job error:', error);
      res.status(500).json({
        error: 'Failed to fetch prepress job'
      });
    }
  }
);

/**
 * @route PATCH /api/prepress/jobs/:id/assign
 * @desc Assign designer to prepress job
 * @access HOD_PREPRESS, ADMIN
 */
router.patch('/jobs/:id/assign',
  requirePermission('ASSIGN_PREPRESS_JOBS'),
  [
    param('id').isUUID().withMessage('Valid prepress job ID is required'),
    body('designerId').isUUID().withMessage('Valid designer ID is required'),
    body('remark').optional().isString().withMessage('Remark must be a string')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { designerId, remark } = req.body;
      
      const prepressJob = await prepressService.assignDesigner(
        req.params.id,
        designerId,
        req.user.id,
        remark
      );

      res.json({
        success: true,
        data: prepressJob,
        message: 'Designer assigned successfully'
      });
    } catch (error) {
      console.error('Assign designer error:', error);
      res.status(400).json({
        error: error.message || 'Failed to assign designer'
      });
    }
  }
);

/**
 * @route PATCH /api/prepress/jobs/:id/reassign
 * @desc Reassign designer
 * @access HOD_PREPRESS, ADMIN
 */
router.patch('/jobs/:id/reassign',
  requirePermission('REASSIGN_PREPRESS_JOBS'),
  [
    param('id').isUUID().withMessage('Valid prepress job ID is required'),
    body('designerId').isUUID().withMessage('Valid designer ID is required'),
    body('remark').optional().isString().withMessage('Remark must be a string')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { designerId, remark } = req.body;
      
      const prepressJob = await prepressService.reassignDesigner(
        req.params.id,
        designerId,
        req.user.id,
        remark
      );

      res.json({
        success: true,
        data: prepressJob,
        message: 'Designer reassigned successfully'
      });
    } catch (error) {
      console.error('Reassign designer error:', error);
      res.status(400).json({
        error: error.message || 'Failed to reassign designer'
      });
    }
  }
);

/**
 * @route PATCH /api/prepress/jobs/:id/start
 * @desc Start working on prepress job
 * @access DESIGNER, ADMIN
 */
router.patch('/jobs/:id/start',
  requirePermission('START_PREPRESS_JOBS'),
  [
    param('id').isUUID().withMessage('Valid prepress job ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const prepressJob = await prepressService.updatePrepressJobStatus(
        req.params.id,
        'IN_PROGRESS',
        req.user.id,
        req.user.role,
        'Work started'
      );

      res.json({
        success: true,
        data: prepressJob,
        message: 'Work started successfully'
      });
    } catch (error) {
      console.error('Start prepress job error:', error);
      res.status(400).json({
        error: error.message || 'Failed to start prepress job'
      });
    }
  }
);

/**
 * @route PATCH /api/prepress/jobs/:id/pause
 * @desc Pause prepress job
 * @access DESIGNER, ADMIN
 */
router.patch('/jobs/:id/pause',
  requirePermission('PAUSE_PREPRESS_JOBS'),
  [
    param('id').isUUID().withMessage('Valid prepress job ID is required'),
    body('remark').optional().isString().withMessage('Remark must be a string')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { remark } = req.body;
      
      const prepressJob = await prepressService.updatePrepressJobStatus(
        req.params.id,
        'PAUSED',
        req.user.id,
        req.user.role,
        remark || 'Work paused'
      );

      res.json({
        success: true,
        data: prepressJob,
        message: 'Work paused successfully'
      });
    } catch (error) {
      console.error('Pause prepress job error:', error);
      res.status(400).json({
        error: error.message || 'Failed to pause prepress job'
      });
    }
  }
);

/**
 * @route PATCH /api/prepress/jobs/:id/resume
 * @desc Resume prepress job
 * @access DESIGNER, ADMIN
 */
router.patch('/jobs/:id/resume',
  requirePermission('START_PREPRESS_JOBS'),
  [
    param('id').isUUID().withMessage('Valid prepress job ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const prepressJob = await prepressService.updatePrepressJobStatus(
        req.params.id,
        'IN_PROGRESS',
        req.user.id,
        req.user.role,
        'Work resumed'
      );

      res.json({
        success: true,
        data: prepressJob,
        message: 'Work resumed successfully'
      });
    } catch (error) {
      console.error('Resume prepress job error:', error);
      res.status(400).json({
        error: error.message || 'Failed to resume prepress job'
      });
    }
  }
);

/**
 * @route PATCH /api/prepress/jobs/:id/submit
 * @desc Submit prepress job for HOD review
 * @access DESIGNER, ADMIN
 */
router.patch('/jobs/:id/submit',
  requirePermission('COMPLETE_PREPRESS_JOBS'),
  [
    param('id').isUUID().withMessage('Valid prepress job ID is required'),
    body('remark').optional().isString().withMessage('Remark must be a string')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { remark } = req.body;
      
      const prepressJob = await prepressService.updatePrepressJobStatus(
        req.params.id,
        'HOD_REVIEW',
        req.user.id,
        req.user.role,
        remark || 'Submitted for review'
      );

      res.json({
        success: true,
        data: prepressJob,
        message: 'Job submitted for review successfully'
      });
    } catch (error) {
      console.error('Submit prepress job error:', error);
      res.status(400).json({
        error: error.message || 'Failed to submit prepress job'
      });
    }
  }
);

/**
 * @route PATCH /api/prepress/jobs/:id/approve
 * @desc Approve prepress job
 * @access HOD_PREPRESS, ADMIN
 */
router.patch('/jobs/:id/approve',
  requirePermission('APPROVE_PREPRESS_JOBS'),
  [
    param('id').isUUID().withMessage('Valid prepress job ID is required'),
    body('remark').optional().isString().withMessage('Remark must be a string')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { remark } = req.body;
      
      const prepressJob = await prepressService.updatePrepressJobStatus(
        req.params.id,
        'COMPLETED',
        req.user.id,
        req.user.role,
        remark || 'Approved by HOD'
      );

      res.json({
        success: true,
        data: prepressJob,
        message: 'Job approved successfully'
      });
    } catch (error) {
      console.error('Approve prepress job error:', error);
      res.status(400).json({
        error: error.message || 'Failed to approve prepress job'
      });
    }
  }
);

/**
 * @route PATCH /api/prepress/jobs/:id/reject
 * @desc Reject prepress job
 * @access HOD_PREPRESS, ADMIN
 */
router.patch('/jobs/:id/reject',
  requirePermission('REJECT_PREPRESS_JOBS'),
  [
    param('id').isUUID().withMessage('Valid prepress job ID is required'),
    body('remark').isString().notEmpty().withMessage('Rejection remark is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { remark } = req.body;
      
      const prepressJob = await prepressService.updatePrepressJobStatus(
        req.params.id,
        'REJECTED',
        req.user.id,
        req.user.role,
        remark
      );

      res.json({
        success: true,
        data: prepressJob,
        message: 'Job rejected successfully'
      });
    } catch (error) {
      console.error('Reject prepress job error:', error);
      res.status(400).json({
        error: error.message || 'Failed to reject prepress job'
      });
    }
  }
);

/**
 * @route POST /api/prepress/jobs/:id/remark
 * @desc Add remark to prepress job
 * @access HOD_PREPRESS, DESIGNER, ADMIN
 */
router.post('/jobs/:id/remark',
  requirePermission('VIEW_PREPRESS_JOBS'),
  [
    param('id').isUUID().withMessage('Valid prepress job ID is required'),
    body('remark').isString().notEmpty().withMessage('Remark is required'),
    body('isHodRemark').optional().isBoolean().withMessage('isHodRemark must be boolean')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { remark, isHodRemark = false } = req.body;
      
      // Check if user can add HOD remarks
      if (isHodRemark && !['HOD_PREPRESS', 'ADMIN'].includes(req.user.role)) {
        return res.status(403).json({
          error: 'Only HOD can add HOD remarks'
        });
      }
      
      const prepressJob = await prepressService.addRemark(
        req.params.id,
        remark,
        req.user.id,
        isHodRemark
      );

      res.json({
        success: true,
        data: prepressJob,
        message: 'Remark added successfully'
      });
    } catch (error) {
      console.error('Add remark error:', error);
      res.status(400).json({
        error: error.message || 'Failed to add remark'
      });
    }
  }
);

/**
 * @route GET /api/prepress/jobs/:id/activity
 * @desc Get prepress job activity log
 * @access HOD_PREPRESS, DESIGNER, ADMIN
 */
router.get('/jobs/:id/activity',
  requirePermission('VIEW_PREPRESS_JOBS'),
  [
    param('id').isUUID().withMessage('Valid prepress job ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const activity = await prepressService.getPrepressJobActivity(req.params.id);

      res.json({
        success: true,
        data: activity
      });
    } catch (error) {
      console.error('Get activity error:', error);
      res.status(500).json({
        error: 'Failed to fetch activity log'
      });
    }
  }
);

/**
 * @route GET /api/prepress/statistics
 * @desc Get prepress statistics
 * @access HOD_PREPRESS, HEAD_OF_MERCHANDISER, HEAD_OF_PRODUCTION, ADMIN
 */
router.get('/statistics',
  requirePermission('VIEW_REPORTS'),
  [
    query('fromDate').optional().isISO8601(),
    query('toDate').optional().isISO8601()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const filters = {
        fromDate: req.query.fromDate,
        toDate: req.query.toDate
      };

      const statistics = await prepressService.getPrepressStatistics(filters);

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Get statistics error:', error);
      res.status(500).json({
        error: 'Failed to fetch statistics'
      });
    }
  }
);

export default router;
