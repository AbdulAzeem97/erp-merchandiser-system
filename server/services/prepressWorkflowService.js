import dbAdapter from '../database/adapter.js';
import { v4 as uuidv4 } from 'uuid';

class PrepressWorkflowService {
  constructor(socketHandler = null) {
    this.socketHandler = socketHandler;
  }

  setSocketHandler(socketHandler) {
    this.socketHandler = socketHandler;
  }

  // Prepress workflow stages
  static PREPRESS_STAGES = {
    DESIGNING: 'DESIGNING',
    DIE_MAKING: 'DIE_MAKING', 
    PLATE_MAKING: 'PLATE_MAKING',
    PREPRESS_COMPLETED: 'PREPRESS_COMPLETED'
  };

  // Status transitions for prepress workflow
  static STATUS_TRANSITIONS = {
    PENDING: ['ASSIGNED'],
    ASSIGNED: ['DESIGNING'],
    DESIGNING: ['DESIGNING_COMPLETED'],
    DESIGNING_COMPLETED: ['DIE_MAKING'],
    DIE_MAKING: ['DIE_MAKING_COMPLETED'],
    DIE_MAKING_COMPLETED: ['PLATE_MAKING'],
    PLATE_MAKING: ['PLATE_MAKING_COMPLETED'],
    PLATE_MAKING_COMPLETED: ['PREPRESS_COMPLETED'],
    PREPRESS_COMPLETED: ['IN_PROGRESS'], // Move to production
    IN_PROGRESS: ['PAUSED', 'HOD_REVIEW', 'REJECTED'],
    PAUSED: ['IN_PROGRESS', 'REJECTED'],
    HOD_REVIEW: ['COMPLETED', 'REJECTED'],
    COMPLETED: [], // Terminal state
    REJECTED: ['ASSIGNED', 'DESIGNING'] // Can be reassigned
  };

  /**
   * Update prepress job status with automatic progression
   */
  async updatePrepressStatus(jobCardId, newStatus, notes = '', updatedBy, metadata = {}) {
    try {
      console.log(`🔄 Updating prepress status for job ${jobCardId} to ${newStatus}`);

      // Get current prepress job
      const currentJobQuery = `
        SELECT 
          pj.*,
          jc."jobNumber",
          jc."productId",
          p.name as product_name,
          p.product_type,
          u."firstName" || ' ' || u."lastName" as designer_name
        FROM prepress_jobs pj
        JOIN job_cards jc ON pj.job_card_id = jc.id
        LEFT JOIN products p ON jc."productId" = p.id
        LEFT JOIN users u ON pj.assigned_designer_id = u.id
        WHERE jc."jobNumber" = $1 OR jc.id = $1
      `;

      const currentJobResult = await dbAdapter.query(currentJobQuery, [jobCardId]);
      
      if (currentJobResult.rows.length === 0) {
        throw new Error(`Prepress job not found for job card: ${jobCardId}`);
      }

      const currentJob = currentJobResult.rows[0];
      const currentStatus = currentJob.status;

      // Validate status transition
      if (!this.isValidTransition(currentStatus, newStatus)) {
        throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
      }

      // Update prepress job status
      const updateQuery = `
        UPDATE prepress_jobs 
        SET 
          status = $1,
          notes = $2,
          updated_at = NOW(),
          updated_by = $3
        WHERE job_card_id = $4
        RETURNING *
      `;

      const updateResult = await dbAdapter.query(updateQuery, [
        newStatus,
        notes,
        updatedBy,
        currentJob.job_card_id
      ]);

      const updatedJob = updateResult.rows[0];

      // Log activity
      await this.logPrepressActivity(
        updatedJob.id,
        updatedBy,
        'STATUS_UPDATE',
        currentStatus,
        newStatus,
        notes,
        metadata
      );

      // Check for automatic progression
      const nextStatus = this.getNextAutomaticStatus(newStatus);
      if (nextStatus) {
        console.log(`🚀 Auto-progressing job ${jobCardId} from ${newStatus} to ${nextStatus}`);
        
        // Auto-progress after a short delay (simulating processing time)
        setTimeout(async () => {
          try {
            await this.updatePrepressStatus(jobCardId, nextStatus, 'Auto-progressed to next stage', 'system', {
              auto_progressed: true,
              from_status: newStatus
            });
          } catch (error) {
            console.error('Error in auto-progression:', error);
          }
        }, 2000); // 2 second delay for demo
      }

      // Update main job card status if prepress is completed
      if (newStatus === 'PREPRESS_COMPLETED') {
        await this.updateJobCardStatus(currentJob.job_card_id, 'IN_PROGRESS', 'Prepress completed, moved to production');
      }

      // Emit real-time updates
      if (this.socketHandler) {
        this.emitPrepressUpdate(updatedJob, currentJob, newStatus, notes);
      }

      return {
        success: true,
        prepressJob: updatedJob,
        previousStatus: currentStatus,
        newStatus: newStatus,
        autoProgressed: !!nextStatus
      };

    } catch (error) {
      console.error('Error updating prepress status:', error);
      throw error;
    }
  }

  /**
   * Check if status transition is valid
   */
  isValidTransition(fromStatus, toStatus) {
    const allowedTransitions = PrepressWorkflowService.STATUS_TRANSITIONS[fromStatus] || [];
    return allowedTransitions.includes(toStatus);
  }

  /**
   * Get next automatic status in the workflow
   */
  getNextAutomaticStatus(currentStatus) {
    const autoProgressions = {
      'DESIGNING_COMPLETED': 'DIE_MAKING',
      'DIE_MAKING_COMPLETED': 'PLATE_MAKING', 
      'PLATE_MAKING_COMPLETED': 'PREPRESS_COMPLETED'
    };
    return autoProgressions[currentStatus] || null;
  }

  /**
   * Update main job card status
   */
  async updateJobCardStatus(jobCardId, status, notes = '') {
    try {
      const updateQuery = `
        UPDATE job_cards 
        SET 
          status = $1,
          notes = COALESCE(notes, '') || $2,
          "updatedAt" = NOW()
        WHERE id = $1
      `;

      await dbAdapter.query(updateQuery, [status, notes ? `\n${notes}` : '', jobCardId]);
      console.log(`✅ Updated job card ${jobCardId} status to ${status}`);
    } catch (error) {
      console.error('Error updating job card status:', error);
    }
  }

  /**
   * Log prepress activity
   */
  async logPrepressActivity(prepressJobId, actorId, action, fromStatus = null, toStatus = null, remark = null, metadata = null) {
    try {
      const logQuery = `
        INSERT INTO prepress_activity_log (
          id, prepress_job_id, actor_id, action, from_status, to_status, 
          remark, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      `;

      await dbAdapter.query(logQuery, [
        uuidv4(),
        prepressJobId,
        actorId,
        action,
        fromStatus,
        toStatus,
        remark,
        JSON.stringify(metadata)
      ]);
    } catch (error) {
      console.error('Error logging prepress activity:', error);
    }
  }

  /**
   * Emit real-time updates via Socket.IO
   */
  emitPrepressUpdate(updatedJob, previousJob, newStatus, notes) {
    if (!this.socketHandler) return;

    const updateData = {
      jobCardId: previousJob.jobNumber,
      prepressJobId: updatedJob.id,
      status: newStatus,
      previousStatus: previousJob.status,
      designer: previousJob.designer_name,
      productName: previousJob.product_name,
      productType: previousJob.product_type,
      notes: notes,
      timestamp: new Date().toISOString(),
      message: `Job ${previousJob.jobNumber} status updated to ${newStatus}`
    };

    // Emit to all connected clients
    this.socketHandler.emit('prepress_status_update', updateData);
    
    // Emit to specific rooms
    this.socketHandler.to('role:HOD_PREPRESS').emit('prepress_status_update', updateData);
    this.socketHandler.to('role:DESIGNER').emit('prepress_status_update', updateData);
    this.socketHandler.to('role:ADMIN').emit('prepress_status_update', updateData);
    
    // Emit to job-specific room
    this.socketHandler.to(`prepress:job:${updatedJob.id}`).emit('prepress_status_update', updateData);

    console.log('📡 Emitted prepress status update:', updateData);
  }

  /**
   * Get prepress job details with workflow info
   */
  async getPrepressJobDetails(jobCardId) {
    try {
      // First check if prepress_jobs table exists
      const tableCheck = await dbAdapter.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_name = 'prepress_jobs'
      `);
      
      if (tableCheck.rows.length === 0) {
        // Table doesn't exist, return default data
        console.log('Prepress jobs table does not exist, returning default data');
        return {
          id: 'default',
          job_card_id: jobCardId,
          status: 'ASSIGNED',
          workflowProgress: this.getWorkflowProgress('ASSIGNED')
        };
      }

      const query = `
        SELECT 
          pj.*,
          jc."jobNumber",
          jc."productId",
          jc.quantity,
          jc."dueDate",
          jc.urgency,
          p.name as product_name,
          p.product_type,
          p.brand,
          u."firstName" || ' ' || u."lastName" as designer_name,
          u.email as designer_email,
          c.name as company_name
        FROM prepress_jobs pj
        JOIN job_cards jc ON pj.job_card_id = jc.id
        LEFT JOIN products p ON jc."productId" = p.id
        LEFT JOIN users u ON pj.assigned_designer_id = u.id
        LEFT JOIN companies c ON jc."companyId" = c.id
        WHERE jc."jobNumber" = $1 OR jc.id = $1
      `;

      const result = await dbAdapter.query(query, [jobCardId]);
      
      if (result.rows.length === 0) {
        // No prepress job found, return default data
        return {
          id: 'default',
          job_card_id: jobCardId,
          status: 'ASSIGNED',
          workflowProgress: this.getWorkflowProgress('ASSIGNED')
        };
      }

      const job = result.rows[0];
      
      // Get workflow progress
      const workflowProgress = this.getWorkflowProgress(job.status);
      
      return {
        ...job,
        workflowProgress
      };
    } catch (error) {
      console.error('Error getting prepress job details:', error);
      // Return default data on error
      return {
        id: 'default',
        job_card_id: jobCardId,
        status: 'ASSIGNED',
        workflowProgress: this.getWorkflowProgress('ASSIGNED')
      };
    }
  }

  /**
   * Get workflow progress information
   */
  getWorkflowProgress(currentStatus) {
    const stages = [
      { key: 'DESIGNING', label: 'Designing', status: 'pending' },
      { key: 'DIE_MAKING', label: 'Die Making', status: 'pending' },
      { key: 'PLATE_MAKING', label: 'Plate Making', status: 'pending' },
      { key: 'PREPRESS_COMPLETED', label: 'Prepress Completed', status: 'pending' }
    ];

    const statusOrder = [
      'ASSIGNED', 'DESIGNING', 'DESIGNING_COMPLETED',
      'DIE_MAKING', 'DIE_MAKING_COMPLETED',
      'PLATE_MAKING', 'PLATE_MAKING_COMPLETED',
      'PREPRESS_COMPLETED'
    ];

    const currentIndex = statusOrder.indexOf(currentStatus);
    
    stages.forEach((stage, index) => {
      if (index < currentIndex / 2) {
        stage.status = 'completed';
      } else if (index === Math.floor(currentIndex / 2)) {
        stage.status = 'current';
      } else {
        stage.status = 'pending';
      }
    });

    return {
      stages,
      currentStage: stages.find(s => s.status === 'current')?.label || 'Unknown',
      progress: Math.round((currentIndex / (statusOrder.length - 1)) * 100)
    };
  }

  /**
   * Get all prepress jobs with workflow status
   */
  async getAllPrepressJobs(filters = {}) {
    try {
      // First check if prepress_jobs table exists
      const tableCheck = await dbAdapter.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_name = 'prepress_jobs'
      `);
      
      if (tableCheck.rows.length === 0) {
        // Table doesn't exist, return empty array
        console.log('Prepress jobs table does not exist, returning empty array');
        return [];
      }

      let query = `
        SELECT 
          pj.*,
          jc."jobNumber",
          jc."productId",
          jc.quantity,
          jc."dueDate",
          jc.urgency,
          p.name as product_name,
          p.product_type,
          p.brand,
          u."firstName" || ' ' || u."lastName" as designer_name,
          u.email as designer_email,
          c.name as company_name
        FROM prepress_jobs pj
        JOIN job_cards jc ON pj.job_card_id = jc.id
        LEFT JOIN products p ON jc."productId" = p.id
        LEFT JOIN users u ON pj.assigned_designer_id = u.id
        LEFT JOIN companies c ON jc."companyId" = c.id
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 0;

      if (filters.status) {
        paramCount++;
        query += ` AND pj.status = $${paramCount}`;
        params.push(filters.status);
      }

      if (filters.designerId) {
        paramCount++;
        query += ` AND pj.assigned_designer_id = $${paramCount}`;
        params.push(filters.designerId);
      }

      if (filters.priority) {
        paramCount++;
        query += ` AND jc.urgency = $${paramCount}`;
        params.push(filters.priority);
      }

      query += ` ORDER BY pj.created_at DESC`;

      const result = await dbAdapter.query(query, params);
      
      return result.rows.map(job => ({
        ...job,
        workflowProgress: this.getWorkflowProgress(job.status)
      }));
    } catch (error) {
      console.error('Error getting all prepress jobs:', error);
      // Return empty array on error
      return [];
    }
  }
}

export default PrepressWorkflowService;
