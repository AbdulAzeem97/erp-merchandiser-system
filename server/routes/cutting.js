import express from 'express';
import { authenticateToken, requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import CuttingWorkflowService from '../services/cuttingWorkflowService.js';
import dbAdapter from '../database/adapter.js';

const router = express.Router();

// Initialize service
const cuttingService = new CuttingWorkflowService();

// Set socket handler if available
router.use((req, res, next) => {
  const io = req.app.get('io');
  if (io) {
    cuttingService.setSocketHandler(io);
  }
  next();
});

/**
 * GET /cutting/jobs
 * Get all jobs in Cutting department
 * Access: HOD_CUTTING, SUPER_ADMIN
 */
router.get('/jobs', authenticateToken, requirePermission(['HOD_CUTTING', 'ADMIN', 'SUPER_ADMIN']), asyncHandler(async (req, res) => {
  try {
    console.log('🔪 Cutting: GET /jobs - User:', req.user?.email, 'Role:', req.user?.role);
    
    const filters = {
      status: req.query.status,
      assignedTo: req.query.assigned_to,
      dateFrom: req.query.date_from,
      dateTo: req.query.date_to,
      priority: req.query.priority
    };

    console.log('🔪 Cutting: Filters:', filters);

    const jobs = await cuttingService.getCuttingJobs(filters);

    console.log(`🔪 Cutting: Found ${jobs.length} jobs`);

    res.json({
      success: true,
      jobs,
      count: jobs.length
    });
  } catch (error) {
    console.error('❌ Error fetching cutting jobs:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to fetch cutting jobs',
      message: error.message
    });
  }
}));

/**
 * GET /cutting/jobs/:jobId
 * Get specific cutting job details
 * Access: HOD_CUTTING, SUPER_ADMIN, CUTTING_LABOR (if assigned)
 */
router.get('/jobs/:jobId', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;

    // Check permissions
    const userRole = req.user?.role;
    if (!['HOD_CUTTING', 'SUPER_ADMIN'].includes(userRole)) {
      // For labor, check if assigned
      const assignment = await cuttingService.getAssignment(jobId);
      if (!assignment || assignment.assigned_to !== userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only view jobs assigned to you'
        });
      }
    }

    const jobs = await cuttingService.getCuttingJobs({});
    const job = jobs.find(j => j.id === jobId);

    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        message: 'Job not found in cutting department'
      });
    }

    const assignment = await cuttingService.getAssignment(jobId);

    res.json({
      success: true,
      job: {
        ...job,
        assignment
      }
    });
  } catch (error) {
    console.error('Error fetching cutting job:', error);
    res.status(500).json({
      error: 'Failed to fetch cutting job',
      message: error.message
    });
  }
}));

/**
 * POST /cutting/assign
 * Assign job to cutting labor
 * Access: HOD_CUTTING, SUPER_ADMIN
 */
router.post('/assign', authenticateToken, requirePermission(['HOD_CUTTING', 'ADMIN', 'SUPER_ADMIN']), asyncHandler(async (req, res) => {
  try {
    const { jobId, assignedTo, comments } = req.body;
    const assignedBy = req.user?.id;

    if (!jobId || !assignedTo) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'jobId and assignedTo are required'
      });
    }

    const result = await cuttingService.assignJob(jobId, assignedTo, assignedBy, comments);

    res.json({
      success: true,
      message: 'Job assigned successfully',
      ...result
    });
  } catch (error) {
    console.error('Error assigning cutting job:', error);
    res.status(500).json({
      error: 'Failed to assign job',
      message: error.message
    });
  }
}));

/**
 * PATCH /cutting/update-status
 * Update cutting status
 * Access: HOD_CUTTING, SUPER_ADMIN
 */
router.patch('/update-status', authenticateToken, requirePermission(['HOD_CUTTING', 'ADMIN', 'SUPER_ADMIN']), asyncHandler(async (req, res) => {
  try {
    const { jobId, status, comments } = req.body;
    const updatedBy = req.user?.id;

    if (!jobId || !status) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'jobId and status are required'
      });
    }

    const result = await cuttingService.updateStatus(jobId, status, updatedBy, comments);

    res.json({
      success: true,
      message: 'Status updated successfully',
      ...result
    });
  } catch (error) {
    console.error('Error updating cutting status:', error);
    res.status(500).json({
      error: 'Failed to update status',
      message: error.message
    });
  }
}));

/**
 * POST /cutting/comments
 * Add comment to cutting assignment
 * Access: HOD_CUTTING, SUPER_ADMIN
 */
router.post('/comments', authenticateToken, requirePermission(['HOD_CUTTING', 'ADMIN', 'SUPER_ADMIN']), asyncHandler(async (req, res) => {
  try {
    const { jobId, comment } = req.body;
    const userId = req.user?.id;

    if (!jobId || !comment) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'jobId and comment are required'
      });
    }

    const result = await cuttingService.addComment(jobId, comment, userId);

    res.json({
      success: true,
      message: 'Comment added successfully',
      ...result
    });
  } catch (error) {
    console.error('Error adding cutting comment:', error);
    res.status(500).json({
      error: 'Failed to add comment',
      message: error.message
    });
  }
}));

/**
 * GET /cutting/live
 * Get live updates via polling (WebSocket alternative)
 * Access: HOD_CUTTING, SUPER_ADMIN, CUTTING_LABOR
 */
router.get('/live', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    let filters = {};
    
    // Labor can only see assigned jobs
    if (userRole === 'CUTTING_LABOR') {
      filters.assignedTo = userId;
    }

    const jobs = await cuttingService.getCuttingJobs(filters);

    res.json({
      success: true,
      jobs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching live cutting jobs:', error);
    res.status(500).json({
      error: 'Failed to fetch live jobs',
      message: error.message
    });
  }
}));

/**
 * POST /cutting/manual-activate/:jobId
 * Manually activate cutting workflow for a job (for jobs stuck after CTP)
 * Access: HOD_CUTTING, ADMIN, SUPER_ADMIN
 */
router.post('/manual-activate/:jobId', authenticateToken, requirePermission(['HOD_CUTTING', 'ADMIN', 'SUPER_ADMIN']), asyncHandler(async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;
    
    console.log(`🔪 Cutting: Manual activation for job ${jobId}`);
    
    // Get job workflow steps
    const workflowSteps = await dbAdapter.query(`
      SELECT * FROM job_workflow_steps
      WHERE job_card_id = $1
      ORDER BY sequence_number ASC
    `, [jobId]);
    
    if (workflowSteps.rows.length === 0) {
      return res.status(404).json({
        error: 'No workflow steps found',
        message: 'This job does not have workflow steps. Please ensure workflow was generated from product process sequence.'
      });
    }
    
    // Find CTP or last completed Prepress step
    const ctpStep = workflowSteps.rows.find(s => 
      (s.step_name.toLowerCase().includes('ctp') || s.step_name.toLowerCase().includes('plate')) &&
      s.status === 'completed'
    ) || workflowSteps.rows.filter(s => s.department === 'Prepress' && s.status === 'completed').pop();
    
    if (!ctpStep) {
      return res.status(400).json({
        error: 'CTP not completed',
        message: 'CTP step must be completed before activating cutting workflow'
      });
    }
    
    // Find next step (should be cutting)
    const nextStep = workflowSteps.rows.find(s => s.sequence_number === ctpStep.sequence_number + 1);
    
    if (!nextStep) {
      return res.status(400).json({
        error: 'No next step found',
        message: 'No workflow step found after CTP'
      });
    }
    
    // Check if it's a cutting step
    const isCuttingStep = nextStep.department === 'Cutting' || 
                          nextStep.step_name.toLowerCase().includes('cut') ||
                          nextStep.step_name.toLowerCase().includes('cutting') ||
                          nextStep.step_name.toLowerCase().includes('trim') ||
                          nextStep.step_name.toLowerCase().includes('die');
    
    if (!isCuttingStep) {
      return res.status(400).json({
        error: 'Next step is not cutting',
        message: `Next step is "${nextStep.step_name}" (${nextStep.department}), not a cutting step`
      });
    }
    
    // Fix department if wrong
    if (nextStep.department !== 'Cutting') {
      await dbAdapter.query(`
        UPDATE job_workflow_steps
        SET department = 'Cutting'
        WHERE job_card_id = $1 AND sequence_number = $2
      `, [jobId, nextStep.sequence_number]);
      console.log(`✅ Fixed department for step "${nextStep.step_name}"`);
    }
    
    // Create cutting assignment
    await dbAdapter.query(`
      INSERT INTO cutting_assignments (job_id, assigned_by, status)
      VALUES ($1, $2, 'Pending')
      ON CONFLICT (job_id) DO UPDATE SET status = 'Pending', updated_at = NOW()
    `, [jobId, userId]);
    
    // Update job_cards
    await dbAdapter.query(`
      UPDATE job_cards
      SET 
        current_step = $1,
        current_department = 'Cutting',
        workflow_status = 'pending',
        status = 'PENDING',
        status_message = 'Awaiting cutting assignment',
        last_updated_by = $2,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [nextStep.step_name, userId, jobId]);
    
    // Update workflow step to pending
    await dbAdapter.query(`
      UPDATE job_workflow_steps
      SET 
        status = 'pending',
        status_message = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE job_card_id = $2 AND sequence_number = $3
    `, [
      `Pending in ${nextStep.step_name} (Cutting)`,
      jobId,
      nextStep.sequence_number
    ]);
    
    // Emit notification
    const io = req.app.get('io');
    if (io) {
      io.emit('cutting:job_ready', {
        jobId: parseInt(jobId),
        step: nextStep.step_name,
        department: 'Cutting'
      });
    }
    
    res.json({
      success: true,
      message: 'Cutting workflow activated successfully',
      jobId: parseInt(jobId),
      step: nextStep.step_name
    });
  } catch (error) {
    console.error('Error manually activating cutting:', error);
    res.status(500).json({
      error: 'Failed to activate cutting workflow',
      message: error.message
    });
  }
}));

/**
 * GET /cutting/assignment/:jobId
 * Get assignment details for a job
 * Access: HOD_CUTTING, SUPER_ADMIN, CUTTING_LABOR (if assigned)
 */
router.get('/assignment/:jobId', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const assignment = await cuttingService.getAssignment(jobId);

    if (!assignment) {
      return res.status(404).json({
        error: 'Assignment not found',
        message: 'No cutting assignment found for this job'
      });
    }

    // Check permissions
    if (!['HOD_CUTTING', 'SUPER_ADMIN'].includes(userRole)) {
      if (assignment.assigned_to !== userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only view your own assignments'
        });
      }
    }

    res.json({
      success: true,
      assignment
    });
  } catch (error) {
    console.error('Error fetching cutting assignment:', error);
    res.status(500).json({
      error: 'Failed to fetch assignment',
      message: error.message
    });
  }
}));

/**
 * GET /cutting/diagnose/:jobNumber
 * Diagnostic endpoint to check why a job is or isn't appearing in cutting dashboard
 * Access: HOD_CUTTING, SUPER_ADMIN
 */
router.get('/diagnose/:jobNumber', authenticateToken, requirePermission(['HOD_CUTTING', 'ADMIN', 'SUPER_ADMIN']), asyncHandler(async (req, res) => {
  try {
    const { jobNumber } = req.params;
    console.log('🔍 Cutting Diagnostic: Checking job:', jobNumber);

    // Find job by jobNumber
    const jobCardResult = await dbAdapter.query(`
      SELECT 
        jc.id,
        jc."jobNumber",
        jc.current_department,
        jc.current_step,
        jc.workflow_status,
        jc.status_message,
        jc.status,
        jc."createdAt",
        jc."updatedAt"
      FROM job_cards jc
      WHERE jc."jobNumber" = $1
    `, [jobNumber]);

    if (jobCardResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
        message: `No job found with job number: ${jobNumber}`
      });
    }

    const jobCard = jobCardResult.rows[0];
    const jobCardId = jobCard.id;

    // Check planning status (using CAST for type consistency)
    const planningResult = await dbAdapter.query(`
      SELECT 
        id,
        job_card_id,
        CAST(job_card_id AS TEXT) as job_card_id_text,
        planning_status,
        final_total_sheets,
        cutting_layout_type,
        grid_pattern,
        blanks_per_sheet,
        created_at,
        updated_at,
        planned_at,
        planned_by
      FROM job_production_planning
      WHERE CAST(job_card_id AS TEXT) = CAST($1 AS TEXT)
    `, [jobCardId]);

    // Check cutting assignments (using CAST for type consistency)
    const assignmentResult = await dbAdapter.query(`
      SELECT 
        id,
        job_id,
        CAST(job_id AS TEXT) as job_id_text,
        assigned_to,
        assigned_by,
        status,
        comments,
        started_at,
        finished_at,
        created_at,
        updated_at
      FROM cutting_assignments
      WHERE CAST(job_id AS TEXT) = CAST($1 AS TEXT)
    `, [jobCardId]);

    // Check workflow steps (using CAST for type consistency)
    const workflowResult = await dbAdapter.query(`
      SELECT 
        id,
        job_card_id,
        CAST(job_card_id AS TEXT) as job_card_id_text,
        step_name,
        department,
        status,
        sequence_number,
        status_message,
        created_at,
        updated_at
      FROM job_workflow_steps
      WHERE CAST(job_card_id AS TEXT) = CAST($1 AS TEXT)
      ORDER BY sequence_number
    `, [jobCardId]);

    // Check prepress job (using CAST for type consistency)
    const prepressResult = await dbAdapter.query(`
      SELECT 
        id,
        job_card_id,
        CAST(job_card_id AS TEXT) as job_card_id_text,
        status,
        plate_generated,
        plate_generated_at
      FROM prepress_jobs
      WHERE CAST(job_card_id AS TEXT) = CAST($1 AS TEXT)
    `, [jobCardId]);

    // Check if job would match cutting query conditions
    const wouldMatch = {
      by_current_department: jobCard.current_department === 'Cutting',
      by_assignment: assignmentResult.rows.length > 0,
      by_planning_status: planningResult.rows.length > 0 && 
                          planningResult.rows[0].planning_status === 'APPLIED',
      planning_status_value: planningResult.rows.length > 0 ? planningResult.rows[0].planning_status : null,
      job_card_id_type: typeof jobCardId,
      planning_job_card_id_type: planningResult.rows.length > 0 ? typeof planningResult.rows[0].job_card_id : null,
      ids_match: planningResult.rows.length > 0 ? 
                 String(jobCardId) === String(planningResult.rows[0].job_card_id) : false
    };

    // Test the actual query
    const testQueryResult = await dbAdapter.query(`
      SELECT DISTINCT
        jc.id,
        jc."jobNumber",
        jc.current_department,
        jpp.planning_status,
        ca.id as assignment_id
      FROM job_cards jc
      LEFT JOIN cutting_assignments ca ON jc.id = ca.job_id
      LEFT JOIN job_production_planning jpp ON jc.id = jpp.job_card_id
      WHERE jc."jobNumber" = $1
        AND (
          jc.current_department = 'Cutting' 
          OR ca.id IS NOT NULL 
          OR (jpp.planning_status IS NOT NULL AND jpp.planning_status = 'APPLIED')
        )
    `, [jobNumber]);

      const diagnostic = {
      job_card: {
        ...jobCard,
        id_type: typeof jobCard.id,
        id_value: jobCard.id
      },
      planning: planningResult.rows.length > 0 ? {
        ...planningResult.rows[0],
        job_card_id_type: typeof planningResult.rows[0].job_card_id,
        ids_match: String(planningResult.rows[0].job_card_id) === String(jobCardId)
      } : null,
      assignment: assignmentResult.rows.length > 0 ? {
        ...assignmentResult.rows[0],
        job_id_type: typeof assignmentResult.rows[0].job_id,
        ids_match: String(assignmentResult.rows[0].job_id) === String(jobCardId)
      } : null,
      workflow_steps: workflowResult.rows.map(step => ({
        ...step,
        job_card_id_type: typeof step.job_card_id,
        ids_match: String(step.job_card_id) === String(jobCardId)
      })),
      prepress_job: prepressResult.rows.length > 0 ? {
        ...prepressResult.rows[0],
        job_card_id_type: typeof prepressResult.rows[0].job_card_id,
        ids_match: String(prepressResult.rows[0].job_card_id) === String(jobCardId)
      } : null,
      query_match_conditions: wouldMatch,
      appears_in_query: testQueryResult.rows.length > 0,
      query_result: testQueryResult.rows.length > 0 ? testQueryResult.rows[0] : null
    };

    console.log('🔍 Cutting Diagnostic Result:', JSON.stringify(diagnostic, null, 2));

    res.json({
      success: true,
      jobNumber,
      diagnostic,
      recommendations: generateRecommendations(diagnostic)
    });
  } catch (error) {
    console.error('❌ Error in diagnostic endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Diagnostic failed',
      message: error.message,
      stack: error.stack
    });
  }
}));

/**
 * Helper function to generate recommendations based on diagnostic
 */
function generateRecommendations(diagnostic) {
  const recommendations = [];

  if (!diagnostic.appears_in_query) {
    if (!diagnostic.query_match_conditions.by_current_department && 
        !diagnostic.query_match_conditions.by_assignment && 
        !diagnostic.query_match_conditions.by_planning_status) {
      recommendations.push('Job does not match any cutting query conditions');
    }

    if (diagnostic.planning && diagnostic.planning.planning_status !== 'APPLIED') {
      recommendations.push(`Planning status is "${diagnostic.planning.planning_status}" but should be "APPLIED"`);
    }

    if (!diagnostic.query_match_conditions.ids_match && diagnostic.planning) {
      recommendations.push('Job card ID and planning job_card_id do not match - possible data type mismatch');
    }

    if (diagnostic.job_card.current_department !== 'Cutting') {
      recommendations.push(`Current department is "${diagnostic.job_card.current_department}" but should be "Cutting"`);
    }
  }

  if (diagnostic.planning && diagnostic.planning.planning_status === 'APPLIED' && !diagnostic.appears_in_query) {
    recommendations.push('Planning is APPLIED but job not appearing - check query JOIN conditions');
  }

  return recommendations;
}

export default router;

