import dbAdapter from '../database/adapter.js';
import { logPrepressActivity, validatePrepressStatusTransition } from '../database/migrations/001_add_prepress_and_roles.js';

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

class EnhancedPrepressService {
  constructor(io = null) {
    this.io = io; // Socket.io instance for real-time updates
  }

  /**
   * Emit real-time update to relevant users
   */
  emitUpdate(event, data, targetUsers = null) {
    if (this.io) {
      if (targetUsers) {
        // Emit to specific users
        targetUsers.forEach(userId => {
          this.io.to(`user_${userId}`).emit(event, data);
        });
      } else {
        // Emit to all connected users
        this.io.emit(event, data);
      }
    }
  }

  /**
   * Create a new prepress job with real-time notifications
   */
  async createPrepressJob(jobCardId, assignedDesignerId = null, priority = 'MEDIUM', dueDate = null, createdBy) {
    try {
      // Verify job card exists
      const jobCard = pool.prepare(`
        SELECT jc.id, jc.job_card_id, jc.status, c.name as company_name, p.brand as product_name
        FROM job_cards jc
        LEFT JOIN companies c ON jc.company_id = c.id
        LEFT JOIN products p ON jc.product_id = p.id
        WHERE jc.id = ?
      `).get(jobCardId);

      if (!jobCard) {
        throw new Error('Job card not found');
      }

      // Check if prepress job already exists for this job card
      const existingJob = pool.prepare(
        'SELECT id FROM prepress_jobs WHERE job_card_id = ?'
      ).get(jobCardId);

      if (existingJob) {
        throw new Error('Prepress job already exists for this job card');
      }

      // Create prepress job
      const result = pool.prepare(`
        INSERT INTO prepress_jobs (job_card_id, assigned_designer_id, status, priority, due_date, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(jobCardId, assignedDesignerId, 'PENDING', priority, dueDate, createdBy, createdBy);

      const prepressJobId = result.lastInsertRowid;

      // Log activity
      await logPrepressActivity(prepressJobId, 'CREATED', 'Prepress job created', createdBy);

      // Get the created job with full details
      const createdJob = await this.getPrepressJobById(prepressJobId);

      // Emit real-time update
      this.emitUpdate('prepress_job_created', {
        job: createdJob,
        jobCardId: jobCard.job_card_id,
        companyName: jobCard.company_name,
        productName: jobCard.product_name
      });

      // If assigned to a designer, notify them specifically
      if (assignedDesignerId) {
        this.emitUpdate('prepress_job_assigned', {
          job: createdJob,
          jobCardId: jobCard.job_card_id,
          companyName: jobCard.company_name,
          productName: jobCard.product_name
        }, [assignedDesignerId]);
      }

      return createdJob;
    } catch (error) {
      console.error('Error creating prepress job:', error);
      throw error;
    }
  }

  /**
   * Update prepress job status with real-time notifications
   */
  async updatePrepressJobStatus(jobId, newStatus, userId, remark = null) {
    try {
      // Get current job details
      const currentJob = await this.getPrepressJobById(jobId);
      if (!currentJob) {
        throw new Error('Prepress job not found');
      }

      // Validate status transition
      const isValidTransition = validatePrepressStatusTransition(currentJob.status, newStatus);
      if (!isValidTransition) {
        throw new Error(`Invalid status transition from ${currentJob.status} to ${newStatus}`);
      }

      // Update job status
      const result = pool.prepare(`
        UPDATE prepress_jobs 
        SET status = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [newStatus, userId, jobId]);

      if (result.changes === 0) {
        throw new Error('Failed to update prepress job status');
      }

      // Log activity
      const activityType = this.getActivityTypeFromStatus(newStatus);
      await logPrepressActivity(jobId, activityType, remark || `Status changed to ${newStatus}`, userId);

      // Get updated job details
      const updatedJob = await this.getPrepressJobById(jobId);

      // Emit real-time update
      this.emitUpdate('prepress_job_updated', {
        job: updatedJob,
        previousStatus: currentJob.status,
        newStatus: newStatus,
        updatedBy: userId
      });

      // Notify specific users based on status change
      const targetUsers = this.getTargetUsersForStatusUpdate(updatedJob, newStatus);
      if (targetUsers.length > 0) {
        this.emitUpdate('prepress_job_status_notification', {
          job: updatedJob,
          status: newStatus,
          message: this.getStatusChangeMessage(newStatus)
        }, targetUsers);
      }

      return updatedJob;
    } catch (error) {
      console.error('Error updating prepress job status:', error);
      throw error;
    }
  }

  /**
   * Assign designer to prepress job with real-time notifications
   */
  async assignDesigner(jobId, designerId, assignedBy) {
    try {
      const currentJob = await this.getPrepressJobById(jobId);
      if (!currentJob) {
        throw new Error('Prepress job not found');
      }

      // Update assignment
      const result = pool.prepare(`
        UPDATE prepress_jobs 
        SET assigned_designer_id = ?, status = 'ASSIGNED', updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [designerId, assignedBy, jobId]);

      if (result.changes === 0) {
        throw new Error('Failed to assign designer');
      }

      // Log activity
      await logPrepressActivity(jobId, 'ASSIGNED', `Designer assigned to job`, assignedBy);

      // Get updated job details
      const updatedJob = await this.getPrepressJobById(jobId);

      // Emit real-time update
      this.emitUpdate('prepress_job_assigned', {
        job: updatedJob,
        assignedBy: assignedBy
      }, [designerId]);

      // Also notify HOD
      this.emitUpdate('prepress_job_assignment_confirmed', {
        job: updatedJob,
        designerId: designerId
      });

      return updatedJob;
    } catch (error) {
      console.error('Error assigning designer:', error);
      throw error;
    }
  }

  /**
   * Start work on prepress job with real-time notifications
   */
  async startWork(jobId, userId) {
    try {
      const currentJob = await this.getPrepressJobById(jobId);
      if (!currentJob) {
        throw new Error('Prepress job not found');
      }

      if (currentJob.assigned_designer_id !== userId) {
        throw new Error('Only assigned designer can start work on this job');
      }

      if (currentJob.status !== 'ASSIGNED') {
        throw new Error('Job must be assigned before work can be started');
      }

      // Update status to IN_PROGRESS
      const result = pool.prepare(`
        UPDATE prepress_jobs 
        SET status = 'IN_PROGRESS', work_started_at = CURRENT_TIMESTAMP, updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [userId, jobId]);

      if (result.changes === 0) {
        throw new Error('Failed to start work');
      }

      // Log activity
      await logPrepressActivity(jobId, 'WORK_STARTED', 'Work started on prepress job', userId);

      // Get updated job details
      const updatedJob = await this.getPrepressJobById(jobId);

      // Emit real-time update
      this.emitUpdate('prepress_job_started', {
        job: updatedJob,
        startedBy: userId
      });

      // Notify HOD
      this.emitUpdate('prepress_work_started', {
        job: updatedJob,
        designerId: userId
      });

      return updatedJob;
    } catch (error) {
      console.error('Error starting work:', error);
      throw error;
    }
  }

  /**
   * Pause work on prepress job with real-time notifications
   */
  async pauseWork(jobId, userId, remark = null) {
    try {
      const currentJob = await this.getPrepressJobById(jobId);
      if (!currentJob) {
        throw new Error('Prepress job not found');
      }

      if (currentJob.status !== 'IN_PROGRESS') {
        throw new Error('Job must be in progress to be paused');
      }

      // Update status to PAUSED
      const result = pool.prepare(`
        UPDATE prepress_jobs 
        SET status = 'PAUSED', work_paused_at = CURRENT_TIMESTAMP, updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [userId, jobId]);

      if (result.changes === 0) {
        throw new Error('Failed to pause work');
      }

      // Log activity
      await logPrepressActivity(jobId, 'WORK_PAUSED', remark || 'Work paused', userId);

      // Get updated job details
      const updatedJob = await this.getPrepressJobById(jobId);

      // Emit real-time update
      this.emitUpdate('prepress_job_paused', {
        job: updatedJob,
        pausedBy: userId,
        remark: remark
      });

      return updatedJob;
    } catch (error) {
      console.error('Error pausing work:', error);
      throw error;
    }
  }

  /**
   * Resume work on prepress job with real-time notifications
   */
  async resumeWork(jobId, userId) {
    try {
      const currentJob = await this.getPrepressJobById(jobId);
      if (!currentJob) {
        throw new Error('Prepress job not found');
      }

      if (currentJob.status !== 'PAUSED') {
        throw new Error('Job must be paused to be resumed');
      }

      // Update status to IN_PROGRESS
      const result = pool.prepare(`
        UPDATE prepress_jobs 
        SET status = 'IN_PROGRESS', work_resumed_at = CURRENT_TIMESTAMP, updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [userId, jobId]);

      if (result.changes === 0) {
        throw new Error('Failed to resume work');
      }

      // Log activity
      await logPrepressActivity(jobId, 'WORK_RESUMED', 'Work resumed', userId);

      // Get updated job details
      const updatedJob = await this.getPrepressJobById(jobId);

      // Emit real-time update
      this.emitUpdate('prepress_job_resumed', {
        job: updatedJob,
        resumedBy: userId
      });

      return updatedJob;
    } catch (error) {
      console.error('Error resuming work:', error);
      throw error;
    }
  }

  /**
   * Submit job for HOD review with real-time notifications
   */
  async submitForReview(jobId, userId, remark = null) {
    try {
      const currentJob = await this.getPrepressJobById(jobId);
      if (!currentJob) {
        throw new Error('Prepress job not found');
      }

      if (currentJob.status !== 'IN_PROGRESS') {
        throw new Error('Job must be in progress to be submitted for review');
      }

      // Update status to HOD_REVIEW
      const result = pool.prepare(`
        UPDATE prepress_jobs 
        SET status = 'HOD_REVIEW', submitted_at = CURRENT_TIMESTAMP, updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [userId, jobId]);

      if (result.changes === 0) {
        throw new Error('Failed to submit job for review');
      }

      // Log activity
      await logPrepressActivity(jobId, 'SUBMITTED_FOR_REVIEW', remark || 'Submitted for HOD review', userId);

      // Get updated job details
      const updatedJob = await this.getPrepressJobById(jobId);

      // Emit real-time update
      this.emitUpdate('prepress_job_submitted', {
        job: updatedJob,
        submittedBy: userId,
        remark: remark
      });

      // Notify HOD
      this.emitUpdate('prepress_job_ready_for_review', {
        job: updatedJob,
        designerId: userId
      });

      return updatedJob;
    } catch (error) {
      console.error('Error submitting job for review:', error);
      throw error;
    }
  }

  /**
   * Complete prepress job with real-time notifications
   */
  async completeJob(jobId, userId, remark = null) {
    try {
      const currentJob = await this.getPrepressJobById(jobId);
      if (!currentJob) {
        throw new Error('Prepress job not found');
      }

      if (currentJob.status !== 'HOD_REVIEW') {
        throw new Error('Job must be under HOD review to be completed');
      }

      // Update status to COMPLETED
      const result = pool.prepare(`
        UPDATE prepress_jobs 
        SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP, updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [userId, jobId]);

      if (result.changes === 0) {
        throw new Error('Failed to complete job');
      }

      // Log activity
      await logPrepressActivity(jobId, 'COMPLETED', remark || 'Job completed', userId);

      // Get updated job details
      const updatedJob = await this.getPrepressJobById(jobId);

      // Emit real-time update
      this.emitUpdate('prepress_job_completed', {
        job: updatedJob,
        completedBy: userId,
        remark: remark
      });

      // Notify designer
      if (updatedJob.assigned_designer_id) {
        this.emitUpdate('prepress_job_completion_notification', {
          job: updatedJob,
          message: 'Your job has been completed and approved'
        }, [updatedJob.assigned_designer_id]);
      }

      return updatedJob;
    } catch (error) {
      console.error('Error completing job:', error);
      throw error;
    }
  }

  /**
   * Add remark to prepress job with real-time notifications
   */
  async addRemark(jobId, remark, userId, isHodRemark = false) {
    try {
      const currentJob = await this.getPrepressJobById(jobId);
      if (!currentJob) {
        throw new Error('Prepress job not found');
      }

      // Log activity with remark
      await logPrepressActivity(jobId, 'REMARK_ADDED', remark, userId);

      // Update last remark fields
      const remarkField = isHodRemark ? 'hod_last_remark' : 'designer_last_remark';
      const remarkDateField = isHodRemark ? 'hod_last_remark_date' : 'designer_last_remark_date';

      pool.prepare(`
        UPDATE prepress_jobs 
        SET ${remarkField} = ?, ${remarkDateField} = CURRENT_TIMESTAMP, updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [remark, userId, jobId]);

      // Get updated job details
      const updatedJob = await this.getPrepressJobById(jobId);

      // Emit real-time update
      this.emitUpdate('prepress_job_remark_added', {
        job: updatedJob,
        remark: remark,
        addedBy: userId,
        isHodRemark: isHodRemark
      });

      // Notify relevant users
      const targetUsers = isHodRemark ? [currentJob.assigned_designer_id] : [];
      if (targetUsers.length > 0) {
        this.emitUpdate('prepress_job_remark_notification', {
          job: updatedJob,
          remark: remark,
          isHodRemark: isHodRemark
        }, targetUsers.filter(Boolean));
      }

      return updatedJob;
    } catch (error) {
      console.error('Error adding remark:', error);
      throw error;
    }
  }

  /**
   * Get prepress job by ID with full details
   */
  async getPrepressJobById(jobId) {
    try {
      const result = pool.prepare(`
        SELECT 
          pj.*,
          jc.job_card_id,
          jc.status as job_card_status,
          c.name as company_name,
          pr.brand as product_name,
          pr.product_type,
          pr.product_item_code,
          d.first_name as designer_first_name,
          d.last_name as designer_last_name,
          d.email as designer_email,
          cb.first_name as created_by_first_name,
          cb.last_name as created_by_last_name,
          ub.first_name as updated_by_first_name,
          ub.last_name as updated_by_last_name
        FROM prepress_jobs pj
        LEFT JOIN job_cards jc ON pj.job_card_id = jc.job_card_id
        LEFT JOIN companies c ON jc.company_id = c.id
        LEFT JOIN products pr ON jc.product_id = pr.id
        LEFT JOIN users d ON pj.assigned_designer_id = d.id
        LEFT JOIN users cb ON pj.created_by = cb.id
        LEFT JOIN users ub ON pj.updated_by = ub.id
        WHERE pj.id = ?
      `, [jobId]);

      return result.get() || null;
    } catch (error) {
      console.error('Error getting prepress job:', error);
      throw error;
    }
  }

  /**
   * Get all prepress jobs with filtering
   */
  async getPrepressJobs(filters = {}) {
    try {
      let query = `
        SELECT 
          pj.*,
          jc.job_card_id,
          jc.status as job_card_status,
          c.name as company_name,
          pr.brand as product_name,
          pr.product_type,
          pr.product_item_code,
          d.first_name as designer_first_name,
          d.last_name as designer_last_name,
          d.email as designer_email,
          cb.first_name as created_by_first_name,
          cb.last_name as created_by_last_name,
          ub.first_name as updated_by_first_name,
          ub.last_name as updated_by_last_name
        FROM prepress_jobs pj
        LEFT JOIN job_cards jc ON pj.job_card_id = jc.job_card_id
        LEFT JOIN companies c ON jc.company_id = c.id
        LEFT JOIN products pr ON jc.product_id = pr.id
        LEFT JOIN users d ON pj.assigned_designer_id = d.id
        LEFT JOIN users cb ON pj.created_by = cb.id
        LEFT JOIN users ub ON pj.updated_by = ub.id
        WHERE 1=1
      `;

      const params = [];

      if (filters.status) {
        query += ' AND pj.status = ?';
        params.push(filters.status);
      }

      if (filters.priority) {
        query += ' AND pj.priority = ?';
        params.push(filters.priority);
      }

      if (filters.designer) {
        query += ' AND pj.assigned_designer_id = ?';
        params.push(filters.designer);
      }

      if (filters.search) {
        query += ' AND (jc.job_card_id LIKE ? OR c.name LIKE ? OR pr.brand LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      query += ' ORDER BY pj.created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const result = pool.prepare(query).all(...params);
      return result;
    } catch (error) {
      console.error('Error getting prepress jobs:', error);
      throw error;
    }
  }

  /**
   * Get prepress statistics
   */
  async getPrepressStatistics() {
    try {
      const result = pool.prepare(`
        SELECT 
          COUNT(*) as total_jobs,
          COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_jobs,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_jobs,
          COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_jobs,
          COUNT(CASE WHEN status = 'HOD_REVIEW' THEN 1 END) as hod_review_jobs,
          COUNT(DISTINCT assigned_designer_id) as active_designers
        FROM prepress_jobs
      `).get();

      return result;
    } catch (error) {
      console.error('Error getting prepress statistics:', error);
      throw error;
    }
  }

  /**
   * Get designer productivity data
   */
  async getDesignerProductivity() {
    try {
      const result = pool.prepare(`
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          COUNT(pj.id) as total_jobs,
          COUNT(CASE WHEN pj.status = 'COMPLETED' THEN 1 END) as completed_jobs,
          COUNT(CASE WHEN pj.status = 'IN_PROGRESS' THEN 1 END) as in_progress_jobs,
          COUNT(CASE WHEN pj.status = 'REJECTED' THEN 1 END) as rejected_jobs
        FROM users u
        LEFT JOIN prepress_jobs pj ON u.id = pj.assigned_designer_id
        WHERE u.role = 'DESIGNER' AND u.is_active = 1
        GROUP BY u.id, u.first_name, u.last_name, u.email
        ORDER BY completed_jobs DESC
      `);

      return result.all(...params);
    } catch (error) {
      console.error('Error getting designer productivity:', error);
      throw error;
    }
  }

  /**
   * Get prepress job activity history
   */
  async getPrepressJobActivity(jobId) {
    try {
      const result = pool.prepare(`
        SELECT 
          pa.*,
          u.first_name,
          u.last_name,
          u.email
        FROM prepress_activity pa
        LEFT JOIN users u ON pa.user_id = u.id
        WHERE pa.prepress_job_id = ?
        ORDER BY pa.created_at DESC
      `, [jobId]);

      return result.all(...params);
    } catch (error) {
      console.error('Error getting prepress job activity:', error);
      throw error;
    }
  }

  // Helper methods
  getActivityTypeFromStatus(status) {
    const statusMap = {
      'PENDING': 'CREATED',
      'ASSIGNED': 'ASSIGNED',
      'IN_PROGRESS': 'WORK_STARTED',
      'PAUSED': 'WORK_PAUSED',
      'HOD_REVIEW': 'SUBMITTED_FOR_REVIEW',
      'COMPLETED': 'COMPLETED',
      'REJECTED': 'REJECTED'
    };
    return statusMap[status] || 'STATUS_CHANGED';
  }

  getTargetUsersForStatusUpdate(job, newStatus) {
    const targetUsers = [];
    
    // Always notify the assigned designer
    if (job.assigned_designer_id) {
      targetUsers.push(job.assigned_designer_id);
    }

    // Notify HOD for certain status changes
    if (['HOD_REVIEW', 'COMPLETED', 'REJECTED'].includes(newStatus)) {
      // Get HOD users (this would need to be implemented based on your user structure)
      // For now, we'll emit to all users and let the frontend filter
    }

    return targetUsers;
  }

  getStatusChangeMessage(status) {
    const messages = {
      'ASSIGNED': 'A new job has been assigned to you',
      'IN_PROGRESS': 'Work has started on this job',
      'PAUSED': 'Work has been paused on this job',
      'HOD_REVIEW': 'Job has been submitted for review',
      'COMPLETED': 'Job has been completed',
      'REJECTED': 'Job has been rejected and needs attention'
    };
    return messages[status] || 'Job status has been updated';
  }
}

export default EnhancedPrepressService;

