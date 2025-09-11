import { v4 as uuidv4 } from 'uuid';
import dbAdapter from '../database/adapter.js';

class EnhancedJobLifecycleService {
  constructor(io = null) {
    this.io = io;
  }

  setSocketHandler(io) {
    this.io = io;
  }

  // Enhanced Job Status Definitions
  static JOB_STATUSES = {
    CREATED: 'CREATED',
    ASSIGNED_TO_PREPRESS: 'ASSIGNED_TO_PREPRESS',
    PREPRESS_IN_PROGRESS: 'PREPRESS_IN_PROGRESS',
    PREPRESS_COMPLETED: 'PREPRESS_COMPLETED',
    HOD_REVIEW: 'HOD_REVIEW',
    READY_FOR_PRODUCTION: 'READY_FOR_PRODUCTION',
    IN_PRODUCTION: 'IN_PRODUCTION',
    COMPLETED: 'COMPLETED',
    ON_HOLD: 'ON_HOLD',
    CANCELLED: 'CANCELLED'
  };

  // Create job lifecycle entry
  async createJobLifecycle(jobCardId, productType, createdBy, priority = 'MEDIUM') {
    const lifecycleId = uuidv4();
    const currentTime = new Date().toISOString();
    
    try {
      // Create main lifecycle entry
      const lifecycleQuery = `
        INSERT INTO job_lifecycle (
          id, job_card_id, status, current_stage, product_type, priority,
          created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;

      await dbAdapter.query(lifecycleQuery, [
        lifecycleId,
        jobCardId,
        EnhancedJobLifecycleService.JOB_STATUSES.CREATED,
        'job_creation',
        productType,
        priority,
        createdBy,
        currentTime,
        currentTime
      ]);

      // Log the initial status change
      await this.logStatusChange(
        lifecycleId,
        null,
        EnhancedJobLifecycleService.JOB_STATUSES.CREATED,
        'Job created and lifecycle initialized',
        createdBy,
        { productType }
      );

      // Emit real-time update
      this.emitLifecycleUpdate(jobCardId, 'JOB_CREATED', {
        lifecycleId,
        status: EnhancedJobLifecycleService.JOB_STATUSES.CREATED,
        currentStage: 'job_creation',
        productType,
        message: 'Job created successfully'
      });

      return { 
        id: lifecycleId, 
        status: EnhancedJobLifecycleService.JOB_STATUSES.CREATED
      };
    } catch (error) {
      console.error('Error creating job lifecycle:', error);
      throw error;
    }
  }

  // Update job status
  async updateJobStatus(jobCardId, newStatus, updatedBy, notes = '', metadata = {}) {
    try {
      const lifecycleResult = await dbAdapter.query(`
        SELECT * FROM job_lifecycle WHERE job_card_id = $1
      `, [jobCardId]);
      const lifecycle = lifecycleResult.rows?.[0] || null;

      if (!lifecycle) {
        throw new Error('Job lifecycle not found');
      }

      const oldStatus = lifecycle.status;
      const currentTime = new Date().toISOString();

      // Update main lifecycle
      const updateQuery = `
            UPDATE job_lifecycle 
        SET status = $1, updated_at = $2, current_stage = $3
        WHERE job_card_id = $4
      `;

      await dbAdapter.query(updateQuery, [
        newStatus,
        currentTime,
        this.getStageFromStatus(newStatus),
        jobCardId
      ]);

      // Log the status change
      await this.logStatusChange(
        lifecycle.id,
        oldStatus,
        newStatus,
        notes,
        updatedBy,
        metadata
      );

      // Emit real-time update
      this.emitLifecycleUpdate(jobCardId, 'STATUS_CHANGED', {
        lifecycleId: lifecycle.id,
        oldStatus,
        newStatus,
        currentStage: this.getStageFromStatus(newStatus),
        updatedBy,
        notes,
        metadata,
        timestamp: currentTime,
        message: `Job status updated from ${oldStatus} to ${newStatus}`
      });

      return { success: true, oldStatus, newStatus };
    } catch (error) {
      console.error('Error updating job status:', error);
      throw error;
    }
  }

  // Log status change
  async logStatusChange(lifecycleId, fromStatus, toStatus, notes, changedBy, metadata = {}) {
    const historyId = uuidv4();
    const currentTime = new Date().toISOString();

    const insertQuery = `
      INSERT INTO job_lifecycle_history (
        id, job_lifecycle_id, status_from, status_to, notes,
        changed_by, changed_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    await dbAdapter.query(insertQuery, [
      historyId,
      lifecycleId,
      fromStatus,
      toStatus,
      notes,
      changedBy,
      currentTime,
      JSON.stringify(metadata)
    ]);
  }

  // Get comprehensive job lifecycle data
  async getJobLifecycle(jobCardId) {
    try {
      const lifecycleResult = await dbAdapter.query(`
        SELECT 
          jl.*,
          jc.quantity,
          jc.delivery_date,
          jc.customer_notes,
          p.product_item_code,
          p.brand as product_name,
          c.name as company_name,
          u.first_name as created_by_name,
          u.last_name as created_by_lastname
        FROM job_lifecycle jl
        JOIN job_cards jc ON jl.job_card_id = jc.job_card_id
        LEFT JOIN products p ON jc.product_id = p.id
        LEFT JOIN companies c ON jc.company_id = c.id
        LEFT JOIN users u ON jl.created_by = u.id
        WHERE jl.job_card_id = $1
      `, [jobCardId]);
      const lifecycle = lifecycleResult.rows?.[0] || null;

      if (!lifecycle) {
        return null;
      }

      // Get status history
      const historyResult = await dbAdapter.query(`
        SELECT 
          jlh.*,
          u.first_name as changed_by_name,
          u.last_name as changed_by_lastname
        FROM job_lifecycle_history jlh
        LEFT JOIN users u ON jlh.changed_by = u.id
        WHERE jlh.job_lifecycle_id = $1
        ORDER BY jlh.changed_at DESC
      `, [lifecycle.id]);
      const history = historyResult.rows;

      return {
        ...lifecycle,
        history,
        progress: this.calculateProgress(lifecycle.status)
      };
    } catch (error) {
      console.error('Error getting job lifecycle:', error);
      throw error;
    }
  }

  // Get all jobs with lifecycle data
  async getAllJobsWithLifecycle(filters = {}) {
    try {
      let whereClause = '1=1';
      const params = [];

      if (filters.status) {
        whereClause += ` AND jl.status = $${params.length + 1}`;
        params.push(filters.status);
      }

      if (filters.priority) {
        whereClause += ` AND jl.priority = $${params.length + 1}`;
        params.push(filters.priority);
      }

      const query = `
        SELECT 
          jl.*,
          jc.quantity,
          jc.delivery_date,
          p.product_item_code,
          p.brand as product_name,
          c.name as company_name,
          u.first_name as created_by_name,
          u.last_name as created_by_lastname
        FROM job_lifecycle jl
        JOIN job_cards jc ON jl.job_card_id = jc.job_card_id
        LEFT JOIN products p ON jc.product_id = p.id
        LEFT JOIN companies c ON jc.company_id = c.id
        LEFT JOIN users u ON jl.created_by = u.id
        WHERE ${whereClause}
        ORDER BY jl.updated_at DESC
      `;

      const jobsResult = await dbAdapter.query(query, params);
      const jobs = jobsResult.rows;

      return jobs.map(job => ({
        ...job,
        progress: this.calculateProgress(job.status)
      }));
    } catch (error) {
      console.error('Error getting all jobs with lifecycle:', error);
      throw error;
    }
  }

  // Calculate progress percentage
  calculateProgress(status) {
    const progressMap = {
      'CREATED': 10,
      'ASSIGNED_TO_PREPRESS': 20,
      'PREPRESS_IN_PROGRESS': 40,
      'PREPRESS_COMPLETED': 60,
      'HOD_REVIEW': 70,
      'READY_FOR_PRODUCTION': 80,
      'IN_PRODUCTION': 90,
      'COMPLETED': 100,
      'ON_HOLD': 0,
      'CANCELLED': 0
    };
    
    return progressMap[status] || 0;
  }

  // Get stage from status
  getStageFromStatus(status) {
    const stageMap = {
      'CREATED': 'job_creation',
      'ASSIGNED_TO_PREPRESS': 'prepress_assignment',
      'PREPRESS_IN_PROGRESS': 'prepress_work',
      'PREPRESS_COMPLETED': 'prepress_completion',
      'HOD_REVIEW': 'hod_review',
      'READY_FOR_PRODUCTION': 'production_ready',
      'IN_PRODUCTION': 'production_work',
      'COMPLETED': 'completed'
    };
    
    return stageMap[status] || 'unknown';
  }

  // Emit real-time lifecycle updates
  emitLifecycleUpdate(jobCardId, eventType, data) {
    if (!this.io) return;

    // Emit to all connected users
    this.io.emit('job_lifecycle_update', {
      jobCardId,
      eventType,
      data,
      timestamp: new Date().toISOString()
    });

    // Emit to specific rooms based on event type
    switch (eventType) {
      case 'JOB_CREATED':
        this.io.to('role:HEAD_OF_MERCHANDISER').emit('new_job_created', data);
        this.io.to('role:ADMIN').emit('new_job_created', data);
        break;
        
      case 'STATUS_CHANGED':
        this.io.to('role:HOD_PREPRESS').emit('job_status_changed', data);
        this.io.to('role:ADMIN').emit('job_status_changed', data);
        this.io.to('role:HEAD_OF_MERCHANDISER').emit('job_status_changed', data);
        break;
    }
  }

  // Get dashboard statistics
  async getDashboardStats() {
    try {
      const statsResult = await dbAdapter.query(`
        SELECT 
          COUNT(*) as total_jobs,
          COUNT(CASE WHEN status = 'CREATED' THEN 1 END) as created_jobs,
          COUNT(CASE WHEN status LIKE 'PREPRESS_%' THEN 1 END) as prepress_jobs,
          COUNT(CASE WHEN status = 'IN_PRODUCTION' THEN 1 END) as production_jobs,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_jobs,
          COUNT(CASE WHEN status = 'ON_HOLD' THEN 1 END) as on_hold_jobs,
          COUNT(CASE WHEN priority = 'HIGH' OR priority = 'CRITICAL' THEN 1 END) as urgent_jobs
        FROM job_lifecycle
      `);
      const stats = statsResult.rows[0];

      return stats;
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }
}

export default EnhancedJobLifecycleService;