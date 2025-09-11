import dbAdapter from '../database/adapter.js';
import { v4 as uuidv4 } from 'uuid';

class InventoryService {
  // Material Management
  async createInventoryMaterial(data) {
    const {
      material_id,
      category_id,
      unit_of_measurement,
      unit_cost = 0.00,
      minimum_stock_level = 0,
      reorder_level = 0,
      maximum_stock_level = 1000,
      lead_time_days = 7,
      supplier_code,
      storage_location
    } = data;

    const id = uuidv4();
    
    const query = `
      INSERT INTO inventory_materials (
        id, material_id, category_id, unit_of_measurement, unit_cost,
        minimum_stock_level, reorder_level, maximum_stock_level,
        lead_time_days, supplier_code, storage_location
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await pool.query(query, [
      id, material_id, category_id, unit_of_measurement, unit_cost,
      minimum_stock_level, reorder_level, maximum_stock_level,
      lead_time_days, supplier_code, storage_location
    ]);

    // Initialize stock entry
    await this.initializeStock(id);
    
    return result.rows[0];
  }

  async initializeStock(inventory_material_id, initial_stock = 0) {
    const stockId = uuidv4();
    
    const query = `
      INSERT INTO inventory_stock (
        id, inventory_material_id, current_stock, reserved_stock, location
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    return await pool.query(query, [stockId, inventory_material_id, initial_stock, 0, 'MAIN_WAREHOUSE']);
  }

  // Smart Stock Management
  async checkStockAvailability(inventory_material_id, required_quantity) {
    const query = `
      SELECT 
        s.*,
        m.minimum_stock_level,
        m.reorder_level,
        m.unit_of_measurement,
        mat.name as material_name
      FROM inventory_stock s
      JOIN inventory_materials m ON s.inventory_material_id = m.id
      JOIN materials mat ON m.material_id = mat.id
      WHERE s.inventory_material_id = $1
    `;

    const result = await pool.query(query, [inventory_material_id]);
    const stock = result.rows[0];

    if (!stock) {
      return {
        available: false,
        current_stock: 0,
        available_stock: 0,
        shortage: required_quantity,
        status: 'NO_STOCK_RECORD'
      };
    }

    const available_stock = stock.current_stock - stock.reserved_stock;
    const shortage = Math.max(0, required_quantity - available_stock);

    return {
      available: available_stock >= required_quantity,
      current_stock: stock.current_stock,
      available_stock,
      reserved_stock: stock.reserved_stock,
      required_quantity,
      shortage,
      minimum_stock_level: stock.minimum_stock_level,
      reorder_level: stock.reorder_level,
      status: available_stock >= required_quantity ? 'SUFFICIENT' : 'INSUFFICIENT',
      material_name: stock.material_name,
      unit: stock.unit_of_measurement
    };
  }

  async reserveStock(inventory_material_id, quantity, reference_id, reference_type = 'JOB', performed_by) {
    try {
      // Check availability
      const stockCheck = await this.checkStockAvailability(inventory_material_id, quantity);
      
      if (!stockCheck.available) {
        throw new Error(`Insufficient stock. Available: ${stockCheck.available_stock}, Required: ${quantity}`);
      }

      // Update reserved stock
      const updateQuery = `
        UPDATE inventory_stock 
        SET reserved_stock = reserved_stock + $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE inventory_material_id = $2
      `;
      await pool.query(updateQuery, [quantity, inventory_material_id]);

      // Record movement
      await this.recordStockMovement(pool, {
        inventory_stock_id: await this.getStockId(inventory_material_id),
        movement_type: 'RESERVATION',
        quantity,
        reference_type,
        reference_id,
        performed_by,
        reason: `Stock reserved for ${reference_type}: ${reference_id}`
      });
      
      return { success: true, reserved_quantity: quantity };
      
    } catch (error) {
      throw error;
    }
  }

  async releaseReservedStock(inventory_material_id, quantity, reference_id, performed_by) {
    try {
      const updateQuery = `
        UPDATE inventory_stock 
        SET reserved_stock = MAX(0, reserved_stock - $1),
            updated_at = CURRENT_TIMESTAMP
        WHERE inventory_material_id = $2
      `;
      await pool.query(updateQuery, [quantity, inventory_material_id]);

      await this.recordStockMovement(pool, {
        inventory_stock_id: await this.getStockId(inventory_material_id),
        movement_type: 'RELEASE',
        quantity,
        reference_type: 'JOB',
        reference_id,
        performed_by,
        reason: `Stock reservation released for job: ${reference_id}`
      });
      
      return { success: true, released_quantity: quantity };
      
    } catch (error) {
      throw error;
    }
  }

  async issueStock(inventory_material_id, quantity, reference_id, reference_type = 'JOB', performed_by) {
    try {
      // Update current and reserved stock
      const updateQuery = `
        UPDATE inventory_stock 
        SET current_stock = current_stock - $1,
            reserved_stock = MAX(0, reserved_stock - $1),
            updated_at = CURRENT_TIMESTAMP
        WHERE inventory_material_id = $2
      `;
      await pool.query(updateQuery, [quantity, inventory_material_id]);

      await this.recordStockMovement(pool, {
        inventory_stock_id: await this.getStockId(inventory_material_id),
        movement_type: 'OUT',
        quantity,
        reference_type,
        reference_id,
        performed_by,
        reason: `Stock issued for ${reference_type}: ${reference_id}`
      });

      // Check if reorder needed
      await this.checkAndCreateReorderAlert(inventory_material_id);
      
      return { success: true, issued_quantity: quantity };
      
    } catch (error) {
      throw error;
    }
  }

  async receiveStock(inventory_material_id, quantity, unit_cost, reference_id, performed_by) {
    try {
      const updateQuery = `
        UPDATE inventory_stock 
        SET current_stock = current_stock + $1,
            stock_value = stock_value + ($1 * $2),
            updated_at = CURRENT_TIMESTAMP
        WHERE inventory_material_id = $3
      `;
      await pool.query(updateQuery, [quantity, unit_cost, inventory_material_id]);

      await this.recordStockMovement(pool, {
        inventory_stock_id: await this.getStockId(inventory_material_id),
        movement_type: 'IN',
        quantity,
        reference_type: 'PURCHASE',
        reference_id,
        unit_cost,
        total_cost: quantity * unit_cost,
        performed_by,
        reason: `Stock received from purchase: ${reference_id}`
      });
      
      return { success: true, received_quantity: quantity };
      
    } catch (error) {
      throw error;
    }
  }

  // Job Management
  async processJobMaterialRequirements(job_card_id, materials_required, requested_by) {
    try {
      let overall_status = 'FULLY_AVAILABLE';
      let procurement_needed = false;
      let available_percentage = 100;
      const material_statuses = [];

      for (const material of materials_required) {
        const { inventory_material_id, required_quantity, priority = 5 } = material;
        
        // Create requirement record
        const reqId = uuidv4();
        await pool.query(`
          INSERT INTO job_material_requirements (
            id, job_card_id, inventory_material_id, required_quantity, priority
          ) VALUES ($1, $2, $3, $4, $5)
        `, [reqId, job_card_id, inventory_material_id, required_quantity, priority]);

        // Check availability
        const availability = await this.checkStockAvailability(inventory_material_id, required_quantity);
        
        let status = 'PENDING';
        let allocated_quantity = 0;

        if (availability.available) {
          // Reserve the stock
          await this.reserveStock(inventory_material_id, required_quantity, job_card_id, 'JOB', requested_by);
          status = 'FULLY_ALLOCATED';
          allocated_quantity = required_quantity;
        } else {
          if (availability.available_stock > 0) {
            // Partial allocation possible
            const partial_qty = availability.available_stock;
            if (partial_qty >= required_quantity * 0.5) { // 50% threshold for partial approval
              await this.reserveStock(inventory_material_id, partial_qty, job_card_id, 'JOB', requested_by);
              status = 'PARTIALLY_ALLOCATED';
              allocated_quantity = partial_qty;
            } else {
              status = 'INSUFFICIENT_STOCK';
              procurement_needed = true;
            }
          } else {
            status = 'INSUFFICIENT_STOCK';
            procurement_needed = true;
          }
        }

        // Update requirement status
        await pool.query(`
          UPDATE job_material_requirements 
          SET status = $1, allocated_quantity = $2
          WHERE id = $3
        `, [status, allocated_quantity, reqId]);

        material_statuses.push({
          inventory_material_id,
          material_name: availability.material_name,
          required_quantity,
          allocated_quantity,
          available_stock: availability.available_stock,
          status,
          shortage: availability.shortage
        });

        // Update overall status
        if (status === 'INSUFFICIENT_STOCK') {
          overall_status = 'INSUFFICIENT_STOCK';
        } else if (status === 'PARTIALLY_ALLOCATED' && overall_status !== 'INSUFFICIENT_STOCK') {
          overall_status = 'PARTIALLY_AVAILABLE';
        }
      }

      // Calculate availability percentage
      const total_required = materials_required.reduce((sum, m) => sum + m.required_quantity, 0);
      const total_allocated = material_statuses.reduce((sum, m) => sum + m.allocated_quantity, 0);
      available_percentage = total_required > 0 ? Math.round((total_allocated / total_required) * 100) : 0;

      return {
        job_card_id,
        overall_status,
        available_percentage,
        procurement_needed,
        material_statuses,
        can_proceed: available_percentage >= 50, // Can proceed with 50% or more
        recommendation: this.getRecommendation(available_percentage, procurement_needed)
      };

    } catch (error) {
      throw error;
    }
  }

  async approveJobWithMaterials(job_card_id, approval_data, approved_by) {
    const { status, approval_percentage = 100, special_approval_reason, remarks } = approval_data;
    
    const approvalId = uuidv4();
    
    const query = `
      INSERT INTO inventory_job_approvals (
        id, job_card_id, reviewed_by, status, approval_date,
        approval_percentage, special_approval_reason, remarks
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      approvalId, job_card_id, approved_by, status,
      approval_percentage, special_approval_reason, remarks
    ]);

    // If approved, issue the allocated stock
    if (status === 'APPROVED' || status === 'PARTIALLY_APPROVED') {
      await this.issueAllocatedStock(job_card_id, approved_by);
    }

    return result.rows[0];
  }

  async issueAllocatedStock(job_card_id, performed_by) {
    const requirements = await pool.query(`
      SELECT * FROM job_material_requirements 
      WHERE job_card_id = $1 AND allocated_quantity > 0
    `, [job_card_id]);

    for (const req of requirements.rows) {
      await this.issueStock(
        req.inventory_material_id,
        req.allocated_quantity,
        job_card_id,
        'JOB',
        performed_by
      );

      // Create allocation record
      const allocId = uuidv4();
      await pool.query(`
        INSERT INTO job_material_allocations (
          id, job_material_requirement_id, inventory_stock_id,
          allocated_quantity, allocated_by, status
        ) VALUES ($1, $2, $3, $4, $5, 'ISSUED')
      `, [
        allocId,
        req.id,
        await this.getStockId(req.inventory_material_id),
        req.allocated_quantity,
        performed_by
      ]);
    }
  }

  // Purchase Request Management
  async createPurchaseRequest(materials_needed, requested_by, reason = 'Stock replenishment') {
    try {
      const requestId = uuidv4();
      const request_number = `PR-${Date.now()}`;
      let total_estimated_cost = 0;

      // Create purchase request
      const requestQuery = `
        INSERT INTO purchase_requests (
          id, request_number, requested_by, request_reason, status
        ) VALUES ($1, $2, $3, $4, 'PENDING')
        RETURNING *
      `;
      
      const requestResult = await pool.query(requestQuery, [
        requestId, request_number, requested_by, reason
      ]);

      // Add items to purchase request
      for (const item of materials_needed) {
        const { inventory_material_id, quantity, estimated_unit_cost, job_card_ids = [] } = item;
        
        const itemId = uuidv4();
        const estimated_total = quantity * (estimated_unit_cost || 0);
        total_estimated_cost += estimated_total;

        await pool.query(`
          INSERT INTO purchase_request_items (
            id, purchase_request_id, inventory_material_id,
            requested_quantity, estimated_unit_cost, estimated_total_cost,
            reason, job_card_ids
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          itemId, requestId, inventory_material_id, quantity,
          estimated_unit_cost, estimated_total, reason,
          JSON.stringify(job_card_ids)
        ]);
      }

      // Update total cost
      await pool.query(`
        UPDATE purchase_requests 
        SET total_estimated_cost = $1 
        WHERE id = $2
      `, [total_estimated_cost, requestId]);

      return requestResult.rows[0];

    } catch (error) {
      throw error;
    }
  }

  // Alert Management
  async checkAndCreateReorderAlert(inventory_material_id) {
    const stockQuery = `
      SELECT s.*, m.reorder_level, m.minimum_stock_level, mat.name as material_name
      FROM inventory_stock s
      JOIN inventory_materials m ON s.inventory_material_id = m.id
      JOIN materials mat ON m.material_id = mat.id
      WHERE s.inventory_material_id = $1
    `;

    const result = await pool.query(stockQuery, [inventory_material_id]);
    const stock = result.rows[0];

    if (!stock) return;

    const available_stock = stock.current_stock - stock.reserved_stock;

    if (available_stock <= stock.reorder_level) {
      await this.createStockAlert({
        inventory_material_id,
        alert_type: available_stock <= stock.minimum_stock_level ? 'LOW_STOCK' : 'REORDER_POINT',
        current_level: available_stock,
        threshold_level: stock.reorder_level
      });
    }
  }

  async createStockAlert(alertData) {
    const { inventory_material_id, alert_type, current_level, threshold_level } = alertData;
    
    // Check if alert already exists
    const existingAlert = await pool.query(`
      SELECT id FROM stock_alerts 
      WHERE inventory_material_id = $1 AND alert_type = $2 AND status = 'ACTIVE'
    `, [inventory_material_id, alert_type]);

    if (existingAlert.rows.length > 0) return;

    const alertId = uuidv4();
    await pool.query(`
      INSERT INTO stock_alerts (
        id, inventory_material_id, alert_type, current_level, threshold_level
      ) VALUES ($1, $2, $3, $4, $5)
    `, [alertId, inventory_material_id, alert_type, current_level, threshold_level]);
  }

  // Helper Methods
  async getStockId(inventory_material_id) {
    const result = await pool.query(
      'SELECT id FROM inventory_stock WHERE inventory_material_id = $1',
      [inventory_material_id]
    );
    return result.rows[0]?.id;
  }

  async recordStockMovement(poolOrClient, movementData) {
    const {
      inventory_stock_id,
      movement_type,
      quantity,
      reference_type,
      reference_id,
      unit_cost,
      total_cost,
      performed_by,
      reason,
      notes
    } = movementData;

    const movementId = uuidv4();
    const query = `
      INSERT INTO stock_movements (
        id, inventory_stock_id, movement_type, quantity,
        reference_type, reference_id, unit_cost, total_cost,
        performed_by, reason, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;

    await poolOrClient.query(query, [
      movementId, inventory_stock_id, movement_type, quantity,
      reference_type, reference_id, unit_cost, total_cost,
      performed_by, reason, notes
    ]);
  }

  getRecommendation(available_percentage, procurement_needed) {
    if (available_percentage === 100) {
      return 'Full stock available. Job can proceed immediately.';
    } else if (available_percentage >= 75) {
      return 'Sufficient stock available. Job can proceed with minor adjustments.';
    } else if (available_percentage >= 50) {
      return 'Partial stock available. Special approval required for production start.';
    } else if (procurement_needed) {
      return 'Insufficient stock. Purchase request required before job approval.';
    } else {
      return 'Stock unavailable. Material procurement critical.';
    }
  }

  // Dashboard and Reporting
  async getInventoryDashboard() {
    const stats = await pool.query(`
      SELECT 
        COUNT(DISTINCT im.id) as total_materials,
        COUNT(DISTINCT CASE WHEN s.available_stock <= im.minimum_stock_level THEN im.id END) as low_stock_items,
        COUNT(DISTINCT CASE WHEN s.available_stock <= im.reorder_level THEN im.id END) as reorder_items,
        SUM(s.stock_value) as total_stock_value,
        COUNT(DISTINCT CASE WHEN sa.status = 'ACTIVE' THEN sa.id END) as active_alerts
      FROM inventory_materials im
      LEFT JOIN inventory_stock s ON im.id = s.inventory_material_id
      LEFT JOIN stock_alerts sa ON im.id = sa.inventory_material_id
    `);

    const recentMovements = await pool.query(`
      SELECT 
        sm.*,
        m.name as material_name,
        u.first_name || ' ' || u.last_name as performed_by_name
      FROM stock_movements sm
      JOIN inventory_stock s ON sm.inventory_stock_id = s.id
      JOIN inventory_materials im ON s.inventory_material_id = im.id
      JOIN materials m ON im.material_id = m.id
      JOIN users u ON sm.performed_by = u.id
      ORDER BY sm.performed_at DESC
      LIMIT 10
    `);

    return {
      stats: stats.rows[0],
      recent_movements: recentMovements.rows
    };
  }
}

export default new InventoryService();