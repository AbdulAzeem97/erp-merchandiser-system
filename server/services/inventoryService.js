import dbAdapter from '../database/adapter.js';
import { v4 as uuidv4 } from 'uuid';

class InventoryService {
  constructor(socketHandler = null) {
    this.socketHandler = socketHandler;
  }

  setSocketHandler(socketHandler) {
    this.socketHandler = socketHandler;
  }

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

  // Create inventory job
  async createInventoryJob(jobCardId, assignedTo = null, priority = 'MEDIUM', dueDate = null, createdBy) {
    try {
      const inventoryJobId = uuidv4();
      const currentTime = new Date().toISOString();
      
      // Create inventory job entry
      const insertQuery = `
        INSERT INTO inventory_jobs (
          id, job_card_id, assigned_to, priority, due_date, status,
          material_request_status, material_issuance_status, material_procurement_status,
          created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `;

      await dbAdapter.query(insertQuery, [
        inventoryJobId,
        jobCardId,
        assignedTo,
        priority,
        dueDate,
        InventoryService.INVENTORY_STATUSES.PENDING,
        InventoryService.INVENTORY_STATUSES.PENDING,
        InventoryService.INVENTORY_STATUSES.PENDING,
        InventoryService.INVENTORY_STATUSES.PENDING,
        createdBy,
        currentTime,
        currentTime
      ]);

      // Log activity
      await this.logInventoryActivity(
        inventoryJobId,
        'JOB_CREATED',
        'Inventory job created',
        createdBy
      );

      // Emit real-time update
      if (this.socketHandler) {
        this.socketHandler.emitInventoryUpdate(jobCardId, 'INVENTORY_JOB_CREATED', {
          inventoryJobId,
          status: InventoryService.INVENTORY_STATUSES.PENDING,
          assignedTo,
          priority,
          dueDate,
          message: 'Inventory job created successfully'
        });
      }

      return { 
        id: inventoryJobId, 
        status: InventoryService.INVENTORY_STATUSES.PENDING
      };
    } catch (error) {
      console.error('Error creating inventory job:', error);
      throw error;
    }
  }

  // Create material request
  async createMaterialRequest(inventoryJobId, materialId, quantityRequested, unit, requestedBy, notes = '') {
    try {
      const requestId = uuidv4();
      const currentTime = new Date().toISOString();
      
      // Get material details
      const materialQuery = 'SELECT name, code FROM materials WHERE id = $1';
      const materialResult = await dbAdapter.query(materialQuery, [materialId]);
      const material = materialResult.rows?.[0];
      
      if (!material) {
        throw new Error('Material not found');
      }

      // Create material request
      const insertQuery = `
        INSERT INTO material_requests (
          id, inventory_job_id, material_id, material_name, material_code,
          quantity_requested, unit, status, requested_by, requested_at, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;

      await dbAdapter.query(insertQuery, [
        requestId,
        inventoryJobId,
        materialId,
        material.name,
        material.code,
        quantityRequested,
        unit,
        InventoryService.INVENTORY_STATUSES.PENDING,
        requestedBy,
        currentTime,
        notes
      ]);

      // Update inventory job status
      await this.updateInventoryJobStatus(
        inventoryJobId,
        InventoryService.INVENTORY_STATUSES.MATERIAL_REQUEST_CREATED,
        requestedBy,
        'Material request created'
      );

      // Log activity
      await this.logInventoryActivity(
        inventoryJobId,
        'MATERIAL_REQUEST_CREATED',
        `Material request created for ${material.name}`,
        requestedBy,
        { materialId, quantityRequested, unit, requestId }
      );

      // Emit real-time update
      if (this.socketHandler) {
        const jobCardId = await this.getJobCardId(inventoryJobId);
        this.socketHandler.emitInventoryUpdate(jobCardId, 'MATERIAL_REQUEST_CREATED', {
          inventoryJobId,
          requestId,
          materialName: material.name,
          quantityRequested,
          unit,
          message: `Material request created for ${material.name}`
        });
      }

      return { 
        id: requestId, 
        status: InventoryService.INVENTORY_STATUSES.PENDING,
        materialName: material.name,
        materialCode: material.code
      };
    } catch (error) {
      console.error('Error creating material request:', error);
      throw error;
    }
  }

  // Approve material request
  async approveMaterialRequest(requestId, approvedBy, approvedQuantity = null, notes = '') {
    try {
      const currentTime = new Date().toISOString();
      
      // Get request details
      const requestQuery = 'SELECT * FROM material_requests WHERE id = $1';
      const requestResult = await dbAdapter.query(requestQuery, [requestId]);
      const request = requestResult.rows?.[0];
      
      if (!request) {
        throw new Error('Material request not found');
      }

      const quantityToApprove = approvedQuantity || request.quantity_requested;

      // Update request status
      const updateQuery = `
        UPDATE material_requests 
        SET status = $1, quantity_approved = $2, approved_by = $3, approved_at = $4
        WHERE id = $5
      `;

      await dbAdapter.query(updateQuery, [
        InventoryService.INVENTORY_STATUSES.MATERIAL_REQUEST_APPROVED,
        quantityToApprove,
        approvedBy,
        currentTime,
        requestId
      ]);

      // Update inventory job status
      await this.updateInventoryJobStatus(
        request.inventory_job_id,
        InventoryService.INVENTORY_STATUSES.MATERIAL_REQUEST_APPROVED,
        approvedBy,
        'Material request approved'
      );

      // Log activity
      await this.logInventoryActivity(
        request.inventory_job_id,
        'MATERIAL_REQUEST_APPROVED',
        `Material request approved for ${request.material_name}`,
        approvedBy,
        { requestId, approvedQuantity: quantityToApprove, notes }
      );

      // Emit real-time update
      if (this.socketHandler) {
        const jobCardId = await this.getJobCardId(request.inventory_job_id);
        this.socketHandler.emitInventoryUpdate(jobCardId, 'MATERIAL_REQUEST_APPROVED', {
          inventoryJobId: request.inventory_job_id,
          requestId,
          materialName: request.material_name,
          approvedQuantity: quantityToApprove,
          message: `Material request approved for ${request.material_name}`
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error approving material request:', error);
      throw error;
    }
  }

  // Issue materials
  async issueMaterials(requestId, issuedQuantity, issuedBy, notes = '') {
    try {
      const currentTime = new Date().toISOString();
      
      // Get request details
      const requestQuery = 'SELECT * FROM material_requests WHERE id = $1';
      const requestResult = await dbAdapter.query(requestQuery, [requestId]);
      const request = requestResult.rows?.[0];
      
      if (!request) {
        throw new Error('Material request not found');
      }

      // Update request with issued quantity
      const updateQuery = `
        UPDATE material_requests 
        SET quantity_issued = $1, issued_by = $2, issued_at = $3, status = $4
        WHERE id = $5
      `;

      await dbAdapter.query(updateQuery, [
        issuedQuantity,
        issuedBy,
        currentTime,
        InventoryService.INVENTORY_STATUSES.MATERIAL_ISSUANCE_COMPLETED,
        requestId
      ]);

      // Update inventory job status
      await this.updateInventoryJobStatus(
        request.inventory_job_id,
        InventoryService.INVENTORY_STATUSES.MATERIAL_ISSUANCE_COMPLETED,
        issuedBy,
        'Materials issued'
      );

      // Log activity
      await this.logInventoryActivity(
        request.inventory_job_id,
        'MATERIALS_ISSUED',
        `Materials issued for ${request.material_name}`,
        issuedBy,
        { requestId, issuedQuantity, notes }
      );

      // Emit real-time update
      if (this.socketHandler) {
        const jobCardId = await this.getJobCardId(request.inventory_job_id);
        this.socketHandler.emitInventoryUpdate(jobCardId, 'MATERIALS_ISSUED', {
          inventoryJobId: request.inventory_job_id,
          requestId,
          materialName: request.material_name,
          issuedQuantity,
          message: `Materials issued for ${request.material_name}`
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error issuing materials:', error);
      throw error;
    }
  }

  // Start material procurement
  async startMaterialProcurement(requestId, procurementBy, supplierId = null, notes = '') {
    try {
      const currentTime = new Date().toISOString();
      
      // Get request details
      const requestQuery = 'SELECT * FROM material_requests WHERE id = $1';
      const requestResult = await dbAdapter.query(requestQuery, [requestId]);
      const request = requestResult.rows?.[0];
      
      if (!request) {
        throw new Error('Material request not found');
      }

      // Update request status
      const updateQuery = `
        UPDATE material_requests 
        SET status = $1, notes = $2
        WHERE id = $3
      `;

      await dbAdapter.query(updateQuery, [
        InventoryService.INVENTORY_STATUSES.MATERIAL_PROCUREMENT_STARTED,
        notes,
        requestId
      ]);

      // Update inventory job status
      await this.updateInventoryJobStatus(
        request.inventory_job_id,
        InventoryService.INVENTORY_STATUSES.MATERIAL_PROCUREMENT_STARTED,
        procurementBy,
        'Material procurement started'
      );

      // Log activity
      await this.logInventoryActivity(
        request.inventory_job_id,
        'PROCUREMENT_STARTED',
        `Material procurement started for ${request.material_name}`,
        procurementBy,
        { requestId, supplierId, notes }
      );

      // Emit real-time update
      if (this.socketHandler) {
        const jobCardId = await this.getJobCardId(request.inventory_job_id);
        this.socketHandler.emitInventoryUpdate(jobCardId, 'PROCUREMENT_STARTED', {
          inventoryJobId: request.inventory_job_id,
          requestId,
          materialName: request.material_name,
          supplierId,
          message: `Material procurement started for ${request.material_name}`
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error starting material procurement:', error);
      throw error;
    }
  }

  // Complete material procurement
  async completeMaterialProcurement(requestId, completedBy, notes = '') {
    try {
      const currentTime = new Date().toISOString();
      
      // Get request details
      const requestQuery = 'SELECT * FROM material_requests WHERE id = $1';
      const requestResult = await dbAdapter.query(requestQuery, [requestId]);
      const request = requestResult.rows?.[0];
      
      if (!request) {
        throw new Error('Material request not found');
      }

      // Update request status
      const updateQuery = `
        UPDATE material_requests 
        SET status = $1, notes = $2
        WHERE id = $3
      `;

      await dbAdapter.query(updateQuery, [
        InventoryService.INVENTORY_STATUSES.MATERIAL_PROCUREMENT_COMPLETED,
        notes,
        requestId
      ]);

      // Update inventory job status
      await this.updateInventoryJobStatus(
        request.inventory_job_id,
        InventoryService.INVENTORY_STATUSES.MATERIAL_PROCUREMENT_COMPLETED,
        completedBy,
        'Material procurement completed'
      );

      // Log activity
      await this.logInventoryActivity(
        request.inventory_job_id,
        'PROCUREMENT_COMPLETED',
        `Material procurement completed for ${request.material_name}`,
        completedBy,
        { requestId, notes }
      );

      // Emit real-time update
      if (this.socketHandler) {
        const jobCardId = await this.getJobCardId(request.inventory_job_id);
        this.socketHandler.emitInventoryUpdate(jobCardId, 'PROCUREMENT_COMPLETED', {
          inventoryJobId: request.inventory_job_id,
          requestId,
          materialName: request.material_name,
          message: `Material procurement completed for ${request.material_name}`
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error completing material procurement:', error);
      throw error;
    }
  }

  // Update inventory job status
  async updateInventoryJobStatus(inventoryJobId, status, updatedBy, notes = '') {
    try {
      const currentTime = new Date().toISOString();
      
      const updateQuery = `
        UPDATE inventory_jobs 
        SET status = $1, updated_at = $2
        WHERE id = $3
      `;

      await dbAdapter.query(updateQuery, [status, currentTime, inventoryJobId]);

      // Update notes if provided
      if (notes) {
        const notesQuery = `
          UPDATE inventory_jobs 
          SET material_request_notes = $1, updated_at = $2
          WHERE id = $3
        `;
        await dbAdapter.query(notesQuery, [notes, currentTime, inventoryJobId]);
      }

      // Check if inventory is completed
      if (status === InventoryService.INVENTORY_STATUSES.COMPLETED) {
        // This would trigger the next step in the workflow
        // For now, we'll just log it
        await this.logInventoryActivity(
          inventoryJobId,
          'INVENTORY_COMPLETED',
          'Inventory job completed',
          updatedBy
        );
      }

      // Log activity
      await this.logInventoryActivity(
        inventoryJobId,
        'STATUS_UPDATED',
        `Status updated to ${status}`,
        updatedBy,
        { status, notes }
      );

      // Emit real-time update
      if (this.socketHandler) {
        const jobCardId = await this.getJobCardId(inventoryJobId);
        this.socketHandler.emitInventoryUpdate(jobCardId, 'STATUS_UPDATED', {
          inventoryJobId,
          status,
          notes,
          message: `Status updated to ${status}`
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating inventory job status:', error);
      throw error;
    }
  }

  // Get job card ID from inventory job ID
  async getJobCardId(inventoryJobId) {
    try {
      const query = 'SELECT job_card_id FROM inventory_jobs WHERE id = $1';
      const result = await dbAdapter.query(query, [inventoryJobId]);
      return result.rows?.[0]?.job_card_id;
    } catch (error) {
      console.error('Error getting job card ID:', error);
      return null;
    }
  }

  // Get inventory job details
  async getInventoryJob(inventoryJobId) {
    try {
      const query = `
        SELECT ij.*, jc.job_card_id as job_card_id_display, jc.product_item_code,
               jc.brand, jc.quantity, jc.delivery_date, jc.priority as job_priority,
               c.name as company_name, u.first_name || ' ' || u.last_name as assigned_to_name
        FROM inventory_jobs ij
        JOIN job_cards jc ON ij.job_card_id = jc.id
        JOIN companies c ON jc.company_id = c.id
        LEFT JOIN users u ON ij.assigned_to = u.id
        WHERE ij.id = $1
      `;
      
      const result = await dbAdapter.query(query, [inventoryJobId]);
      return result.rows?.[0] || null;
    } catch (error) {
      console.error('Error getting inventory job:', error);
      throw error;
    }
  }

  // Get all inventory jobs with filters
  async getAllInventoryJobs(filters = {}) {
    try {
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 0;

      if (filters.status) {
        paramCount++;
        whereClause += ` AND ij.status = $${paramCount}`;
        params.push(filters.status);
      }

      if (filters.priority) {
        paramCount++;
        whereClause += ` AND ij.priority = $${paramCount}`;
        params.push(filters.priority);
      }

      if (filters.assignedTo) {
        paramCount++;
        whereClause += ` AND ij.assigned_to = $${paramCount}`;
        params.push(filters.assignedTo);
      }

      const query = `
        SELECT ij.*, jc.job_card_id as job_card_id_display, jc.product_item_code,
               jc.brand, jc.quantity, jc.delivery_date, jc.priority as job_priority,
               c.name as company_name, u.first_name || ' ' || u.last_name as assigned_to_name
        FROM inventory_jobs ij
        JOIN job_cards jc ON ij.job_card_id = jc.id
        JOIN companies c ON jc.company_id = c.id
        LEFT JOIN users u ON ij.assigned_to = u.id
        ${whereClause}
        ORDER BY ij.updated_at DESC
      `;

      const result = await dbAdapter.query(query, params);
      return result.rows || [];
    } catch (error) {
      console.error('Error getting all inventory jobs:', error);
      throw error;
    }
  }

  // Log inventory activity
  async logInventoryActivity(inventoryJobId, activityType, description, userId, metadata = {}) {
    try {
      const activityId = uuidv4();
      const currentTime = new Date().toISOString();
      
      const insertQuery = `
        INSERT INTO inventory_activities (
          id, inventory_job_id, activity_type, description, metadata, user_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;

      await dbAdapter.query(insertQuery, [
        activityId,
        inventoryJobId,
        activityType,
        description,
        JSON.stringify(metadata),
        userId,
        currentTime
      ]);

      return { success: true };
    } catch (error) {
      console.error('Error logging inventory activity:', error);
      // Don't throw error for logging failures
    }
  }

  // Get inventory statistics
  async getInventoryStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_jobs,
          COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_jobs,
          COUNT(CASE WHEN status = 'MATERIAL_REQUEST_CREATED' THEN 1 END) as request_created_jobs,
          COUNT(CASE WHEN status = 'MATERIAL_REQUEST_APPROVED' THEN 1 END) as request_approved_jobs,
          COUNT(CASE WHEN status = 'MATERIAL_ISSUANCE_COMPLETED' THEN 1 END) as issuance_completed_jobs,
          COUNT(CASE WHEN status = 'MATERIAL_PROCUREMENT_COMPLETED' THEN 1 END) as procurement_completed_jobs,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_jobs
        FROM inventory_jobs
      `;

      const result = await dbAdapter.query(query);
      return result.rows?.[0] || {};
    } catch (error) {
      console.error('Error getting inventory stats:', error);
      throw error;
    }
  }
}

export default InventoryService;