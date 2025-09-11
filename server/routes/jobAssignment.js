import express from 'express';
import { body, validationResult } from 'express-validator';
import dbAdapter from '../database/adapter.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route POST /api/job-assignment/assign
 * @desc Assign a job to a designer with full lifecycle tracking
 * @access MERCHANDISER, HOD_PREPRESS, ADMIN
 */
router.post('/assign', 
  requirePermission('ASSIGN_JOBS'),
  [
    body('jobCardId').isString().notEmpty().withMessage('Job card ID is required'),
    body('designerId').isString().notEmpty().withMessage('Designer ID is required'),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Invalid priority'),
    body('dueDate').optional().isISO8601().withMessage('Valid due date is required'),
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

      const { jobCardId, designerId, priority = 'MEDIUM', dueDate, notes } = req.body;
      const assignedBy = req.user.id;

      // Verify job card exists
      const jobCard = await dbAdapter.query(`
        SELECT jc.id, jc.job_card_id, jc.status, jc.priority as job_priority,
               c.name as company_name, p.brand as product_name, p.product_item_code
        FROM job_cards jc
        LEFT JOIN companies c ON jc.company_id = c.id
        LEFT JOIN products p ON jc.product_id = p.id
        WHERE jc.job_card_id = ?
      `, [jobCardId]);

      if (!jobCard) {
        return res.status(404).json({
          success: false,
          error: 'Job card not found'
        });
      }

      // Verify designer exists and has correct role
      const designer = await dbAdapter.query(`
        SELECT id, first_name, last_name, email, role
        FROM users WHERE id = ? AND role = 'DESIGNER'
      `, [designerId]);

      if (!designer) {
        return res.status(404).json({
          success: false,
          error: 'Designer not found or invalid role'
        });
      }

      // Check if job is already assigned to a designer
      const existingAssignment = await dbAdapter.query(`
        SELECT id, assigned_designer_id, status
        FROM prepress_jobs WHERE job_card_id = ?
      `, [jobCard.id]);

      if (existingAssignment) {
        return res.status(409).json({
          success: false,
          error: 'Job is already assigned to a designer',
          currentDesigner: existingAssignment.assigned_designer_id,
          status: existingAssignment.status
        });
      }

      // Create prepress job assignment
      const prepressJobId = `prep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const insertPrepressJob = await dbAdapter.query(`
        INSERT INTO prepress_jobs (
          id, job_card_id, assigned_designer_id, status, priority, due_date, 
          hod_last_remark, created_by, updated_by, created_at, updated_at
        ) VALUES (?, ?, ?, 'ASSIGNED', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);

      insertPrepressJob.run(
        prepressJobId,
        jobCard.job_card_id,
        designerId,
        priority,
        dueDate,
        notes,
        assignedBy,
        assignedBy
      );

      // Update job card status
      const updateJobCard = await dbAdapter.query(`
        UPDATE job_cards SET status = 'IN_PROGRESS', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      updateJobCard.run(jobCard.id);

      // Create job lifecycle entry
      const lifecycleId = `lifecycle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const insertLifecycle = await dbAdapter.query(`
        INSERT INTO job_lifecycle (
          id, job_card_id, status, prepress_job_id, prepress_status, 
          assigned_designer_id, created_by, created_at, updated_at
        ) VALUES (?, ?, 'ASSIGNED', ?, 'ASSIGNED', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);
      insertLifecycle.run(
        lifecycleId,
        jobCard.job_card_id,
        prepressJobId,
        designerId,
        assignedBy
      );

      // Get the complete assignment details
      const assignmentDetails = await dbAdapter.query(`
        SELECT 
          pj.id as prepress_job_id,
          pj.status,
          pj.priority,
          pj.due_date,
          pj.hod_last_remark as notes,
          pj.created_at as assigned_at,
          jc.job_card_id,
          jc.quantity,
          jc.delivery_date,
          c.name as company_name,
          p.brand as product_name,
          p.product_item_code,
          d.first_name as designer_first_name,
          d.last_name as designer_last_name,
          d.email as designer_email
        FROM prepress_jobs pj
        JOIN job_cards jc ON pj.job_card_id = jc.job_card_id
        LEFT JOIN companies c ON jc.company_id = c.id
        LEFT JOIN products p ON jc.product_id = p.id
        LEFT JOIN users d ON pj.assigned_designer_id = d.id
        WHERE pj.id = ?
      `, [prepressJobId]);

      // Emit real-time updates via Socket.io
      const io = req.app.get('io');
      if (io) {
        console.log('🔌 Emitting Socket.io events for job assignment:', jobCardId);
        
        // Notify all connected users about the job assignment
        io.emit('job_assigned', {
          jobCardId: jobCardId,
          prepressJobId: prepressJobId,
          designerId: designerId,
          designerName: `${designer.first_name} ${designer.last_name}`,
          priority: priority,
          dueDate: dueDate,
          assignedBy: req.user.firstName + ' ' + req.user.lastName,
          assignedAt: new Date().toISOString(),
          message: `Job ${jobCardId} assigned to ${designer.first_name} ${designer.last_name}`
        });

        // Notify the specific designer if they're connected
        io.to(`user:${designerId}`).emit('job_assigned_to_me', {
          jobCardId: jobCardId,
          prepressJobId: prepressJobId,
          priority: priority,
          dueDate: dueDate,
          assignedAt: new Date().toISOString(),
          message: `You have been assigned job ${jobCardId}`,
          jobDetails: assignmentDetails
        });

        // Notify HOD and ADMIN users
        io.emit('designer_job_assigned', {
          jobCardId: jobCardId,
          designerName: `${designer.first_name} ${designer.last_name}`,
          priority: priority,
          assignedAt: new Date().toISOString(),
          message: `Job ${jobCardId} assigned to ${designer.first_name} ${designer.last_name}`
        });

        // Notify role-specific rooms
        io.to('role:HOD_PREPRESS').emit('designer_job_assigned', {
          jobCardId: jobCardId,
          designerName: `${designer.first_name} ${designer.last_name}`,
          priority: priority,
          assignedAt: new Date().toISOString(),
          message: `Job ${jobCardId} assigned to ${designer.first_name} ${designer.last_name}`
        });

        io.to('role:ADMIN').emit('designer_job_assigned', {
          jobCardId: jobCardId,
          designerName: `${designer.first_name} ${designer.last_name}`,
          priority: priority,
          assignedAt: new Date().toISOString(),
          message: `Job ${jobCardId} assigned to ${designer.first_name} ${designer.last_name}`
        });
        
        console.log('✅ Socket.io events emitted successfully');
      } else {
        console.log('❌ Socket.io instance not found');
      }

      res.status(201).json({
        success: true,
        message: 'Job assigned successfully',
        data: assignmentDetails
      });

    } catch (error) {
      console.error('Error assigning job:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * @route GET /api/job-assignment/designer/:designerId
 * @desc Get all jobs assigned to a specific designer
 * @access DESIGNER, HOD_PREPRESS, ADMIN
 */
router.get('/designer/:designerId', 
  requirePermission('VIEW_PREPRESS_JOBS'),
  async (req, res) => {
    try {
      const { designerId } = req.params;
      const { status, priority, limit = 50, offset = 0 } = req.query;

      // Build query conditions
      let whereConditions = ['pj.assigned_designer_id = ?'];
      let queryParams = [designerId];

      if (status && status !== 'all') {
        whereConditions.push('pj.status = ?');
        queryParams.push(status);
      }

      if (priority && priority !== 'all') {
        whereConditions.push('pj.priority = ?');
        queryParams.push(priority);
      }

      const whereClause = whereConditions.join(' AND ');

      // Get jobs with pagination
      const jobs = await dbAdapter.query(`
        SELECT 
          pj.id as prepress_job_id,
          pj.status,
          pj.priority,
          pj.due_date,
          pj.hod_last_remark as notes,
          pj.created_at as assigned_at,
          pj.updated_at,
          jc.id as job_card_id,
          jc.job_card_id as job_card_number,
          jc.quantity,
          jc.delivery_date,
          jc.customer_notes,
          jc.special_instructions,
          c.name as company_name,
          p.brand as product_name,
          p.product_item_code,
          d.first_name as designer_first_name,
          d.last_name as designer_last_name,
          d.email as designer_email
        FROM prepress_jobs pj
        JOIN job_cards jc ON pj.job_card_id = jc.job_card_id
        LEFT JOIN companies c ON jc.company_id = c.id
        LEFT JOIN products p ON jc.product_id = p.id
        LEFT JOIN users d ON pj.assigned_designer_id = d.id
        WHERE ${whereClause}
        ORDER BY pj.created_at DESC
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `, [...queryParams, parseInt(limit), parseInt(offset)]);

      // Get total count
      const totalCount = await dbAdapter.query(`
        SELECT COUNT(*) as count
        FROM prepress_jobs pj
        WHERE ${whereClause}
      `, [...queryParams]);

      res.json({
        success: true,
        data: {
          jobs,
          pagination: {
            total: totalCount.count,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: (parseInt(offset) + parseInt(limit)) < totalCount.count
          }
        }
      });

    } catch (error) {
      console.error('Error fetching designer jobs:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * @route GET /api/job-assignment/hod/dashboard
 * @desc Get all jobs for HOD dashboard with designer assignments
 * @access HOD_PREPRESS, ADMIN
 */
router.get('/hod/dashboard', 
  requirePermission('VIEW_PREPRESS_JOBS'),
  async (req, res) => {
    try {
      const { status, priority, designerId, limit = 100, offset = 0 } = req.query;

      // Build query conditions
      let whereConditions = ['1=1'];
      let queryParams = [];

      if (status && status !== 'all') {
        whereConditions.push('pj.status = ?');
        queryParams.push(status);
      }

      if (priority && priority !== 'all') {
        whereConditions.push('pj.priority = ?');
        queryParams.push(priority);
      }

      if (designerId && designerId !== 'all') {
        whereConditions.push('pj.assigned_designer_id = ?');
        queryParams.push(designerId);
      }

      const whereClause = whereConditions.join(' AND ');

      // Get all jobs with designer info
      const jobs = await dbAdapter.query(`
        SELECT 
          pj.id as prepress_job_id,
          pj.status,
          pj.priority,
          pj.due_date,
          pj.hod_last_remark as notes,
          pj.created_at as assigned_at,
          pj.updated_at,
          jc.id as job_card_id,
          jc.job_card_id as job_card_number,
          jc.quantity,
          jc.delivery_date,
          jc.customer_notes,
          jc.special_instructions,
          c.name as company_name,
          p.brand as product_name,
          p.product_item_code,
          d.first_name as designer_first_name,
          d.last_name as designer_last_name,
          d.email as designer_email,
          d.id as designer_id,
          hod.first_name as assigned_by_first_name,
          hod.last_name as assigned_by_last_name
        FROM prepress_jobs pj
        JOIN job_cards jc ON pj.job_card_id = jc.job_card_id
        LEFT JOIN companies c ON jc.company_id = c.id
        LEFT JOIN products p ON jc.product_id = p.id
        LEFT JOIN users d ON pj.assigned_designer_id = d.id
        LEFT JOIN users hod ON pj.assigned_by_hod_id = hod.id
        WHERE ${whereClause}
        ORDER BY pj.created_at DESC
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `, [...queryParams, parseInt(limit), parseInt(offset)]);

      // Get statistics
      const stats = await dbAdapter.query(`
        SELECT 
          COUNT(*) as total_jobs,
          SUM(CASE WHEN pj.status = 'ASSIGNED' THEN 1 ELSE 0 END) as assigned_jobs,
          SUM(CASE WHEN pj.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_jobs,
          SUM(CASE WHEN pj.status = 'HOD_REVIEW' THEN 1 ELSE 0 END) as hod_review_jobs,
          SUM(CASE WHEN pj.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_jobs,
          SUM(CASE WHEN pj.status = 'PAUSED' THEN 1 ELSE 0 END) as paused_jobs
        FROM prepress_jobs pj
        WHERE ${whereClause}
      `, [...queryParams]);

      // Get designer productivity stats
      const designerStats = await dbAdapter.query(`
        SELECT 
          d.id as designer_id,
          d.first_name,
          d.last_name,
          d.email,
          COUNT(pj.id) as total_jobs,
          SUM(CASE WHEN pj.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_jobs,
          SUM(CASE WHEN pj.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_jobs,
          SUM(CASE WHEN pj.status = 'PAUSED' THEN 1 ELSE 0 END) as paused_jobs
        FROM users d
        LEFT JOIN prepress_jobs pj ON d.id = pj.assigned_designer_id
        WHERE d.role = 'DESIGNER'
        GROUP BY d.id, d.first_name, d.last_name, d.email
        ORDER BY total_jobs DESC
      `).all();

      res.json({
        success: true,
        data: {
          jobs,
          statistics: stats,
          designerStats,
          pagination: {
            total: stats.total_jobs,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: (parseInt(offset) + parseInt(limit)) < stats.total_jobs
          }
        }
      });

    } catch (error) {
      console.error('Error fetching HOD dashboard data:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * @route PUT /api/job-assignment/:prepressJobId/status
 * @desc Update job status (for designers and HOD)
 * @access DESIGNER, HOD_PREPRESS, ADMIN
 */
router.put('/:prepressJobId/status',
  [
    body('status').isIn(['ASSIGNED', 'IN_PROGRESS', 'PAUSED', 'HOD_REVIEW', 'COMPLETED', 'REJECTED']).withMessage('Invalid status'),
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

      const { prepressJobId } = req.params;
      const { status, notes } = req.body;
      const updatedBy = req.user.id;

      // Verify job exists and user has permission
      const job = await dbAdapter.query(`
        SELECT pj.*, jc.job_card_id, d.first_name as designer_first_name, d.last_name as designer_last_name
        FROM prepress_jobs pj
        JOIN job_cards jc ON pj.job_card_id = jc.job_card_id
        LEFT JOIN users d ON pj.assigned_designer_id = d.id
        WHERE pj.id = ?
      `, [prepressJobId]);

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      // Check permissions
      const isDesigner = req.user.role === 'DESIGNER' && job.assigned_designer_id === req.user.id;
      const isHOD = req.user.role === 'HOD_PREPRESS';
      const isAdmin = req.user.role === 'ADMIN';

      if (!isDesigner && !isHOD && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
      }

      // Get current timestamp
      const currentTime = new Date().toISOString();
      
      // Update job status with proper timestamps
      const updateJob = await dbAdapter.query(`
        UPDATE prepress_jobs 
        SET status = ?, hod_last_remark = ?, updated_at = CURRENT_TIMESTAMP,
            started_at = CASE WHEN ? = 'IN_PROGRESS' AND started_at IS NULL THEN CURRENT_TIMESTAMP ELSE started_at END,
            completed_at = CASE WHEN ? IN ('COMPLETED', 'REJECTED') THEN CURRENT_TIMESTAMP ELSE completed_at END
        WHERE id = ?
      `);
      updateJob.run(status, notes, status, status, prepressJobId);

      // Update existing lifecycle entry or create new one
      const existingLifecycle = await dbAdapter.query(`
        SELECT * FROM job_lifecycle 
        WHERE job_card_id = ? AND prepress_job_id = ?
      `, [job.job_card_id, prepressJobId]);

      if (existingLifecycle) {
        // Update existing lifecycle entry
        const updateLifecycle = await dbAdapter.query(`
          UPDATE job_lifecycle 
          SET status = ?, prepress_status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE job_card_id = ? AND prepress_job_id = ?
        `);
        updateLifecycle.run(status, status, job.job_card_id, prepressJobId);
      } else {
        // Create new lifecycle entry (simplified to avoid foreign key issues)
        try {
          const lifecycleId = `lifecycle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const insertLifecycle = await dbAdapter.query(`
            INSERT INTO job_lifecycle (
              id, job_card_id, status, prepress_job_id, prepress_status, 
              assigned_designer_id, created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `);
          insertLifecycle.run(
            lifecycleId,
            job.job_card_id,
            status,
            prepressJobId,
            status,
            job.assigned_designer_id,
            updatedBy
          );
        } catch (lifecycleError) {
          console.log('Lifecycle insert error (non-critical):', lifecycleError.message);
        }
      }

      // Create lifecycle history entry for tracking changes (simplified)
      try {
        const historyId = `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const insertHistory = await dbAdapter.query(`
          INSERT INTO job_lifecycle_history (
            id, job_lifecycle_id, status_from, status_to, notes, changed_by, changed_at
          ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);
        insertHistory.run(
          historyId,
          existingLifecycle?.id || 'unknown',
          job.status,
          status,
          notes || `Status updated from ${job.status} to ${status}`,
          updatedBy
        );
      } catch (historyError) {
        console.log('History insert error (non-critical):', historyError.message);
      }

      // Get updated job details
      const updatedJob = await dbAdapter.query(`
        SELECT 
          pj.id as prepress_job_id,
          pj.status,
          pj.priority,
          pj.due_date,
          pj.hod_last_remark as notes,
          pj.updated_at,
          jc.job_card_id as job_card_number,
          c.name as company_name,
          p.brand as product_name,
          d.first_name as designer_first_name,
          d.last_name as designer_last_name
        FROM prepress_jobs pj
        JOIN job_cards jc ON pj.job_card_id = jc.job_card_id
        LEFT JOIN companies c ON jc.company_id = c.id
        LEFT JOIN products p ON jc.product_id = p.id
        LEFT JOIN users d ON pj.assigned_designer_id = d.id
        WHERE pj.id = ?
      `, [prepressJobId]);

      // Emit real-time updates via Socket.io
      const io = req.app.get('io');
      if (io) {
        // Notify all connected users about the status update
        io.emit('job_status_updated', {
          jobCardId: job.job_card_id,
          prepressJobId: prepressJobId,
          oldStatus: job.status,
          newStatus: status,
          updatedBy: req.user.firstName + ' ' + req.user.lastName,
          updatedAt: currentTime,
          notes: notes
        });

        // Notify role-specific rooms for status updates
        io.to('role:HOD_PREPRESS').emit('job_status_updated', {
          jobCardId: job.job_card_id,
          prepressJobId: prepressJobId,
          oldStatus: job.status,
          newStatus: status,
          updatedBy: req.user.firstName + ' ' + req.user.lastName,
          updatedAt: currentTime,
          notes: notes
        });

        io.to('role:ADMIN').emit('job_status_updated', {
          jobCardId: job.job_card_id,
          prepressJobId: prepressJobId,
          oldStatus: job.status,
          newStatus: status,
          updatedBy: req.user.firstName + ' ' + req.user.lastName,
          updatedAt: currentTime,
          notes: notes
        });

        io.to('role:HEAD_OF_MERCHANDISER').emit('job_status_updated', {
          jobCardId: job.job_card_id,
          prepressJobId: prepressJobId,
          oldStatus: job.status,
          newStatus: status,
          updatedBy: req.user.firstName + ' ' + req.user.lastName,
          updatedAt: currentTime,
          notes: notes
        });

        // Notify specific designer if they're connected
        if (job.assigned_designer_id) {
          io.to(`user:${job.assigned_designer_id}`).emit('my_job_updated', {
            jobCardId: job.job_card_id,
            prepressJobId: prepressJobId,
            status: status,
            updatedAt: currentTime,
            message: `Your job ${job.job_card_id} status updated to ${status}`
          });
        }
      }

      res.json({
        success: true,
        message: 'Job status updated successfully',
        data: {
          ...updatedJob,
          updatedAt: currentTime,
          previousStatus: job.status,
          updatedBy: req.user.firstName + ' ' + req.user.lastName
        }
      });

    } catch (error) {
      console.error('Error updating job status:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * @route GET /api/job-assignment/designers
 * @desc Get all available designers
 * @access HOD_PREPRESS, ADMIN
 */
router.get('/designers', 
  requirePermission('VIEW_PREPRESS_JOBS'),
  async (req, res) => {
    try {
      const designers = await dbAdapter.query(`
        SELECT 
          id, first_name, last_name, email, role,
          (SELECT COUNT(*) FROM prepress_jobs WHERE assigned_designer_id = users.id AND status IN ('ASSIGNED', 'IN_PROGRESS')) as active_jobs
        FROM users 
        WHERE role = 'DESIGNER' AND is_active = true
        ORDER BY first_name, last_name
      `).all();

      res.json({
        success: true,
        data: designers
      });

    } catch (error) {
      console.error('Error fetching designers:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

export default router;
