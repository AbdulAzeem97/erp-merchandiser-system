import dbAdapter from '../database/adapter.js';
import BaseDepartmentService from './baseDepartmentService.js';
import JobStatusService from './jobStatusService.js';

/**
 * Offset Printing Workflow Service
 * Handles Offset Printing department operations
 * - Only shows jobs where "Offset Printing" step is selected in process sequence
 * - Uses machines already selected by designer (from job_ctp_machines)
 * - Complete job information display
 */
class OffsetPrintingWorkflowService extends BaseDepartmentService {
  constructor(socketHandler = null) {
    super('Offset Printing', socketHandler);
  }

  /**
   * Get Offset Printing jobs with improved logic
   * Returns jobs where:
   * - "Offset Printing" step is selected in process sequence (job_process_selections)
   * - Cutting is completed (via cutting_assignments OR workflow steps)
   * - Includes jobs even if workflow steps don't exist yet (will generate them)
   */
  async getOffsetPrintingJobs(filters = {}) {
    try {
      console.log('🖨️ Offset Printing: getOffsetPrintingJobs called with filters:', filters);
      const { status, priority, assignedTo, dateRange, machineId } = filters;
      
      let query = `
        SELECT DISTINCT
          jc.id,
          jc.id as job_card_id,
          jc."jobNumber",
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
          jc.final_design_link,
          -- Ratio report data from ratio_reports table
          rr.id as ratio_report_id,
          rr.excel_file_link as ratio_excel_link,
          rr.excel_file_name as ratio_excel_file_name,
          rr.factory_name as ratio_factory_name,
          rr.po_number as ratio_po_number,
          rr.job_number as ratio_job_number,
          rr.brand_name as ratio_brand_name,
          rr.item_name as ratio_item_name,
          rr.report_date as ratio_report_date,
          rr.total_ups as ratio_total_ups,
          rr.total_sheets as ratio_total_sheets,
          rr.total_plates as ratio_total_plates,
          rr.qty_produced as ratio_qty_produced,
          rr.excess_qty as ratio_excess_qty,
          rr.efficiency_percentage as ratio_efficiency_percentage,
          rr.excess_percentage as ratio_excess_percentage,
          rr.required_order_qty as ratio_required_order_qty,
          rr.color_details as ratio_color_details,
          rr.plate_distribution as ratio_plate_distribution,
          rr.color_efficiency as ratio_color_efficiency,
          rr.raw_excel_data as ratio_raw_excel_data,
          -- Item specifications (if stored separately, adjust as needed)
          NULL as item_specifications_excel_link,
          NULL as item_specifications_data,
          p.sku as product_code,
          p.name as product_name,
          p.brand as product_brand,
          p.gsm as product_gsm,
          m.name as material_name,
          c.name as company_name,
          c.email as company_email,
          c.phone as company_phone,
          c.address as company_address,
          opa.id as assignment_id,
          opa.status as offset_status,
          opa.assigned_to as offset_assigned_to,
          opa.assigned_by as offset_assigned_by,
          opa.comments as offset_comments,
          opa.started_at as offset_started_at,
          opa.completed_at as offset_completed_at,
          opa.ctp_machine_id as assigned_machine_id,
          u_assigned."firstName" || ' ' || u_assigned."lastName" as assigned_operator_name,
          u_assigned.email as assigned_operator_email,
          u_by."firstName" || ' ' || u_by."lastName" as assigned_by_name,
          COALESCE(jc.current_department, '') as current_department,
          COALESCE(jc.current_step, '') as current_step,
          COALESCE(jc.workflow_status, '') as workflow_status,
          COALESCE(jc.status_message, '') as status_message,
          -- Get date when received in offset (cutting completed_at or workflow step activated_at)
          COALESCE(
            (SELECT completed_at FROM job_workflow_steps 
             WHERE job_card_id = jc.id AND department = 'Cutting' AND status = 'completed' 
             ORDER BY completed_at DESC LIMIT 1),
            (SELECT finished_at FROM cutting_assignments 
             WHERE job_id = jc.id AND status = 'Completed' 
             ORDER BY finished_at DESC LIMIT 1),
            (SELECT updated_at FROM job_workflow_steps 
             WHERE job_card_id = jc.id AND step_name ILIKE '%Offset Printing%' 
             ORDER BY updated_at ASC LIMIT 1),
            jc."updatedAt"
          ) as received_at_offset,
          -- Prepress job info
          pj.id as prepress_job_id,
          pj.required_plate_count,
          -- Planning info
          jpp.planning_status,
          jpp.final_total_sheets,
          jpp.blanks_per_sheet,
          jpp.selected_sheet_size_id,
          pj.blank_width_mm,
          pj.blank_height_mm,
          pj.blank_width_inches,
          pj.blank_height_inches,
          pj.blank_size_unit,
          -- Check if workflow steps exist
          (SELECT COUNT(*) FROM job_workflow_steps WHERE job_card_id = jc.id) as has_workflow_steps,
          -- Check if Offset Printing workflow step exists
          (SELECT COUNT(*) FROM job_workflow_steps 
           WHERE job_card_id = jc.id 
           AND (step_name ILIKE '%Offset Printing%' OR step_name = 'Offset Printing')) as has_offset_step
        FROM job_cards jc
        LEFT JOIN products p ON jc."productId" = p.id
        LEFT JOIN companies c ON jc."companyId" = c.id
        LEFT JOIN materials m ON p.material_id = m.id
        LEFT JOIN offset_printing_assignments opa ON jc.id = opa.job_card_id
        LEFT JOIN users u_assigned ON opa.assigned_to = u_assigned.id
        LEFT JOIN users u_by ON opa.assigned_by = u_by.id
        LEFT JOIN prepress_jobs pj ON jc.id = pj.job_card_id
        LEFT JOIN job_production_planning jpp ON CAST(jc.id AS TEXT) = CAST(jpp.job_card_id AS TEXT)
        LEFT JOIN ratio_reports rr ON jc.id = rr.job_card_id
        WHERE 
          -- Offset Printing must be selected in process sequence
          EXISTS (
            SELECT 1 FROM job_process_selections jps
            JOIN process_steps pst ON jps."processStepId" = pst.id
            WHERE jps."jobId" = jc.id
              AND jps.is_selected = true
              AND (pst.name ILIKE '%Offset Printing%' OR pst.name = 'Offset Printing')
          )
          AND (
            -- Option 1: Job is already in Offset Printing department
            jc.current_department = 'Offset Printing'
            OR
            -- Option 2: Cutting is completed (via workflow steps)
            EXISTS (
              SELECT 1 FROM job_workflow_steps jws3
              WHERE jws3.job_card_id = jc.id
                AND (jws3.department = 'Cutting' OR jws3.step_name ILIKE '%Cutting%' OR jws3.step_name ILIKE '%Paper Cutting%')
                AND jws3.status = 'completed'
            )
            OR
            -- Option 3: Cutting is completed (via cutting_assignments)
            EXISTS (
              SELECT 1 FROM cutting_assignments ca
              WHERE ca.job_id = jc.id
                AND ca.status = 'Completed'
            )
            OR
            -- Option 4: Job is in Cutting department with planning (ready for next step)
            (
              jc.current_department = 'Cutting'
              AND EXISTS (
                SELECT 1 FROM job_production_planning jpp2
                WHERE jpp2.job_card_id = jc.id
                  AND jpp2.planning_status IN ('APPLIED', 'PLANNED')
              )
            )
            OR
            -- Option 5: Job is in Cutting department and status indicates work is done
            (
              jc.current_department = 'Cutting'
              AND jc.status IN ('IN_PROGRESS', 'COMPLETED')
            )
          )
      `;
      
      const params = [];
      let paramIndex = 1;

      if (status) {
        query += ` AND (opa.status = $${paramIndex} OR (opa.status IS NULL AND $${paramIndex} = 'Pending'))`;
        params.push(status);
        paramIndex++;
      }

      if (assignedTo) {
        query += ` AND opa.assigned_to = $${paramIndex}`;
        params.push(assignedTo);
        paramIndex++;
      }

      if (machineId) {
        query += ` AND opa.ctp_machine_id = $${paramIndex}`;
        params.push(machineId);
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

      const result = await dbAdapter.query(query, params);
      
      // For jobs without workflow steps, generate them on-the-fly
      const jobsWithWorkflow = await Promise.all(result.rows.map(async (job) => {
        // If workflow steps don't exist, try to generate them
        if (parseInt(job.has_workflow_steps) === 0) {
          console.log(`⚠️ Job ${job.jobNumber} has no workflow steps, attempting to generate...`);
          try {
            const UnifiedWorkflowService = (await import('./unifiedWorkflowService.js')).default;
            const workflowService = new UnifiedWorkflowService();
            await workflowService.generateWorkflowFromProduct(job.id, job.productId);
            console.log(`✅ Generated workflow steps for job ${job.jobNumber}`);
          } catch (error) {
            console.error(`❌ Failed to generate workflow for job ${job.jobNumber}:`, error.message);
          }
        }
        return job;
      }));
      
      // Enhance jobs with designer-selected machines
      const enhancedJobs = await Promise.all(jobsWithWorkflow.map(async (job) => {
        // Fetch machines from job_ctp_machines (designer-selected machines)
        let machines = [];
        if (job.prepress_job_id) {
          try {
            const machinesResult = await dbAdapter.query(`
              SELECT 
                jcm.*,
                cm.machine_code,
                cm.machine_name,
                cm.machine_type,
                cm.manufacturer,
                cm.model,
                cm.location,
                cm.max_plate_size
              FROM job_ctp_machines jcm
              JOIN ctp_machines cm ON jcm.ctp_machine_id = cm.id
              WHERE jcm.prepress_job_id = $1
              ORDER BY jcm.created_at
            `, [job.prepress_job_id]);
            
            machines = machinesResult.rows.map(m => ({
              id: m.ctp_machine_id,
              machine_code: m.machine_code,
              machine_name: m.machine_name,
              machine_type: m.machine_type,
              manufacturer: m.manufacturer,
              model: m.model,
              location: m.location,
              max_plate_size: m.max_plate_size,
              plate_count: m.plate_count
            }));
          } catch (error) {
            console.error(`Error fetching machines for job ${job.id}:`, error);
          }
        }

        // Parse and structure ratio report data
        let ratioReport = null;
        if (job.ratio_report_id) {
          try {
            // Parse JSONB fields if they are strings
            const colorDetails = typeof job.ratio_color_details === 'string' 
              ? JSON.parse(job.ratio_color_details) 
              : job.ratio_color_details;
            const plateDistribution = typeof job.ratio_plate_distribution === 'string'
              ? JSON.parse(job.ratio_plate_distribution)
              : job.ratio_plate_distribution;
            const colorEfficiency = typeof job.ratio_color_efficiency === 'string'
              ? JSON.parse(job.ratio_color_efficiency)
              : job.ratio_color_efficiency;
            const rawExcelData = typeof job.ratio_raw_excel_data === 'string'
              ? JSON.parse(job.ratio_raw_excel_data)
              : job.ratio_raw_excel_data;

            ratioReport = {
              id: job.ratio_report_id,
              job_card_id: job.id,
              excel_file_link: job.ratio_excel_link,
              excel_file_name: job.ratio_excel_file_name,
              factory_name: job.ratio_factory_name,
              po_number: job.ratio_po_number,
              job_number: job.ratio_job_number,
              brand_name: job.ratio_brand_name,
              item_name: job.ratio_item_name,
              report_date: job.ratio_report_date,
              total_ups: job.ratio_total_ups,
              total_sheets: job.ratio_total_sheets,
              total_plates: job.ratio_total_plates,
              qty_produced: job.ratio_qty_produced,
              excess_qty: job.ratio_excess_qty,
              efficiency_percentage: job.ratio_efficiency_percentage,
              excess_percentage: job.ratio_excess_percentage,
              required_order_qty: job.ratio_required_order_qty,
              color_details: colorDetails || [],
              plate_distribution: plateDistribution || {},
              color_efficiency: colorEfficiency || {},
              raw_excel_data: rawExcelData
            };
          } catch (error) {
            console.error(`Error parsing ratio report for job ${job.id}:`, error);
          }
        }

        return {
          ...job,
          machines: machines,
          received_at_offset: job.received_at_offset,
          ratio_report: ratioReport
        };
      }));

      console.log(`✅ Offset Printing: Found ${enhancedJobs.length} jobs`);
      return enhancedJobs;
    } catch (error) {
      console.error('❌ Error getting Offset Printing jobs:', error);
      throw error;
    }
  }

  /**
   * Get specific job with complete information
   */
  async getJobDetails(jobId) {
    try {
      const jobs = await this.getOffsetPrintingJobs({});
      const job = jobs.find(j => j.id === jobId || j.job_card_id === jobId);
      
      if (!job) {
        throw new Error('Job not found in Offset Printing department');
      }

      return job;
    } catch (error) {
      console.error('Error getting job details:', error);
      throw error;
    }
  }

  /**
   * Assign job to machine and operator
   * Machine must be one of the designer-selected machines
   */
  async assignJob(jobId, machineId, operatorId, userId, comments = '') {
    try {
      console.log('🖨️ Offset Printing: Assigning job', jobId, 'to machine', machineId, 'operator', operatorId);
      
      // Verify job exists and is in Offset Printing
      const job = await this.getJobDetails(jobId);
      
      // Verify machine is one of the designer-selected machines
      const machineExists = job.machines.some(m => m.id === machineId);
      if (!machineExists) {
        throw new Error('Machine must be one of the designer-selected machines for this job');
      }

      // Get prepress_job_id for the machine reference
      const prepressJobResult = await dbAdapter.query(
        'SELECT id FROM prepress_jobs WHERE job_card_id = $1',
        [jobId]
      );
      const prepressJobId = prepressJobResult.rows[0]?.id;

      // Create or update assignment
      const assignmentResult = await dbAdapter.query(`
        INSERT INTO offset_printing_assignments (
          job_card_id,
          prepress_job_id,
          ctp_machine_id,
          assigned_to,
          assigned_by,
          status,
          comments,
          started_at
        ) VALUES ($1, $2, $3, $4, $5, 'Assigned', $6, CURRENT_TIMESTAMP)
        ON CONFLICT (job_card_id, ctp_machine_id) 
        DO UPDATE SET
          assigned_to = EXCLUDED.assigned_to,
          assigned_by = EXCLUDED.assigned_by,
          status = 'Assigned',
          comments = EXCLUDED.comments,
          started_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [jobId, prepressJobId, machineId, operatorId, userId, comments]);

      // Update workflow step status
      await this.initWorkflowService();
      const workflowSteps = await this.workflowService.getJobWorkflow(jobId);
      const offsetStep = workflowSteps.find(step => 
        step.department === 'Offset Printing' && 
        (step.step_name?.toLowerCase().includes('offset printing') || step.step_name === 'Offset Printing')
      );

      if (offsetStep) {
        await dbAdapter.query(`
          UPDATE job_workflow_steps
          SET status = 'in_progress',
              status_message = $1,
              updated_by = $2,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [
          `Assigned to machine and operator - ${job.machines.find(m => m.id === machineId)?.machine_name || 'Machine'}`,
          userId,
          offsetStep.id
        ]);
      }

      // Update job_cards
      await JobStatusService.updateFromWorkflowStep(
        jobId,
        'in_progress',
        'Offset Printing',
        'Offset Printing',
        userId
      );

      // Log to history
      await this.logToHistory(
        jobId,
        'Offset Printing',
        'in_progress',
        userId,
        `Job assigned to machine ${machineId} and operator ${operatorId}. ${comments}`
      );

      // Emit Socket.io notification
      if (this.socketHandler) {
        this.socketHandler.emit('offset_printing:job_assigned', {
          jobId: jobId,
          machineId: machineId,
          operatorId: operatorId,
          assignedBy: userId
        });
      }

      return { success: true, assignment: assignmentResult.rows[0] };
    } catch (error) {
      console.error('Error assigning job:', error);
      throw error;
    }
  }

  /**
   * Update printing status
   */
  async updateStatus(jobId, status, userId, comments = '', metadata = {}) {
    try {
      console.log('🖨️ Offset Printing: Updating status for job', jobId, 'to', status);

      // Update assignment status
      await dbAdapter.query(`
        UPDATE offset_printing_assignments
        SET 
          status = $1,
          comments = COALESCE($2, comments),
          updated_at = CURRENT_TIMESTAMP
        WHERE job_card_id = $3
      `, [status, comments, jobId]);

      // Update workflow step
      await this.initWorkflowService();
      const workflowSteps = await this.workflowService.getJobWorkflow(jobId);
      const offsetStep = workflowSteps.find(step => 
        step.department === 'Offset Printing' && 
        (step.step_name?.toLowerCase().includes('offset printing') || step.step_name === 'Offset Printing')
      );

      if (offsetStep) {
        let stepStatus = 'in_progress';
        if (status === 'Completed') {
          stepStatus = 'completed';
        } else if (status === 'Rejected') {
          stepStatus = 'rejected';
        } else if (status === 'On Hold') {
          stepStatus = 'on_hold';
        }

        await dbAdapter.query(`
          UPDATE job_workflow_steps
          SET 
            status = $1,
            status_message = $2,
            updated_by = $3,
            updated_at = CURRENT_TIMESTAMP
            ${status === 'Completed' ? ', completed_at = CURRENT_TIMESTAMP' : ''}
          WHERE id = $4
        `, [
          stepStatus,
          `${status} - ${comments || 'Status updated'}`,
          userId,
          offsetStep.id
        ]);
      }

      // Update job_cards
      await JobStatusService.updateFromWorkflowStep(
        jobId,
        status.toLowerCase().replace(' ', '_'),
        'Offset Printing',
        'Offset Printing',
        userId
      );

      // Log to history
      await this.logToHistory(
        jobId,
        'Offset Printing',
        status.toLowerCase().replace(' ', '_'),
        userId,
        comments || `Status updated to ${status}`
      );

      // Handle completion or rejection
      if (status === 'Completed') {
        await this.handleOffsetPrintingCompleted(jobId, userId);
      } else if (status === 'Rejected') {
        await this.handleOffsetPrintingRejected(jobId, userId, comments);
      }

      // Emit Socket.io notification
      if (this.socketHandler) {
        this.socketHandler.emit('offset_printing:status_updated', {
          jobId: jobId,
          status: status,
          updatedBy: userId
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  }

  /**
   * Handle Offset Printing completed - move to next workflow step
   */
  async handleOffsetPrintingCompleted(jobId, userId) {
    try {
      await this.initWorkflowService();
      
      const workflowSteps = await this.workflowService.getJobWorkflow(jobId);
      const offsetStep = workflowSteps.find(step => 
        step.department === 'Offset Printing' && 
        (step.step_name?.toLowerCase().includes('offset printing') || step.step_name === 'Offset Printing')
      );

      if (offsetStep) {
        // Mark offset printing as completed
        await dbAdapter.query(`
          UPDATE job_workflow_steps
          SET status = 'completed',
              completed_at = CURRENT_TIMESTAMP,
              updated_by = $1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [userId, offsetStep.id]);

        // Update assignment
        await dbAdapter.query(`
          UPDATE offset_printing_assignments
          SET 
            status = 'Completed',
            completed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE job_card_id = $1
        `, [jobId]);

        // Activate next step
        const nextStep = workflowSteps.find(step => 
          step.sequence_number === offsetStep.sequence_number + 1 &&
          step.status !== 'inactive'
        );

        if (nextStep) {
          await this.workflowService.startStep(jobId, nextStep.sequence_number, userId);
          
          // Emit notification
          if (this.socketHandler) {
            this.socketHandler.emit('offset_printing:job_completed', {
              jobId: jobId,
              nextStep: nextStep.step_name,
              nextDepartment: nextStep.department
            });
          }
        } else {
          // No more steps - job completed
          await JobStatusService.updateJobStatus(
            jobId,
            'completed',
            null,
            'completed',
            userId,
            'Job Completed - All production steps finished'
          );
        }
      }
    } catch (error) {
      console.error('Error handling offset printing completed:', error);
      throw error;
    }
  }

  /**
   * Handle Offset Printing rejected - return to previous step
   */
  async handleOffsetPrintingRejected(jobId, userId, comments) {
    try {
      await this.initWorkflowService();
      
      const workflowSteps = await this.workflowService.getJobWorkflow(jobId);
      const offsetStep = workflowSteps.find(step => 
        step.department === 'Offset Printing' && 
        (step.step_name?.toLowerCase().includes('offset printing') || step.step_name === 'Offset Printing')
      );

      if (offsetStep) {
        // Find previous completed step (Cutting)
        const previousStep = workflowSteps.find(step => 
          step.sequence_number < offsetStep.sequence_number &&
          step.status === 'completed'
        );

        if (previousStep) {
          // Reactivate previous step
          await dbAdapter.query(`
            UPDATE job_workflow_steps
            SET 
              status = 'pending',
              status_message = $1,
              updated_by = $2,
              updated_at = CURRENT_TIMESTAMP,
              completed_at = NULL
            WHERE id = $3
          `, [
            `Returned from Offset Printing: ${comments || 'Rejected'}`,
            userId,
            previousStep.id
          ]);

          // Update job_cards
          await JobStatusService.updateFromWorkflowStep(
            jobId,
            'pending',
            previousStep.step_name,
            previousStep.department,
            userId
          );

          // Emit notification
          if (this.socketHandler) {
            this.socketHandler.emit('offset_printing:job_rejected', {
              jobId: jobId,
              returnedTo: previousStep.step_name,
              returnedToDepartment: previousStep.department
            });
          }
        }
      }
    } catch (error) {
      console.error('Error handling offset printing rejected:', error);
      throw error;
    }
  }

  /**
   * Add comment to assignment
   */
  async addComment(jobId, userId, comment) {
    try {
      await dbAdapter.query(`
        UPDATE offset_printing_assignments
        SET 
          comments = COALESCE(comments || E'\\n', '') || $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE job_card_id = $2
      `, [`[${new Date().toISOString()}] ${comment}`, jobId]);

      return { success: true };
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  /**
   * Get available operators for Offset Printing
   */
  async getAvailableOperators() {
    try {
      const result = await dbAdapter.query(`
        SELECT 
          id,
          "firstName",
          "lastName",
          email,
          phone,
          role
        FROM users
        WHERE role IN ('OFFSET_OPERATOR', 'HOD_OFFSET', 'ADMIN')
          AND "isActive" = true
        ORDER BY "firstName", "lastName"
      `);

      return result.rows;
    } catch (error) {
      console.error('Error getting operators:', error);
      throw error;
    }
  }

  /**
   * Record plate progress for a specific date
   * @param {number} assignmentId - Assignment ID
   * @param {number} plateNumber - Plate sequence number
   * @param {number} sheetsCompleted - Sheets completed for this plate on this date
   * @param {string} date - Date (YYYY-MM-DD)
   * @param {number} operatorId - Operator ID
   * @param {object} metadata - Additional metadata (sheetsTarget, notes, qualityIssues, downtimeMinutes)
   */
  async recordPlateProgress(assignmentId, plateNumber, sheetsCompleted, date, operatorId, metadata = {}) {
    try {
      console.log('🖨️ Recording plate progress:', { assignmentId, plateNumber, sheetsCompleted, date, operatorId });

      // Get assignment to verify it exists
      const assignmentResult = await dbAdapter.query(
        'SELECT job_card_id FROM offset_printing_assignments WHERE id = $1',
        [assignmentId]
      );

      if (assignmentResult.rows.length === 0) {
        throw new Error('Assignment not found');
      }

      const jobCardId = assignmentResult.rows[0].job_card_id;

      // Insert or update progress record
      const progressResult = await dbAdapter.query(`
        INSERT INTO offset_printing_progress (
          assignment_id,
          job_card_id,
          plate_number,
          date,
          sheets_completed,
          sheets_target,
          operator_id,
          status,
          notes,
          quality_issues,
          downtime_minutes,
          start_time,
          end_time
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (assignment_id, plate_number, date)
        DO UPDATE SET
          sheets_completed = EXCLUDED.sheets_completed,
          sheets_target = COALESCE(EXCLUDED.sheets_target, offset_printing_progress.sheets_target),
          operator_id = COALESCE(EXCLUDED.operator_id, offset_printing_progress.operator_id),
          status = COALESCE(EXCLUDED.status, offset_printing_progress.status),
          notes = COALESCE(EXCLUDED.notes, offset_printing_progress.notes),
          quality_issues = COALESCE(EXCLUDED.quality_issues, offset_printing_progress.quality_issues),
          downtime_minutes = COALESCE(EXCLUDED.downtime_minutes, offset_printing_progress.downtime_minutes),
          start_time = COALESCE(EXCLUDED.start_time, offset_printing_progress.start_time),
          end_time = COALESCE(EXCLUDED.end_time, offset_printing_progress.end_time),
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [
        assignmentId,
        jobCardId,
        plateNumber,
        date,
        sheetsCompleted,
        metadata.sheetsTarget || null,
        operatorId,
        metadata.status || (sheetsCompleted > 0 ? 'In Progress' : 'Not Started'),
        metadata.notes || null,
        metadata.qualityIssues ? JSON.stringify(metadata.qualityIssues) : '[]',
        metadata.downtimeMinutes || 0,
        metadata.startTime || null,
        metadata.endTime || null
      ]);

      // Update assignment totals
      await this.updateAssignmentTotals(assignmentId);

      // Update daily summary
      await this.updateDailySummary(assignmentId, date);

      // Emit real-time update
      if (this.socketHandler) {
        this.socketHandler.emit('offset_printing:progress_updated', {
          assignmentId,
          jobCardId,
          plateNumber,
          date,
          sheetsCompleted,
          progress: progressResult.rows[0]
        });
      }

      return { success: true, progress: progressResult.rows[0] };
    } catch (error) {
      console.error('Error recording plate progress:', error);
      throw error;
    }
  }

  /**
   * Get progress for a specific plate
   */
  async getPlateProgress(assignmentId, plateNumber) {
    try {
      const result = await dbAdapter.query(`
        SELECT 
          opp.*,
          u."firstName" || ' ' || u."lastName" as operator_name
        FROM offset_printing_progress opp
        LEFT JOIN users u ON opp.operator_id = u.id
        WHERE opp.assignment_id = $1 AND opp.plate_number = $2
        ORDER BY opp.date DESC
      `, [assignmentId, plateNumber]);

      return result.rows;
    } catch (error) {
      console.error('Error getting plate progress:', error);
      throw error;
    }
  }

  /**
   * Get all plates progress for a specific date
   */
  async getDailyProgress(assignmentId, date) {
    try {
      const result = await dbAdapter.query(`
        SELECT 
          opp.*,
          u."firstName" || ' ' || u."lastName" as operator_name
        FROM offset_printing_progress opp
        LEFT JOIN users u ON opp.operator_id = u.id
        WHERE opp.assignment_id = $1 AND opp.date = $2
        ORDER BY opp.plate_number ASC
      `, [assignmentId, date]);

      return result.rows;
    } catch (error) {
      console.error('Error getting daily progress:', error);
      throw error;
    }
  }

  /**
   * Get overall progress for a job (all plates, all dates)
   */
  async getJobProgress(jobId) {
    try {
      // Get assignment
      const assignmentResult = await dbAdapter.query(
        'SELECT id FROM offset_printing_assignments WHERE job_card_id = $1 LIMIT 1',
        [jobId]
      );

      if (assignmentResult.rows.length === 0) {
        return { progress: [], summary: null };
      }

      const assignmentId = assignmentResult.rows[0].id;

      // Get all progress records
      const progressResult = await dbAdapter.query(`
        SELECT 
          opp.*,
          u."firstName" || ' ' || u."lastName" as operator_name
        FROM offset_printing_progress opp
        LEFT JOIN users u ON opp.operator_id = u.id
        WHERE opp.assignment_id = $1
        ORDER BY opp.date DESC, opp.plate_number ASC
      `, [assignmentId]);

      // Get assignment summary
      const summaryResult = await dbAdapter.query(
        'SELECT * FROM offset_printing_assignments WHERE id = $1',
        [assignmentId]
      );

      return {
        progress: progressResult.rows,
        summary: summaryResult.rows[0] || null
      };
    } catch (error) {
      console.error('Error getting job progress:', error);
      throw error;
    }
  }

  /**
   * Calculate production efficiency for a date
   */
  async calculateEfficiency(assignmentId, date) {
    try {
      // Get daily progress
      const progress = await this.getDailyProgress(assignmentId, date);

      if (progress.length === 0) {
        return { efficiency: 0, totalSheets: 0, totalTarget: 0 };
      }

      const totalSheets = progress.reduce((sum, p) => sum + (p.sheets_completed || 0), 0);
      const totalTarget = progress.reduce((sum, p) => sum + (p.sheets_target || 0), 0);

      const efficiency = totalTarget > 0 ? (totalSheets / totalTarget) * 100 : 0;

      return {
        efficiency: Math.round(efficiency * 100) / 100,
        totalSheets,
        totalTarget
      };
    } catch (error) {
      console.error('Error calculating efficiency:', error);
      throw error;
    }
  }

  /**
   * Update daily summary metrics
   */
  async updateDailySummary(assignmentId, date) {
    try {
      // Get assignment
      const assignmentResult = await dbAdapter.query(
        'SELECT job_card_id FROM offset_printing_assignments WHERE id = $1',
        [assignmentId]
      );

      if (assignmentResult.rows.length === 0) {
        return;
      }

      const jobCardId = assignmentResult.rows[0].job_card_id;

      // Get daily progress
      const progress = await this.getDailyProgress(assignmentId, date);

      const totalSheetsCompleted = progress.reduce((sum, p) => sum + (p.sheets_completed || 0), 0);
      const totalPlatesCompleted = progress.filter(p => p.status === 'Completed').length;
      const totalPlatesInProgress = progress.filter(p => p.status === 'In Progress').length;
      const totalDowntimeMinutes = progress.reduce((sum, p) => sum + (p.downtime_minutes || 0), 0);

      // Calculate efficiency
      const efficiencyData = await this.calculateEfficiency(assignmentId, date);

      // Get operator (most recent)
      const operatorId = progress.length > 0 ? progress[0].operator_id : null;

      // Insert or update daily summary
      await dbAdapter.query(`
        INSERT INTO offset_printing_daily_summary (
          assignment_id,
          job_card_id,
          date,
          total_sheets_completed,
          total_plates_completed,
          total_plates_in_progress,
          total_downtime_minutes,
          efficiency_percentage,
          operator_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (assignment_id, date)
        DO UPDATE SET
          total_sheets_completed = EXCLUDED.total_sheets_completed,
          total_plates_completed = EXCLUDED.total_plates_completed,
          total_plates_in_progress = EXCLUDED.total_plates_in_progress,
          total_downtime_minutes = EXCLUDED.total_downtime_minutes,
          efficiency_percentage = EXCLUDED.efficiency_percentage,
          operator_id = COALESCE(EXCLUDED.operator_id, offset_printing_daily_summary.operator_id),
          updated_at = CURRENT_TIMESTAMP
      `, [
        assignmentId,
        jobCardId,
        date,
        totalSheetsCompleted,
        totalPlatesCompleted,
        totalPlatesInProgress,
        totalDowntimeMinutes,
        efficiencyData.efficiency,
        operatorId
      ]);
    } catch (error) {
      console.error('Error updating daily summary:', error);
      throw error;
    }
  }

  /**
   * Update assignment totals based on progress
   */
  async updateAssignmentTotals(assignmentId) {
    try {
      // Get all progress for this assignment
      const progressResult = await dbAdapter.query(`
        SELECT 
          plate_number,
          sheets_completed,
          sheets_target,
          status
        FROM offset_printing_progress
        WHERE assignment_id = $1
      `, [assignmentId]);

      const progress = progressResult.rows;

      // Calculate totals
      const totalPlates = Math.max(...progress.map(p => p.plate_number), 0);
      const completedPlates = new Set(progress.filter(p => p.status === 'Completed').map(p => p.plate_number)).size;
      const totalSheetsTarget = progress.reduce((sum, p) => sum + (p.sheets_target || 0), 0);
      const totalSheetsCompleted = progress.reduce((sum, p) => sum + (p.sheets_completed || 0), 0);

      // Calculate progress percentage
      const progressPercentage = totalSheetsTarget > 0 
        ? Math.round((totalSheetsCompleted / totalSheetsTarget) * 100 * 100) / 100 
        : 0;

      // Get current plate number (highest in progress)
      const currentPlate = progress
        .filter(p => p.status === 'In Progress')
        .map(p => p.plate_number)
        .sort((a, b) => b - a)[0] || 0;

      // Update assignment
      await dbAdapter.query(`
        UPDATE offset_printing_assignments
        SET
          total_plates = $1,
          completed_plates = $2,
          total_sheets_target = $3,
          total_sheets_completed = $4,
          overall_progress_percentage = $5,
          current_plate_number = $6,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
      `, [
        totalPlates,
        completedPlates,
        totalSheetsTarget,
        totalSheetsCompleted,
        progressPercentage,
        currentPlate,
        assignmentId
      ]);

      // Calculate estimated completion date
      await this.calculateEstimatedCompletionDate(assignmentId);
    } catch (error) {
      console.error('Error updating assignment totals:', error);
      throw error;
    }
  }

  /**
   * Calculate estimated completion date based on current progress
   */
  async calculateEstimatedCompletionDate(assignmentId) {
    try {
      // Get assignment
      const assignment = await dbAdapter.query(
        'SELECT * FROM offset_printing_assignments WHERE id = $1',
        [assignmentId]
      );

      if (assignment.rows.length === 0) return;

      const { total_sheets_target, total_sheets_completed, started_at } = assignment.rows[0];

      if (!total_sheets_target || total_sheets_completed === 0 || !started_at) {
        return;
      }

      // Calculate average sheets per day
      const daysElapsed = Math.max(1, Math.ceil((new Date() - new Date(started_at)) / (1000 * 60 * 60 * 24)));
      const avgSheetsPerDay = total_sheets_completed / daysElapsed;

      if (avgSheetsPerDay <= 0) return;

      // Calculate remaining sheets and days
      const remainingSheets = total_sheets_target - total_sheets_completed;
      const estimatedDaysRemaining = Math.ceil(remainingSheets / avgSheetsPerDay);

      // Calculate estimated completion date
      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + estimatedDaysRemaining);

      // Update assignment
      await dbAdapter.query(`
        UPDATE offset_printing_assignments
        SET estimated_completion_date = $1
        WHERE id = $2
      `, [estimatedDate.toISOString().split('T')[0], assignmentId]);
    } catch (error) {
      console.error('Error calculating estimated completion date:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Get production metrics for a date range
   */
  async getProductionMetrics(assignmentId, startDate, endDate) {
    try {
      const result = await dbAdapter.query(`
        SELECT 
          date,
          total_sheets_completed,
          total_plates_completed,
          total_plates_in_progress,
          total_downtime_minutes,
          efficiency_percentage,
          material_consumed,
          quality_metrics
        FROM offset_printing_daily_summary
        WHERE assignment_id = $1
          AND date >= $2
          AND date <= $3
        ORDER BY date ASC
      `, [assignmentId, startDate, endDate]);

      return result.rows;
    } catch (error) {
      console.error('Error getting production metrics:', error);
      throw error;
    }
  }

  /**
   * Record machine downtime
   */
  async recordDowntime(assignmentId, plateNumber, date, minutes, reason) {
    try {
      // Update progress record with downtime
      await dbAdapter.query(`
        UPDATE offset_printing_progress
        SET
          downtime_minutes = COALESCE(downtime_minutes, 0) + $1,
          notes = COALESCE(notes || E'\\n', '') || $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE assignment_id = $3
          AND plate_number = $4
          AND date = $5
      `, [
        minutes,
        `[${new Date().toISOString()}] Downtime: ${minutes} minutes - ${reason}`,
        assignmentId,
        plateNumber,
        date
      ]);

      // Update daily summary
      await this.updateDailySummary(assignmentId, date);

      // Emit real-time update
      if (this.socketHandler) {
        this.socketHandler.emit('offset_printing:downtime_recorded', {
          assignmentId,
          plateNumber,
          date,
          minutes,
          reason
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error recording downtime:', error);
      throw error;
    }
  }

  /**
   * Record quality issue
   */
  async recordQualityIssue(assignmentId, plateNumber, date, issue) {
    try {
      // Get existing quality issues
      const progressResult = await dbAdapter.query(`
        SELECT quality_issues
        FROM offset_printing_progress
        WHERE assignment_id = $1
          AND plate_number = $2
          AND date = $3
      `, [assignmentId, plateNumber, date]);

      let qualityIssues = [];
      if (progressResult.rows.length > 0 && progressResult.rows[0].quality_issues) {
        try {
          qualityIssues = Array.isArray(progressResult.rows[0].quality_issues)
            ? progressResult.rows[0].quality_issues
            : JSON.parse(progressResult.rows[0].quality_issues);
        } catch (e) {
          qualityIssues = [];
        }
      }

      // Add new issue
      qualityIssues.push({
        ...issue,
        timestamp: new Date().toISOString()
      });

      // Update progress record
      await dbAdapter.query(`
        UPDATE offset_printing_progress
        SET
          quality_issues = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE assignment_id = $2
          AND plate_number = $3
          AND date = $4
      `, [
        JSON.stringify(qualityIssues),
        assignmentId,
        plateNumber,
        date
      ]);

      // Update daily summary
      await this.updateDailySummary(assignmentId, date);

      // Emit real-time update
      if (this.socketHandler) {
        this.socketHandler.emit('offset_printing:quality_issue', {
          assignmentId,
          plateNumber,
          date,
          issue
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error recording quality issue:', error);
      throw error;
    }
  }

  /**
   * Get dashboard metrics (real-time)
   */
  async getDashboardMetrics() {
    try {
      // Get active assignments
      const activeAssignments = await dbAdapter.query(`
        SELECT COUNT(*) as count
        FROM offset_printing_assignments
        WHERE status IN ('Assigned', 'Setup', 'Printing', 'Quality Check')
      `);

      // Get today's progress
      const todayProgress = await dbAdapter.query(`
        SELECT 
          SUM(total_sheets_completed) as total_sheets,
          SUM(total_plates_completed) as total_plates,
          AVG(efficiency_percentage) as avg_efficiency
        FROM offset_printing_daily_summary
        WHERE date = CURRENT_DATE
      `);

      // Get jobs in progress
      const inProgressJobs = await dbAdapter.query(`
        SELECT COUNT(DISTINCT job_card_id) as count
        FROM offset_printing_progress
        WHERE date = CURRENT_DATE
          AND status = 'In Progress'
      `);

      return {
        activeAssignments: parseInt(activeAssignments.rows[0].count || 0),
        todaySheets: parseInt(todayProgress.rows[0].total_sheets || 0),
        todayPlates: parseInt(todayProgress.rows[0].total_plates || 0),
        avgEfficiency: parseFloat(todayProgress.rows[0].avg_efficiency || 0),
        inProgressJobs: parseInt(inProgressJobs.rows[0].count || 0)
      };
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      throw error;
    }
  }
}

export default OffsetPrintingWorkflowService;

