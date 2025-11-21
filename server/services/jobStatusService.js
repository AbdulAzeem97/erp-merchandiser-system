import dbAdapter from '../database/adapter.js';

/**
 * Centralized Job Status Service
 * Ensures consistent status updates across all departments and workflows
 * 
 * This service provides a single source of truth for job_cards.status updates
 * and maps department-specific statuses to the unified JobStatus enum.
 */
class JobStatusService {
  /**
   * Unified JobStatus enum values (from Prisma schema)
   */
  static JOB_STATUS = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    ON_HOLD: 'ON_HOLD',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
  };

  /**
   * Map department-specific statuses to unified JobStatus
   * This ensures consistency across all departments
   */
  static STATUS_MAPPING = {
    // Prepress Department
    'ASSIGNED': JobStatusService.JOB_STATUS.PENDING,
    'DESIGN_IN_PROGRESS': JobStatusService.JOB_STATUS.IN_PROGRESS,
    'HOD_REVIEW': JobStatusService.JOB_STATUS.IN_PROGRESS,
    'SUBMITTED_FOR_QA': JobStatusService.JOB_STATUS.IN_PROGRESS,
    'QA_REVIEW': JobStatusService.JOB_STATUS.IN_PROGRESS,
    'APPROVED_BY_QA': JobStatusService.JOB_STATUS.PENDING, // Ready for next step
    'REJECTED_BY_QA': JobStatusService.JOB_STATUS.PENDING, // Returned for revision
    'CTP_IN_PROGRESS': JobStatusService.JOB_STATUS.IN_PROGRESS,
    'CTP_COMPLETED': JobStatusService.JOB_STATUS.PENDING, // Ready for next step
    
    // Cutting Department
    'Pending': JobStatusService.JOB_STATUS.PENDING,
    'Assigned': JobStatusService.JOB_STATUS.PENDING,
    'In Progress': JobStatusService.JOB_STATUS.IN_PROGRESS,
    'On Hold': JobStatusService.JOB_STATUS.ON_HOLD,
    'Completed': JobStatusService.JOB_STATUS.PENDING, // Ready for next step
    'Rejected': JobStatusService.JOB_STATUS.PENDING, // Returned for revision
    
    // Production Department
    'PRODUCTION_PENDING': JobStatusService.JOB_STATUS.PENDING,
    'PRODUCTION_IN_PROGRESS': JobStatusService.JOB_STATUS.IN_PROGRESS,
    'PRODUCTION_ON_HOLD': JobStatusService.JOB_STATUS.ON_HOLD,
    'PRODUCTION_COMPLETED': JobStatusService.JOB_STATUS.PENDING,
    
    // Workflow Step Statuses
    'pending': JobStatusService.JOB_STATUS.PENDING,
    'in_progress': JobStatusService.JOB_STATUS.IN_PROGRESS,
    'submitted': JobStatusService.JOB_STATUS.IN_PROGRESS,
    'qa_review': JobStatusService.JOB_STATUS.IN_PROGRESS,
    'approved': JobStatusService.JOB_STATUS.PENDING,
    'revision_required': JobStatusService.JOB_STATUS.PENDING,
    'completed': JobStatusService.JOB_STATUS.PENDING, // Will move to next step
    
    // Direct mappings (already in correct format)
    'PENDING': JobStatusService.JOB_STATUS.PENDING,
    'IN_PROGRESS': JobStatusService.JOB_STATUS.IN_PROGRESS,
    'ON_HOLD': JobStatusService.JOB_STATUS.ON_HOLD,
    'COMPLETED': JobStatusService.JOB_STATUS.COMPLETED,
    'CANCELLED': JobStatusService.JOB_STATUS.CANCELLED
  };

  /**
   * Map any department-specific status to unified JobStatus
   * @param {string} departmentStatus - Department-specific status
   * @param {string} department - Department name (optional, for context)
   * @param {string} workflowStatus - Workflow step status (optional)
   * @returns {string} Unified JobStatus enum value
   */
  static mapToJobStatus(departmentStatus, department = null, workflowStatus = null) {
    // Priority: workflowStatus > departmentStatus
    const statusToMap = workflowStatus || departmentStatus;
    
    if (!statusToMap) {
      return JobStatusService.JOB_STATUS.PENDING;
    }

    // Direct mapping
    const mapped = JobStatusService.STATUS_MAPPING[statusToMap];
    if (mapped) {
      return mapped;
    }

    // Case-insensitive lookup
    const upperStatus = statusToMap.toUpperCase();
    for (const [key, value] of Object.entries(JobStatusService.STATUS_MAPPING)) {
      if (key.toUpperCase() === upperStatus) {
        return value;
      }
    }

    // Default based on keywords
    if (upperStatus.includes('PROGRESS') || upperStatus.includes('IN_PROGRESS') || upperStatus.includes('STARTED')) {
      return JobStatusService.JOB_STATUS.IN_PROGRESS;
    }
    if (upperStatus.includes('HOLD') || upperStatus.includes('PAUSED') || upperStatus.includes('STOPPED')) {
      return JobStatusService.JOB_STATUS.ON_HOLD;
    }
    if (upperStatus.includes('COMPLETED') || upperStatus.includes('FINISHED') || upperStatus.includes('DONE')) {
      return JobStatusService.JOB_STATUS.COMPLETED;
    }
    if (upperStatus.includes('CANCELLED') || upperStatus.includes('CANCELED')) {
      return JobStatusService.JOB_STATUS.CANCELLED;
    }

    // Default to PENDING
    return JobStatusService.JOB_STATUS.PENDING;
  }

  /**
   * Update job_cards.status consistently
   * This is the SINGLE POINT OF TRUTH for status updates
   * 
   * @param {number} jobId - Job card ID
   * @param {string} departmentStatus - Department-specific status
   * @param {string} department - Department name
   * @param {string} workflowStatus - Workflow step status (optional)
   * @param {number} updatedBy - User ID who made the update
   * @param {string} statusMessage - Human-readable status message (optional)
   * @returns {Promise<Object>} Update result
   */
  static async updateJobStatus(jobId, departmentStatus, department = null, workflowStatus = null, updatedBy = null, statusMessage = null) {
    try {
      // Map to unified status
      const unifiedStatus = JobStatusService.mapToJobStatus(departmentStatus, department, workflowStatus);
      
      console.log(`🔄 JobStatusService: Updating job ${jobId} status`);
      console.log(`   Department: ${department || 'N/A'}`);
      console.log(`   Department Status: ${departmentStatus || 'N/A'}`);
      console.log(`   Workflow Status: ${workflowStatus || 'N/A'}`);
      console.log(`   → Unified Status: ${unifiedStatus}`);

      // Build update query
      const updateFields = ['status = $1', '"updatedAt" = CURRENT_TIMESTAMP'];
      const updateParams = [unifiedStatus];
      let paramIndex = 2;

      // Update workflow fields if provided
      if (department) {
        updateFields.push(`current_department = $${paramIndex}`);
        updateParams.push(department);
        paramIndex++;
      }

      if (statusMessage) {
        updateFields.push(`status_message = $${paramIndex}`);
        updateParams.push(statusMessage);
        paramIndex++;
      }

      if (updatedBy) {
        updateFields.push(`last_updated_by = $${paramIndex}`);
        updateParams.push(updatedBy);
        paramIndex++;
      }

      updateParams.push(jobId);

      const updateQuery = `
        UPDATE job_cards
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
      `;

      const result = await dbAdapter.query(updateQuery, updateParams);

      console.log(`✅ JobStatusService: Successfully updated job ${jobId} to ${unifiedStatus}`);

      return {
        success: true,
        jobId,
        oldStatus: null, // Could be fetched if needed
        newStatus: unifiedStatus,
        departmentStatus,
        department,
        workflowStatus
      };
    } catch (error) {
      console.error(`❌ JobStatusService: Error updating job ${jobId} status:`, error);
      throw error;
    }
  }

  /**
   * Update job status based on workflow step status
   * Convenience method for workflow transitions
   * 
   * @param {number} jobId - Job card ID
   * @param {string} stepStatus - Workflow step status (pending, in_progress, completed, etc.)
   * @param {string} stepName - Step name
   * @param {string} department - Department name
   * @param {number} updatedBy - User ID
   * @returns {Promise<Object>} Update result
   */
  static async updateFromWorkflowStep(jobId, stepStatus, stepName, department, updatedBy) {
    const statusMessage = JobStatusService.getStatusMessage(stepStatus, stepName, department);
    return JobStatusService.updateJobStatus(jobId, null, department, stepStatus, updatedBy, statusMessage);
  }

  /**
   * Get friendly status message
   * @param {string} status - Status value
   * @param {string} stepName - Step name (optional)
   * @param {string} department - Department name (optional)
   * @returns {string} Friendly status message
   */
  static getStatusMessage(status, stepName = null, department = null) {
    const statusText = JobStatusService.STATUS_TEXT[status] || status;
    
    if (stepName && department) {
      return `${statusText} in ${stepName} (${department})`;
    } else if (stepName) {
      return `${statusText} in ${stepName}`;
    } else if (department) {
      return `${statusText} (${department})`;
    }
    
    return statusText;
  }

  /**
   * Status text mapping
   */
  static STATUS_TEXT = {
    pending: 'Pending',
    in_progress: 'In Progress',
    submitted: 'Submitted',
    qa_review: 'Under QA Review',
    approved: 'Approved',
    rejected: 'Rejected',
    revision_required: 'Revision Required',
    completed: 'Completed',
    inactive: 'Inactive'
  };

  /**
   * Sync job status from current workflow state
   * Useful for fixing inconsistencies or after workflow changes
   * 
   * @param {number} jobId - Job card ID
   * @returns {Promise<Object>} Sync result
   */
  static async syncJobStatusFromWorkflow(jobId) {
    try {
      // Get current workflow state
      const workflowQuery = `
        SELECT 
          jc.id,
          jc.current_department,
          jc.current_step,
          jc.workflow_status,
          jws.status as step_status,
          jws.step_name,
          jws.department
        FROM job_cards jc
        LEFT JOIN job_workflow_steps jws ON jc.id = jws.job_card_id 
          AND jws.status IN ('in_progress', 'pending', 'submitted', 'qa_review')
        WHERE jc.id = $1
        ORDER BY jws.sequence_number DESC
        LIMIT 1
      `;

      const result = await dbAdapter.query(workflowQuery, [jobId]);
      
      if (result.rows.length === 0) {
        throw new Error(`Job ${jobId} not found`);
      }

      const job = result.rows[0];
      
      // Update status based on workflow
      return await JobStatusService.updateFromWorkflowStep(
        jobId,
        job.step_status || job.workflow_status || 'pending',
        job.step_name || job.current_step,
        job.department || job.current_department,
        null // No specific user for sync
      );
    } catch (error) {
      console.error(`❌ JobStatusService: Error syncing job ${jobId}:`, error);
      throw error;
    }
  }
}

export default JobStatusService;

