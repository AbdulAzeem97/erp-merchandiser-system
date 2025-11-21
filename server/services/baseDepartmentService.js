import dbAdapter from '../database/adapter.js';
import JobStatusService from './jobStatusService.js';
import UnifiedWorkflowService from './unifiedWorkflowService.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Base Department Service
 * Provides common functionality for all department services
 * Ensures:
 * - All updates use UnifiedWorkflowService
 * - All updates write to job_lifecycle_history
 * - Status updates are consistent via JobStatusService
 * - Optional steps only activate if selected
 */
class BaseDepartmentService {
  constructor(departmentName, socketHandler = null) {
    this.department = departmentName;
    this.socketHandler = socketHandler;
    this.workflowService = null;
  }

  /**
   * Initialize workflow service
   */
  async initWorkflowService() {
    if (!this.workflowService) {
      this.workflowService = new UnifiedWorkflowService(this.socketHandler);
    }
    return this.workflowService;
  }

  /**
   * Get jobs for this department
   * Filters by current_department and active workflow steps
   */
  async getDepartmentJobs(filters = {}) {
    try {
      const { status, priority, assignedTo, dateRange } = filters;
      
      let query = `
        SELECT DISTINCT
          jc.id,
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
          p.product_type,
          c.name as company_name,
          c.name as customer_name
        FROM job_cards jc
        LEFT JOIN products p ON jc."productId" = p.id
        LEFT JOIN companies c ON jc."companyId" = c.id
        INNER JOIN job_workflow_steps jws ON jc.id = jws.job_card_id
        WHERE jc.current_department = $1
          AND jws.status IN ('pending', 'in_progress', 'submitted', 'qa_review')
          AND jws.department = $1
      `;
      
      const params = [this.department];
      let paramIndex = 2;

      if (status) {
        query += ` AND jws.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (assignedTo) {
        // Department-specific assignment logic
        query += ` AND EXISTS (
          SELECT 1 FROM job_assignments ja 
          WHERE ja.job_id = jc.id AND ja.assigned_to = $${paramIndex}
        )`;
        params.push(assignedTo);
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

      const result = await dbAdapter.query(query, params);
      return result.rows;
    } catch (error) {
      console.error(`Error getting ${this.department} jobs:`, error);
      throw error;
    }
  }

  /**
   * Update job status using UnifiedWorkflowService
   * Ensures workflow progression follows process sequence
   */
  async updateJobStatus(jobId, stepStatus, userId, notes = '') {
    try {
      await this.initWorkflowService();
      
      // Get current workflow step for this department
      const workflowSteps = await this.workflowService.getJobWorkflow(jobId);
      const currentStep = workflowSteps.find(step => 
        step.department === this.department && 
        step.status !== 'completed' && 
        step.status !== 'inactive'
      );

      if (!currentStep) {
        throw new Error(`No active step found for ${this.department} department in job ${jobId}`);
      }

      // Update workflow step status
      await dbAdapter.query(`
        UPDATE job_workflow_steps
        SET 
          status = $1,
          status_message = $2,
          updated_by = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [
        stepStatus,
        this.getStatusMessage(stepStatus, currentStep.step_name),
        userId,
        currentStep.id
      ]);

      // Update job_cards using JobStatusService
      await JobStatusService.updateFromWorkflowStep(
        jobId,
        stepStatus,
        currentStep.step_name,
        this.department,
        userId
      );

      // Log to job_lifecycle_history
      await this.logToHistory(jobId, currentStep.step_name, stepStatus, userId, notes);

      // Handle step completion and progression
      if (stepStatus === 'completed' || stepStatus === 'approved') {
        await this.progressToNextStep(jobId, currentStep, userId);
      }

      return { success: true };
    } catch (error) {
      console.error(`Error updating ${this.department} job status:`, error);
      throw error;
    }
  }

  /**
   * Progress to next step in process sequence
   * Only activates if step is not optional OR if it was selected
   */
  async progressToNextStep(jobId, completedStep, userId) {
    try {
      await this.initWorkflowService();
      
      const workflowSteps = await this.workflowService.getJobWorkflow(jobId);
      const nextStep = workflowSteps.find(step => 
        step.sequence_number === completedStep.sequence_number + 1
      );

      if (!nextStep) {
        // No more steps - job is completed
        await JobStatusService.updateJobStatus(
          jobId,
          'completed',
          null,
          'completed',
          userId,
          'Job Completed — Ready for Archive or Production Execution'
        );
        return;
      }

      // Check if next step is optional
      // Optional steps should only activate if they were selected during job creation
      // This is tracked in job_workflow_steps - if status is 'inactive', it's not selected
      if (nextStep.status === 'inactive') {
        // Skip optional step and move to next
        return this.progressToNextStep(jobId, nextStep, userId);
      }

      // Activate next step
      await this.workflowService.startStep(jobId, nextStep.sequence_number, userId);

      // Log progression
      await this.logToHistory(
        jobId,
        nextStep.step_name,
        'pending',
        userId,
        `Progressed to ${nextStep.step_name} (${nextStep.department})`
      );
    } catch (error) {
      console.error(`Error progressing to next step:`, error);
      throw error;
    }
  }

  /**
   * Log all updates to job_lifecycle_history
   * This is CRITICAL for audit trail
   */
  async logToHistory(jobId, stepName, status, userId, notes = '') {
    try {
      // Check if job_lifecycle_history table exists and get its structure
      const tableCheck = await dbAdapter.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'job_lifecycle_history'
      `);

      if (tableCheck.rows.length === 0) {
        console.warn('⚠️ job_lifecycle_history table does not exist, skipping history log');
        return;
      }

      const columns = tableCheck.rows.map(r => r.column_name);
      
      // Build insert query based on available columns
      let insertQuery;
      let params;

      if (columns.includes('job_card_id') && columns.includes('department') && columns.includes('status')) {
        // New schema with job_card_id
        insertQuery = `
          INSERT INTO job_lifecycle_history (
            job_card_id,
            department,
            status,
            status_message,
            updated_by,
            notes,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        `;
        params = [
          jobId,
          this.department,
          status,
          this.getStatusMessage(status, stepName),
          userId,
          notes || `Status updated to ${status} in ${stepName}`
        ];
      } else if (columns.includes('job_lifecycle_id')) {
        // Old schema with job_lifecycle_id
        // Try to get lifecycle_id from job_cards or create a reference
        insertQuery = `
          INSERT INTO job_lifecycle_history (
            job_lifecycle_id,
            status_from,
            status_to,
            notes,
            changed_by,
            changed_at
          ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        `;
        params = [
          jobId, // Using job_id as lifecycle_id reference
          'previous',
          status,
          notes || `Status updated to ${status} in ${stepName} (${this.department})`,
          userId
        ];
      } else {
        console.warn('⚠️ Unknown job_lifecycle_history schema, skipping history log');
        return;
      }

      await dbAdapter.query(insertQuery, params);
      console.log(`✅ Logged ${this.department} update to job_lifecycle_history for job ${jobId}`);
    } catch (error) {
      console.error(`❌ Error logging to job_lifecycle_history:`, error);
      // Don't throw - history logging failure shouldn't break workflow
    }
  }

  /**
   * Get status message
   */
  getStatusMessage(status, stepName) {
    const statusText = UnifiedWorkflowService.STATUS_TEXT[status] || status;
    return `${statusText} in ${stepName} (${this.department})`;
  }

  /**
   * Set socket handler for real-time updates
   */
  setSocketHandler(socketHandler) {
    this.socketHandler = socketHandler;
    console.log(`✅ ${this.department}: Socket handler set`, {
      hasSocketHandler: !!this.socketHandler,
      hasEmit: this.socketHandler && typeof this.socketHandler.emit === 'function',
      type: this.socketHandler ? this.socketHandler.constructor.name : 'null'
    });
    if (this.workflowService) {
      this.workflowService.setSocketHandler(socketHandler);
    }
  }
}

export default BaseDepartmentService;

