import dbAdapter from '../database/adapter.js';

// Prepress status state machine
const STATUS_TRANSITIONS = {
  PENDING: ['ASSIGNED'],
  ASSIGNED: ['IN_PROGRESS', 'REASSIGNED'],
  IN_PROGRESS: ['PAUSED', 'HOD_REVIEW', 'REJECTED'],
  PAUSED: ['IN_PROGRESS', 'REJECTED'],
  HOD_REVIEW: ['COMPLETED', 'REJECTED'],
  COMPLETED: [], // Terminal state
  REJECTED: ['ASSIGNED', 'IN_PROGRESS'] // Can be reassigned
};

// Role-based transition permissions
const ROLE_TRANSITIONS = {
  HOD_PREPRESS: ['ASSIGNED', 'REASSIGNED', 'HOD_REVIEW', 'REJECTED', 'COMPLETED'],
  DESIGNER: ['STARTED', 'PAUSED', 'RESUMED', 'COMPLETED'],
  ADMIN: ['*'] // Can do any transition
};

class PrepressService {
  /**
   * Create a new prepress job
   */
  async createPrepressJob(jobCardId, assignedDesignerId = null, priority = 'MEDIUM', dueDate = null, createdBy) {
    try {
      // Verify job card exists
      const jobCardResult = await dbAdapter.query(
        'SELECT id, "jobNumber", status FROM job_cards WHERE id = $1',
        [jobCardId]
      );

      if (jobCardResult.rows.length === 0) {
        throw new Error('Job card not found');
      }

      // Check if prepress job already exists for this job card
      const existingResult = await dbAdapter.query(
        'SELECT id FROM prepress_jobs WHERE job_card_id = $1',
        [jobCardId]
      );

      if (existingResult.rows.length > 0) {
        // Return existing record instead of throwing
        console.log('Prepress job already exists, returning existing record');
        return await this.getPrepressJobById(existingResult.rows[0].id);
      }

      // Create prepress job with sequence recovery
      const { insertWithRecovery } = await import('../utils/sequenceRecovery.js');
      const insertQuery = `
        INSERT INTO prepress_jobs (job_card_id, assigned_designer_id, status, priority, due_date, created_by, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const result = await insertWithRecovery(
        dbAdapter,
        insertQuery,
        [
          jobCardId,
          assignedDesignerId,
          assignedDesignerId ? 'ASSIGNED' : 'PENDING',
          priority,
          dueDate,
          createdBy,
          createdBy
        ],
        'prepress_jobs'
      );

      const prepressJob = result.rows[0];
      if (!prepressJob) {
        throw new Error('Failed to create prepress job');
      }

      // Log initial activity
      await dbAdapter.query(`
        INSERT INTO prepress_activity (prepress_job_id, actor_id, action, from_status, to_status, remark)
        VALUES ($1, $2, 'STATUS_CHANGED', NULL, $3, 'Prepress job created')
      `, [prepressJob.id, createdBy, prepressJob.status]);

      // If assigned, log assignment
      if (assignedDesignerId) {
        await dbAdapter.query(`
          INSERT INTO prepress_activity (prepress_job_id, actor_id, action, from_status, to_status, remark)
          VALUES ($1, $2, 'ASSIGNED', 'PENDING', 'ASSIGNED', 'Initial assignment')
        `, [prepressJob.id, createdBy]);

        // Update job lifecycle status
        try {
          if (global.jobLifecycleService) {
            await global.jobLifecycleService.updateJobStatusToPrepress(
              jobCardId,
              prepressJob.id,
              assignedDesignerId,
              createdBy
            );
          }
        } catch (lifecycleError) {
          console.error('Error updating job lifecycle:', lifecycleError);
          // Don't fail prepress job creation if lifecycle update fails
        }
      }

      return prepressJob;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get prepress jobs with filters
   */
  async getPrepressJobs(filters = {}) {
    try {
      let query = `
        SELECT 
          pj.*,
          jc."jobNumber" as job_card_id,
          jc.po_number,
          jc.quantity,
          jc.delivery_date,
          jc.priority as job_priority,
          jc.status as job_status,
          jc."createdAt" as job_created_at,
          p.product_item_code,
          p.brand,
          p.product_type,
          c.name as company_name,
          c.code as company_code,
          u_designer.first_name as designer_first_name,
          u_designer.last_name as designer_last_name,
          u_creator.first_name as creator_first_name,
          u_creator.last_name as creator_last_name,
          u_merchandiser.first_name as merchandiser_first_name,
          u_merchandiser.last_name as merchandiser_last_name
        FROM prepress_jobs pj
        LEFT JOIN job_cards jc ON pj.job_card_id = jc.id
        LEFT JOIN products p ON jc.product_id = p.id
        LEFT JOIN companies c ON jc.company_id = c.id
        LEFT JOIN users u_designer ON pj.assigned_designer_id = u_designer.id
        LEFT JOIN users u_creator ON pj.created_by = u_creator.id
        LEFT JOIN users u_merchandiser ON jc."createdById" = u_merchandiser.id
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 1;

      // Apply filters
      if (filters.status) {
        query += ` AND pj.status = $${paramCount++} `;
        params.push(filters.status);
      }

      if (filters.assignedDesignerId) {
        query += ` AND pj.assigned_designer_id = $${paramCount++} `;
        params.push(filters.assignedDesignerId);
      }

      if (filters.priority) {
        query += ` AND pj.priority = $${paramCount++} `;
        params.push(filters.priority);
      }

      if (filters.companyId) {
        query += ` AND jc.company_id = $${paramCount++} `;
        params.push(filters.companyId);
      }

      if (filters.productType) {
        query += ` AND p.product_type = $${paramCount++} `;
        params.push(filters.productType);
      }

      if (filters.search) {
        query += ` AND(
          jc."jobNumber" ILIKE $${paramCount} OR
          jc.po_number ILIKE $${paramCount} OR
          p.product_item_code ILIKE $${paramCount} OR
          c.name ILIKE $${paramCount}
        )`;
        params.push(`% ${filters.search}% `);
        paramCount++; // Only increment once as we reuse the param (Wait, PG doesn't reuse param automatically in ILIKE list unless referenced by $1... oh, we passed 4 params before. Better to use separate params)
        // Actually, let's fix the search:
      }

      // Re-doing search correctly
      if (filters.search) {
        query += ` AND(
          jc."jobNumber" ILIKE $${paramCount} OR
           jc.po_number ILIKE $${paramCount + 1} OR
    p.product_item_code ILIKE $${paramCount + 2} OR
    c.name ILIKE $${paramCount + 3}
         )`;
        params.push(`% ${filters.search}% `, ` % ${filters.search}% `, ` % ${filters.search}% `, ` % ${filters.search}% `);
        paramCount += 4;
      }

      if (filters.dueDateFrom) {
        query += ` AND pj.due_date >= $${paramCount++} `;
        params.push(filters.dueDateFrom);
      }

      if (filters.dueDateTo) {
        query += ` AND pj.due_date <= $${paramCount++} `;
        params.push(filters.dueDateTo);
      }

      // Ordering
      query += ` ORDER BY pj.priority DESC, pj.due_date ASC, pj.created_at DESC`;

      // Pagination
      if (filters.limit) {
        query += ` LIMIT $${paramCount++} `;
        params.push(filters.limit);
      }

      if (filters.offset) {
        query += ` OFFSET $${paramCount++} `;
        params.push(filters.offset);
      }

      const result = await dbAdapter.query(query, params);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get prepress job by ID
   */
  async getPrepressJobById(id) {
    try {
      const result = await pool.query(`
    SELECT
    pj.*,
      jc.job_card_id,
      jc.po_number,
      jc.quantity,
      jc.delivery_date,
      jc.priority as job_priority,
      jc.status as job_status,
      jc.customer_notes,
      jc.special_instructions,
      p.product_item_code,
      p.brand,
      p.product_type,
      p.color_specifications,
      c.name as company_name,
      c.code as company_code,
      u_designer.first_name as designer_first_name,
      u_designer.last_name as designer_last_name,
      u_creator.first_name as creator_first_name,
      u_creator.last_name as creator_last_name
        FROM prepress_jobs pj
        LEFT JOIN job_cards jc ON pj.job_card_id = jc.job_card_id
        LEFT JOIN products p ON jc.product_id = p.id
        LEFT JOIN companies c ON jc.company_id = c.id
        LEFT JOIN users u_designer ON pj.assigned_designer_id = u_designer.id
        LEFT JOIN users u_creator ON pj.created_by = u_creator.id
        WHERE pj.id = $1
      `, [id]);

      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update prepress job status with validation
   */
  async updatePrepressJobStatus(id, newStatus, actorId, actorRole, remark = null) {
    try {
      // Get current job
      const currentJob = await this.getPrepressJobById(id);
      if (!currentJob) {
        throw new Error('Prepress job not found');
      }

      const currentStatus = currentJob.status;

      // Validate transition
      if (!this.isValidTransition(currentStatus, newStatus, actorRole)) {
        throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus} for role ${actorRole}`);
      }

      // Update job
      const updateFields = ['status = $1', 'updated_by = $2'];
      const updateParams = [newStatus, actorId];
      let paramCount = 3; // Next parameter index

      // Set timestamps based on status
      if (newStatus === 'IN_PROGRESS' && !currentJob.started_at) {
        updateFields.push(`started_at = $${paramCount++} `);
        updateParams.push(new Date().toISOString());
      }

      if (newStatus === 'COMPLETED') {
        updateFields.push(`completed_at = $${paramCount++} `);
        updateParams.push(new Date().toISOString());
      }

      updateParams.push(id); // ID is the last parameter

      await dbAdapter.query(`
        UPDATE prepress_jobs 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
    `, updateParams);

      // Log activity
      await dbAdapter.query(`
        INSERT INTO prepress_activity(prepress_job_id, actor_id, action, from_status, to_status, remark)
    VALUES($1, $2, $3, $4, $5, $6)
      `, [id, actorId, this.getActionFromStatusChange(currentStatus, newStatus), currentStatus, newStatus, remark]);

      // Update job lifecycle status
      try {
        if (global.jobLifecycleService) {
          await global.jobLifecycleService.updatePrepressStatus(
            currentJob.job_card_id,
            newStatus,
            remark,
            actorId
          );
        }
      } catch (lifecycleError) {
        console.error('Error updating job lifecycle status:', lifecycleError);
        // Don't fail prepress status update if lifecycle update fails
      }

      return await this.getPrepressJobById(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Assign designer to prepress job
   */
  async assignDesigner(id, designerId, actorId, remark = null) {
    try {
      const currentJob = await this.getPrepressJobById(id);
      if (!currentJob) {
        throw new Error('Prepress job not found');
      }

      // Update assignment
      await dbAdapter.query(`
        UPDATE prepress_jobs 
        SET assigned_designer_id = $1, status = 'ASSIGNED', updated_by = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [designerId, actorId, id]);

      // Log activity
      await dbAdapter.query(`
        INSERT INTO prepress_activity(prepress_job_id, actor_id, action, from_status, to_status, remark)
    VALUES($1, $2, 'ASSIGNED', $3, 'ASSIGNED', $4)
      `, [id, actorId, currentJob.status, remark || 'Designer assigned']);

      return await this.getPrepressJobById(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reassign designer
   */
  async reassignDesigner(id, newDesignerId, actorId, remark = null) {
    try {
      const currentJob = await this.getPrepressJobById(id);
      if (!currentJob) {
        throw new Error('Prepress job not found');
      }

      const oldDesignerId = currentJob.assigned_designer_id;

      // Update assignment
      // Update assignment
      await dbAdapter.query(`
        UPDATE prepress_jobs 
        SET assigned_designer_id = $1, status = 'ASSIGNED', updated_by = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [newDesignerId, actorId, id]);

      // Log activity
      await dbAdapter.query(`
        INSERT INTO prepress_activity(prepress_job_id, actor_id, action, from_status, to_status, remark, metadata)
    VALUES($1, $2, 'REASSIGNED', $3, 'ASSIGNED', $4, $5)
      `, [
        id,
        actorId,
        currentJob.status,
        remark || 'Designer reassigned',
        JSON.stringify({ from: oldDesignerId, to: newDesignerId })
      ]);

      return await this.getPrepressJobById(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add remark to prepress job
   */
  async addRemark(id, remark, actorId, isHodRemark = false) {
    try {
      const currentJob = await this.getPrepressJobById(id);
      if (!currentJob) {
        throw new Error('Prepress job not found');
      }

      // Update HOD remark if specified
      if (isHodRemark) {
        await dbAdapter.query(`
          UPDATE prepress_jobs 
          SET hod_last_remark = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
      `, [remark, actorId, id]);
      }

      // Log activity
      await dbAdapter.query(`
        INSERT INTO prepress_activity(prepress_job_id, actor_id, action, remark)
    VALUES($1, $2, 'REMARK', $3)
      `, [id, actorId, remark]);

      return await this.getPrepressJobById(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get prepress job activity log
   */
  async getPrepressJobActivity(id) {
    try {
      const result = await dbAdapter.query(`
    SELECT
    pa.*,
      u.first_name,
      u.last_name,
      u.role
        FROM prepress_activity pa
        LEFT JOIN users u ON pa.actor_id = u.id
        WHERE pa.prepress_job_id = $1
        ORDER BY pa.created_at DESC
      `, [id]);

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get designer's queue
   */
  async getDesignerQueue(designerId, filters = {}) {
    try {
      let query = `
    SELECT
    pj.*,
      jc."jobNumber" as job_card_id,
        jc.po_number,
        jc.quantity,
        jc.delivery_date,
        jc.priority as job_priority,
        jc."createdAt" as job_created_at,
          p.product_item_code,
          p.brand,
          p.product_type,
          c.name as company_name,
          c.code as company_code,
          u_merchandiser.first_name as merchandiser_first_name,
          u_merchandiser.last_name as merchandiser_last_name
        FROM prepress_jobs pj
        LEFT JOIN job_cards jc ON pj.job_card_id = jc.id
        LEFT JOIN products p ON jc.product_id = p.id
        LEFT JOIN companies c ON jc.company_id = c.id
        LEFT JOIN users u_merchandiser ON jc."createdById" = u_merchandiser.id
        WHERE pj.assigned_designer_id = $1
      `;

      const params = [designerId];
      let paramCount = 2; // Starts at 2 because designerId is $1

      if (filters.status) {
        query += ` AND pj.status = $${paramCount++} `;
        params.push(filters.status);
      }

      if (filters.priority) {
        query += ` AND pj.priority = $${paramCount++} `;
        params.push(filters.priority);
      }

      query += ` ORDER BY pj.priority DESC, pj.due_date ASC, pj.created_at DESC`;

      if (filters.limit) {
        query += ` LIMIT $${paramCount++} `;
        params.push(filters.limit);
      }

      const result = await dbAdapter.query(query, params);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get prepress statistics
   */
  async getPrepressStatistics(filters = {}) {
    try {
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 1;

      if (filters.fromDate) {
        whereClause += ` AND pj.created_at >= $${paramCount++} `;
        params.push(filters.fromDate);
      }

      if (filters.toDate) {
        whereClause += ` AND pj.created_at <= $${paramCount++} `;
        params.push(filters.toDate);
      }

      const result = await dbAdapter.query(`
    SELECT
    COUNT(*) as total_jobs,
      COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_jobs,
      COUNT(CASE WHEN status = 'ASSIGNED' THEN 1 END) as assigned_jobs,
      COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_jobs,
      COUNT(CASE WHEN status = 'PAUSED' THEN 1 END) as paused_jobs,
      COUNT(CASE WHEN status = 'HOD_REVIEW' THEN 1 END) as hod_review_jobs,
      COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_jobs,
      COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected_jobs,
      AVG(CASE 
            WHEN started_at IS NOT NULL AND completed_at IS NOT NULL 
            THEN(EXTRACT(EPOCH FROM completed_at) - EXTRACT(EPOCH FROM started_at))
          END) as avg_turnaround_seconds,
      COUNT(DISTINCT assigned_designer_id) as active_designers
        FROM prepress_jobs pj
        ${whereClause}
    `, params);

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate status transition
   */
  isValidTransition(fromStatus, toStatus, userRole) {
    // Admin can do any transition
    if (userRole === 'ADMIN') {
      return true;
    }

    // Check if transition is allowed in state machine
    const allowedTransitions = STATUS_TRANSITIONS[fromStatus] || [];
    if (!allowedTransitions.includes(toStatus)) {
      return false;
    }

    // Check role permissions
    const roleTransitions = ROLE_TRANSITIONS[userRole] || [];
    return roleTransitions.includes('*') || roleTransitions.includes(toStatus);
  }

  /**
   * Get action name from status change
   */
  getActionFromStatusChange(fromStatus, toStatus) {
    const actionMap = {
      'PENDING->ASSIGNED': 'ASSIGNED',
      'ASSIGNED->IN_PROGRESS': 'STARTED',
      'IN_PROGRESS->PAUSED': 'PAUSED',
      'PAUSED->IN_PROGRESS': 'RESUMED',
      'IN_PROGRESS->HOD_REVIEW': 'COMPLETED',
      'HOD_REVIEW->COMPLETED': 'APPROVED',
      'HOD_REVIEW->REJECTED': 'REJECTED',
      'ASSIGNED->REASSIGNED': 'REASSIGNED'
    };

    return actionMap[`${fromStatus} -> ${toStatus} `] || 'STATUS_CHANGED';
  }
}

export default new PrepressService();