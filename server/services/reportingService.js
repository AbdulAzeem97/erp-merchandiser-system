import { Pool } from 'pg';
import { format } from 'date-fns';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'erp_merchandiser',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'db123',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

class ReportingService {
  /**
   * Get overall system summary
   */
  async getSystemSummary(fromDate = null, toDate = null) {
    const client = await pool.connect();
    try {
      let whereClause = '';
      const params = [];
      let paramCount = 0;

      if (fromDate) {
        paramCount++;
        whereClause += ` AND jc.punched_at >= $${paramCount}`;
        params.push(fromDate);
      }

      if (toDate) {
        paramCount++;
        whereClause += ` AND jc.punched_at <= $${paramCount}`;
        params.push(toDate);
      }

      const result = await client.query(`
        SELECT 
          -- Job Cards Summary
          COUNT(jc.id) as total_jobs,
          COUNT(CASE WHEN jc.status = 'PENDING' THEN 1 END) as pending_jobs,
          COUNT(CASE WHEN jc.status = 'IN_PROGRESS' THEN 1 END) as in_progress_jobs,
          COUNT(CASE WHEN jc.status = 'COMPLETED' THEN 1 END) as completed_jobs,
          COUNT(CASE WHEN jc.status = 'DELIVERED' THEN 1 END) as delivered_jobs,
          
          -- Prepress Summary
          COUNT(pj.id) as total_prepress_jobs,
          COUNT(CASE WHEN pj.status = 'PENDING' THEN 1 END) as pending_prepress,
          COUNT(CASE WHEN pj.status = 'IN_PROGRESS' THEN 1 END) as in_progress_prepress,
          COUNT(CASE WHEN pj.status = 'HOD_REVIEW' THEN 1 END) as hod_review_prepress,
          COUNT(CASE WHEN pj.status = 'COMPLETED' THEN 1 END) as completed_prepress,
          
          -- Turnaround Times
          AVG(CASE 
            WHEN jc.status = 'COMPLETED' AND jc.punched_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (jc.updated_at - jc.punched_at)) 
          END) as avg_job_turnaround_seconds,
          
          AVG(CASE 
            WHEN pj.status = 'COMPLETED' AND pj.started_at IS NOT NULL AND pj.completed_at IS NOT NULL
            THEN EXTRACT(EPOCH FROM (pj.completed_at - pj.started_at)) 
          END) as avg_prepress_turnaround_seconds,
          
          -- Active Users
          COUNT(DISTINCT jc.punched_by) as active_merchandisers,
          COUNT(DISTINCT pj.assigned_designer_id) as active_designers,
          COUNT(DISTINCT jc.company_id) as active_companies
          
        FROM job_cards jc
        LEFT JOIN prepress_jobs pj ON jc.id = pj.job_card_id
        WHERE jc.punched_at IS NOT NULL ${whereClause}
      `, params);

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Get monthly trends
   */
  async getMonthlyTrends(year = new Date().getFullYear()) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          date_trunc('month', jc.punched_at) as month,
          COUNT(jc.id) as jobs_punched,
          COUNT(CASE WHEN jc.status = 'COMPLETED' THEN 1 END) as jobs_completed,
          COUNT(pj.id) as prepress_jobs,
          COUNT(CASE WHEN pj.status = 'COMPLETED' THEN 1 END) as prepress_completed,
          AVG(CASE 
            WHEN jc.status = 'COMPLETED' AND jc.punched_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (jc.updated_at - jc.punched_at)) 
          END) as avg_turnaround_seconds
        FROM job_cards jc
        LEFT JOIN prepress_jobs pj ON jc.id = pj.job_card_id
        WHERE EXTRACT(YEAR FROM jc.punched_at) = $1
        GROUP BY date_trunc('month', jc.punched_at)
        ORDER BY month
      `, [year]);

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get merchandiser performance
   */
  async getMerchandiserPerformance(fromDate = null, toDate = null) {
    const client = await pool.connect();
    try {
      let whereClause = '';
      const params = [];
      let paramCount = 0;

      if (fromDate) {
        paramCount++;
        whereClause += ` AND jc.punched_at >= $${paramCount}`;
        params.push(fromDate);
      }

      if (toDate) {
        paramCount++;
        whereClause += ` AND jc.punched_at <= $${paramCount}`;
        params.push(toDate);
      }

      const result = await client.query(`
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          COUNT(jc.id) as total_jobs,
          COUNT(CASE WHEN jc.status = 'COMPLETED' THEN 1 END) as completed_jobs,
          COUNT(CASE WHEN jc.status = 'IN_PROGRESS' THEN 1 END) as in_progress_jobs,
          COUNT(CASE WHEN jc.status = 'PENDING' THEN 1 END) as pending_jobs,
          AVG(CASE 
            WHEN jc.status = 'COMPLETED' AND jc.punched_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (jc.updated_at - jc.punched_at)) 
          END) as avg_turnaround_seconds,
          COUNT(DISTINCT jc.company_id) as unique_companies,
          COUNT(DISTINCT p.product_type) as unique_product_types
        FROM users u
        LEFT JOIN job_cards jc ON u.id = jc.punched_by
        LEFT JOIN products p ON jc.product_id = p.id
        WHERE u.role = 'MERCHANDISER' ${whereClause}
        GROUP BY u.id, u.first_name, u.last_name, u.email
        ORDER BY total_jobs DESC
      `, params);

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get designer productivity
   */
  async getDesignerProductivity(fromDate = null, toDate = null) {
    const client = await pool.connect();
    try {
      let whereClause = '';
      const params = [];
      let paramCount = 0;

      if (fromDate) {
        paramCount++;
        whereClause += ` AND pj.created_at >= $${paramCount}`;
        params.push(fromDate);
      }

      if (toDate) {
        paramCount++;
        whereClause += ` AND pj.created_at <= $${paramCount}`;
        params.push(toDate);
      }

      const result = await client.query(`
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          COUNT(pj.id) as total_jobs,
          COUNT(CASE WHEN pj.status = 'COMPLETED' THEN 1 END) as completed_jobs,
          COUNT(CASE WHEN pj.status = 'IN_PROGRESS' THEN 1 END) as in_progress_jobs,
          COUNT(CASE WHEN pj.status = 'HOD_REVIEW' THEN 1 END) as hod_review_jobs,
          COUNT(CASE WHEN pj.status = 'REJECTED' THEN 1 END) as rejected_jobs,
          AVG(CASE 
            WHEN pj.started_at IS NOT NULL AND pj.completed_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (pj.completed_at - pj.started_at)) 
          END) as avg_cycle_time_seconds,
          COUNT(DISTINCT DATE(pj.created_at)) as active_days,
          COUNT(CASE WHEN pj.priority = 'HIGH' OR pj.priority = 'CRITICAL' THEN 1 END) as high_priority_jobs
        FROM users u
        LEFT JOIN prepress_jobs pj ON u.id = pj.assigned_designer_id
        WHERE u.role = 'DESIGNER' ${whereClause}
        GROUP BY u.id, u.first_name, u.last_name, u.email
        ORDER BY completed_jobs DESC
      `, params);

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get company performance
   */
  async getCompanyPerformance(fromDate = null, toDate = null) {
    const client = await pool.connect();
    try {
      let whereClause = '';
      const params = [];
      let paramCount = 0;

      if (fromDate) {
        paramCount++;
        whereClause += ` AND jc.punched_at >= $${paramCount}`;
        params.push(fromDate);
      }

      if (toDate) {
        paramCount++;
        whereClause += ` AND jc.punched_at <= $${paramCount}`;
        params.push(toDate);
      }

      const result = await client.query(`
        SELECT 
          c.id,
          c.name,
          c.code,
          c.country,
          COUNT(jc.id) as total_jobs,
          COUNT(CASE WHEN jc.status = 'COMPLETED' THEN 1 END) as completed_jobs,
          COUNT(CASE WHEN jc.status = 'IN_PROGRESS' THEN 1 END) as in_progress_jobs,
          COUNT(CASE WHEN jc.status = 'PENDING' THEN 1 END) as pending_jobs,
          SUM(jc.quantity) as total_quantity,
          AVG(jc.quantity) as avg_quantity_per_job,
          AVG(CASE 
            WHEN jc.status = 'COMPLETED' AND jc.punched_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (jc.updated_at - jc.punched_at)) 
          END) as avg_turnaround_seconds,
          COUNT(DISTINCT p.product_type) as unique_product_types
        FROM companies c
        LEFT JOIN job_cards jc ON c.id = jc.company_id
        LEFT JOIN products p ON jc.product_id = p.id
        WHERE c.is_active = true ${whereClause}
        GROUP BY c.id, c.name, c.code, c.country
        ORDER BY total_jobs DESC
      `, params);

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get product type performance
   */
  async getProductTypePerformance(fromDate = null, toDate = null) {
    const client = await pool.connect();
    try {
      let whereClause = '';
      const params = [];
      let paramCount = 0;

      if (fromDate) {
        paramCount++;
        whereClause += ` AND jc.punched_at >= $${paramCount}`;
        params.push(fromDate);
      }

      if (toDate) {
        paramCount++;
        whereClause += ` AND jc.punched_at <= $${paramCount}`;
        params.push(toDate);
      }

      const result = await client.query(`
        SELECT 
          p.product_type,
          COUNT(jc.id) as total_jobs,
          COUNT(CASE WHEN jc.status = 'COMPLETED' THEN 1 END) as completed_jobs,
          COUNT(CASE WHEN jc.status = 'IN_PROGRESS' THEN 1 END) as in_progress_jobs,
          COUNT(CASE WHEN jc.status = 'PENDING' THEN 1 END) as pending_jobs,
          SUM(jc.quantity) as total_quantity,
          AVG(jc.quantity) as avg_quantity_per_job,
          AVG(CASE 
            WHEN jc.status = 'COMPLETED' AND jc.punched_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (jc.updated_at - jc.punched_at)) 
          END) as avg_turnaround_seconds,
          COUNT(DISTINCT jc.company_id) as unique_companies
        FROM products p
        LEFT JOIN job_cards jc ON p.id = jc.product_id
        WHERE p.is_active = true ${whereClause}
        GROUP BY p.product_type
        ORDER BY total_jobs DESC
      `, params);

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get SLA compliance report
   */
  async getSLACompliance(fromDate = null, toDate = null) {
    const client = await pool.connect();
    try {
      let whereClause = '';
      const params = [];
      let paramCount = 0;

      if (fromDate) {
        paramCount++;
        whereClause += ` AND jc.punched_at >= $${paramCount}`;
        params.push(fromDate);
      }

      if (toDate) {
        paramCount++;
        whereClause += ` AND jc.punched_at <= $${paramCount}`;
        params.push(toDate);
      }

      const result = await client.query(`
        SELECT 
          'Job Cards' as process_type,
          COUNT(*) as total_items,
          COUNT(CASE WHEN jc.status = 'COMPLETED' THEN 1 END) as completed_items,
          COUNT(CASE WHEN jc.delivery_date >= CURRENT_DATE THEN 1 END) as on_time_items,
          COUNT(CASE WHEN jc.delivery_date < CURRENT_DATE AND jc.status != 'COMPLETED' THEN 1 END) as overdue_items,
          AVG(CASE 
            WHEN jc.status = 'COMPLETED' AND jc.punched_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (jc.updated_at - jc.punched_at)) 
          END) as avg_processing_time_seconds
        FROM job_cards jc
        WHERE jc.punched_at IS NOT NULL ${whereClause}
        
        UNION ALL
        
        SELECT 
          'Prepress' as process_type,
          COUNT(*) as total_items,
          COUNT(CASE WHEN pj.status = 'COMPLETED' THEN 1 END) as completed_items,
          COUNT(CASE WHEN pj.due_date >= CURRENT_DATE OR pj.status = 'COMPLETED' THEN 1 END) as on_time_items,
          COUNT(CASE WHEN pj.due_date < CURRENT_DATE AND pj.status != 'COMPLETED' THEN 1 END) as overdue_items,
          AVG(CASE 
            WHEN pj.started_at IS NOT NULL AND pj.completed_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (pj.completed_at - pj.started_at)) 
          END) as avg_processing_time_seconds
        FROM prepress_jobs pj
        WHERE pj.created_at IS NOT NULL ${whereClause}
      `, params);

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(limit = 50) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        (
          SELECT 
            'job_card' as activity_type,
            jc.id as item_id,
            jc.job_card_id as item_name,
            jc.status as status,
            jc.updated_at as activity_date,
            u.first_name || ' ' || u.last_name as actor_name,
            u.role as actor_role,
            c.name as company_name,
            p.product_type
          FROM job_cards jc
          JOIN users u ON jc.punched_by = u.id
          JOIN companies c ON jc.company_id = c.id
          JOIN products p ON jc.product_id = p.id
          WHERE jc.updated_at >= CURRENT_DATE - INTERVAL '7 days'
        )
        UNION ALL
        (
          SELECT 
            'prepress_job' as activity_type,
            pj.id as item_id,
            jc.job_card_id as item_name,
            pj.status as status,
            pj.updated_at as activity_date,
            u.first_name || ' ' || u.last_name as actor_name,
            u.role as actor_role,
            c.name as company_name,
            p.product_type
          FROM prepress_jobs pj
          JOIN job_cards jc ON pj.job_card_id = jc.id
          JOIN users u ON pj.updated_by = u.id
          JOIN companies c ON jc.company_id = c.id
          JOIN products p ON jc.product_id = p.id
          WHERE pj.updated_at >= CURRENT_DATE - INTERVAL '7 days'
        )
        ORDER BY activity_date DESC
        LIMIT $1
      `, [limit]);

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Export data to CSV format
   */
  async exportToCSV(data, headers) {
    if (!data || data.length === 0) {
      return 'No data available';
    }

    // Create CSV header
    const csvHeaders = headers.join(',');
    
    // Create CSV rows
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',');
    });

    return [csvHeaders, ...csvRows].join('\n');
  }

  /**
   * Generate report filename
   */
  generateReportFilename(reportType, format = 'csv') {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    return `${reportType}_${timestamp}.${format}`;
  }
}

export default new ReportingService();
