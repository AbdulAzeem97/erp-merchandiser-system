import dbAdapter from '../database/adapter.js';
import { v4 as uuidv4 } from 'uuid';

class JobLifecycleService {
  constructor(socketHandler = null) {
    this.socketHandler = socketHandler;
  }

  setSocketHandler(socketHandler) {
    this.socketHandler = socketHandler;
  }

  // Job Status Definitions
  static JOB_STATUSES = {
    CREATED: 'CREATED',
    ASSIGNED_TO_PREPRESS: 'ASSIGNED_TO_PREPRESS',
    PREPRESS_IN_PROGRESS: 'PREPRESS_IN_PROGRESS',
    PREPRESS_COMPLETED: 'PREPRESS_COMPLETED',
    READY_FOR_PRODUCTION: 'READY_FOR_PRODUCTION',
    IN_PRODUCTION: 'IN_PRODUCTION',
    COMPLETED: 'COMPLETED',
    ON_HOLD: 'ON_HOLD',
    CANCELLED: 'CANCELLED'
  };

  static PREPRESS_STATUSES = {
    PENDING: 'PENDING',
    ASSIGNED: 'ASSIGNED',
    IN_PROGRESS: 'IN_PROGRESS',
    PAUSED: 'PAUSED',
    HOD_REVIEW: 'HOD_REVIEW',
    COMPLETED: 'COMPLETED',
    REJECTED: 'REJECTED'
  };

  // Create job lifecycle entry when job is created
  async createJobLifecycle(jobCardId, createdBy) {
    const lifecycleId = uuidv4();
    
    const query = `
      INSERT INTO job_lifecycle (
        id, job_card_id, status, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `;

    try {
      const result = pool.query(query, [
        lifecycleId,
        jobCardId,
        JobLifecycleService.JOB_STATUSES.CREATED,
        createdBy
      ]);

      // Log the status change
      await this.logStatusChange(
        lifecycleId,
        null,
        JobLifecycleService.JOB_STATUSES.CREATED,
        'Job created by merchandiser',
        createdBy
      );

      // Emit real-time update
      if (this.socketHandler) {
        this.socketHandler.emitJobLifecycleUpdate(jobCardId, 'STATUS_CHANGE', {
          status: JobLifecycleService.JOB_STATUSES.CREATED,
          message: 'Job created successfully'
        });
      }

      return { id: lifecycleId, status: JobLifecycleService.JOB_STATUSES.CREATED };
    } catch (error) {
      console.error('Error creating job lifecycle:', error);
      throw error;
    }
  }

  // Update job status when assigned to prepress
  async updateJobStatusToPrepress(jobCardId, prepressJobId, assignedDesignerId, updatedBy) {
    try {
      // Update job lifecycle status
      const updateLifecycleQuery = `
        UPDATE job_lifecycle 
        SET status = ?, prepress_job_id = ?, assigned_designer_id = ?, updated_at = datetime('now')
        WHERE job_card_id = ?
      `;

      pool.query(updateLifecycleQuery, [
        JobLifecycleService.JOB_STATUSES.ASSIGNED_TO_PREPRESS,
        prepressJobId,
        assignedDesignerId,
        jobCardId
      ]);

      // Get designer info
      const designer = pool.prepare('SELECT first_name, last_name FROM users WHERE id = ?').get(assignedDesignerId);
      const designerName = designer ? `${designer.first_name} ${designer.last_name}` : 'Unknown';

      // Log status change
      const lifecycle = pool.prepare('SELECT id FROM job_lifecycle WHERE job_card_id = ?').get(jobCardId);
      if (lifecycle) {
        await this.logStatusChange(
          lifecycle.id,
          JobLifecycleService.JOB_STATUSES.CREATED,
          JobLifecycleService.JOB_STATUSES.ASSIGNED_TO_PREPRESS,
          `Job assigned to designer: ${designerName}`,
          updatedBy
        );
      }

      // Emit real-time updates
      if (this.socketHandler) {
        // Notify the assigned designer
        this.socketHandler.emitUserNotification(assignedDesignerId, {
          type: 'job_assigned',
          title: 'New Job Assigned',
          message: `You have been assigned job ${jobCardId}`,
          jobCardId: jobCardId,
          priority: 'medium'
        });

        // Notify job creator/merchandiser about assignment
        this.socketHandler.emitJobLifecycleUpdate(jobCardId, 'ASSIGNED_TO_PREPRESS', {
          status: JobLifecycleService.JOB_STATUSES.ASSIGNED_TO_PREPRESS,
          assignedDesigner: designerName,
          assignedDesignerId: assignedDesignerId,
          message: `Job assigned to ${designerName} for prepress work`
        });

        // Notify HOD
        this.socketHandler.emitHODPrepressUpdate('JOB_ASSIGNED', {
          jobCardId: jobCardId,
          assignedDesigner: designerName,
          assignedDesignerId: assignedDesignerId
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating job status to prepress:', error);
      throw error;
    }
  }

  // Update prepress status
  async updatePrepressStatus(jobCardId, prepressStatus, notes, updatedBy) {
    try {
      // Map prepress status to job lifecycle status
      let jobStatus;
      switch (prepressStatus) {
        case JobLifecycleService.PREPRESS_STATUSES.IN_PROGRESS:
          jobStatus = JobLifecycleService.JOB_STATUSES.PREPRESS_IN_PROGRESS;
          break;
        case JobLifecycleService.PREPRESS_STATUSES.COMPLETED:
          jobStatus = JobLifecycleService.JOB_STATUSES.PREPRESS_COMPLETED;
          break;
        case JobLifecycleService.PREPRESS_STATUSES.PAUSED:
          jobStatus = JobLifecycleService.JOB_STATUSES.ON_HOLD;
          break;
        default:
          jobStatus = JobLifecycleService.JOB_STATUSES.ASSIGNED_TO_PREPRESS;
      }

      // Update job lifecycle
      const updateQuery = `
        UPDATE job_lifecycle 
        SET status = ?, prepress_status = ?, prepress_notes = ?, updated_at = datetime('now')
        WHERE job_card_id = ?
      `;

      pool.query(updateQuery, [jobStatus, prepressStatus, notes, jobCardId]);

      // Get lifecycle info for logging
      const lifecycle = pool.prepare('SELECT * FROM job_lifecycle WHERE job_card_id = ?').get(jobCardId);
      const designer = pool.prepare('SELECT first_name, last_name FROM users WHERE id = ?').get(updatedBy);
      const designerName = designer ? `${designer.first_name} ${designer.last_name}` : 'Unknown';

      if (lifecycle) {
        await this.logStatusChange(
          lifecycle.id,
          lifecycle.status,
          jobStatus,
          notes || `Prepress status updated to ${prepressStatus} by ${designerName}`,
          updatedBy
        );
      }

      // Emit real-time updates based on status
      if (this.socketHandler) {
        let notificationData = {
          status: jobStatus,
          prepressStatus: prepressStatus,
          designer: designerName,
          notes: notes
        };

        switch (prepressStatus) {
          case JobLifecycleService.PREPRESS_STATUSES.IN_PROGRESS:
            notificationData.message = `${designerName} started working on the job`;
            break;
          case JobLifecycleService.PREPRESS_STATUSES.COMPLETED:
            notificationData.message = `Prepress work completed by ${designerName}`;
            break;
          case JobLifecycleService.PREPRESS_STATUSES.PAUSED:
            notificationData.message = `Job paused by ${designerName}`;
            break;
          case JobLifecycleService.PREPRESS_STATUSES.HOD_REVIEW:
            notificationData.message = `Job submitted for review by ${designerName}`;
            break;
        }

        // Notify all stakeholders
        this.socketHandler.emitJobLifecycleUpdate(jobCardId, 'PREPRESS_UPDATE', notificationData);
        
        // Notify HOD
        this.socketHandler.emitHODPrepressUpdate('PREPRESS_STATUS_CHANGE', notificationData);

        // Notify job creator if it's a significant milestone
        if ([JobLifecycleService.PREPRESS_STATUSES.IN_PROGRESS, JobLifecycleService.PREPRESS_STATUSES.COMPLETED].includes(prepressStatus)) {
          const jobCard = pool.prepare('SELECT created_by FROM job_cards WHERE id = ?').get(jobCardId);
          if (jobCard && jobCard.created_by) {
            this.socketHandler.emitUserNotification(jobCard.created_by, {
              type: 'prepress_update',
              title: 'Prepress Update',
              message: notificationData.message,
              jobCardId: jobCardId,
              priority: prepressStatus === JobLifecycleService.PREPRESS_STATUSES.COMPLETED ? 'high' : 'medium'
            });
          }
        }
      }

      return { success: true, status: jobStatus, prepressStatus };
    } catch (error) {
      console.error('Error updating prepress status:', error);
      throw error;
    }
  }

  // Get complete job lifecycle
  async getJobLifecycle(jobCardId) {
    try {
      const query = `
        SELECT 
          jl.*,
          jc.job_card_id,
          jc.po_number,
          jc.quantity,
          jc.delivery_date,
          jc.priority as job_priority,
          p.product_item_code,
          p.brand,
          c.name as company_name,
          designer.first_name || ' ' || designer.last_name as designer_name,
          creator.first_name || ' ' || creator.last_name as creator_name,
          pj.status as prepress_detailed_status,
          pj.due_date as prepress_due_date
        FROM job_lifecycle jl
        LEFT JOIN job_cards jc ON jl.job_card_id = jc.id
        LEFT JOIN products p ON jc.product_id = p.id
        LEFT JOIN companies c ON jc.company_id = c.id
        LEFT JOIN users designer ON jl.assigned_designer_id = designer.id
        LEFT JOIN users creator ON jl.created_by = creator.id
        LEFT JOIN prepress_jobs pj ON jl.prepress_job_id = pj.id
        WHERE jl.job_card_id = ?
      `;

      const result = pool.prepare(query).get(jobCardId);

      if (!result) {
        return null;
      }

      // Get status history
      const historyQuery = `
        SELECT * FROM job_lifecycle_history 
        WHERE job_lifecycle_id = ? 
        ORDER BY changed_at DESC
      `;
      
      const history = pool.prepare(historyQuery).all(result.id);

      return {
        ...result,
        statusHistory: history
      };
    } catch (error) {
      console.error('Error getting job lifecycle:', error);
      throw error;
    }
  }

  // Get all active jobs with their current status
  async getAllJobsWithStatus(filters = {}) {
    try {
      let whereConditions = ['jl.status != ?'];
      let params = [JobLifecycleService.JOB_STATUSES.CANCELLED];

      if (filters.status) {
        whereConditions.push('jl.status = ?');
        params.push(filters.status);
      }

      if (filters.designerId) {
        whereConditions.push('jl.assigned_designer_id = ?');
        params.push(filters.designerId);
      }

      if (filters.createdBy) {
        whereConditions.push('jl.created_by = ?');
        params.push(filters.createdBy);
      }

      const query = `
        SELECT 
          jl.*,
          jc.job_card_id,
          jc.po_number,
          jc.quantity,
          jc.delivery_date,
          jc.priority as job_priority,
          p.product_item_code,
          p.brand,
          c.name as company_name,
          designer.first_name || ' ' || designer.last_name as designer_name,
          creator.first_name || ' ' || creator.last_name as creator_name,
          pj.status as prepress_detailed_status,
          pj.due_date as prepress_due_date,
          (SELECT COUNT(*) FROM job_lifecycle_history WHERE job_lifecycle_id = jl.id) as status_change_count
        FROM job_lifecycle jl
        LEFT JOIN job_cards jc ON jl.job_card_id = jc.id
        LEFT JOIN products p ON jc.product_id = p.id
        LEFT JOIN companies c ON jc.company_id = c.id
        LEFT JOIN users designer ON jl.assigned_designer_id = designer.id
        LEFT JOIN users creator ON jl.created_by = creator.id
        LEFT JOIN prepress_jobs pj ON jl.prepress_job_id = pj.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY jl.updated_at DESC
        LIMIT ${filters.limit || 50}
      `;

      const results = pool.prepare(query).all(params);
      return results;
    } catch (error) {
      console.error('Error getting all jobs with status:', error);
      throw error;
    }
  }

  // Log status changes for audit trail
  async logStatusChange(lifecycleId, fromStatus, toStatus, notes, changedBy) {
    const historyId = uuidv4();
    
    // Use system admin user if no user is provided
    const defaultAdminId = '96f0200a-ebc9-4946-8955-d67c30c88827';
    const finalChangedBy = changedBy || defaultAdminId;
    
    const query = `
      INSERT INTO job_lifecycle_history (
        id, job_lifecycle_id, status_from, status_to, notes, changed_by, changed_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `;

    try {
      pool.query(query, [historyId, lifecycleId, fromStatus, toStatus, notes, finalChangedBy]);
      return { success: true };
    } catch (error) {
      console.error('Error logging status change:', error);
      throw error;
    }
  }

  // Get real-time dashboard stats
  async getDashboardStats() {
    try {
      const stats = {};

      // Job status distribution
      const statusQuery = `
        SELECT status, COUNT(*) as count 
        FROM job_lifecycle 
        WHERE status != ? 
        GROUP BY status
      `;
      const statusResults = pool.prepare(statusQuery).all(JobLifecycleService.JOB_STATUSES.CANCELLED);
      
      stats.statusDistribution = statusResults.reduce((acc, row) => {
        acc[row.status] = row.count;
        return acc;
      }, {});

      // Active prepress jobs
      stats.activePrepressJobs = pool.prepare(`
        SELECT COUNT(*) as count 
        FROM job_lifecycle 
        WHERE status IN (?, ?, ?)
      `).get([
        JobLifecycleService.JOB_STATUSES.ASSIGNED_TO_PREPRESS,
        JobLifecycleService.JOB_STATUSES.PREPRESS_IN_PROGRESS,
        JobLifecycleService.JOB_STATUSES.ON_HOLD
      ]).count;

      // Jobs by designer
      const designerQuery = `
        SELECT 
          u.first_name || ' ' || u.last_name as designer_name,
          COUNT(*) as job_count
        FROM job_lifecycle jl
        JOIN users u ON jl.assigned_designer_id = u.id
        WHERE jl.status IN (?, ?, ?)
        GROUP BY jl.assigned_designer_id, u.first_name, u.last_name
      `;
      const designerResults = pool.prepare(designerQuery).all([
        JobLifecycleService.JOB_STATUSES.ASSIGNED_TO_PREPRESS,
        JobLifecycleService.JOB_STATUSES.PREPRESS_IN_PROGRESS,
        JobLifecycleService.JOB_STATUSES.ON_HOLD
      ]);
      
      stats.jobsByDesigner = designerResults;

      return stats;
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }
}

export default JobLifecycleService;