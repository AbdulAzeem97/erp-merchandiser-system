import dbAdapter from '../database/adapter.js';
import { v4 as uuidv4 } from 'uuid';
import { 
  getDepartmentForStep, 
  requiresQA, 
  getAutoAction 
} from '../config/workflowMapping.js';
import JobStatusService from './jobStatusService.js';

/**
 * Unified Workflow Service
 * Handles dynamic workflow generation and management based on product process sequences
 */
class UnifiedWorkflowService {
  constructor(socketHandler = null) {
    this.socketHandler = socketHandler;
  }

  setSocketHandler(socketHandler) {
    this.socketHandler = socketHandler;
  }

  /**
   * Status text mapping for friendly messages
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
   * Generate workflow steps from product process sequence
   * @param {string} jobCardId - Job card ID
   * @param {string} productId - Product ID
   * @returns {Promise<Array>} Generated workflow steps
   */
  async generateWorkflowFromProduct(jobCardId, productId) {
    try {
      console.log(`🔄 Generating workflow for job ${jobCardId} from product ${productId}`);

      // Get product and its process sequence (with default to Offset)
      const productQuery = `
        SELECT 
          p.id,
          p.product_type,
          p.name as product_name,
          COALESCE(
            -- First try: Get from product_process_selections (default sequence)
            (SELECT ps.id FROM product_process_selections pps
             JOIN process_sequences ps ON pps."sequenceId" = ps.id
             WHERE pps."productId" = p.id AND pps."isDefault" = true
             LIMIT 1),
            -- Second try: Match by product_type
            (SELECT ps.id FROM process_sequences ps 
             WHERE ps.name = p.product_type OR ps.name LIKE p.product_type || '%'
             LIMIT 1),
            -- Default: Use Offset sequence
            (SELECT ps.id FROM process_sequences ps 
             WHERE ps.name = 'Offset' OR ps.name LIKE 'Offset%'
             LIMIT 1)
          ) as sequence_id,
          COALESCE(
            (SELECT ps.name FROM product_process_selections pps
             JOIN process_sequences ps ON pps."sequenceId" = ps.id
             WHERE pps."productId" = p.id AND pps."isDefault" = true
             LIMIT 1),
            (SELECT ps.name FROM process_sequences ps 
             WHERE ps.name = p.product_type OR ps.name LIKE p.product_type || '%'
             LIMIT 1),
            'Offset'
          ) as sequence_name
        FROM products p
        WHERE p.id = $1
        LIMIT 1
      `;

      const productResult = await dbAdapter.query(productQuery, [productId]);
      
      if (productResult.rows.length === 0) {
        throw new Error(`Product not found: ${productId}`);
      }

      const product = productResult.rows[0];
      
      // If no sequence found, default to Offset
      if (!product.sequence_id) {
        console.log(`⚠️ No sequence found for product ${productId}, defaulting to Offset`);
        const offsetResult = await dbAdapter.query(`
          SELECT id, name FROM process_sequences 
          WHERE name = 'Offset' OR name LIKE 'Offset%'
          LIMIT 1
        `);
        if (offsetResult.rows.length > 0) {
          product.sequence_id = offsetResult.rows[0].id;
          product.sequence_name = offsetResult.rows[0].name;
        }
      }

      // Get process steps for this sequence
      let stepsQuery;
      let stepsParams;

      // Try different schema variations
      if (product.sequence_id) {
        // PostgreSQL schema with process_steps table
        stepsQuery = `
          SELECT 
            pst.id,
            pst.name as step_name,
            pst."stepNumber" as step_order,
            pst."isQualityCheck" as is_qa_required,
            pst.department,
            pst.department_id,
            pd.name as department_name
          FROM process_steps pst
          LEFT JOIN production_departments pd ON pst.department_id = pd.id
          WHERE pst."sequenceId" = $1 AND pst."isActive" = true
          ORDER BY pst."stepNumber" ASC
        `;
        stepsParams = [product.sequence_id];
      } else {
        // Fallback: Try to get from product_process_selections or use default
        stepsQuery = `
          SELECT 
            pst.id,
            pst.name as step_name,
            pst."stepNumber" as step_order,
            pst."isQualityCheck" as is_qa_required
          FROM process_steps pst
          JOIN process_sequences ps ON pst."sequenceId" = ps.id
          WHERE (ps.name = $1 OR ps.name LIKE $1 || '%') 
            AND pst."isActive" = true
          ORDER BY pst."stepNumber" ASC
        `;
        stepsParams = [product.product_type];
      }

      const stepsResult = await dbAdapter.query(stepsQuery, stepsParams);

      if (stepsResult.rows.length === 0) {
        console.log(`⚠️ No process steps found for sequence ${product.sequence_name}, using default workflow`);
        // Use default workflow with Prepress steps (Design, QA, CTP)
        return this.generateDefaultWorkflow(jobCardId, product.sequence_name || 'Offset');
      }

      // Generate workflow steps
      const workflowSteps = [];
      for (let i = 0; i < stepsResult.rows.length; i++) {
        const step = stepsResult.rows[i];
        const stepName = step.step_name;
        const sequenceNumber = i + 1;
        
        // Determine department
        let department = step.department_name || step.department;
        if (!department) {
          department = getDepartmentForStep(stepName);
        }

        // Check if QA is required
        const needsQA = step.is_qa_required || requiresQA(stepName);
        
        // Check for auto-action
        const autoAction = getAutoAction(stepName);

        // Determine initial status
        // Check if step is compulsory (required) or optional
        // Optional steps start as 'inactive' and only activate if selected
        // Required steps start as 'pending' (for first step) or 'inactive' (for others)
        let status = 'inactive';
        if (sequenceNumber === 1) {
          status = 'pending';
        }
        
        // Check if step is optional (not compulsory)
        // If process_steps has is_compulsory field, use it
        // Otherwise, assume all steps are required
        const isCompulsory = step.is_compulsory !== false; // Default to true if not specified

        workflowSteps.push({
          job_card_id: jobCardId,
          sequence_number: sequenceNumber,
          step_name: stepName,
          department: department,
          requires_qa: needsQA,
          auto_action: !!autoAction,
          is_compulsory: isCompulsory,
          status: status,
          status_message: this.generateStatusMessage(status, stepName, department)
        });
      }

      // Insert workflow steps into database
      await this.insertWorkflowSteps(workflowSteps);

      // Update job_cards with initial workflow state
      if (workflowSteps.length > 0) {
        const firstStep = workflowSteps[0];
        await dbAdapter.query(`
          UPDATE job_cards
          SET 
            current_step = $1,
            current_department = $2,
            workflow_status = $3,
            status_message = $4
          WHERE id = $5
        `, [
          firstStep.step_name,
          firstStep.department,
          firstStep.status,
          firstStep.status_message,
          jobCardId
        ]);
      }

      console.log(`✅ Generated ${workflowSteps.length} workflow steps for job ${jobCardId}`);
      return workflowSteps;

    } catch (error) {
      console.error('❌ Error generating workflow:', error);
      throw error;
    }
  }

  /**
   * Generate default workflow if no process sequence exists
   * Default includes Prepress steps: Design, QA Review (Prepress), CTP (Plate Making)
   */
  async generateDefaultWorkflow(jobCardId, productType) {
    const defaultSteps = [
      { name: 'Design', department: 'Prepress', requires_qa: false },
      { name: 'QA Review (Prepress)', department: 'Prepress', requires_qa: false },
      { name: 'CTP', department: 'Prepress', requires_qa: false, auto_action: true },
      { name: 'Plate Making', department: 'Prepress', requires_qa: false },
      { name: 'Printing', department: 'Production', requires_qa: false },
      { name: 'Cutting', department: 'Cutting', requires_qa: false },
      { name: 'Final QA', department: 'QA', requires_qa: false },
      { name: 'Dispatch', department: 'Logistics', requires_qa: false }
    ];

    const workflowSteps = defaultSteps.map((step, index) => ({
      job_card_id: jobCardId,
      sequence_number: index + 1,
      step_name: step.name,
      department: step.department,
      requires_qa: step.requires_qa || false,
      auto_action: step.auto_action || false,
      status: index === 0 ? 'pending' : 'inactive',
      status_message: this.generateStatusMessage(
        index === 0 ? 'pending' : 'inactive',
        step.name,
        step.department
      )
    }));

    await this.insertWorkflowSteps(workflowSteps);
    return workflowSteps;
  }

  /**
   * Insert workflow steps into database
   * Optional steps are marked as 'inactive' and only activate if selected
   */
  async insertWorkflowSteps(steps) {
    for (const step of steps) {
      // Check if step has is_compulsory field in database schema
      // If not, we'll add it as a comment or use a workaround
      try {
        await dbAdapter.query(`
          INSERT INTO job_workflow_steps (
            job_card_id,
            sequence_number,
            step_name,
            department,
            requires_qa,
            auto_action,
            status,
            status_message
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (job_card_id, sequence_number) DO NOTHING
        `, [
          step.job_card_id,
          step.sequence_number,
          step.step_name,
          step.department,
          step.requires_qa,
          step.auto_action,
          step.status,
          step.status_message
        ]);
      } catch (error) {
        // If column doesn't exist, try without is_compulsory
        console.log('Inserting workflow step (is_compulsory may not be in schema):', step.step_name);
        await dbAdapter.query(`
          INSERT INTO job_workflow_steps (
            job_card_id,
            sequence_number,
            step_name,
            department,
            requires_qa,
            auto_action,
            status,
            status_message
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (job_card_id, sequence_number) DO NOTHING
        `, [
          step.job_card_id,
          step.sequence_number,
          step.step_name,
          step.department,
          step.requires_qa || false,
          step.auto_action || false,
          step.status,
          step.status_message
        ]);
      }
    }
  }

  /**
   * Generate status message
   * Format: ${friendlyStatusText} in ${step_name} (${department})
   */
  generateStatusMessage(status, stepName, department) {
    const friendlyStatus = UnifiedWorkflowService.STATUS_TEXT[status] || status;
    return `${friendlyStatus} in ${stepName} (${department})`;
  }

  /**
   * Start a workflow step
   */
  async startStep(jobCardId, sequenceNumber, userId) {
    try {
      const step = await this.getWorkflowStep(jobCardId, sequenceNumber);
      
      if (!step) {
        throw new Error(`Workflow step not found for job ${jobCardId}, step ${sequenceNumber}`);
      }

      if (step.status !== 'pending') {
        throw new Error(`Cannot start step. Current status: ${step.status}`);
      }

      const newStatus = 'in_progress';
      const statusMessage = this.generateStatusMessage(newStatus, step.step_name, step.department);

      // Update workflow step
      await dbAdapter.query(`
        UPDATE job_workflow_steps
        SET 
          status = $1,
          status_message = $2,
          started_at = CURRENT_TIMESTAMP,
          updated_by = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE job_card_id = $4 AND sequence_number = $5
      `, [newStatus, statusMessage, userId, jobCardId, sequenceNumber]);

      // Update job_cards using centralized status service
      await JobStatusService.updateFromWorkflowStep(jobCardId, newStatus, step.step_name, step.department, userId);

      // Log to history
      await this.logWorkflowTransition(jobCardId, sequenceNumber, 'pending', newStatus, userId);

      return { success: true, step: { ...step, status: newStatus, status_message: statusMessage } };
    } catch (error) {
      console.error('❌ Error starting step:', error);
      throw error;
    }
  }

  /**
   * Submit step to QA
   */
  async submitToQA(jobCardId, sequenceNumber, userId) {
    try {
      const step = await this.getWorkflowStep(jobCardId, sequenceNumber);
      
      if (!step.requires_qa) {
        throw new Error(`Step ${step.step_name} does not require QA review`);
      }

      if (step.status !== 'in_progress') {
        throw new Error(`Cannot submit to QA. Current status: ${step.status}`);
      }

      const newStatus = 'submitted';
      const statusMessage = `Submitted for QA in ${step.department}`;

      await dbAdapter.query(`
        UPDATE job_workflow_steps
        SET 
          status = $1,
          status_message = $2,
          updated_by = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE job_card_id = $4 AND sequence_number = $5
      `, [newStatus, statusMessage, userId, jobCardId, sequenceNumber]);

      // Update to qa_review if QA is required
      await dbAdapter.query(`
        UPDATE job_workflow_steps
        SET status = 'qa_review'
        WHERE job_card_id = $1 AND sequence_number = $2 AND requires_qa = true
      `, [jobCardId, sequenceNumber]);

      await dbAdapter.query(`
        UPDATE job_cards
        SET 
          workflow_status = 'submitted',
          status_message = $1,
          last_updated_by = $2,
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [statusMessage, userId, jobCardId]);

      await this.logWorkflowTransition(jobCardId, sequenceNumber, 'in_progress', 'submitted', userId);

      return { success: true };
    } catch (error) {
      console.error('❌ Error submitting to QA:', error);
      throw error;
    }
  }

  /**
   * Approve step (QA approval)
   */
  async approveStep(jobCardId, sequenceNumber, userId, notes = '') {
    try {
      const step = await this.getWorkflowStep(jobCardId, sequenceNumber);
      
      if (!['submitted', 'qa_review'].includes(step.status)) {
        throw new Error(`Cannot approve step. Current status: ${step.status}`);
      }

      const newStatus = 'approved';
      const statusMessage = this.generateStatusMessage(newStatus, step.step_name, step.department);

      // Update current step to approved
      await dbAdapter.query(`
        UPDATE job_workflow_steps
        SET 
          status = $1,
          status_message = $2,
          completed_at = CURRENT_TIMESTAMP,
          updated_by = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE job_card_id = $4 AND sequence_number = $5
      `, [newStatus, statusMessage, userId, jobCardId, sequenceNumber]);

      // Move to completed
      await dbAdapter.query(`
        UPDATE job_workflow_steps
        SET status = 'completed'
        WHERE job_card_id = $1 AND sequence_number = $2
      `, [jobCardId, sequenceNumber]);

      // Activate next step
      const nextStep = await this.getNextWorkflowStep(jobCardId, sequenceNumber);
      if (nextStep) {
        await dbAdapter.query(`
          UPDATE job_workflow_steps
          SET 
            status = 'pending',
            status_message = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE job_card_id = $2 AND sequence_number = $3
        `, [
          this.generateStatusMessage('pending', nextStep.step_name, nextStep.department),
          jobCardId,
          nextStep.sequence_number
        ]);

        // Special handling for Cutting department
        if (nextStep.department === 'Cutting') {
          // Auto-activate Cutting workflow
          const CuttingWorkflowService = (await import('./cuttingWorkflowService.js')).default;
          const cuttingService = new CuttingWorkflowService();
          
          if (this.socketHandler) {
            cuttingService.setSocketHandler(this.socketHandler);
          }

          // Create initial cutting assignment (Pending status)
          try {
            await dbAdapter.query(`
              INSERT INTO cutting_assignments (job_id, assigned_by, status)
              VALUES ($1, $2, 'Pending')
              ON CONFLICT (job_id) DO NOTHING
            `, [jobCardId, userId]);
          } catch (error) {
            // Ignore if assignment already exists
            console.log('Cutting assignment may already exist');
          }

          // Update job_cards using centralized status service
          await JobStatusService.updateFromWorkflowStep(
            jobCardId,
            'pending',
            nextStep.step_name,
            nextStep.department,
            userId
          );

          // Emit notification for HOD Cutting
          if (this.socketHandler) {
            this.socketHandler.emit('cutting:job_ready', {
              jobId: jobCardId,
              step: nextStep.step_name,
              department: nextStep.department
            });
            
            // Notify HOD Cutting role users
            this.socketHandler.emit('notification', {
              type: 'cutting_job_ready',
              title: 'New Job Ready for Cutting',
              message: `A job has been approved and is ready for cutting assignment`,
              jobId: jobCardId,
              timestamp: new Date().toISOString()
            });
          }
        } else {
          // Update job_cards using centralized status service
          await JobStatusService.updateFromWorkflowStep(
            jobCardId,
            'pending',
            nextStep.step_name,
            nextStep.department,
            userId
          );
        }
      } else {
        // No more steps - job is completed
        await JobStatusService.updateJobStatus(
          jobCardId,
          'completed',
          null,
          'completed',
          userId,
          'Job Completed — Ready for Archive or Production Execution'
        );
      }

      await this.logWorkflowTransition(jobCardId, sequenceNumber, step.status, 'approved', userId, notes);

      return { success: true, nextStep };
    } catch (error) {
      console.error('❌ Error approving step:', error);
      throw error;
    }
  }

  /**
   * Reject step (QA rejection)
   */
  async rejectStep(jobCardId, sequenceNumber, userId, notes = '') {
    try {
      const step = await this.getWorkflowStep(jobCardId, sequenceNumber);
      
      if (!['submitted', 'qa_review'].includes(step.status)) {
        throw new Error(`Cannot reject step. Current status: ${step.status}`);
      }

      // Find previous completed step
      const previousStep = await this.getPreviousCompletedStep(jobCardId, sequenceNumber);
      
      if (!previousStep) {
        // If no previous step, go back to current step
        const newStatus = 'revision_required';
        const statusMessage = `Revision Required - Back to ${step.step_name} (${step.department})`;

        await dbAdapter.query(`
          UPDATE job_workflow_steps
          SET 
            status = $1,
            status_message = $2,
            updated_by = $3,
            updated_at = CURRENT_TIMESTAMP
          WHERE job_card_id = $4 AND sequence_number = $5
        `, [newStatus, statusMessage, userId, jobCardId, sequenceNumber]);

        // Update job_cards using centralized status service
        await JobStatusService.updateFromWorkflowStep(
          jobCardId,
          'revision_required',
          step.step_name,
          step.department,
          userId
        );
      } else {
        // Go back to previous step
        const newStatus = 'revision_required';
        const statusMessage = `Revision Required - Back to ${previousStep.step_name} (${previousStep.department})`;

        // Reset current step
        await dbAdapter.query(`
          UPDATE job_workflow_steps
          SET 
            status = 'revision_required',
            status_message = $1,
            updated_by = $2,
            updated_at = CURRENT_TIMESTAMP
          WHERE job_card_id = $3 AND sequence_number = $4
        `, [statusMessage, userId, jobCardId, sequenceNumber]);

        // Reactivate previous step
        await dbAdapter.query(`
          UPDATE job_workflow_steps
          SET 
            status = 'pending',
            status_message = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE job_card_id = $2 AND sequence_number = $3
        `, [
          this.generateStatusMessage('pending', previousStep.step_name, previousStep.department),
          jobCardId,
          previousStep.sequence_number
        ]);

        // Update job_cards using centralized status service
        await JobStatusService.updateFromWorkflowStep(
          jobCardId,
          'revision_required',
          previousStep.step_name,
          previousStep.department,
          userId
        );
      }

      await this.logWorkflowTransition(jobCardId, sequenceNumber, step.status, 'revision_required', userId, notes);

      return { success: true };
    } catch (error) {
      console.error('❌ Error rejecting step:', error);
      throw error;
    }
  }

  /**
   * Get workflow step
   */
  async getWorkflowStep(jobCardId, sequenceNumber) {
    const result = await dbAdapter.query(`
      SELECT * FROM job_workflow_steps
      WHERE job_card_id = $1 AND sequence_number = $2
    `, [jobCardId, sequenceNumber]);
    
    return result.rows[0] || null;
  }

  /**
   * Get next workflow step
   */
  async getNextWorkflowStep(jobCardId, currentSequenceNumber) {
    const result = await dbAdapter.query(`
      SELECT * FROM job_workflow_steps
      WHERE job_card_id = $1 AND sequence_number > $2
      ORDER BY sequence_number ASC
      LIMIT 1
    `, [jobCardId, currentSequenceNumber]);
    
    return result.rows[0] || null;
  }

  /**
   * Get previous completed step
   */
  async getPreviousCompletedStep(jobCardId, currentSequenceNumber) {
    const result = await dbAdapter.query(`
      SELECT * FROM job_workflow_steps
      WHERE job_card_id = $1 
        AND sequence_number < $2
        AND status = 'completed'
      ORDER BY sequence_number DESC
      LIMIT 1
    `, [jobCardId, currentSequenceNumber]);
    
    return result.rows[0] || null;
  }

  /**
   * Get all workflow steps for a job
   */
  async getJobWorkflow(jobCardId) {
    const result = await dbAdapter.query(`
      SELECT * FROM job_workflow_steps
      WHERE job_card_id = $1
      ORDER BY sequence_number ASC
    `, [jobCardId]);
    
    return result.rows;
  }

  /**
   * Log workflow transition to history
   * MANDATORY: All workflow updates must be logged to job_lifecycle_history
   */
  async logWorkflowTransition(jobCardId, sequenceNumber, fromStatus, toStatus, userId, notes = '') {
    try {
      const step = await this.getWorkflowStep(jobCardId, sequenceNumber);
      
      // Check table structure first
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
      let insertQuery;
      let params;

      // Try new schema first (with job_card_id)
      if (columns.includes('job_card_id') && columns.includes('department')) {
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
          jobCardId,
          step?.department || '',
          toStatus,
          this.generateStatusMessage(toStatus, step?.step_name || '', step?.department || ''),
          userId,
          notes || `Status changed from ${fromStatus} to ${toStatus} in ${step?.step_name || ''}`
        ];
      } else if (columns.includes('job_lifecycle_id')) {
        // Old schema with job_lifecycle_id
        insertQuery = `
          INSERT INTO job_lifecycle_history (
            job_lifecycle_id,
            from_status,
            to_status,
            department,
            process,
            changed_by,
            change_reason,
            metadata,
            changed_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
        `;
        params = [
          jobCardId, // Using job_id as lifecycle_id reference
          fromStatus,
          toStatus,
          step?.department || '',
          step?.step_name || '',
          userId,
          notes || `Status changed from ${fromStatus} to ${toStatus}`,
          JSON.stringify({ sequence_number: sequenceNumber, step_name: step?.step_name })
        ];
      } else {
        console.warn('⚠️ Unknown job_lifecycle_history schema, attempting generic insert');
        // Generic fallback
        insertQuery = `
          INSERT INTO job_lifecycle_history (
            job_card_id,
            status,
            notes,
            updated_by,
            created_at
          ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        `;
        params = [
          jobCardId,
          toStatus,
          notes || `Status changed from ${fromStatus} to ${toStatus} in ${step?.step_name || ''} (${step?.department || ''})`,
          userId
        ];
      }

      await dbAdapter.query(insertQuery, params);
      console.log(`✅ Logged workflow transition to job_lifecycle_history: ${fromStatus} → ${toStatus} for job ${jobCardId}`);
    } catch (error) {
      console.error('❌ Error logging workflow transition:', error);
      // Don't throw - logging failure shouldn't break workflow, but log it
      console.error('⚠️ Workflow update succeeded but history logging failed - this should be investigated');
    }
  }

  /**
   * Auto-complete step (e.g., after CTP generation)
   */
  async autoCompleteStep(jobCardId, actionType, userId) {
    try {
      console.log(`🔄 Auto-completing step for job ${jobCardId}, action: ${actionType}`);
      
      // Find current CTP step or step with auto_action
      // Priority: 1) CTP step by name/department, 2) Step with auto_action flag
      let result = await dbAdapter.query(`
        SELECT * FROM job_workflow_steps
        WHERE job_card_id = $1 
          AND (
            (step_name ILIKE '%CTP%' OR step_name ILIKE '%Plate%' OR department = 'Prepress')
            OR auto_action = true
          )
          AND status IN ('pending', 'in_progress', 'approved', 'submitted')
        ORDER BY 
          CASE 
            WHEN step_name ILIKE '%CTP%' OR step_name ILIKE '%Plate%' THEN 1
            WHEN auto_action = true THEN 2
            ELSE 3
          END,
          sequence_number ASC
        LIMIT 1
      `, [jobCardId]);

      // If no CTP step found, try to find any in-progress step in Prepress
      if (result.rows.length === 0) {
        result = await dbAdapter.query(`
          SELECT * FROM job_workflow_steps
          WHERE job_card_id = $1 
            AND department = 'Prepress'
            AND status IN ('pending', 'in_progress', 'approved', 'submitted')
          ORDER BY sequence_number DESC
          LIMIT 1
        `, [jobCardId]);
      }

      if (result.rows.length === 0) {
        console.log(`⚠️ No step found to auto-complete for job ${jobCardId}`);
        return { success: false, message: 'No step found to auto-complete' };
      }

      const step = result.rows[0];
      console.log(`✅ Found step to complete: ${step.step_name} (${step.department}), sequence: ${step.sequence_number}`);
      
      // Complete the step
      await dbAdapter.query(`
        UPDATE job_workflow_steps
        SET 
          status = 'completed',
          status_message = $1,
          completed_at = CURRENT_TIMESTAMP,
          updated_by = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE job_card_id = $3 AND sequence_number = $4
      `, [
        this.generateStatusMessage('completed', step.step_name, step.department),
        userId,
        jobCardId,
        step.sequence_number
      ]);

      // Activate next step
      const nextStep = await this.getNextWorkflowStep(jobCardId, step.sequence_number);
      if (nextStep) {
        // Check if next step is a cutting step (by name or department)
        const isCuttingStep = nextStep.department === 'Cutting' || 
                              nextStep.step_name.toLowerCase().includes('cut') ||
                              nextStep.step_name.toLowerCase().includes('cutting') ||
                              nextStep.step_name.toLowerCase().includes('trim') ||
                              nextStep.step_name.toLowerCase().includes('die');
        
        // Special handling for Cutting department
        if (isCuttingStep) {
          // Fix department if it's wrong
          if (nextStep.department !== 'Cutting') {
            console.log(`⚠️ Fixing department for step "${nextStep.step_name}" from "${nextStep.department}" to "Cutting"`);
            await dbAdapter.query(`
              UPDATE job_workflow_steps
              SET department = 'Cutting'
              WHERE job_card_id = $1 AND sequence_number = $2
            `, [jobCardId, nextStep.sequence_number]);
            nextStep.department = 'Cutting'; // Update local reference
          }
          // Auto-activate Cutting workflow
          const CuttingWorkflowService = (await import('./cuttingWorkflowService.js')).default;
          const cuttingService = new CuttingWorkflowService();
          
          if (this.socketHandler) {
            cuttingService.setSocketHandler(this.socketHandler);
          }

          // Create initial cutting assignment (Pending status)
          try {
            await dbAdapter.query(`
              INSERT INTO cutting_assignments (job_id, assigned_by, status)
              VALUES ($1, $2, 'Pending')
              ON CONFLICT (job_id) DO UPDATE SET status = 'Pending', updated_at = NOW()
            `, [jobCardId, userId]);
          } catch (error) {
            // Log but don't fail if assignment already exists
            console.log('Cutting assignment creation:', error.message);
          }

          // Update job_cards using centralized status service
          await JobStatusService.updateFromWorkflowStep(
            jobCardId,
            'pending',
            nextStep.step_name,
            nextStep.department,
            userId
          );

          // Update workflow step to pending
          await dbAdapter.query(`
            UPDATE job_workflow_steps
            SET 
              status = 'pending',
              status_message = $1,
              updated_at = CURRENT_TIMESTAMP
            WHERE job_card_id = $2 AND sequence_number = $3
          `, [
            this.generateStatusMessage('pending', nextStep.step_name, nextStep.department),
            jobCardId,
            nextStep.sequence_number
          ]);

          // Emit notification for HOD Cutting
          if (this.socketHandler) {
            this.socketHandler.emit('cutting:job_ready', {
              jobId: jobCardId,
              step: nextStep.step_name,
              department: nextStep.department
            });
            
            // Notify HOD Cutting role users
            this.socketHandler.emit('notification', {
              type: 'cutting_job_ready',
              title: 'New Job Ready for Cutting',
              message: `A job has been approved and is ready for cutting assignment`,
              jobId: jobCardId,
              timestamp: new Date().toISOString()
            });
          }
        } else {
          // For non-Cutting steps, use normal startStep
          await this.startStep(jobCardId, nextStep.sequence_number, userId);
        }
      }

      return { success: true, step, nextStep };
    } catch (error) {
      console.error('❌ Error auto-completing step:', error);
      throw error;
    }
  }
}

export default UnifiedWorkflowService;

