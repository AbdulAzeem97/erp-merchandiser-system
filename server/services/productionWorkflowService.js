import BaseDepartmentService from './baseDepartmentService.js';
import dbAdapter from '../database/adapter.js';

/**
 * Production Workflow Service
 * Handles all production department operations (Offset Printing, Digital Printing)
 * Extends BaseDepartmentService for consistent workflow management
 */
class ProductionWorkflowService extends BaseDepartmentService {
  constructor(socketHandler = null) {
    super('Production', socketHandler);
  }

  /**
   * Get production jobs with filters
   * Supports: Offset Printing, Digital Printing, Screen Printing
   */
  async getProductionJobs(filters = {}) {
    try {
      console.log('🏭 Production: getProductionJobs called with filters:', filters);
      const { status, priority, assignedTo, dateRange, stepType } = filters;
      
      let query = `
        SELECT DISTINCT
          jc.id,
          jc.id as job_card_id,
          jc."jobNumber",
          jc."productId",
          jc."companyId",
          jc.po_number,
          jc.quantity,
          jc.urgency as priority,
          jc."dueDate",
          jc.status,
          jc.current_department,
          jc.current_step,
          jc.workflow_status,
          jc.status_message,
          jc."createdAt",
          jc."updatedAt",
          p.name as product_name,
          p.sku as product_item_code,
          c.name as company_name,
          c.name as customer_name,
          jws.step_name,
          jws.status as step_status,
          jws.sequence_number,
          pa.id as assignment_id,
          pa.machine_id,
          pa.assigned_to,
          pa.status as assignment_status,
          pa.started_at,
          pa.completed_at,
          pa.material_consumed,
          pa.quality_metrics,
          u_assigned."firstName" || ' ' || u_assigned."lastName" as assigned_operator_name,
          u_by."firstName" || ' ' || u_by."lastName" as assigned_by_name,
          m.name as machine_name,
          m.machine_type
        FROM job_cards jc
        LEFT JOIN products p ON jc."productId" = p.id
        LEFT JOIN companies c ON jc."companyId" = c.id
        INNER JOIN job_workflow_steps jws ON jc.id = jws.job_card_id
        LEFT JOIN production_assignments pa ON jc.id = pa.job_id
        LEFT JOIN users u_assigned ON pa.assigned_to = u_assigned.id
        LEFT JOIN users u_by ON pa.assigned_by = u_by.id
        LEFT JOIN production_machines m ON pa.machine_id = m.id
        WHERE jc.current_department = 'Production'
          AND jws.department = 'Production'
          AND jws.status IN ('pending', 'in_progress', 'submitted', 'qa_review')
      `;
      
      const params = [];
      let paramIndex = 1;

      if (status) {
        query += ` AND jws.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (stepType) {
        query += ` AND jws.step_name ILIKE $${paramIndex}`;
        params.push(`%${stepType}%`);
        paramIndex++;
      }

      if (assignedTo) {
        query += ` AND pa.assigned_to = $${paramIndex}`;
        params.push(assignedTo);
        paramIndex++;
      }

      if (priority) {
        query += ` AND jc.urgency = $${paramIndex}`;
        params.push(priority);
        paramIndex++;
      }

      if (dateRange?.start) {
        query += ` AND jc."dueDate" >= $${paramIndex}`;
        params.push(dateRange.start);
        paramIndex++;
      }

      if (dateRange?.end) {
        query += ` AND jc."dueDate" <= $${paramIndex}`;
        params.push(dateRange.end);
        paramIndex++;
      }

      query += ` ORDER BY jc."dueDate" ASC, jc.urgency DESC, jc."createdAt" DESC`;

      console.log('🏭 Production: Full query:', query);
      console.log('🏭 Production: Query params:', params);

      try {
        const result = await dbAdapter.query(query, params);
        console.log(`🏭 Production: Query returned ${result.rows.length} rows`);
        return result.rows;
      } catch (queryError) {
        console.error('🏭 Production: Query execution error:', queryError);
        console.error('🏭 Production: Query that failed:', query);
        throw queryError;
      }
    } catch (error) {
      console.error('❌ Error getting production jobs:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Assign job to production operator/machine
   */
  async assignJob(jobId, assignedTo, machineId, assignedBy, comments = null) {
    try {
      console.log('🏭 Production: assignJob called', { jobId, assignedTo, machineId, assignedBy });
      
      // Get current workflow step for this job in Production department
      await this.initWorkflowService();
      const workflowSteps = await this.workflowService.getJobWorkflow(jobId);
      const currentStep = workflowSteps.find(step => 
        step.department === 'Production' && 
        step.status !== 'completed' && 
        step.status !== 'inactive'
      );

      if (!currentStep) {
        throw new Error(`No active Production step found for job ${jobId}`);
      }

      console.log('🏭 Production: Current workflow step:', currentStep);

      // Check if assignment already exists
      const existing = await dbAdapter.query(
        'SELECT id FROM production_assignments WHERE job_id = $1',
        [jobId]
      );

      let assignmentId;
      if (existing.rows.length > 0) {
        // Update existing assignment
        const updateResult = await dbAdapter.query(`
          UPDATE production_assignments
          SET assigned_to = $1,
              machine_id = $2,
              assigned_by = $3,
              status = 'Assigned',
              comments = COALESCE($4, comments),
              updated_at = CURRENT_TIMESTAMP
          WHERE job_id = $5
          RETURNING id
        `, [assignedTo, machineId, assignedBy, comments, jobId]);
        assignmentId = updateResult.rows[0].id;
        console.log('🏭 Production: Updated existing assignment:', assignmentId);
      } else {
        // Create new assignment
        const insertResult = await dbAdapter.query(`
          INSERT INTO production_assignments (job_id, assigned_to, machine_id, assigned_by, status, comments)
          VALUES ($1, $2, $3, $4, 'Assigned', $5)
          RETURNING id
        `, [jobId, assignedTo, machineId, assignedBy, comments]);
        assignmentId = insertResult.rows[0].id;
        console.log('🏭 Production: Created new assignment:', assignmentId);
      }

      // Don't update workflow step status on assignment - just create the assignment record
      // The workflow step status will change when the operator starts work (in_progress) or completes (completed)
      // Log to history using the actual step name
      await this.logToHistory(jobId, currentStep.step_name, currentStep.status, assignedBy, `Assigned to operator ${assignedTo} on machine ${machineId}`);

      // Emit socket notification
      if (this.socketHandler && typeof this.socketHandler.emit === 'function') {
        this.socketHandler.emit('production:job_assigned', {
          jobId,
          assignedTo,
          machineId,
          assignedBy
        });
        
        // Notify assigned operator
        if (typeof this.socketHandler.to === 'function') {
          this.socketHandler.to(`user_${assignedTo}`).emit('notification', {
            type: 'production_assignment',
            title: 'New Production Assignment',
            message: `You have been assigned to a production job`,
            jobId,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        console.warn('⚠️ Production: socketHandler not available or emit is not a function');
      }

      return { success: true, assignmentId };
    } catch (error) {
      console.error('❌ Error assigning production job:', error);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Update production status
   */
  async updateStatus(jobId, status, updatedBy, comments = null, metadata = {}) {
    try {
      console.log('🏭 Production: updateStatus called', { jobId, status, updatedBy });
      
      // Validate status
      const validStatuses = ['Pending', 'Assigned', 'Setup', 'Printing', 'Quality Check', 'Completed', 'On Hold', 'Rejected'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}. Valid statuses: ${validStatuses.join(', ')}`);
      }

      // Get current workflow step for this job in Production department
      await this.initWorkflowService();
      const workflowSteps = await this.workflowService.getJobWorkflow(jobId);
      const currentStep = workflowSteps.find(step => 
        step.department === 'Production' && 
        step.status !== 'completed' && 
        step.status !== 'inactive'
      );

      if (!currentStep) {
        throw new Error(`No active Production step found for job ${jobId}`);
      }

      console.log('🏭 Production: Current workflow step:', currentStep);

      // Check if assignment exists, if not create one
      const assignmentCheck = await dbAdapter.query(
        'SELECT id FROM production_assignments WHERE job_id = $1',
        [jobId]
      );

      if (assignmentCheck.rows.length === 0) {
        // Create assignment if it doesn't exist
        await dbAdapter.query(`
          INSERT INTO production_assignments (job_id, assigned_by, status, comments)
          VALUES ($1, $2, $3, $4)
        `, [jobId, updatedBy, status, comments || 'Status updated']);
        console.log('🏭 Production: Created assignment record for job', jobId);
      } else {
        // Update existing assignment
        const updateData = {
          status,
          updated_at: new Date()
        };

        if (status === 'Printing' || status === 'Setup') {
          // Set started_at if not already set
          const existing = await dbAdapter.query(
            'SELECT started_at FROM production_assignments WHERE job_id = $1',
            [jobId]
          );
          if (!existing.rows[0]?.started_at) {
            updateData.started_at = new Date();
          }
        }

        if (status === 'Completed') {
          updateData.completed_at = new Date();
        }

        await dbAdapter.query(`
          UPDATE production_assignments
          SET status = $1,
              started_at = COALESCE($2, started_at),
              completed_at = COALESCE($3, completed_at),
              material_consumed = COALESCE($4::jsonb, material_consumed),
              quality_metrics = COALESCE($5::jsonb, quality_metrics),
              comments = COALESCE($6, comments),
              updated_at = CURRENT_TIMESTAMP
          WHERE job_id = $7
        `, [
          status,
          updateData.started_at || null,
          updateData.completed_at || null,
          metadata.material_consumed ? JSON.stringify(metadata.material_consumed) : null,
          metadata.quality_metrics ? JSON.stringify(metadata.quality_metrics) : null,
          comments || null,
          jobId
        ]);
        console.log('🏭 Production: Updated assignment record');
      }

      // Map production status to workflow status
      const workflowStatusMap = {
        'Pending': 'pending',
        'Assigned': 'pending',
        'Setup': 'in_progress',
        'Printing': 'in_progress',
        'Quality Check': 'submitted',
        'Completed': 'completed',
        'On Hold': 'revision_required',
        'Rejected': 'revision_required'
      };

      const workflowStatus = workflowStatusMap[status] || 'pending';

      // Update workflow using base service with actual step name
      await this.updateJobStatus(jobId, workflowStatus, updatedBy, comments || `Status updated to ${status}`);

      // Handle status-specific actions
      if (status === 'Completed') {
        await this.handleProductionCompleted(jobId, updatedBy);
      } else if (status === 'Rejected') {
        await this.handleProductionRejected(jobId, updatedBy, comments);
      }

      // Emit socket notification
      if (this.socketHandler && typeof this.socketHandler.emit === 'function') {
        this.socketHandler.emit('production:status_updated', {
          jobId,
          status,
          updatedBy
        });
      } else {
        console.warn('⚠️ Production: socketHandler not available or emit is not a function');
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error updating production status:', error);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Handle production completed - move to next workflow step
   */
  async handleProductionCompleted(jobId, userId) {
    try {
      await this.initWorkflowService();
      
      const workflowSteps = await this.workflowService.getJobWorkflow(jobId);
      const productionStep = workflowSteps.find(step => 
        step.department === 'Production' && 
        step.status === 'in_progress'
      );

      if (productionStep) {
        // Mark production step as completed
        await dbAdapter.query(`
          UPDATE job_workflow_steps
          SET status = 'completed',
              completed_at = NOW(),
              updated_by = $1,
              updated_at = NOW()
          WHERE id = $2
        `, [userId, productionStep.id]);

        // Progress to next step
        await this.progressToNextStep(jobId, productionStep, userId);
      }
    } catch (error) {
      console.error('Error handling production completed:', error);
    }
  }

  /**
   * Handle production rejected - return to previous step
   */
  async handleProductionRejected(jobId, userId, comments) {
    try {
      await this.initWorkflowService();
      
      const workflowSteps = await this.workflowService.getJobWorkflow(jobId);
      const productionStep = workflowSteps.find(step => 
        step.department === 'Production' && 
        step.status === 'in_progress'
      );

      if (productionStep) {
        // Mark production as revision_required
        await dbAdapter.query(`
          UPDATE job_workflow_steps
          SET status = 'revision_required',
              status_message = $1,
              updated_by = $2,
              updated_at = NOW()
          WHERE id = $3
        `, [
          `Revision Required - ${comments || 'Production rejected'}`,
          userId,
          productionStep.id
        ]);

        // Find previous completed step
        const previousStep = workflowSteps
          .filter(step => step.sequence_number < productionStep.sequence_number)
          .sort((a, b) => b.sequence_number - a.sequence_number)
          .find(step => step.status === 'completed');

        if (previousStep) {
          // Reactivate previous step
          await dbAdapter.query(`
            UPDATE job_workflow_steps
            SET status = 'pending',
                status_message = $1,
                updated_at = NOW()
            WHERE id = $2
          `, [
            `Revision Required - Back to ${previousStep.step_name} (${previousStep.department})`,
            previousStep.id
          ]);

          // Update job_cards using JobStatusService
          const JobStatusService = (await import('./jobStatusService.js')).default;
          await JobStatusService.updateFromWorkflowStep(
            jobId,
            'revision_required',
            previousStep.step_name,
            previousStep.department,
            userId
          );
        }
      }
    } catch (error) {
      console.error('Error handling production rejected:', error);
    }
  }

  /**
   * Get available production machines
   */
  async getAvailableMachines(machineType = null) {
    try {
      let query = `
        SELECT 
          id,
          name,
          machine_type,
          status,
          is_active
        FROM production_machines
        WHERE is_active = true
      `;
      
      const params = [];
      if (machineType) {
        query += ` AND machine_type = $1`;
        params.push(machineType);
      }

      query += ` ORDER BY name ASC`;

      const result = await dbAdapter.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting production machines:', error);
      throw error;
    }
  }

  /**
   * Get production operators (users with PRODUCTION_OPERATOR role)
   */
  async getProductionOperators() {
    try {
      const result = await dbAdapter.query(`
        SELECT 
          id,
          "firstName",
          "lastName",
          email,
          role
        FROM users
        WHERE role = 'PRODUCTION_OPERATOR' OR role = 'OPERATOR'
        ORDER BY "firstName" ASC, "lastName" ASC
      `);

      return result.rows;
    } catch (error) {
      console.error('Error getting production operators:', error);
      throw error;
    }
  }

  /**
   * Get production assignment for a job
   */
  async getAssignment(jobId) {
    try {
      const result = await dbAdapter.query(`
        SELECT 
          pa.*,
          u_assigned."firstName" || ' ' || u_assigned."lastName" as assigned_operator_name,
          u_by."firstName" || ' ' || u_by."lastName" as assigned_by_name,
          m.name as machine_name,
          m.machine_type
        FROM production_assignments pa
        LEFT JOIN users u_assigned ON pa.assigned_to = u_assigned.id
        LEFT JOIN users u_by ON pa.assigned_by = u_by.id
        LEFT JOIN production_machines m ON pa.machine_id = m.id
        WHERE pa.job_id = $1
        ORDER BY pa.created_at DESC
        LIMIT 1
      `, [jobId]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting production assignment:', error);
      throw error;
    }
  }

  /**
   * Add comment to production assignment
   */
  async addComment(jobId, comment, userId) {
    try {
      await dbAdapter.query(`
        UPDATE production_assignments
        SET comments = COALESCE(comments || E'\\n', '') || $1,
            updated_at = NOW()
        WHERE job_id = $2
      `, [`[${new Date().toISOString()}] ${comment}`, jobId]);

      // Log to history
      await this.logToHistory(jobId, 'Production', 'Updated', userId, `Comment: ${comment}`);

      return { success: true };
    } catch (error) {
      console.error('Error adding production comment:', error);
      throw error;
    }
  }
}

export default ProductionWorkflowService;

