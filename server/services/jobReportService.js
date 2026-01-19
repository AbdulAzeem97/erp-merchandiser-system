import dbAdapter from '../database/adapter.js';
import pdfReportGenerator from './pdfReportGenerator.js';

/**
 * Job Report Service
 * Handles job report generation with comprehensive filtering and export capabilities
 */
class JobReportService {
  /**
   * Get filtered jobs for reporting
   * @param {Object} filters - Filter options
   * @param {Object} user - Current user (for role-based filtering)
   * @returns {Promise<Object>} - Filtered jobs and summary statistics
   */
  async getFilteredJobs(filters = {}, user = null) {
    try {
      const {
        po_status = 'all',
        status = null,
        brand = null,
        date_from = null,
        date_to = null,
        department = null,
        assistant_merchandiser_id = null,
        created_by_id = null,
        page = 1,
        limit = 1000
      } = filters;

      // Check if workflow columns exist
      const columnCheck = await dbAdapter.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'job_cards' 
        AND column_name IN ('current_department', 'current_step', 'workflow_status', 'status_message')
      `);
      const existingColumns = columnCheck.rows.map(r => r.column_name);
      const hasWorkflowColumns = existingColumns.length > 0;

      // Build WHERE clause
      const whereConditions = [];
      const queryParams = [];
      let paramIndex = 1;

      // Role-based filtering
      const canViewAll = ['ADMIN', 'HEAD_OF_MERCHANDISER', 'HEAD_OF_PRODUCTION', 'DIRECTOR'].includes(user?.role);
      const isSeniorMerchandiser = user?.role === 'SENIOR_MERCHANDISER';

      if (!canViewAll && user?.id) {
        if (isSeniorMerchandiser) {
          // If assistant_merchandiser_id is specified, filter by that assistant only
          if (assistant_merchandiser_id) {
            whereConditions.push(`jc."createdById" = $${paramIndex}`);
            queryParams.push(assistant_merchandiser_id);
            paramIndex++;
          } else {
            // Otherwise, show own jobs + all assistant merchandiser jobs
            whereConditions.push(`(
              jc."createdById" = $${paramIndex} 
              OR jc."createdById" IN (
                SELECT id FROM users 
                WHERE manager_id = $${paramIndex} 
                AND role = 'ASSISTANT_MERCHANDISER'
              )
              OR jc."createdById" IS NULL
            )`);
            queryParams.push(user.id);
            paramIndex++;
          }
        } else {
          // Assistant merchandisers see only their own jobs
          whereConditions.push(`(jc."createdById" = $${paramIndex} OR jc."createdById" IS NULL)`);
          queryParams.push(user.id);
          paramIndex++;
        }
      }

      // Filter by created_by_id if specified (for senior merchandisers)
      if (created_by_id) {
        whereConditions.push(`jc."createdById" = $${paramIndex}`);
        queryParams.push(created_by_id);
        paramIndex++;
      }

      // PO Status filter
      if (po_status === 'with_po') {
        whereConditions.push(`(jc.without_po = false OR jc.without_po IS NULL) AND jc.po_number IS NOT NULL AND jc.po_number != ''`);
      } else if (po_status === 'without_po') {
        whereConditions.push(`(jc.without_po = true OR (jc.po_number IS NULL OR jc.po_number = ''))`);
      }

      // Status filter
      if (status) {
        whereConditions.push(`jc.status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      // Brand filter
      if (brand) {
        whereConditions.push(`p.brand ILIKE $${paramIndex}`);
        queryParams.push(`%${brand}%`);
        paramIndex++;
      }

      // Date range filter (on createdAt)
      if (date_from) {
        whereConditions.push(`jc."createdAt" >= $${paramIndex}`);
        queryParams.push(date_from);
        paramIndex++;
      }
      if (date_to) {
        whereConditions.push(`jc."createdAt" <= $${paramIndex}`);
        queryParams.push(date_to);
        paramIndex++;
      }

      // Department filter
      if (department && hasWorkflowColumns) {
        whereConditions.push(`jc.current_department = $${paramIndex}`);
        queryParams.push(department);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Build workflow columns
      const workflowColumns = hasWorkflowColumns 
        ? `jc.current_department,
           jc.current_step,
           jc.workflow_status,
           jc.status_message`
        : `NULL as current_department,
           NULL as current_step,
           NULL as workflow_status,
           NULL as status_message`;

      // Main query
      const jobsQuery = `
        SELECT 
          jc.*,
          p.sku as product_code,
          p.name as product_name,
          p.brand,
          p.gsm,
          p.description as product_description,
          p."fscCertified" as fsc,
          p."fscLicense" as fsc_claim,
          m.name as material_name,
          cat.name as category_name,
          c.name as company_name,
          jc.customer_name,
          jc.customer_email,
          jc.customer_phone,
          jc.customer_address,
          u."firstName" || ' ' || u."lastName" as assigned_designer_name,
          u.email as assigned_designer_email,
          u.phone as assigned_designer_phone,
          creator."firstName" || ' ' || creator."lastName" as created_by_name,
          ${workflowColumns}
        FROM job_cards jc
          LEFT JOIN products p ON jc."productId" = p.id
          LEFT JOIN materials m ON p.material_id = m.id
          LEFT JOIN categories cat ON p."categoryId" = cat.id
          LEFT JOIN companies c ON jc."companyId" = c.id
          LEFT JOIN users u ON jc."assignedToId" = u.id
          LEFT JOIN users creator ON jc."createdById" = creator.id
        ${whereClause}
        ORDER BY jc."createdAt" DESC
      `;

      const jobsResult = await dbAdapter.query(jobsQuery, queryParams);
      const jobs = jobsResult.rows;

      // Calculate summary statistics
      const stats = this.calculateStatistics(jobs);

      return {
        jobs,
        total: jobs.length,
        statistics: stats,
        filters: filters
      };
    } catch (error) {
      console.error('Error getting filtered jobs:', error);
      throw error;
    }
  }

  /**
   * Calculate summary statistics from jobs
   */
  calculateStatistics(jobs) {
    const stats = {
      total: jobs.length,
      byStatus: {},
      byDepartment: {},
      withPO: 0,
      withoutPO: 0,
      byBrand: {},
      byPriority: {}
    };

    jobs.forEach(job => {
      // Status breakdown
      const status = job.status || 'UNKNOWN';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      // Department breakdown
      const dept = job.current_department || 'N/A';
      stats.byDepartment[dept] = (stats.byDepartment[dept] || 0) + 1;

      // PO status
      if (job.without_po === true || !job.po_number || job.po_number.trim() === '') {
        stats.withoutPO++;
      } else {
        stats.withPO++;
      }

      // Brand breakdown
      if (job.brand) {
        stats.byBrand[job.brand] = (stats.byBrand[job.brand] || 0) + 1;
      }

      // Priority breakdown
      const priority = job.urgency || 'NORMAL';
      stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
    });

    return stats;
  }

  /**
   * Export jobs to CSV format
   * @param {Array} jobs - Jobs to export
   * @returns {string} - CSV formatted string
   */
  exportToCSV(jobs) {
    if (!jobs || jobs.length === 0) {
      return 'No jobs to export';
    }

    // Define CSV columns
    const columns = [
      'Job Number',
      'Product Code',
      'Brand',
      'Customer Name',
      'Company Name',
      'PO Number',
      'PO Status',
      'Quantity',
      'Due Date',
      'Status',
      'Priority',
      'Department',
      'Created By',
      'Created Date',
      'Product Name',
      'Material',
      'GSM',
      'Designer',
      'Customer Email',
      'Customer Phone'
    ];

    // Create header row
    const header = columns.join(',');

    // Create data rows
    const rows = jobs.map(job => {
      const isWithoutPO = job.without_po === true || !job.po_number || job.po_number.trim() === '';
      const poStatus = isWithoutPO ? 'Without PO' : 'With PO';
      
      const row = [
        this.escapeCSV(job.jobNumber || ''),
        this.escapeCSV(job.product_code || ''),
        this.escapeCSV(job.brand || ''),
        this.escapeCSV(job.customer_name || ''),
        this.escapeCSV(job.company_name || ''),
        this.escapeCSV(job.po_number || ''),
        poStatus,
        job.quantity || 0,
        job.dueDate ? new Date(job.dueDate).toISOString().split('T')[0] : '',
        this.escapeCSV(job.status || ''),
        this.escapeCSV(job.urgency || ''),
        this.escapeCSV(job.current_department || ''),
        this.escapeCSV(job.created_by_name || ''),
        job.createdAt ? new Date(job.createdAt).toISOString().split('T')[0] : '',
        this.escapeCSV(job.product_name || ''),
        this.escapeCSV(job.material_name || ''),
        job.gsm || '',
        this.escapeCSV(job.assigned_designer_name || ''),
        this.escapeCSV(job.customer_email || ''),
        this.escapeCSV(job.customer_phone || '')
      ];
      return row.join(',');
    });

    return [header, ...rows].join('\n');
  }

  /**
   * Escape CSV values
   */
  escapeCSV(value) {
    if (value === null || value === undefined) {
      return '';
    }
    const stringValue = String(value);
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }

  /**
   * Export jobs to PDF format
   * @param {Array} jobs - Jobs to export
   * @param {Object} filters - Applied filters
   * @param {Object} statistics - Report statistics
   * @returns {Promise<Buffer>} - PDF buffer
   */
  async exportToPDF(jobs, filters, statistics) {
    if (!jobs || jobs.length === 0) {
      throw new Error('No jobs to export');
    }

    try {
      const pdfBuffer = await pdfReportGenerator.generateJobReport(jobs, filters, statistics);
      return pdfBuffer;
    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw new Error(`Failed to generate PDF report: ${error.message}`);
    }
  }

  /**
   * Get available brands for filtering
   */
  async getAvailableBrands() {
    try {
      const result = await dbAdapter.query(`
        SELECT DISTINCT brand 
        FROM products 
        WHERE brand IS NOT NULL AND brand != ''
        ORDER BY brand
      `);
      return result.rows.map(row => row.brand);
    } catch (error) {
      console.error('Error getting brands:', error);
      return [];
    }
  }

  /**
   * Get available departments
   */
  getAvailableDepartments() {
    return [
      'Prepress',
      'Cutting',
      'Production',
      'Offset Printing',
      'Lamination',
      'QA',
      'Dispatch'
    ];
  }

  /**
   * Get assistant merchandisers for a senior merchandiser
   */
  async getAssistantMerchandisers(seniorMerchandiserId) {
    try {
      const result = await dbAdapter.query(`
        SELECT id, "firstName", "lastName", email, username
        FROM users
        WHERE manager_id = $1 AND role = 'ASSISTANT_MERCHANDISER'
        ORDER BY "firstName", "lastName"
      `, [seniorMerchandiserId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting assistant merchandisers:', error);
      return [];
    }
  }
}

export default new JobReportService();

