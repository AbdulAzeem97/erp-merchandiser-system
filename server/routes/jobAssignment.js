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
      const jobCardResult = await dbAdapter.query(`
        SELECT jc.id, jc."jobNumber" as job_card_number, jc.status, jc.priority as job_priority,
               c.name as company_name, p.brand as product_name, p.product_item_code
        FROM job_cards jc
        LEFT JOIN companies c ON jc.company_id = c.id
        LEFT JOIN products p ON jc.product_id = p.id
        WHERE jc."jobNumber" = $1
      `, [jobCardId]);

      if (jobCardResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Job card not found'
        });
      }

      const jobCard = jobCardResult.rows[0];

      // Verify designer exists and has correct role
      const designerResult = await dbAdapter.query(`
        SELECT id, first_name, last_name, email, role
        FROM users WHERE id = $1 AND role = 'DESIGNER'
      `, [designerId]);

      if (designerResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Designer not found or invalid role'
        });
      }

      const designer = designerResult.rows[0];

      // Check if job is already assigned to a designer
      const existingAssignmentResult = await dbAdapter.query(`
        SELECT id, assigned_designer_id, status
        FROM prepress_jobs WHERE job_card_id = $1
      `, [jobCard.id]);

      let prepressJobId;

      if (existingAssignmentResult.rows.length > 0) {
        const existingJob = existingAssignmentResult.rows[0];
        // If already assigned to someone else
        if (existingJob.assigned_designer_id) {
          return res.status(409).json({
            success: false,
            error: 'Job is already assigned to a designer',
            currentDesigner: existingJob.assigned_designer_id,
            status: existingJob.status
          });
        }

        // If exists but unassigned, UPDATE it
        const prepressUpdateResult = await dbAdapter.query(`
          UPDATE prepress_jobs
          SET assigned_designer_id = $1, status = 'ASSIGNED', priority = $2, due_date = $3, 
              hod_last_remark = $4, updated_by = $5, updated_at = CURRENT_TIMESTAMP
          WHERE id = $6
          RETURNING id
        `, [
          designerId,
          priority,
          dueDate,
          notes,
          assignedBy,
          existingJob.id
        ]);
        prepressJobId = prepressUpdateResult.rows[0].id;

      } else {
        // Create new prepress job assignment
        const prepressInsertResult = await dbAdapter.query(`
          INSERT INTO prepress_jobs (
            job_card_id, assigned_designer_id, status, priority, due_date, 
            hod_last_remark, created_by, updated_by, created_at, updated_at
          ) VALUES ($1, $2, 'ASSIGNED', $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id
        `, [
          jobCard.id, // Use numeric ID here
          designerId,
          priority,
          dueDate,
          notes,
          assignedBy,
          assignedBy
        ]);
        prepressJobId = prepressInsertResult.rows[0].id;
      }

      // Update job card status
      await dbAdapter.query(`
        UPDATE job_cards SET status = 'IN_PROGRESS', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [jobCard.id]);

      // Create job lifecycle entry
      await dbAdapter.query(`
        INSERT INTO job_lifecycle (
          job_card_id, status, prepress_job_id, prepress_status, 
          assigned_designer_id, created_by, created_at, updated_at
        ) VALUES ($1, 'ASSIGNED', $2, 'ASSIGNED', $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        jobCard.id, // Use numeric ID here
        prepressJobId,
        designerId,
        assignedBy
      ]);

      // Get the complete assignment details
      const assignmentDetailsResult = await dbAdapter.query(`
        SELECT 
          pj.id as prepress_job_id,
          pj.status,
          pj.priority,
          pj.due_date,
          pj.hod_last_remark as notes,
          pj.created_at as assigned_at,
          jc."jobNumber" as job_card_id,
          jc.quantity,
          jc.delivery_date,
          c.name as company_name,
          p.brand as product_name,
          p.product_item_code,
          d.first_name as designer_first_name,
          d.last_name as designer_last_name,
          d.email as designer_email
        FROM prepress_jobs pj
        JOIN job_cards jc ON pj.job_card_id = jc.id
        LEFT JOIN companies c ON jc.company_id = c.id
        LEFT JOIN products p ON jc.product_id = p.id
        LEFT JOIN users d ON pj.assigned_designer_id = d.id
        WHERE pj.id = $1
      `, [prepressJobId]);

      const assignmentDetails = assignmentDetailsResult.rows[0];
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
      let whereConditions = ['pj.assigned_designer_id = $1'];
      let queryParams = [designerId];

      if (status && status !== 'all') {
        queryParams.push(status);
        whereConditions.push(`pj.status = $${queryParams.length}`);
      }

      if (priority && priority !== 'all') {
        queryParams.push(priority);
        whereConditions.push(`pj.priority = $${queryParams.length}`);
      }

      const finalWhereClause = whereConditions.join(' AND ');

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
          pj.outsourcing_die_making_initiated,
          pj.fil_initiated_request,
          pj.blocks_initiated,
          jc.id as job_card_id,
          jc."jobNumber" as job_card_number,
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
        JOIN job_cards jc ON pj.job_card_id = jc.id
        LEFT JOIN companies c ON jc.company_id = c.id
        LEFT JOIN products p ON jc.product_id = p.id
        LEFT JOIN users d ON pj.assigned_designer_id = d.id
        WHERE ${finalWhereClause}
        ORDER BY pj.created_at DESC
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `, [...queryParams, parseInt(limit), parseInt(offset)]);

      // Get total count
      const totalCount = await dbAdapter.query(`
        SELECT COUNT(*) as count
        FROM prepress_jobs pj
        WHERE ${finalWhereClause}
      `, [...queryParams]);

      res.json({
        success: true,
        data: {
          jobs: jobs.rows,
          pagination: {
            total: parseInt(totalCount.rows[0]?.count || 0),
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: (parseInt(offset) + parseInt(limit)) < parseInt(totalCount.rows[0]?.count || 0)
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
        whereConditions.push(`pj.assigned_designer_id = $${queryParams.length + 1}`);
        queryParams.push(designerId);
      }

      const whereClause = whereConditions.map((cond, i) => {
        if (cond.includes('?')) {
          return cond.replace('?', `$${i + 1}`);
        }
        return cond;
      }).join(' AND ');

      // Need to adjust queryParams logic because of multiple conditions
      // Better to re-build whereClause properly
      whereConditions = ['1=1'];
      queryParams = [];
      if (status && status !== 'all') {
        queryParams.push(status);
        whereConditions.push(`pj.status = $${queryParams.length}`);
      }
      if (priority && priority !== 'all') {
        queryParams.push(priority);
        whereConditions.push(`pj.priority = $${queryParams.length}`);
      }
      if (designerId && designerId !== 'all') {
        queryParams.push(designerId);
        whereConditions.push(`pj.assigned_designer_id = $${queryParams.length}`);
      }
      const finalWhereClause = whereConditions.join(' AND ');

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
          jc."jobNumber" as job_card_number,
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
          pj.outsourcing_die_making_initiated,
          pj.fil_initiated_request,
          pj.blocks_initiated,
          hod.first_name as assigned_by_first_name,
          hod.last_name as assigned_by_last_name
        FROM prepress_jobs pj
        JOIN job_cards jc ON pj.job_card_id = jc.id
        LEFT JOIN companies c ON jc.company_id = c.id
        LEFT JOIN products p ON jc.product_id = p.id
        LEFT JOIN users d ON pj.assigned_designer_id = d.id
        LEFT JOIN users hod ON pj.assigned_by_hod_id = hod.id
        WHERE ${finalWhereClause}
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
        WHERE ${finalWhereClause}
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
      `);

      res.json({
        success: true,
        data: {
          jobs: jobs.rows,
          statistics: stats.rows[0] || {
            total_jobs: 0,
            assigned_jobs: 0,
            in_progress_jobs: 0,
            hod_review_jobs: 0,
            completed_jobs: 0,
            paused_jobs: 0
          },
          designerStats: designerStats.rows,
          pagination: {
            total: stats.rows[0]?.total_jobs || 0,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: (parseInt(offset) + parseInt(limit)) < (stats.rows[0]?.total_jobs || 0)
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
      const jobResult = await dbAdapter.query(`
        SELECT pj.*, jc.id as job_card_id, jc."jobNumber" as job_card_number, d.first_name as designer_first_name, d.last_name as designer_last_name
        FROM prepress_jobs pj
        JOIN job_cards jc ON pj.job_card_id = jc.id
        LEFT JOIN users d ON pj.assigned_designer_id = d.id
        WHERE pj.id = $1
      `, [prepressJobId]);

      if (jobResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      const job = jobResult.rows[0];

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
      await dbAdapter.query(`
        UPDATE prepress_jobs 
        SET status = $1, hod_last_remark = $2, updated_at = CURRENT_TIMESTAMP,
            started_at = CASE WHEN $3 = 'IN_PROGRESS' AND started_at IS NULL THEN CURRENT_TIMESTAMP ELSE started_at END,
            completed_at = CASE WHEN $4 IN ('COMPLETED', 'REJECTED') THEN CURRENT_TIMESTAMP ELSE completed_at END
        WHERE id = $5
      `, [status, notes, status, status, prepressJobId]);

      // Update existing lifecycle entry or create new one
      const existingLifecycleResult = await dbAdapter.query(`
        SELECT * FROM job_lifecycle 
        WHERE job_card_id = $1 AND prepress_job_id = $2
      `, [job.rows[0].job_card_id, prepressJobId]);

      const existingLifecycle = existingLifecycleResult.rows[0];

      if (existingLifecycle) {
        // Update existing lifecycle entry
        await dbAdapter.query(`
          UPDATE job_lifecycle 
          SET status = $1, prepress_status = $2, updated_at = CURRENT_TIMESTAMP
          WHERE job_card_id = $3 AND prepress_job_id = $4
        `, [status, status, job.rows[0].job_card_id, prepressJobId]);
      } else {
        // Create new lifecycle entry (simplified to avoid foreign key issues)
        try {
          await dbAdapter.query(`
            INSERT INTO job_lifecycle (
              job_card_id, status, prepress_job_id, prepress_status, 
              assigned_designer_id, created_by, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `, [
            job.rows[0].job_card_id,
            status,
            prepressJobId,
            status,
            job.rows[0].assigned_designer_id,
            updatedBy
          ]);
        } catch (lifecycleError) {
          console.log('Lifecycle insert error (non-critical):', lifecycleError.message);
        }
      }

      // Create lifecycle history entry for tracking changes (simplified)
      try {
        await dbAdapter.query(`
          INSERT INTO job_lifecycle_history (
            job_lifecycle_id, status_from, status_to, notes, changed_by, changed_at
          ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        `, [
          existingLifecycle?.id || null,
          job.rows[0].status,
          status,
          notes || `Status updated from ${job.rows[0].status} to ${status}`,
          updatedBy
        ]);
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
          jc."jobNumber" as job_card_number,
          c.name as company_name,
          p.brand as product_name,
          d.first_name as designer_first_name,
          d.last_name as designer_last_name
        FROM prepress_jobs pj
        JOIN job_cards jc ON pj.job_card_id = jc.id
        LEFT JOIN companies c ON jc.company_id = c.id
        LEFT JOIN products p ON jc.product_id = p.id
        LEFT JOIN users d ON pj.assigned_designer_id = d.id
        WHERE pj.id = $1
      `, [prepressJobId]);

      const updatedJobRow = updatedJob.rows[0];

      // Emit real-time updates via Socket.io
      const io = req.app.get('io');
      if (io) {
        // Notify all connected users about the status update
        io.emit('job_status_updated', {
          jobCardId: job.job_card_number,
          prepressJobId: prepressJobId,
          oldStatus: job.status,
          newStatus: status,
          updatedBy: req.user.firstName + ' ' + req.user.lastName,
          updatedAt: currentTime,
          notes: notes
        });

        // Notify role-specific rooms for status updates
        io.to('role:HOD_PREPRESS').emit('job_status_updated', {
          jobCardId: job.job_card_number,
          prepressJobId: prepressJobId,
          oldStatus: job.status,
          newStatus: status,
          updatedBy: req.user.firstName + ' ' + req.user.lastName,
          updatedAt: currentTime,
          notes: notes
        });

        io.to('role:ADMIN').emit('job_status_updated', {
          jobCardId: job.job_card_number,
          prepressJobId: prepressJobId,
          oldStatus: job.status,
          newStatus: status,
          updatedBy: req.user.firstName + ' ' + req.user.lastName,
          updatedAt: currentTime,
          notes: notes
        });

        io.to('role:HEAD_OF_MERCHANDISER').emit('job_status_updated', {
          jobCardId: job.job_card_number,
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
            jobCardId: job.job_card_number,
            prepressJobId: prepressJobId,
            status: status,
            updatedAt: currentTime,
            message: `Your job ${job.job_card_number} status updated to ${status}`
          });
        }
      }

      res.json({
        success: true,
        message: 'Job status updated successfully',
        data: {
          ...updatedJobRow,
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
      const result = await dbAdapter.query(`
        SELECT 
          id, first_name, last_name, email, role,
          (SELECT COUNT(*) FROM prepress_jobs WHERE assigned_designer_id = users.id AND status IN ('ASSIGNED', 'IN_PROGRESS')) as active_jobs
        FROM users 
        WHERE role = 'DESIGNER' AND is_active = true
        ORDER BY first_name, last_name
      `);

      res.json({
        success: true,
        data: result.rows
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

/**
 * @route PUT /api/job-assignment/:prepressJobId/outsourcing
 * @desc Update outsourcing status fields
 * @access DESIGNER, HOD_PREPRESS, ADMIN
 */
router.put('/:prepressJobId/outsourcing',
  [
    body('outsourcing_die_making_initiated').optional().isBoolean(),
    body('fil_initiated_request').optional().isBoolean(),
    body('blocks_initiated').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const { prepressJobId } = req.params;
      const { outsourcing_die_making_initiated, fil_initiated_request, blocks_initiated } = req.body;
      const updatedBy = req.user.id;

      // Build dynamic update query
      let updateFields = ['updated_at = CURRENT_TIMESTAMP', 'updated_by = $1'];
      let queryParams = [updatedBy];
      let paramCount = 2;

      if (outsourcing_die_making_initiated !== undefined) {
        updateFields.push(`outsourcing_die_making_initiated = $${paramCount}`);
        queryParams.push(outsourcing_die_making_initiated);
        paramCount++;
      }
      if (fil_initiated_request !== undefined) {
        updateFields.push(`fil_initiated_request = $${paramCount}`);
        queryParams.push(fil_initiated_request);
        paramCount++;
      }
      if (blocks_initiated !== undefined) {
        updateFields.push(`blocks_initiated = $${paramCount}`);
        queryParams.push(blocks_initiated);
        paramCount++;
      }

      queryParams.push(prepressJobId);
      const query = `
        UPDATE prepress_jobs 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await dbAdapter.query(query, queryParams);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Prepress job not found'
        });
      }

      const updatedJob = result.rows[0];

      // Emit real-time update
      const io = req.app.get('io');
      if (io) {
        io.emit('job_outsourcing_updated', {
          prepressJobId,
          outsourcing_die_making_initiated: updatedJob.outsourcing_die_making_initiated,
          fil_initiated_request: updatedJob.fil_initiated_request,
          blocks_initiated: updatedJob.blocks_initiated,
          updatedBy: req.user.firstName + ' ' + req.user.lastName,
          updatedAt: updatedJob.updated_at
        });
      }

      res.json({
        success: true,
        message: 'Outsourcing status updated successfully',
        data: updatedJob
      });

    } catch (error) {
      console.error('Error updating outsourcing status:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

export default router;
