import dbAdapter from '../database/adapter.js';
import { v4 as uuidv4 } from 'uuid';

class EnhancedPrepressService {
  constructor(socketHandler = null) {
    this.socketHandler = socketHandler;
  }

  setSocketHandler(socketHandler) {
    this.socketHandler = socketHandler;
  }

  // Prepress Categories
  static PREPRESS_CATEGORIES = {
    DESIGN: 'DESIGN',
    DIE_PLATE: 'DIE_PLATE',
    OTHER: 'OTHER'
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

  // Create prepress job with categories
  async createPrepressJob(jobCardId, assignedDesignerId = null, priority = 'MEDIUM', dueDate = null, createdBy) {
    try {
      const prepressJobId = uuidv4();
      const currentTime = new Date().toISOString();

      // Create prepress job entry
      const insertQuery = `
        INSERT INTO prepress_jobs (
          id, job_card_id, assigned_designer_id, priority, due_date, status,
          design_status, die_plate_status, other_status, created_by, created_at, updated_at, assigned_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `;

      await dbAdapter.query(insertQuery, [
        prepressJobId,
        jobCardId,
        assignedDesignerId,
        priority,
        dueDate,
        EnhancedPrepressService.PREPRESS_STATUSES.PENDING,
        EnhancedPrepressService.PREPRESS_STATUSES.PENDING,
        EnhancedPrepressService.PREPRESS_STATUSES.PENDING,
        EnhancedPrepressService.PREPRESS_STATUSES.PENDING,
        EnhancedPrepressService.PREPRESS_STATUSES.PENDING,
        createdBy,
        currentTime,
        currentTime,
        assignedDesignerId ? currentTime : null
      ]);

      // Log activity
      await this.logPrepressActivity(
        prepressJobId,
        'JOB_CREATED',
        'Prepress job created',
        createdBy
      );

      // Emit real-time update
      if (this.socketHandler) {
        this.socketHandler.emitPrepressUpdate(jobCardId, 'PREPRESS_JOB_CREATED', {
          prepressJobId,
          status: EnhancedPrepressService.PREPRESS_STATUSES.PENDING,
          assignedDesignerId,
          priority,
          dueDate,
          message: 'Prepress job created successfully'
        });
      }

      return {
        id: prepressJobId,
        status: EnhancedPrepressService.PREPRESS_STATUSES.PENDING,
        categories: {
          design: EnhancedPrepressService.PREPRESS_STATUSES.PENDING,
          diePlate: EnhancedPrepressService.PREPRESS_STATUSES.PENDING,
          other: EnhancedPrepressService.PREPRESS_STATUSES.PENDING
        }
      };
    } catch (error) {
      console.error('Error creating prepress job:', error);
      throw error;
    }
  }

  // Assign designer to prepress job
  async assignDesigner(prepressJobId, designerId, updatedBy) {
    try {
      const currentTime = new Date().toISOString();

      const updateQuery = `
        UPDATE prepress_jobs 
        SET assigned_designer_id = $1, status = $2, assigned_at = $3, updated_at = $3
        WHERE id = $4
      `;

      await dbAdapter.query(updateQuery, [
        designerId,
        EnhancedPrepressService.PREPRESS_STATUSES.ASSIGNED,
        currentTime,
        prepressJobId
      ]);

      // Log activity
      await this.logPrepressActivity(
        prepressJobId,
        'DESIGNER_ASSIGNED',
        'Designer assigned to job',
        updatedBy,
        { designerId }
      );

      // Emit real-time update
      if (this.socketHandler) {
        const jobCardId = await this.getJobCardId(prepressJobId);
        this.socketHandler.emitPrepressUpdate(jobCardId, 'DESIGNER_ASSIGNED', {
          prepressJobId,
          assignedDesignerId: designerId,
          status: EnhancedPrepressService.PREPRESS_STATUSES.ASSIGNED,
          assignedAt: currentTime,
          message: 'Designer assigned to job'
        });
      }

      return this.getPrepressJob(prepressJobId);
    } catch (error) {
      console.error('Error assigning designer:', error);
      throw error;
    }
  }

  // Update prepress category status
  async updateCategoryStatus(prepressJobId, category, status, updatedBy, notes = '') {
    try {
      const currentTime = new Date().toISOString();

      // Validate category
      if (!Object.values(EnhancedPrepressService.PREPRESS_CATEGORIES).includes(category)) {
        throw new Error('Invalid prepress category');
      }

      // Validate status transition
      const isValidTransition = this.validateStatusTransition(category, status);
      if (!isValidTransition) {
        throw new Error(`Invalid status transition for ${category}: ${status}`);
      }

      // Update the specific category status
      let updateQuery = '';
      let statusColumn = '';

      switch (category) {
        case EnhancedPrepressService.PREPRESS_CATEGORIES.DESIGN:
          statusColumn = 'design_status';
          break;
        case EnhancedPrepressService.PREPRESS_CATEGORIES.DIE_PLATE:
          statusColumn = 'die_plate_status';
          break;
        case EnhancedPrepressService.PREPRESS_CATEGORIES.OTHER:
          statusColumn = 'other_status';
          break;
      }

      updateQuery = `
        UPDATE prepress_jobs 
        SET ${statusColumn} = $1, updated_at = $2
        WHERE id = $3
      `;

      await dbAdapter.query(updateQuery, [status, currentTime, prepressJobId]);

      // Update notes if provided
      if (notes) {
        let notesColumn = '';
        switch (category) {
          case EnhancedPrepressService.PREPRESS_CATEGORIES.DESIGN:
            notesColumn = 'design_notes';
            break;
          case EnhancedPrepressService.PREPRESS_CATEGORIES.DIE_PLATE:
            notesColumn = 'die_plate_notes';
            break;
          case EnhancedPrepressService.PREPRESS_CATEGORIES.OTHER:
            notesColumn = 'other_notes';
            break;
        }

        const notesQuery = `
          UPDATE prepress_jobs 
          SET ${notesColumn} = $1, updated_at = $2
          WHERE id = $3
        `;
        await dbAdapter.query(notesQuery, [notes, currentTime, prepressJobId]);
      }

      // Check if all categories are completed
      const isCompleted = await this.checkAllCategoriesCompleted(prepressJobId);

      if (isCompleted) {
        // Update overall status to HOD_REVIEW
        await this.updateOverallStatus(prepressJobId, EnhancedPrepressService.PREPRESS_STATUSES.HOD_REVIEW, updatedBy);
      }

      // Log activity
      await this.logPrepressActivity(
        prepressJobId,
        'CATEGORY_STATUS_UPDATED',
        `${category} status updated to ${status}`,
        updatedBy,
        { category, status, notes }
      );

      // Emit real-time update
      if (this.socketHandler) {
        const jobCardId = await this.getJobCardId(prepressJobId);
        this.socketHandler.emitPrepressUpdate(jobCardId, 'CATEGORY_STATUS_UPDATED', {
          prepressJobId,
          category,
          status,
          notes,
          isCompleted,
          message: `${category} status updated to ${status}`
        });
      }

      return { success: true, isCompleted };
    } catch (error) {
      console.error('Error updating category status:', error);
      throw error;
    }
  }

  // Update overall prepress status
  async updateOverallStatus(prepressJobId, status, updatedBy, notes = '') {
    try {
      const currentTime = new Date().toISOString();

      const updateQuery = `
        UPDATE prepress_jobs 
        SET status = $1, updated_at = $2
        WHERE id = $3
      `;

      await dbAdapter.query(updateQuery, [status, currentTime, prepressJobId]);

      // Log activity
      await this.logPrepressActivity(
        prepressJobId,
        'OVERALL_STATUS_UPDATED',
        `Overall status updated to ${status}`,
        updatedBy,
        { status, notes }
      );

      // Emit real-time update
      if (this.socketHandler) {
        const jobCardId = await this.getJobCardId(prepressJobId);
        this.socketHandler.emitPrepressUpdate(jobCardId, 'OVERALL_STATUS_UPDATED', {
          prepressJobId,
          status,
          notes,
          message: `Overall status updated to ${status}`
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating overall status:', error);
      throw error;
    }
  }

  // Check if all categories are completed
  async checkAllCategoriesCompleted(prepressJobId) {
    try {
      const query = `
        SELECT design_status, die_plate_status, other_status
        FROM prepress_jobs 
        WHERE id = $1
      `;

      const result = await dbAdapter.query(query, [prepressJobId]);
      const job = result.rows?.[0];

      if (!job) return false;

      const designCompleted = job.design_status === EnhancedPrepressService.PREPRESS_STATUSES.DESIGN_COMPLETED;
      const diePlateCompleted = job.die_plate_status === EnhancedPrepressService.PREPRESS_STATUSES.DIE_PLATE_COMPLETED;
      const otherCompleted = job.other_status === EnhancedPrepressService.PREPRESS_STATUSES.OTHER_COMPLETED;

      // At least design and die_plate must be completed, other is optional
      return designCompleted && diePlateCompleted;
    } catch (error) {
      console.error('Error checking category completion:', error);
      return false;
    }
  }

  // Validate status transition
  validateStatusTransition(category, newStatus) {
    const validTransitions = {
      [EnhancedPrepressService.PREPRESS_CATEGORIES.DESIGN]: [
        EnhancedPrepressService.PREPRESS_STATUSES.PENDING,
        EnhancedPrepressService.PREPRESS_STATUSES.DESIGN_STARTED,
        EnhancedPrepressService.PREPRESS_STATUSES.DESIGN_IN_PROGRESS,
        EnhancedPrepressService.PREPRESS_STATUSES.DESIGN_COMPLETED
      ],
      [EnhancedPrepressService.PREPRESS_CATEGORIES.DIE_PLATE]: [
        EnhancedPrepressService.PREPRESS_STATUSES.PENDING,
        EnhancedPrepressService.PREPRESS_STATUSES.DIE_PLATE_STARTED,
        EnhancedPrepressService.PREPRESS_STATUSES.DIE_PLATE_IN_PROGRESS,
        EnhancedPrepressService.PREPRESS_STATUSES.DIE_PLATE_COMPLETED
      ],
      [EnhancedPrepressService.PREPRESS_CATEGORIES.OTHER]: [
        EnhancedPrepressService.PREPRESS_STATUSES.PENDING,
        EnhancedPrepressService.PREPRESS_STATUSES.OTHER_STARTED,
        EnhancedPrepressService.PREPRESS_STATUSES.OTHER_IN_PROGRESS,
        EnhancedPrepressService.PREPRESS_STATUSES.OTHER_COMPLETED
      ]
    };

    return validTransitions[category]?.includes(newStatus) || false;
  }

  // Get job card ID from prepress job ID
  async getJobCardId(prepressJobId) {
    try {
      const query = 'SELECT job_card_id FROM prepress_jobs WHERE id = $1';
      const result = await dbAdapter.query(query, [prepressJobId]);
      return result.rows?.[0]?.job_card_id;
    } catch (error) {
      console.error('Error getting job card ID:', error);
      return null;
    }
  }

  // Get prepress job details
  async getPrepressJob(prepressJobId) {
    try {
      const query = `
        SELECT pj.*, pj.assigned_at, jc.job_card_id as job_card_id_display, jc."jobNumber" as job_card_number,
               jc.product_item_code,
               jc.brand, jc.quantity, jc.delivery_date, jc.priority as job_priority,
               jc."createdAt" as job_created_at,
               c.name as company_name, 
               u.first_name || ' ' || u.last_name as designer_name,
               u_merchandiser.first_name as merchandiser_first_name,
               u_merchandiser.last_name as merchandiser_last_name
        FROM prepress_jobs pj
        JOIN job_cards jc ON pj.job_card_id = jc.id
        JOIN companies c ON jc.company_id = c.id
        LEFT JOIN users u ON pj.assigned_designer_id = u.id
        LEFT JOIN users u_merchandiser ON jc."createdById" = u_merchandiser.id
        WHERE pj.id = $1
      `;

      const result = await dbAdapter.query(query, [prepressJobId]);
      return result.rows?.[0] || null;
    } catch (error) {
      console.error('Error getting prepress job:', error);
      throw error;
    }
  }

  // Get all prepress jobs with filters
  async getAllPrepressJobs(filters = {}) {
    try {
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 0;

      if (filters.status) {
        paramCount++;
        whereClause += ` AND pj.status = $${paramCount}`;
        params.push(filters.status);
      }

      if (filters.priority) {
        paramCount++;
        whereClause += ` AND pj.priority = $${paramCount}`;
        params.push(filters.priority);
      }

      if (filters.designerId) {
        paramCount++;
        whereClause += ` AND pj.assigned_designer_id = $${paramCount}`;
        params.push(filters.designerId);
      }

      const query = `
        SELECT pj.*, pj.assigned_at, jc.job_card_id as job_card_id_display, jc."jobNumber" as job_card_number,
               jc.product_item_code,
               jc.brand, jc.quantity, jc.delivery_date, jc.priority as job_priority,
               jc."createdAt" as job_created_at,
               c.name as company_name, 
               u.first_name || ' ' || u.last_name as designer_name,
               u_merchandiser.first_name as merchandiser_first_name,
               u_merchandiser.last_name as merchandiser_last_name
        FROM prepress_jobs pj
        JOIN job_cards jc ON pj.job_card_id = jc.id
        JOIN companies c ON jc.company_id = c.id
        LEFT JOIN users u ON pj.assigned_designer_id = u.id
        LEFT JOIN users u_merchandiser ON jc."createdById" = u_merchandiser.id
        ${whereClause}
        ORDER BY pj.updated_at DESC
      `;

      const result = await dbAdapter.query(query, params);
      return result.rows || [];
    } catch (error) {
      console.error('Error getting all prepress jobs:', error);
      throw error;
    }
  }

  // Log prepress activity
  async logPrepressActivity(prepressJobId, activityType, description, userId, metadata = {}) {
    try {
      const activityId = uuidv4();
      const currentTime = new Date().toISOString();

      const insertQuery = `
        INSERT INTO prepress_activities (
          id, prepress_job_id, activity_type, description, metadata, user_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;

      await dbAdapter.query(insertQuery, [
        activityId,
        prepressJobId,
        activityType,
        description,
        JSON.stringify(metadata),
        userId,
        currentTime
      ]);

      return { success: true };
    } catch (error) {
      console.error('Error logging prepress activity:', error);
      // Don't throw error for logging failures
    }
  }

  // Get prepress statistics
  async getPrepressStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_jobs,
          COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_jobs,
          COUNT(CASE WHEN status = 'ASSIGNED' THEN 1 END) as assigned_jobs,
          COUNT(CASE WHEN status = 'HOD_REVIEW' THEN 1 END) as hod_review_jobs,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_jobs,
          COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected_jobs,
          COUNT(CASE WHEN design_status = 'DESIGN_COMPLETED' THEN 1 END) as design_completed,
          COUNT(CASE WHEN die_plate_status = 'DIE_PLATE_COMPLETED' THEN 1 END) as die_plate_completed,
          COUNT(CASE WHEN other_status = 'OTHER_COMPLETED' THEN 1 END) as other_completed
        FROM prepress_jobs
      `;

      const result = await dbAdapter.query(query);
      return result.rows?.[0] || {};
    } catch (error) {
      console.error('Error getting prepress stats:', error);
      throw error;
    }
  }
}

export default EnhancedPrepressService;