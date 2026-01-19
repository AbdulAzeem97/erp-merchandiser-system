import express from 'express';
import { authenticateToken, requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import OffsetPrintingWorkflowService from '../services/offsetPrintingWorkflowService.js';
import dbAdapter from '../database/adapter.js';

const router = express.Router();

// Initialize service
const offsetPrintingService = new OffsetPrintingWorkflowService();

// Set socket handler if available
router.use((req, res, next) => {
  const io = req.app.get('io');
  if (io) {
    offsetPrintingService.setSocketHandler(io);
  }
  next();
});

/**
 * GET /offset-printing/jobs
 * Get all Offset Printing jobs (filtered by process sequence)
 * Access: HOD_OFFSET, OFFSET_OPERATOR, ADMIN
 */
router.get('/jobs', authenticateToken, requirePermission(['HOD_OFFSET', 'OFFSET_OPERATOR', 'ADMIN']), asyncHandler(async (req, res) => {
  try {
    console.log('🖨️ Offset Printing: GET /jobs - User:', req.user?.email, 'Role:', req.user?.role);
    
    const filters = {
      status: req.query.status,
      assignedTo: req.query.assigned_to,
      machineId: req.query.machine_id,
      dateRange: {
        start: req.query.date_from,
        end: req.query.date_to
      },
      priority: req.query.priority
    };

    console.log('🖨️ Offset Printing: Filters:', filters);

    const jobs = await offsetPrintingService.getOffsetPrintingJobs(filters);

    console.log(`🖨️ Offset Printing: Found ${jobs.length} jobs`);

    res.json({
      success: true,
      jobs,
      count: jobs.length
    });
  } catch (error) {
    console.error('❌ Error fetching offset printing jobs:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to fetch offset printing jobs',
      message: error.message
    });
  }
}));

/**
 * GET /offset-printing/jobs/:jobId
 * Get specific Offset Printing job with complete information
 * Access: HOD_OFFSET, OFFSET_OPERATOR, ADMIN
 */
router.get('/jobs/:jobId', authenticateToken, requirePermission(['HOD_OFFSET', 'OFFSET_OPERATOR', 'ADMIN']), asyncHandler(async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;

    console.log('🖨️ Offset Printing: GET /jobs/:jobId', jobId);

    // Check permissions
    const userRole = req.user?.role;
    if (!['HOD_OFFSET', 'ADMIN'].includes(userRole)) {
      // For operator, check if assigned
      const assignmentResult = await dbAdapter.query(
        'SELECT assigned_to FROM offset_printing_assignments WHERE job_card_id = $1',
        [jobId]
      );
      if (assignmentResult.rows.length > 0 && assignmentResult.rows[0].assigned_to !== userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only view jobs assigned to you'
        });
      }
    }

    const job = await offsetPrintingService.getJobDetails(jobId);

    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        message: 'Job not found in Offset Printing department'
      });
    }

    res.json({
      success: true,
      job
    });
  } catch (error) {
    console.error('❌ Error fetching offset printing job details:', error);
    res.status(500).json({
      error: 'Failed to fetch job details',
      message: error.message
    });
  }
}));

/**
 * POST /offset-printing/assign
 * Assign job to machine and operator
 * Access: HOD_OFFSET, ADMIN
 */
router.post('/assign', authenticateToken, requirePermission(['HOD_OFFSET', 'ADMIN']), asyncHandler(async (req, res) => {
  try {
    const { jobId, machineId, operatorId, comments } = req.body;
    const userId = req.user?.id;

    console.log('🖨️ Offset Printing: POST /assign', { jobId, machineId, operatorId, userId });

    if (!jobId || !machineId || !operatorId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'jobId, machineId, and operatorId are required'
      });
    }

    const result = await offsetPrintingService.assignJob(jobId, machineId, operatorId, userId, comments);

    res.json({
      success: true,
      message: 'Job assigned successfully',
      assignment: result.assignment
    });
  } catch (error) {
    console.error('❌ Error assigning job:', error);
    res.status(500).json({
      error: 'Failed to assign job',
      message: error.message
    });
  }
}));

/**
 * PATCH /offset-printing/update-status
 * Update printing status
 * Access: HOD_OFFSET, OFFSET_OPERATOR, ADMIN
 */
router.patch('/update-status', authenticateToken, requirePermission(['HOD_OFFSET', 'OFFSET_OPERATOR', 'ADMIN']), asyncHandler(async (req, res) => {
  try {
    const { jobId, status, comments, metadata } = req.body;
    const userId = req.user?.id;

    console.log('🖨️ Offset Printing: PATCH /update-status', { jobId, status, userId });

    if (!jobId || !status) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'jobId and status are required'
      });
    }

    // Validate status
    const validStatuses = ['Pending', 'Assigned', 'Setup', 'Printing', 'Quality Check', 'Completed', 'On Hold', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Check permissions for certain statuses
    const userRole = req.user?.role;
    if (['Rejected', 'Completed'].includes(status) && !['HOD_OFFSET', 'ADMIN'].includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'Only HOD can reject or complete jobs'
      });
    }

    // Check if operator is assigned (for operators)
    if (['OFFSET_OPERATOR'].includes(userRole)) {
      const assignmentResult = await dbAdapter.query(
        'SELECT assigned_to FROM offset_printing_assignments WHERE job_card_id = $1',
        [jobId]
      );
      if (assignmentResult.rows.length === 0 || assignmentResult.rows[0].assigned_to !== userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update status for jobs assigned to you'
        });
      }
    }

    await offsetPrintingService.updateStatus(jobId, status, userId, comments, metadata);

    res.json({
      success: true,
      message: 'Status updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating status:', error);
    res.status(500).json({
      error: 'Failed to update status',
      message: error.message
    });
  }
}));

/**
 * POST /offset-printing/comments
 * Add comment to job
 * Access: HOD_OFFSET, OFFSET_OPERATOR, ADMIN
 */
router.post('/comments', authenticateToken, requirePermission(['HOD_OFFSET', 'OFFSET_OPERATOR', 'ADMIN']), asyncHandler(async (req, res) => {
  try {
    const { jobId, comment } = req.body;
    const userId = req.user?.id;

    console.log('🖨️ Offset Printing: POST /comments', { jobId, userId });

    if (!jobId || !comment) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'jobId and comment are required'
      });
    }

    await offsetPrintingService.addComment(jobId, userId, comment);

    res.json({
      success: true,
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('❌ Error adding comment:', error);
    res.status(500).json({
      error: 'Failed to add comment',
      message: error.message
    });
  }
}));

/**
 * GET /offset-printing/machines
 * Get available machines for a job (from designer-selected machines)
 * Access: HOD_OFFSET, OFFSET_OPERATOR, ADMIN
 */
router.get('/machines', authenticateToken, requirePermission(['HOD_OFFSET', 'OFFSET_OPERATOR', 'ADMIN']), asyncHandler(async (req, res) => {
  try {
    const { jobId } = req.query;

    if (!jobId) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'jobId is required'
      });
    }

    // Get job details to fetch machines
    const job = await offsetPrintingService.getJobDetails(jobId);

    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        message: 'Job not found in Offset Printing department'
      });
    }

    res.json({
      success: true,
      machines: job.machines || []
    });
  } catch (error) {
    console.error('❌ Error fetching machines:', error);
    res.status(500).json({
      error: 'Failed to fetch machines',
      message: error.message
    });
  }
}));

/**
 * GET /offset-printing/operators
 * Get available operators
 * Access: HOD_OFFSET, ADMIN
 */
router.get('/operators', authenticateToken, requirePermission(['HOD_OFFSET', 'ADMIN']), asyncHandler(async (req, res) => {
  try {
    const operators = await offsetPrintingService.getAvailableOperators();

    res.json({
      success: true,
      operators
    });
  } catch (error) {
    console.error('❌ Error fetching operators:', error);
    res.status(500).json({
      error: 'Failed to fetch operators',
      message: error.message
    });
  }
}));

/**
 * POST /offset-printing/progress/record
 * Record plate progress
 * Access: HOD_OFFSET, OFFSET_OPERATOR, ADMIN
 */
router.post('/progress/record', authenticateToken, requirePermission(['HOD_OFFSET', 'OFFSET_OPERATOR', 'ADMIN']), asyncHandler(async (req, res) => {
  try {
    const { assignmentId, plateNumber, sheetsCompleted, date, operatorId, metadata } = req.body;
    const userId = req.user?.id;

    console.log('🖨️ Recording plate progress:', { assignmentId, plateNumber, sheetsCompleted, date });

    if (!assignmentId || !plateNumber || sheetsCompleted === undefined || !date) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'assignmentId, plateNumber, sheetsCompleted, and date are required'
      });
    }

    // Use current user ID if operatorId not provided
    const finalOperatorId = operatorId || userId;

    const result = await offsetPrintingService.recordPlateProgress(
      assignmentId,
      plateNumber,
      sheetsCompleted,
      date,
      finalOperatorId,
      metadata || {}
    );

    res.json({
      success: true,
      message: 'Progress recorded successfully',
      progress: result.progress
    });
  } catch (error) {
    console.error('❌ Error recording progress:', error);
    res.status(500).json({
      error: 'Failed to record progress',
      message: error.message
    });
  }
}));

/**
 * GET /offset-printing/progress/:assignmentId
 * Get progress for assignment
 * Access: HOD_OFFSET, OFFSET_OPERATOR, ADMIN
 */
router.get('/progress/:assignmentId', authenticateToken, requirePermission(['HOD_OFFSET', 'OFFSET_OPERATOR', 'ADMIN']), asyncHandler(async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { plateNumber, date } = req.query;

    let result;
    if (plateNumber) {
      // Get specific plate progress
      result = await offsetPrintingService.getPlateProgress(assignmentId, parseInt(plateNumber));
    } else if (date) {
      // Get daily progress
      result = await offsetPrintingService.getDailyProgress(assignmentId, date);
    } else {
      // Get all progress (need to get jobId first)
      const assignmentResult = await dbAdapter.query(
        'SELECT job_card_id FROM offset_printing_assignments WHERE id = $1',
        [assignmentId]
      );
      if (assignmentResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Assignment not found'
        });
      }
      const jobProgress = await offsetPrintingService.getJobProgress(assignmentResult.rows[0].job_card_id);
      result = jobProgress.progress;
    }

    res.json({
      success: true,
      progress: result
    });
  } catch (error) {
    console.error('❌ Error fetching progress:', error);
    res.status(500).json({
      error: 'Failed to fetch progress',
      message: error.message
    });
  }
}));

/**
 * GET /offset-printing/progress/:assignmentId/plate/:plateNumber
 * Get specific plate progress
 * Access: HOD_OFFSET, OFFSET_OPERATOR, ADMIN
 */
router.get('/progress/:assignmentId/plate/:plateNumber', authenticateToken, requirePermission(['HOD_OFFSET', 'OFFSET_OPERATOR', 'ADMIN']), asyncHandler(async (req, res) => {
  try {
    const { assignmentId, plateNumber } = req.params;

    const result = await offsetPrintingService.getPlateProgress(assignmentId, parseInt(plateNumber));

    res.json({
      success: true,
      progress: result
    });
  } catch (error) {
    console.error('❌ Error fetching plate progress:', error);
    res.status(500).json({
      error: 'Failed to fetch plate progress',
      message: error.message
    });
  }
}));

/**
 * GET /offset-printing/progress/:assignmentId/daily/:date
 * Get daily progress
 * Access: HOD_OFFSET, OFFSET_OPERATOR, ADMIN
 */
router.get('/progress/:assignmentId/daily/:date', authenticateToken, requirePermission(['HOD_OFFSET', 'OFFSET_OPERATOR', 'ADMIN']), asyncHandler(async (req, res) => {
  try {
    const { assignmentId, date } = req.params;

    const result = await offsetPrintingService.getDailyProgress(assignmentId, date);

    res.json({
      success: true,
      progress: result
    });
  } catch (error) {
    console.error('❌ Error fetching daily progress:', error);
    res.status(500).json({
      error: 'Failed to fetch daily progress',
      message: error.message
    });
  }
}));

/**
 * GET /offset-printing/metrics/:assignmentId
 * Get production metrics for a date range
 * Access: HOD_OFFSET, OFFSET_OPERATOR, ADMIN
 */
router.get('/metrics/:assignmentId', authenticateToken, requirePermission(['HOD_OFFSET', 'OFFSET_OPERATOR', 'ADMIN']), asyncHandler(async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const metrics = await offsetPrintingService.getProductionMetrics(assignmentId, start, end);

    res.json({
      success: true,
      metrics,
      dateRange: { start, end }
    });
  } catch (error) {
    console.error('❌ Error fetching metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch metrics',
      message: error.message
    });
  }
}));

/**
 * POST /offset-printing/downtime
 * Record machine downtime
 * Access: HOD_OFFSET, OFFSET_OPERATOR, ADMIN
 */
router.post('/downtime', authenticateToken, requirePermission(['HOD_OFFSET', 'OFFSET_OPERATOR', 'ADMIN']), asyncHandler(async (req, res) => {
  try {
    const { assignmentId, plateNumber, date, minutes, reason } = req.body;

    if (!assignmentId || !plateNumber || !minutes || !reason) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'assignmentId, plateNumber, minutes, and reason are required'
      });
    }

    const finalDate = date || new Date().toISOString().split('T')[0];

    await offsetPrintingService.recordDowntime(
      assignmentId,
      plateNumber,
      finalDate,
      minutes,
      reason
    );

    res.json({
      success: true,
      message: 'Downtime recorded successfully'
    });
  } catch (error) {
    console.error('❌ Error recording downtime:', error);
    res.status(500).json({
      error: 'Failed to record downtime',
      message: error.message
    });
  }
}));

/**
 * POST /offset-printing/quality-issue
 * Record quality issue
 * Access: HOD_OFFSET, OFFSET_OPERATOR, ADMIN
 */
router.post('/quality-issue', authenticateToken, requirePermission(['HOD_OFFSET', 'OFFSET_OPERATOR', 'ADMIN']), asyncHandler(async (req, res) => {
  try {
    const { assignmentId, plateNumber, date, issue } = req.body;

    if (!assignmentId || !plateNumber || !issue) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'assignmentId, plateNumber, and issue are required'
      });
    }

    const finalDate = date || new Date().toISOString().split('T')[0];

    await offsetPrintingService.recordQualityIssue(
      assignmentId,
      plateNumber,
      finalDate,
      issue
    );

    res.json({
      success: true,
      message: 'Quality issue recorded successfully'
    });
  } catch (error) {
    console.error('❌ Error recording quality issue:', error);
    res.status(500).json({
      error: 'Failed to record quality issue',
      message: error.message
    });
  }
}));

/**
 * GET /offset-printing/dashboard-metrics
 * Get dashboard metrics (real-time)
 * Access: HOD_OFFSET, OFFSET_OPERATOR, ADMIN
 */
router.get('/dashboard-metrics', authenticateToken, requirePermission(['HOD_OFFSET', 'OFFSET_OPERATOR', 'ADMIN']), asyncHandler(async (req, res) => {
  try {
    const metrics = await offsetPrintingService.getDashboardMetrics();

    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('❌ Error fetching dashboard metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard metrics',
      message: error.message
    });
  }
}));

export default router;

