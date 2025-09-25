import express from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler.js';
import PrepressWorkflowService from '../services/prepressWorkflowService.js';

const router = express.Router();

// Initialize prepress workflow service
let prepressWorkflowService = null;

// Set socket handler when available
router.use((req, res, next) => {
  if (req.app.get('io') && !prepressWorkflowService) {
    prepressWorkflowService = new PrepressWorkflowService(req.app.get('io'));
  }
  next();
});

// Validation middleware
const statusUpdateValidation = [
  body('status').isIn([
    'DESIGNING', 'DESIGNING_COMPLETED', 'DIE_MAKING', 'DIE_MAKING_COMPLETED',
    'PLATE_MAKING', 'PLATE_MAKING_COMPLETED', 'PREPRESS_COMPLETED'
  ]),
  body('notes').optional().isString().trim(),
  body('metadata').optional().isObject()
];

/**
 * Update prepress job status
 */
router.put('/:jobCardId/status', statusUpdateValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation error',
      details: errors.array()
    });
  }

  const { jobCardId } = req.params;
  const { status, notes, metadata } = req.body;
  const updatedBy = req.user?.id || 'system';

  if (!prepressWorkflowService) {
    return res.status(500).json({
      error: 'Prepress workflow service not initialized'
    });
  }

  try {
    const result = await prepressWorkflowService.updatePrepressStatus(
      jobCardId,
      status,
      notes,
      updatedBy,
      metadata
    );

    res.json({
      success: true,
      message: 'Prepress status updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating prepress status:', error);
    res.status(500).json({
      error: 'Failed to update prepress status',
      message: error.message
    });
  }
}));

/**
 * Get prepress job details with workflow info
 */
router.get('/:jobCardId', asyncHandler(async (req, res) => {
  const { jobCardId } = req.params;

  if (!prepressWorkflowService) {
    return res.status(500).json({
      error: 'Prepress workflow service not initialized'
    });
  }

  try {
    const jobDetails = await prepressWorkflowService.getPrepressJobDetails(jobCardId);

    if (!jobDetails) {
      return res.status(404).json({
        error: 'Prepress job not found',
        message: 'No prepress job found for the specified job card'
      });
    }

    res.json({
      success: true,
      data: jobDetails
    });
  } catch (error) {
    console.error('Error getting prepress job details:', error);
    res.status(500).json({
      error: 'Failed to get prepress job details',
      message: error.message
    });
  }
}));

/**
 * Get all prepress jobs with workflow status
 */
router.get('/', asyncHandler(async (req, res) => {
  const { status, designerId, priority } = req.query;

  if (!prepressWorkflowService) {
    return res.status(500).json({
      error: 'Prepress workflow service not initialized'
    });
  }

  try {
    const filters = {};
    if (status) filters.status = status;
    if (designerId) filters.designerId = designerId;
    if (priority) filters.priority = priority;

    const jobs = await prepressWorkflowService.getAllPrepressJobs(filters);

    res.json({
      success: true,
      data: jobs,
      count: jobs.length
    });
  } catch (error) {
    console.error('Error getting prepress jobs:', error);
    res.status(500).json({
      error: 'Failed to get prepress jobs',
      message: error.message
    });
  }
}));

/**
 * Get prepress workflow statistics
 */
router.get('/stats/overview', asyncHandler(async (req, res) => {
  if (!prepressWorkflowService) {
    return res.status(500).json({
      error: 'Prepress workflow service not initialized'
    });
  }

  try {
    const allJobs = await prepressWorkflowService.getAllPrepressJobs();
    
    const stats = {
      total: allJobs.length,
      designing: allJobs.filter(job => job.status === 'DESIGNING').length,
      dieMaking: allJobs.filter(job => job.status === 'DIE_MAKING').length,
      plateMaking: allJobs.filter(job => job.status === 'PLATE_MAKING').length,
      completed: allJobs.filter(job => job.status === 'PREPRESS_COMPLETED').length,
      overdue: allJobs.filter(job => {
        const dueDate = new Date(job.dueDate);
        const today = new Date();
        return dueDate < today && !['PREPRESS_COMPLETED', 'COMPLETED'].includes(job.status);
      }).length
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting prepress stats:', error);
    res.status(500).json({
      error: 'Failed to get prepress statistics',
      message: error.message
    });
  }
}));

export default router;
