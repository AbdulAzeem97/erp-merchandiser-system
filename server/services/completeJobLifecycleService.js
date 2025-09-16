import dbAdapter from '../database/adapter.js';
import { v4 as uuidv4 } from 'uuid';

class CompleteJobLifecycleService {
  constructor(socketHandler = null) {
    this.socketHandler = socketHandler;
  }

  setSocketHandler(socketHandler) {
    this.socketHandler = socketHandler;
  }

  // Complete Job Status Definitions
  static JOB_STATUSES = {
    CREATED: 'CREATED',
    ASSIGNED_TO_PREPRESS: 'ASSIGNED_TO_PREPRESS',
    PREPRESS_IN_PROGRESS: 'PREPRESS_IN_PROGRESS',
    PREPRESS_COMPLETED: 'PREPRESS_COMPLETED',
    ASSIGNED_TO_INVENTORY: 'ASSIGNED_TO_INVENTORY',
    INVENTORY_IN_PROGRESS: 'INVENTORY_IN_PROGRESS',
    INVENTORY_COMPLETED: 'INVENTORY_COMPLETED',
    ASSIGNED_TO_PRODUCTION: 'ASSIGNED_TO_PRODUCTION',
    PRODUCTION_IN_PROGRESS: 'PRODUCTION_IN_PROGRESS',
    PRODUCTION_COMPLETED: 'PRODUCTION_COMPLETED',
    ASSIGNED_TO_QA: 'ASSIGNED_TO_QA',
    QA_IN_PROGRESS: 'QA_IN_PROGRESS',
    QA_COMPLETED: 'QA_COMPLETED',
    ASSIGNED_TO_DISPATCH: 'ASSIGNED_TO_DISPATCH',
    DISPATCH_IN_PROGRESS: 'DISPATCH_IN_PROGRESS',
    DISPATCH_COMPLETED: 'DISPATCH_COMPLETED',
    COMPLETED: 'COMPLETED',
    ON_HOLD: 'ON_HOLD',
    CANCELLED: 'CANCELLED'
  };

  // Prepress Status Definitions
  static PREPRESS_STATUSES = {
    PENDING: 'PENDING',
    ASSIGNED: 'ASSIGNED',
    DESIGN_STARTED: 'DESIGN_STARTED',
    DESIGN_IN_PROGRESS: 'DESIGN_IN_PROGRESS',
    DESIGN_COMPLETED: 'DESIGN_COMPLETED',
    DIE_PLATE_STARTED: 'DIE_PLATE_STARTED',
    DIE_PLATE_IN_PROGRESS: 'DIE_PLATE_IN_PROGRESS',
    DIE_PLATE_COMPLETED: 'DIE_PLATE_COMPLETED',
    OTHER_STARTED: 'OTHER_STARTED',
    OTHER_IN_PROGRESS: 'OTHER_IN_PROGRESS',
    OTHER_COMPLETED: 'OTHER_COMPLETED',
    HOD_REVIEW: 'HOD_REVIEW',
    COMPLETED: 'COMPLETED',
    REJECTED: 'REJECTED'
  };

  // Inventory Status Definitions
  static INVENTORY_STATUSES = {
    PENDING: 'PENDING',
    MATERIAL_REQUEST_CREATED: 'MATERIAL_REQUEST_CREATED',
    MATERIAL_REQUEST_APPROVED: 'MATERIAL_REQUEST_APPROVED',
    MATERIAL_ISSUANCE_STARTED: 'MATERIAL_ISSUANCE_STARTED',
    MATERIAL_ISSUANCE_COMPLETED: 'MATERIAL_ISSUANCE_COMPLETED',
    MATERIAL_PROCUREMENT_STARTED: 'MATERIAL_PROCUREMENT_STARTED',
    MATERIAL_PROCUREMENT_COMPLETED: 'MATERIAL_PROCUREMENT_COMPLETED',
    COMPLETED: 'COMPLETED',
    ON_HOLD: 'ON_HOLD'
  };

  // Production Status Definitions
  static PRODUCTION_STATUSES = {
    PENDING: 'PENDING',
    ASSIGNED: 'ASSIGNED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    DELAYED: 'DELAYED',
    ON_HOLD: 'ON_HOLD',
    REJECTED: 'REJECTED'
  };

  // QA Status Definitions
  static QA_STATUSES = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    PASSED: 'PASSED',
    FAILED: 'FAILED',
    REWORK_REQUIRED: 'REWORK_REQUIRED',
    COMPLETED: 'COMPLETED'
  };

  // Dispatch Status Definitions
  static DISPATCH_STATUSES = {
    PENDING: 'PENDING',
    PACKAGING: 'PACKAGING',
    READY_FOR_DISPATCH: 'READY_FOR_DISPATCH',
    DISPATCHED: 'DISPATCHED',
    DELIVERED: 'DELIVERED',
    COMPLETED: 'COMPLETED'
  };

  // Create complete job lifecycle entry
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
        CompleteJobLifecycleService.JOB_STATUSES.CREATED,
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
        CompleteJobLifecycleService.JOB_STATUSES.CREATED,
        'Job created by merchandiser',
        createdBy
      );

      // Emit real-time update
      if (this.socketHandler) {
        this.socketHandler.emitJobLifecycleUpdate(jobCardId, 'JOB_CREATED', {
          lifecycleId,
          status: CompleteJobLifecycleService.JOB_STATUSES.CREATED,
          currentStage: 'job_creation',
          productType,
          priority,
          message: 'Job created successfully'
        });
      }

      return { id: lifecycleId, status: CompleteJobLifecycleService.JOB_STATUSES.CREATED };
    } catch (error) {
      console.error('Error creating job lifecycle:', error);
      throw error;
    }
  }

  // Update job status to Prepress
  async updateJobStatusToPrepress(jobCardId, prepressJobId, assignedDesignerId, updatedBy) {
    try {
      const currentTime = new Date().toISOString();
      
      // Update main lifecycle status
      const updateQuery = `
        UPDATE job_lifecycle 
        SET status = $1, current_stage = $2, updated_at = $3
        WHERE job_card_id = $4
      `;

      await dbAdapter.query(updateQuery, [
        CompleteJobLifecycleService.JOB_STATUSES.ASSIGNED_TO_PREPRESS,
        'prepress_assignment',
        currentTime,
        jobCardId
      ]);

      // Log status change
      await this.logStatusChange(
        null,
        jobCardId,
        CompleteJobLifecycleService.JOB_STATUSES.ASSIGNED_TO_PREPRESS,
        'Job assigned to prepress department',
        updatedBy
      );

      // Emit real-time update
      if (this.socketHandler) {
        this.socketHandler.emitJobLifecycleUpdate(jobCardId, 'STATUS_CHANGED', {
          newStatus: CompleteJobLifecycleService.JOB_STATUSES.ASSIGNED_TO_PREPRESS,
          currentStage: 'prepress_assignment',
          prepressJobId,
          assignedDesignerId,
          message: 'Job assigned to prepress'
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating job status to prepress:', error);
      throw error;
    }
  }

  // Update Prepress status
  async updatePrepressStatus(jobCardId, prepressStatus, category, updatedBy, notes = '') {
    try {
      const currentTime = new Date().toISOString();
      
      // Update prepress status in job_lifecycle
      const updateQuery = `
        UPDATE job_lifecycle 
        SET prepress_status = $1, prepress_notes = $2, updated_at = $3
        WHERE job_card_id = $4
      `;

      await dbAdapter.query(updateQuery, [
        prepressStatus,
        notes,
        currentTime,
        jobCardId
      ]);

      // Check if all prepress categories are completed
      const isPrepressCompleted = await this.checkPrepressCompletion(jobCardId);
      
      if (isPrepressCompleted) {
        // Move to inventory
        await this.updateJobStatusToInventory(jobCardId, updatedBy);
      }

      // Log status change
      await this.logStatusChange(
        null,
        jobCardId,
        prepressStatus,
        `Prepress ${category} status updated: ${prepressStatus}`,
        updatedBy
      );

      // Emit real-time update
      if (this.socketHandler) {
        this.socketHandler.emitJobLifecycleUpdate(jobCardId, 'PREPRESS_UPDATE', {
          prepressStatus,
          category,
          notes,
          isPrepressCompleted,
          message: `Prepress ${category} status updated`
        });
      }

      return { success: true, isPrepressCompleted };
    } catch (error) {
      console.error('Error updating prepress status:', error);
      throw error;
    }
  }

  // Check if all prepress categories are completed
  async checkPrepressCompletion(jobCardId) {
    try {
      // This would check the prepress_jobs table for completion status
      // For now, we'll implement a simple check
      const query = `
        SELECT prepress_status FROM job_lifecycle 
        WHERE job_card_id = $1
      `;
      
      const result = await dbAdapter.query(query, [jobCardId]);
      const job = result.rows?.[0];
      
      if (!job) return false;
      
      // Check if prepress is completed
      return job.prepress_status === CompleteJobLifecycleService.PREPRESS_STATUSES.COMPLETED;
    } catch (error) {
      console.error('Error checking prepress completion:', error);
      return false;
    }
  }

  // Update job status to Inventory
  async updateJobStatusToInventory(jobCardId, updatedBy) {
    try {
      const currentTime = new Date().toISOString();
      
      // Update main lifecycle status
      const updateQuery = `
        UPDATE job_lifecycle 
        SET status = $1, current_stage = $2, updated_at = $3
        WHERE job_card_id = $4
      `;

      await dbAdapter.query(updateQuery, [
        CompleteJobLifecycleService.JOB_STATUSES.ASSIGNED_TO_INVENTORY,
        'inventory_assignment',
        currentTime,
        jobCardId
      ]);

      // Log status change
      await this.logStatusChange(
        null,
        jobCardId,
        CompleteJobLifecycleService.JOB_STATUSES.ASSIGNED_TO_INVENTORY,
        'Job moved to inventory department',
        updatedBy
      );

      // Emit real-time update
      if (this.socketHandler) {
        this.socketHandler.emitJobLifecycleUpdate(jobCardId, 'STATUS_CHANGED', {
          newStatus: CompleteJobLifecycleService.JOB_STATUSES.ASSIGNED_TO_INVENTORY,
          currentStage: 'inventory_assignment',
          message: 'Job moved to inventory'
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating job status to inventory:', error);
      throw error;
    }
  }

  // Update Inventory status
  async updateInventoryStatus(jobCardId, inventoryStatus, updatedBy, notes = '') {
    try {
      const currentTime = new Date().toISOString();
      
      // Update inventory status in job_lifecycle
      const updateQuery = `
        UPDATE job_lifecycle 
        SET inventory_status = $1, inventory_notes = $2, updated_at = $3
        WHERE job_card_id = $4
      `;

      await dbAdapter.query(updateQuery, [
        inventoryStatus,
        notes,
        currentTime,
        jobCardId
      ]);

      // Check if inventory is completed
      if (inventoryStatus === CompleteJobLifecycleService.INVENTORY_STATUSES.COMPLETED) {
        // Move to production
        await this.updateJobStatusToProduction(jobCardId, updatedBy);
      }

      // Log status change
      await this.logStatusChange(
        null,
        jobCardId,
        inventoryStatus,
        `Inventory status updated: ${inventoryStatus}`,
        updatedBy
      );

      // Emit real-time update
      if (this.socketHandler) {
        this.socketHandler.emitJobLifecycleUpdate(jobCardId, 'INVENTORY_UPDATE', {
          inventoryStatus,
          notes,
          message: `Inventory status updated`
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating inventory status:', error);
      throw error;
    }
  }

  // Update job status to Production
  async updateJobStatusToProduction(jobCardId, updatedBy) {
    try {
      const currentTime = new Date().toISOString();
      
      // Update main lifecycle status
      const updateQuery = `
        UPDATE job_lifecycle 
        SET status = $1, current_stage = $2, updated_at = $3
        WHERE job_card_id = $4
      `;

      await dbAdapter.query(updateQuery, [
        CompleteJobLifecycleService.JOB_STATUSES.ASSIGNED_TO_PRODUCTION,
        'production_assignment',
        currentTime,
        jobCardId
      ]);

      // Log status change
      await this.logStatusChange(
        null,
        jobCardId,
        CompleteJobLifecycleService.JOB_STATUSES.ASSIGNED_TO_PRODUCTION,
        'Job moved to production department',
        updatedBy
      );

      // Emit real-time update
      if (this.socketHandler) {
        this.socketHandler.emitJobLifecycleUpdate(jobCardId, 'STATUS_CHANGED', {
          newStatus: CompleteJobLifecycleService.JOB_STATUSES.ASSIGNED_TO_PRODUCTION,
          currentStage: 'production_assignment',
          message: 'Job moved to production'
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating job status to production:', error);
      throw error;
    }
  }

  // Update Production status
  async updateProductionStatus(jobCardId, productionStatus, departmentId, processId, updatedBy, notes = '') {
    try {
      const currentTime = new Date().toISOString();
      
      // Update production status in job_lifecycle
      const updateQuery = `
        UPDATE job_lifecycle 
        SET production_status = $1, production_notes = $2, current_department_id = $3, 
            current_process_id = $4, updated_at = $5
        WHERE job_card_id = $6
      `;

      await dbAdapter.query(updateQuery, [
        productionStatus,
        notes,
        departmentId,
        processId,
        currentTime,
        jobCardId
      ]);

      // Check if production is completed
      if (productionStatus === CompleteJobLifecycleService.PRODUCTION_STATUSES.COMPLETED) {
        // Move to QA
        await this.updateJobStatusToQA(jobCardId, updatedBy);
      }

      // Log status change
      await this.logStatusChange(
        null,
        jobCardId,
        productionStatus,
        `Production status updated: ${productionStatus}`,
        updatedBy
      );

      // Emit real-time update
      if (this.socketHandler) {
        this.socketHandler.emitJobLifecycleUpdate(jobCardId, 'PRODUCTION_UPDATE', {
          productionStatus,
          departmentId,
          processId,
          notes,
          message: `Production status updated`
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating production status:', error);
      throw error;
    }
  }

  // Update job status to QA
  async updateJobStatusToQA(jobCardId, updatedBy) {
    try {
      const currentTime = new Date().toISOString();
      
      // Update main lifecycle status
      const updateQuery = `
        UPDATE job_lifecycle 
        SET status = $1, current_stage = $2, updated_at = $3
        WHERE job_card_id = $4
      `;

      await dbAdapter.query(updateQuery, [
        CompleteJobLifecycleService.JOB_STATUSES.ASSIGNED_TO_QA,
        'qa_assignment',
        currentTime,
        jobCardId
      ]);

      // Log status change
      await this.logStatusChange(
        null,
        jobCardId,
        CompleteJobLifecycleService.JOB_STATUSES.ASSIGNED_TO_QA,
        'Job moved to QA department',
        updatedBy
      );

      // Emit real-time update
      if (this.socketHandler) {
        this.socketHandler.emitJobLifecycleUpdate(jobCardId, 'STATUS_CHANGED', {
          newStatus: CompleteJobLifecycleService.JOB_STATUSES.ASSIGNED_TO_QA,
          currentStage: 'qa_assignment',
          message: 'Job moved to QA'
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating job status to QA:', error);
      throw error;
    }
  }

  // Update QA status
  async updateQAStatus(jobCardId, qaStatus, updatedBy, notes = '') {
    try {
      const currentTime = new Date().toISOString();
      
      // Update QA status in job_lifecycle
      const updateQuery = `
        UPDATE job_lifecycle 
        SET qa_status = $1, qa_notes = $2, updated_at = $3
        WHERE job_card_id = $4
      `;

      await dbAdapter.query(updateQuery, [
        qaStatus,
        notes,
        currentTime,
        jobCardId
      ]);

      // Check if QA is completed
      if (qaStatus === CompleteJobLifecycleService.QA_STATUSES.COMPLETED) {
        // Move to dispatch
        await this.updateJobStatusToDispatch(jobCardId, updatedBy);
      }

      // Log status change
      await this.logStatusChange(
        null,
        jobCardId,
        qaStatus,
        `QA status updated: ${qaStatus}`,
        updatedBy
      );

      // Emit real-time update
      if (this.socketHandler) {
        this.socketHandler.emitJobLifecycleUpdate(jobCardId, 'QA_UPDATE', {
          qaStatus,
          notes,
          message: `QA status updated`
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating QA status:', error);
      throw error;
    }
  }

  // Update job status to Dispatch
  async updateJobStatusToDispatch(jobCardId, updatedBy) {
    try {
      const currentTime = new Date().toISOString();
      
      // Update main lifecycle status
      const updateQuery = `
        UPDATE job_lifecycle 
        SET status = $1, current_stage = $2, updated_at = $3
        WHERE job_card_id = $4
      `;

      await dbAdapter.query(updateQuery, [
        CompleteJobLifecycleService.JOB_STATUSES.ASSIGNED_TO_DISPATCH,
        'dispatch_assignment',
        currentTime,
        jobCardId
      ]);

      // Log status change
      await this.logStatusChange(
        null,
        jobCardId,
        CompleteJobLifecycleService.JOB_STATUSES.ASSIGNED_TO_DISPATCH,
        'Job moved to dispatch department',
        updatedBy
      );

      // Emit real-time update
      if (this.socketHandler) {
        this.socketHandler.emitJobLifecycleUpdate(jobCardId, 'STATUS_CHANGED', {
          newStatus: CompleteJobLifecycleService.JOB_STATUSES.ASSIGNED_TO_DISPATCH,
          currentStage: 'dispatch_assignment',
          message: 'Job moved to dispatch'
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating job status to dispatch:', error);
      throw error;
    }
  }

  // Update Dispatch status
  async updateDispatchStatus(jobCardId, dispatchStatus, updatedBy, notes = '') {
    try {
      const currentTime = new Date().toISOString();
      
      // Update dispatch status in job_lifecycle
      const updateQuery = `
        UPDATE job_lifecycle 
        SET dispatch_status = $1, dispatch_notes = $2, updated_at = $3
        WHERE job_card_id = $4
      `;

      await dbAdapter.query(updateQuery, [
        dispatchStatus,
        notes,
        currentTime,
        jobCardId
      ]);

      // Check if dispatch is completed
      if (dispatchStatus === CompleteJobLifecycleService.DISPATCH_STATUSES.COMPLETED) {
        // Mark job as completed
        await this.completeJob(jobCardId, updatedBy);
      }

      // Log status change
      await this.logStatusChange(
        null,
        jobCardId,
        dispatchStatus,
        `Dispatch status updated: ${dispatchStatus}`,
        updatedBy
      );

      // Emit real-time update
      if (this.socketHandler) {
        this.socketHandler.emitJobLifecycleUpdate(jobCardId, 'DISPATCH_UPDATE', {
          dispatchStatus,
          notes,
          message: `Dispatch status updated`
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating dispatch status:', error);
      throw error;
    }
  }

  // Complete job
  async completeJob(jobCardId, updatedBy) {
    try {
      const currentTime = new Date().toISOString();
      
      // Update main lifecycle status
      const updateQuery = `
        UPDATE job_lifecycle 
        SET status = $1, current_stage = $2, updated_at = $3
        WHERE job_card_id = $4
      `;

      await dbAdapter.query(updateQuery, [
        CompleteJobLifecycleService.JOB_STATUSES.COMPLETED,
        'job_completed',
        currentTime,
        jobCardId
      ]);

      // Log status change
      await this.logStatusChange(
        null,
        jobCardId,
        CompleteJobLifecycleService.JOB_STATUSES.COMPLETED,
        'Job completed successfully',
        updatedBy
      );

      // Emit real-time update
      if (this.socketHandler) {
        this.socketHandler.emitJobLifecycleUpdate(jobCardId, 'JOB_COMPLETED', {
          newStatus: CompleteJobLifecycleService.JOB_STATUSES.COMPLETED,
          currentStage: 'job_completed',
          message: 'Job completed successfully'
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error completing job:', error);
      throw error;
    }
  }

  // Log status change
  async logStatusChange(lifecycleId, jobCardId, status, message, changedBy) {
    try {
      const historyId = uuidv4();
      const currentTime = new Date().toISOString();
      
      // If lifecycleId is not provided, get it from jobCardId
      if (!lifecycleId && jobCardId) {
        const query = `SELECT id FROM job_lifecycle WHERE job_card_id = $1`;
        const result = await dbAdapter.query(query, [jobCardId]);
        lifecycleId = result.rows?.[0]?.id;
      }

      if (!lifecycleId) return;

      const insertQuery = `
        INSERT INTO job_lifecycle_history (
          id, job_lifecycle_id, status, message, changed_by, changed_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;

      await dbAdapter.query(insertQuery, [
        historyId,
        lifecycleId,
        status,
        message,
        changedBy,
        currentTime
      ]);

      return { success: true };
    } catch (error) {
      console.error('Error logging status change:', error);
      // Don't throw error for logging failures
    }
  }

  // Get job lifecycle data
  async getJobLifecycle(jobCardId) {
    try {
      const query = `
        SELECT jl.*, jc.job_card_id as job_card_id_display, jc.product_id, 
               jc.quantity, jc.delivery_date, jc.priority as job_priority,
               c.name as company_name, u.first_name || ' ' || u.last_name as creator_name
        FROM job_lifecycle jl
        JOIN job_cards jc ON jl.job_card_id = jc.id
        JOIN companies c ON jc.company_id = c.id
        JOIN users u ON jl.created_by::uuid = u.id
        WHERE jl.job_card_id = $1
      `;

      const result = await dbAdapter.query(query, [jobCardId]);
      return result.rows?.[0] || null;
    } catch (error) {
      console.error('Error getting job lifecycle:', error);
      throw error;
    }
  }

  // Get all job lifecycles with filters
  async getAllJobLifecycles(filters = {}) {
    try {
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 0;

      if (filters.status) {
        paramCount++;
        whereClause += ` AND jl.status = $${paramCount}`;
        params.push(filters.status);
      }

      if (filters.priority) {
        paramCount++;
        whereClause += ` AND jc.priority = $${paramCount}`;
        params.push(filters.priority);
      }

      if (filters.department) {
        paramCount++;
        whereClause += ` AND jl.current_department_id = $${paramCount}`;
        params.push(filters.department);
      }

      const query = `
        SELECT jl.*, jc.job_card_id as job_card_id_display, jc.product_item_code, 
               jc.brand, jc.quantity, jc.delivery_date, jc.priority as job_priority,
               c.name as company_name, u.first_name || ' ' || u.last_name as creator_name
        FROM job_lifecycle jl
        JOIN job_cards jc ON jl.job_card_id = jc.id
        JOIN companies c ON jc.company_id = c.id
        JOIN users u ON jl.created_by = u.id
        ${whereClause}
        ORDER BY jl.updated_at DESC
      `;

      const result = await dbAdapter.query(query, params);
      return result.rows || [];
    } catch (error) {
      console.error('Error getting all job lifecycles:', error);
      throw error;
    }
  }

  // Get dashboard statistics
  async getDashboardStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_jobs,
          COUNT(CASE WHEN status = 'CREATED' THEN 1 END) as created_jobs,
          COUNT(CASE WHEN status LIKE '%PREPRESS%' THEN 1 END) as prepress_jobs,
          COUNT(CASE WHEN status LIKE '%INVENTORY%' THEN 1 END) as inventory_jobs,
          COUNT(CASE WHEN status LIKE '%PRODUCTION%' THEN 1 END) as production_jobs,
          COUNT(CASE WHEN status LIKE '%QA%' THEN 1 END) as qa_jobs,
          COUNT(CASE WHEN status LIKE '%DISPATCH%' THEN 1 END) as dispatch_jobs,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_jobs,
          COUNT(CASE WHEN status = 'ON_HOLD' THEN 1 END) as on_hold_jobs,
          COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_jobs
        FROM job_lifecycle
      `;

      const result = await dbAdapter.query(query);
      return result.rows?.[0] || {};
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }
}

export default CompleteJobLifecycleService;
