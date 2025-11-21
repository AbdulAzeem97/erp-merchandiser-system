import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import UnifiedWorkflowService from '../services/unifiedWorkflowService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Initialize service
let workflowService = new UnifiedWorkflowService();

// Set socket handler when available
export const setWorkflowSocketHandler = (io) => {
  workflowService.setSocketHandler(io);
};

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route GET /api/workflow/:jobCardId
 * @desc Get workflow steps for a job
 * @access Authenticated users
 */
router.get('/:jobCardId', asyncHandler(async (req, res) => {
  try {
    const { jobCardId } = req.params;
    const workflow = await workflowService.getJobWorkflow(jobCardId);
    
    res.json({
      success: true,
      workflow: workflow
    });
  } catch (error) {
    console.error('Error getting workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get workflow',
      message: error.message
    });
  }
}));

/**
 * @route POST /api/workflow/:jobCardId/start
 * @desc Start a workflow step
 * @access Authenticated users with appropriate permissions
 */
router.post('/:jobCardId/start', 
  requirePermission('UPDATE_JOB_STATUS'),
  asyncHandler(async (req, res) => {
    try {
      const { jobCardId } = req.params;
      const { sequenceNumber } = req.body;
      const userId = req.user.id;

      if (!sequenceNumber) {
        return res.status(400).json({
          success: false,
          error: 'Sequence number is required'
        });
      }

      const result = await workflowService.startStep(jobCardId, sequenceNumber, userId);
      
      res.json({
        success: true,
        message: 'Step started successfully',
        data: result
      });
    } catch (error) {
      console.error('Error starting step:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start step',
        message: error.message
      });
    }
  })
);

/**
 * @route POST /api/workflow/:jobCardId/submit
 * @desc Submit step to QA
 * @access Authenticated users
 */
router.post('/:jobCardId/submit',
  requirePermission('SUBMIT_TO_QA'),
  asyncHandler(async (req, res) => {
    try {
      const { jobCardId } = req.params;
      const { sequenceNumber } = req.body;
      const userId = req.user.id;

      if (!sequenceNumber) {
        return res.status(400).json({
          success: false,
          error: 'Sequence number is required'
        });
      }

      const result = await workflowService.submitToQA(jobCardId, sequenceNumber, userId);
      
      res.json({
        success: true,
        message: 'Step submitted to QA successfully',
        data: result
      });
    } catch (error) {
      console.error('Error submitting to QA:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit to QA',
        message: error.message
      });
    }
  })
);

/**
 * @route POST /api/workflow/:jobCardId/approve
 * @desc Approve step (QA approval)
 * @access QA users
 */
router.post('/:jobCardId/approve',
  requirePermission('APPROVE_QA_JOBS'),
  asyncHandler(async (req, res) => {
    try {
      const { jobCardId } = req.params;
      const { sequenceNumber, notes } = req.body;
      const userId = req.user.id;

      if (!sequenceNumber) {
        return res.status(400).json({
          success: false,
          error: 'Sequence number is required'
        });
      }

      const result = await workflowService.approveStep(jobCardId, sequenceNumber, userId, notes);
      
      res.json({
        success: true,
        message: 'Step approved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error approving step:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to approve step',
        message: error.message
      });
    }
  })
);

/**
 * @route POST /api/workflow/:jobCardId/reject
 * @desc Reject step (QA rejection)
 * @access QA users
 */
router.post('/:jobCardId/reject',
  requirePermission('REJECT_QA_JOBS'),
  asyncHandler(async (req, res) => {
    try {
      const { jobCardId } = req.params;
      const { sequenceNumber, notes } = req.body;
      const userId = req.user.id;

      if (!sequenceNumber) {
        return res.status(400).json({
          success: false,
          error: 'Sequence number is required'
        });
      }

      const result = await workflowService.rejectStep(jobCardId, sequenceNumber, userId, notes);
      
      res.json({
        success: true,
        message: 'Step rejected, returned for revision',
        data: result
      });
    } catch (error) {
      console.error('Error rejecting step:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reject step',
        message: error.message
      });
    }
  })
);

/**
 * @route POST /api/workflow/:jobCardId/auto-complete
 * @desc Auto-complete step (e.g., after CTP generation)
 * @access Authenticated users
 */
router.post('/:jobCardId/auto-complete',
  asyncHandler(async (req, res) => {
    try {
      const { jobCardId } = req.params;
      const { actionType } = req.body;
      const userId = req.user.id;

      const result = await workflowService.autoCompleteStep(jobCardId, actionType, userId);
      
      res.json({
        success: true,
        message: 'Step auto-completed successfully',
        data: result
      });
    } catch (error) {
      console.error('Error auto-completing step:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to auto-complete step',
        message: error.message
      });
    }
  })
);

export default router;

