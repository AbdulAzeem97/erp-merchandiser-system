import dbAdapter from '../database/adapter.js';
import BaseDepartmentService from './baseDepartmentService.js';
import JobStatusService from './jobStatusService.js';

/**
 * Digital Printing Workflow Service
 * Handles Digital Printing department operations
 */
class DigitalPrintingWorkflowService extends BaseDepartmentService {
    constructor(socketHandler = null) {
        super('Digital Printing', socketHandler);
    }

    /**
     * Get Digital Printing jobs for the dashboard
     */
    async getDigitalPrintingJobs(filters = {}) {
        try {
            console.log('📱 Digital Printing: getDigitalPrintingJobs called');

            // Get jobs using the base department logic
            // This will return jobs that have "Digital Printing" as their current department
            const jobs = await this.getDepartmentJobs(filters);

            // Enhance with digital specific data
            const enhancedJobs = await Promise.all(jobs.map(async (job) => {
                const digitalData = await dbAdapter.query(`
          SELECT 
            "digitalPrintingEnabled",
            "digitalMachine",
            "digitalOutputSheets",
            "digitalRejectSheets",
            "digitalStatus",
            "digitalCompletionTime"
          FROM job_cards
          WHERE id = $1
        `, [job.id]);

                // Also get incoming sheet count from previous step (usually Offset or Cutting)
                const offsetData = await dbAdapter.query(`
          SELECT 
            COALESCE(jpp.final_total_sheets, 0) as total_sheets,
            COALESCE(rr.total_sheets, 0) as ratio_sheets
          FROM job_cards jc
          LEFT JOIN job_production_planning jpp ON CAST(jc.id AS TEXT) = CAST(jpp.job_card_id AS TEXT)
          LEFT JOIN ratio_reports rr ON jc.id = rr.job_card_id
          WHERE jc.id = $1
        `, [job.id]);

                return {
                    ...job,
                    digital_printing: digitalData.rows[0] || {},
                    incoming_sheets: offsetData.rows[0]?.total_sheets || offsetData.rows[0]?.ratio_sheets || 0
                };
            }));

            return enhancedJobs;
        } catch (error) {
            console.error('❌ Error getting Digital Printing jobs:', error);
            throw error;
        }
    }

    /**
     * Update Digital Printing specific data (Machine, Sheets)
     */
    async updateDigitalData(jobId, data, userId) {
        try {
            console.log(`📱 Digital Printing: Updating data for job ${jobId}`, data);

            const { machineType, outputSheets, rejectSheets, status, notes } = data;

            const updateFields = [];
            const params = [];
            let paramIndex = 1;

            if (machineType) {
                updateFields.push(`"digitalMachine" = $${paramIndex}`);
                params.push(machineType);
                paramIndex++;
            }

            if (outputSheets !== undefined) {
                updateFields.push(`"digitalOutputSheets" = $${paramIndex}`);
                params.push(outputSheets);
                paramIndex++;
            }

            if (rejectSheets !== undefined) {
                updateFields.push(`"digitalRejectSheets" = $${paramIndex}`);
                params.push(rejectSheets);
                paramIndex++;
            }

            if (status) {
                updateFields.push(`"digitalStatus" = $${paramIndex}`);
                params.push(status);
                paramIndex++;

                if (status === 'COMPLETED') {
                    updateFields.push(`"digitalCompletionTime" = CURRENT_TIMESTAMP`);
                }
            }

            if (updateFields.length === 0) return { success: true };

            params.push(jobId);
            const query = `
        UPDATE job_cards 
        SET ${updateFields.join(', ')} 
        WHERE id = $${paramIndex}
        RETURNING *
      `;

            await dbAdapter.query(query, params);

            // Log to history if status changed or notes provided
            if (status || notes) {
                await this.logToHistory(
                    jobId,
                    'Digital Printing',
                    status?.toLowerCase() || 'updated',
                    userId,
                    notes || `Digital Printing data updated: ${machineType || ''} ${outputSheets || 0} sheets`
                );
            }

            // If completing, use the base service to progress workflow
            if (status === 'COMPLETED') {
                await this.updateJobStatus(jobId, 'completed', userId, notes);
            }

            return { success: true };
        } catch (error) {
            console.error('❌ Error updating Digital Printing data:', error);
            throw error;
        }
    }

    /**
     * Start Digital Printing
     */
    async startDigitalPrinting(jobId, userId) {
        return this.updateJobStatus(jobId, 'in_progress', userId, 'Digital Printing started');
    }
}

export default DigitalPrintingWorkflowService;
