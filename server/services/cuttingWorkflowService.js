import dbAdapter from '../database/adapter.js';
import JobStatusService from './jobStatusService.js';

class CuttingWorkflowService {
  constructor() {
    this.socketHandler = null;
  }

  setSocketHandler(io) {
    this.socketHandler = io;
  }

  /**
   * Get all jobs in Cutting department
   */
  async getCuttingJobs(filters = {}) {
    try {
      console.log('🔪 Cutting: getCuttingJobs called with filters:', filters);
      const { status, assignedTo, dateFrom, dateTo, priority } = filters;
      
      // Comprehensive query - find jobs that are in Cutting department or have cutting assignments
      let query = `
        SELECT DISTINCT
          jc.id,
          jc.id as job_card_id,
          jc."jobNumber" as "jobNumber",
          jc."productId",
          jc."companyId",
          jc.po_number,
          jc.customer_name,
          jc.customer_email,
          jc.customer_phone,
          jc.customer_address,
          jc.quantity,
          jc.urgency as priority,
          jc."dueDate" as delivery_date,
          jc."createdAt",
          jc."updatedAt",
          jc.notes as job_notes,
          jc.client_layout_link,
          p.sku as product_code,
          p.name as product_name,
          p.brand as product_brand,
          p.gsm as product_gsm,
          p.description as product_description,
          p."fscCertified" as product_fsc_certified,
          p."fscLicense" as product_fsc_license,
          m.name as material_name,
          cat.name as category_name,
          c.name as company_name,
          c.email as company_email,
          c.phone as company_phone,
          c.address as company_address,
          ca.id as assignment_id,
          ca.status as cutting_status,
          ca.assigned_to as cutting_assigned_to,
          ca.assigned_by as cutting_assigned_by,
          ca.comments as cutting_comments,
          ca.started_at as cutting_started_at,
          ca.finished_at as cutting_finished_at,
          u_assigned."firstName" || ' ' || u_assigned."lastName" as assigned_labor_name,
          u_assigned.email as assigned_labor_email,
          u_assigned.phone as assigned_labor_phone,
          u_by."firstName" || ' ' || u_by."lastName" as assigned_by_name,
          u_by.email as assigned_by_email,
          COALESCE(jc.current_department, '') as current_department,
          COALESCE(jc.current_step, '') as current_step,
          COALESCE(jc.workflow_status, '') as workflow_status,
          COALESCE(jc.status_message, '') as status_message,
          pj.required_plate_count,
          pj.plate_count,
          pj.ctp_machine_id,
          cm.machine_name as ctp_machine_name,
          cm.machine_code as ctp_machine_code,
          cm.machine_type as ctp_machine_type,
          cm.location as ctp_machine_location
        FROM job_cards jc
        LEFT JOIN products p ON jc."productId" = p.id
        LEFT JOIN companies c ON jc."companyId" = c.id
        LEFT JOIN materials m ON p.material_id = m.id
        LEFT JOIN categories cat ON p."categoryId" = cat.id
        LEFT JOIN cutting_assignments ca ON jc.id = ca.job_id
        LEFT JOIN users u_assigned ON ca.assigned_to = u_assigned.id
        LEFT JOIN users u_by ON ca.assigned_by = u_by.id
        LEFT JOIN prepress_jobs pj ON jc.id = pj.job_card_id
        LEFT JOIN ctp_machines cm ON pj.ctp_machine_id = cm.id
        LEFT JOIN job_production_planning jpp ON jc.id = jpp.job_card_id
        WHERE (jc.current_department = 'Cutting' OR ca.id IS NOT NULL OR jpp.planning_status = 'APPLIED')
      `;

      const params = [];
      let paramIndex = 1;

      if (status) {
        query += ` AND (ca.status = $${paramIndex} OR (ca.status IS NULL AND $${paramIndex} = 'Pending'))`;
        params.push(status);
        paramIndex++;
      }

      if (assignedTo) {
        query += ` AND ca.assigned_to = $${paramIndex}`;
        params.push(assignedTo);
        paramIndex++;
      }

      if (dateFrom) {
        query += ` AND jc."createdAt" >= $${paramIndex}`;
        params.push(dateFrom);
        paramIndex++;
      }

      if (dateTo) {
        query += ` AND jc."createdAt" <= $${paramIndex}`;
        params.push(dateTo);
        paramIndex++;
      }

      // Note: priority column doesn't exist in job_cards table, so we skip this filter
      // if (priority) {
      //   query += ` AND jc.priority = $${paramIndex}`;
      //   params.push(priority);
      //   paramIndex++;
      // }

      query += ` ORDER BY jc."createdAt" DESC`;

      console.log('🔪 Cutting: Full query:', query);
      console.log('🔪 Cutting: Query params:', params);

      try {
        const result = await dbAdapter.query(query, params);
        console.log(`🔪 Cutting: Query returned ${result.rows.length} rows`);
        return result.rows;
      } catch (queryError) {
        console.error('🔪 Cutting: Query execution error:', queryError);
        console.error('🔪 Cutting: Query that failed:', query);
        throw queryError;
      }
    } catch (error) {
      console.error('❌ Error fetching cutting jobs:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Assign a job to cutting labor
   */
  async assignJob(jobId, assignedTo, assignedBy, comments = null) {
    try {
      // Check if assignment already exists
      const existing = await dbAdapter.query(
        'SELECT id FROM cutting_assignments WHERE job_id = $1',
        [jobId]
      );

      let assignmentId;
      if (existing.rows.length > 0) {
        // Update existing assignment
        const updateResult = await dbAdapter.query(`
          UPDATE cutting_assignments
          SET assigned_to = $1,
              assigned_by = $2,
              status = 'Assigned',
              comments = COALESCE($3, comments),
              updated_at = NOW()
          WHERE job_id = $4
          RETURNING id
        `, [assignedTo, assignedBy, comments, jobId]);
        assignmentId = updateResult.rows[0].id;
      } else {
        // Create new assignment
        const insertResult = await dbAdapter.query(`
          INSERT INTO cutting_assignments (job_id, assigned_to, assigned_by, status, comments)
          VALUES ($1, $2, $3, 'Assigned', $4)
          RETURNING id
        `, [jobId, assignedTo, assignedBy, comments]);
        assignmentId = insertResult.rows[0].id;
      }

      // CRITICAL: Use centralized status service for consistency
      await JobStatusService.updateJobStatus(jobId, 'Assigned', 'Cutting', null, assignedBy, 'Assigned to cutting labor');

      // Update job workflow status
      await this.updateWorkflowStatus(jobId, 'Assigned', 'Cutting', assignedBy);

      // Log to history
      await this.logCuttingTransition(jobId, 'Assigned', assignedBy, `Assigned to cutting labor`);

      // Emit socket notification
      if (this.socketHandler) {
        this.socketHandler.emit('cutting:job_assigned', {
          jobId,
          assignedTo,
          assignedBy
        });
        
        // Notify assigned labor
        this.socketHandler.to(`user_${assignedTo}`).emit('notification', {
          type: 'cutting_assignment',
          title: 'New Cutting Assignment',
          message: `You have been assigned to a cutting job`,
          jobId,
          timestamp: new Date().toISOString()
        });
      }

      return { success: true, assignmentId };
    } catch (error) {
      console.error('Error assigning cutting job:', error);
      throw error;
    }
  }

  /**
   * Update cutting status
   */
  async updateStatus(jobId, status, updatedBy, comments = null) {
    try {
      // Validate status
      const validStatuses = ['Pending', 'Assigned', 'In Progress', 'On Hold', 'Completed', 'Rejected'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}`);
      }

      // Update assignment
      const updateData = {
        status,
        updated_at: new Date()
      };

      if (status === 'In Progress' && !comments) {
        updateData.started_at = new Date();
      }

      if (status === 'Completed') {
        updateData.finished_at = new Date();
      }

      if (comments) {
        updateData.comments = comments;
      }

      await dbAdapter.query(`
        UPDATE cutting_assignments
        SET status = $1,
            started_at = COALESCE($2, started_at),
            finished_at = COALESCE($3, finished_at),
            comments = COALESCE($4, comments),
            updated_at = NOW()
        WHERE job_id = $5
      `, [
        status,
        updateData.started_at || null,
        updateData.finished_at || null,
        comments || null,
        jobId
      ]);

      // CRITICAL: Use centralized status service for consistency
      const statusMessage = this.getStatusMessage(status);
      await JobStatusService.updateJobStatus(jobId, status, 'Cutting', null, updatedBy, statusMessage);

      // Update workflow status (this also updates job_cards, but we do it above for reliability)
      await this.updateWorkflowStatus(jobId, status, 'Cutting', updatedBy, statusMessage);

      // Log to history
      await this.logCuttingTransition(jobId, status, updatedBy, comments || statusMessage);

      // Handle status-specific actions
      if (status === 'Completed') {
        await this.handleCuttingCompleted(jobId, updatedBy);
      } else if (status === 'Rejected') {
        await this.handleCuttingRejected(jobId, updatedBy, comments);
      }

      // Emit socket notification
      if (this.socketHandler) {
        this.socketHandler.emit('cutting:status_updated', {
          jobId,
          status,
          updatedBy
        });
        
        // Notify HOD Cutting if status is completed
        if (status === 'Completed') {
          this.socketHandler.emit('notification', {
            type: 'cutting_completed',
            title: 'Cutting Completed',
            message: `Cutting job has been completed`,
            jobId,
            timestamp: new Date().toISOString()
          });
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating cutting status:', error);
      throw error;
    }
  }

  /**
   * Add comment to cutting assignment
   */
  async addComment(jobId, comment, userId) {
    try {
      await dbAdapter.query(`
        UPDATE cutting_assignments
        SET comments = COALESCE(comments || E'\\n', '') || $1,
            updated_at = NOW()
        WHERE job_id = $2
      `, [`[${new Date().toISOString()}] ${comment}`, jobId]);

      // Log to history
      await this.logCuttingTransition(jobId, null, userId, `Comment: ${comment}`);

      return { success: true };
    } catch (error) {
      console.error('Error adding cutting comment:', error);
      throw error;
    }
  }

  /**
   * Update workflow status using UnifiedWorkflowService
   */
  async updateWorkflowStatus(jobId, status, department, userId, statusMessage = null) {
    try {
      const UnifiedWorkflowService = (await import('./unifiedWorkflowService.js')).default;
      const workflowService = new UnifiedWorkflowService();

      if (this.socketHandler) {
        workflowService.setSocketHandler(this.socketHandler);
      }

      // Find cutting step in workflow
      const workflowSteps = await workflowService.getJobWorkflow(jobId);
      const cuttingStep = workflowSteps.find(step => 
        step.department === 'Cutting' || step.step_name.toLowerCase().includes('cutting')
      );

      if (cuttingStep) {
        // Update the cutting step status
        const stepStatus = this.mapCuttingStatusToWorkflowStatus(status);
        await dbAdapter.query(`
          UPDATE job_workflow_steps
          SET status = $1,
              status_message = $2,
              updated_by = $3,
              updated_at = NOW()
          WHERE id = $4
        `, [
          stepStatus,
          statusMessage || this.getStatusMessage(status),
          userId,
          cuttingStep.id
        ]);

        // Update job_cards using centralized status service
        await JobStatusService.updateJobStatus(
          jobId, 
          status, 
          department, 
          stepStatus, 
          userId, 
          statusMessage || this.getStatusMessage(status)
        );
      } else {
        // Fallback: Use centralized status service
        await JobStatusService.updateJobStatus(
          jobId, 
          status, 
          department, 
          this.mapCuttingStatusToWorkflowStatus(status), 
          userId, 
          statusMessage || this.getStatusMessage(status)
        );
      }
    } catch (error) {
      console.error('Error updating workflow status:', error);
      // Don't throw - this is a non-critical update
    }
  }

  /**
   * Log cutting transition to job_lifecycle_history
   */
  async logCuttingTransition(jobId, status, userId, notes) {
    try {
      await dbAdapter.query(`
        INSERT INTO job_lifecycle_history (
          job_card_id,
          department,
          status,
          status_message,
          updated_by,
          notes,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        jobId,
        'Cutting',
        status || 'Updated',
        this.getStatusMessage(status),
        userId,
        notes
      ]);
    } catch (error) {
      console.error('Error logging cutting transition:', error);
      // Don't throw - logging is non-critical
    }
  }

  /**
   * Handle cutting completed - move to next workflow step
   */
  async handleCuttingCompleted(jobId, userId) {
    try {
      const UnifiedWorkflowService = (await import('./unifiedWorkflowService.js')).default;
      const workflowService = new UnifiedWorkflowService();

      if (this.socketHandler) {
        workflowService.setSocketHandler(this.socketHandler);
      }

      // Find cutting step and move to next
      const workflowSteps = await workflowService.getJobWorkflow(jobId);
      const cuttingStep = workflowSteps.find(step => 
        step.department === 'Cutting' || step.step_name.toLowerCase().includes('cutting')
      );

      if (cuttingStep) {
        // Mark cutting as completed
        await dbAdapter.query(`
          UPDATE job_workflow_steps
          SET status = 'completed',
              completed_at = NOW(),
              updated_by = $1,
              updated_at = NOW()
          WHERE id = $2
        `, [userId, cuttingStep.id]);

        // Activate next step
        const nextStep = workflowSteps.find(step => 
          step.sequence_number === cuttingStep.sequence_number + 1
        );

        if (nextStep) {
          await dbAdapter.query(`
            UPDATE job_workflow_steps
            SET status = 'pending',
                status_message = $1,
                updated_at = NOW()
            WHERE id = $2
          `, [
            `Pending in ${nextStep.step_name} (${nextStep.department})`,
            nextStep.id
          ]);

          // Update job_cards using centralized status service
          await JobStatusService.updateFromWorkflowStep(
            jobId,
            'pending',
            nextStep.step_name,
            nextStep.department,
            userId
          );
        }
      }
    } catch (error) {
      console.error('Error handling cutting completed:', error);
    }
  }

  /**
   * Handle cutting rejected - return to previous step
   */
  async handleCuttingRejected(jobId, userId, comments) {
    try {
      const UnifiedWorkflowService = (await import('./unifiedWorkflowService.js')).default;
      const workflowService = new UnifiedWorkflowService();

      // Find cutting step and return to previous completed step
      const workflowSteps = await workflowService.getJobWorkflow(jobId);
      const cuttingStep = workflowSteps.find(step => 
        step.department === 'Cutting' || step.step_name.toLowerCase().includes('cutting')
      );

      if (cuttingStep) {
        // Mark cutting as revision_required
        await dbAdapter.query(`
          UPDATE job_workflow_steps
          SET status = 'revision_required',
              status_message = $1,
              updated_by = $2,
              updated_at = NOW()
          WHERE id = $3
        `, [
          `Revision Required - ${comments || 'Cutting rejected'}`,
          userId,
          cuttingStep.id
        ]);

        // Find previous completed step (usually CTP or QA)
        const previousStep = workflowSteps
          .filter(step => step.sequence_number < cuttingStep.sequence_number)
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

          // Update job_cards using centralized status service
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
      console.error('Error handling cutting rejected:', error);
    }
  }

  /**
   * Get status message for cutting status
   */
  getStatusMessage(status) {
    const messages = {
      'Pending': 'Awaiting cutting assignment',
      'Assigned': 'Assigned to cutting labor',
      'In Progress': 'Cutting In Progress',
      'On Hold': 'Cutting Paused',
      'Completed': 'Cutting Completed',
      'Rejected': 'Cutting Rejected'
    };
    return messages[status] || `${status} (Cutting Department)`;
  }

  /**
   * Map cutting status to workflow status
   */
  mapCuttingStatusToWorkflowStatus(cuttingStatus) {
    const mapping = {
      'Pending': 'pending',
      'Assigned': 'pending',
      'In Progress': 'in_progress',
      'On Hold': 'revision_required',
      'Completed': 'completed',
      'Rejected': 'revision_required'
    };
    return mapping[cuttingStatus] || 'pending';
  }

  /**
   * Map cutting status to job_cards.status
   */
  mapCuttingStatusToJobStatus(cuttingStatus) {
    const mapping = {
      'Pending': 'PENDING',
      'Assigned': 'PENDING',
      'In Progress': 'IN_PROGRESS',
      'On Hold': 'ON_HOLD',
      'Completed': 'PENDING', // Will move to next step
      'Rejected': 'PENDING' // Will return to previous step
    };
    return mapping[cuttingStatus] || 'PENDING';
  }

  /**
   * Get cutting assignment for a job
   */
  async getAssignment(jobId) {
    try {
      const result = await dbAdapter.query(`
        SELECT 
          ca.*,
          u_assigned."firstName" || ' ' || u_assigned."lastName" as assigned_labor_name,
          u_by."firstName" || ' ' || u_by."lastName" as assigned_by_name
        FROM cutting_assignments ca
        LEFT JOIN users u_assigned ON ca.assigned_to = u_assigned.id
        LEFT JOIN users u_by ON ca.assigned_by = u_by.id
        WHERE ca.job_id = $1
        ORDER BY ca.created_at DESC
        LIMIT 1
      `, [jobId]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting cutting assignment:', error);
      throw error;
    }
  }
}

export default CuttingWorkflowService;

