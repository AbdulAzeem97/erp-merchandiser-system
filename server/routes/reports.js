import express from 'express';
import { query, validationResult } from 'express-validator';
import { authenticateToken, requirePermission } from '../middleware/rbac.js';
import reportingService from '../services/reportingService.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * @route GET /api/reports/summary
 * @desc Get overall system summary
 * @access HoM, HoP, ADMIN
 */
router.get('/summary',
  requirePermission('VIEW_REPORTS'),
  [
    query('fromDate').optional().isISO8601().withMessage('Valid from date is required'),
    query('toDate').optional().isISO8601().withMessage('Valid to date is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { fromDate, toDate } = req.query;
      
      const summary = await reportingService.getSystemSummary(
        fromDate ? new Date(fromDate) : null,
        toDate ? new Date(toDate) : null
      );

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Get summary error:', error);
      res.status(500).json({
        error: 'Failed to fetch system summary'
      });
    }
  }
);

/**
 * @route GET /api/reports/monthly
 * @desc Get monthly trends
 * @access HoM, HoP, ADMIN
 */
router.get('/monthly',
  requirePermission('VIEW_REPORTS'),
  [
    query('year').optional().isInt({ min: 2020, max: 2030 }).withMessage('Valid year is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const year = parseInt(req.query.year) || new Date().getFullYear();
      
      const trends = await reportingService.getMonthlyTrends(year);

      res.json({
        success: true,
        data: trends
      });
    } catch (error) {
      console.error('Get monthly trends error:', error);
      res.status(500).json({
        error: 'Failed to fetch monthly trends'
      });
    }
  }
);

/**
 * @route GET /api/reports/merchandisers
 * @desc Get merchandiser performance
 * @access HoM, ADMIN
 */
router.get('/merchandisers',
  requirePermission('VIEW_REPORTS'),
  [
    query('fromDate').optional().isISO8601().withMessage('Valid from date is required'),
    query('toDate').optional().isISO8601().withMessage('Valid to date is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { fromDate, toDate } = req.query;
      
      const performance = await reportingService.getMerchandiserPerformance(
        fromDate ? new Date(fromDate) : null,
        toDate ? new Date(toDate) : null
      );

      res.json({
        success: true,
        data: performance
      });
    } catch (error) {
      console.error('Get merchandiser performance error:', error);
      res.status(500).json({
        error: 'Failed to fetch merchandiser performance'
      });
    }
  }
);

/**
 * @route GET /api/reports/designers
 * @desc Get designer productivity
 * @access HOD_PREPRESS, HoM, HoP, ADMIN
 */
router.get('/designers',
  requirePermission('VIEW_REPORTS'),
  [
    query('fromDate').optional().isISO8601().withMessage('Valid from date is required'),
    query('toDate').optional().isISO8601().withMessage('Valid to date is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { fromDate, toDate } = req.query;
      
      const productivity = await reportingService.getDesignerProductivity(
        fromDate ? new Date(fromDate) : null,
        toDate ? new Date(toDate) : null
      );

      res.json({
        success: true,
        data: productivity
      });
    } catch (error) {
      console.error('Get designer productivity error:', error);
      res.status(500).json({
        error: 'Failed to fetch designer productivity'
      });
    }
  }
);

/**
 * @route GET /api/reports/companies
 * @desc Get company performance
 * @access HoM, ADMIN
 */
router.get('/companies',
  requirePermission('VIEW_REPORTS'),
  [
    query('fromDate').optional().isISO8601().withMessage('Valid from date is required'),
    query('toDate').optional().isISO8601().withMessage('Valid to date is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { fromDate, toDate } = req.query;
      
      const performance = await reportingService.getCompanyPerformance(
        fromDate ? new Date(fromDate) : null,
        toDate ? new Date(toDate) : null
      );

      res.json({
        success: true,
        data: performance
      });
    } catch (error) {
      console.error('Get company performance error:', error);
      res.status(500).json({
        error: 'Failed to fetch company performance'
      });
    }
  }
);

/**
 * @route GET /api/reports/product-types
 * @desc Get product type performance
 * @access HoM, HoP, ADMIN
 */
router.get('/product-types',
  requirePermission('VIEW_REPORTS'),
  [
    query('fromDate').optional().isISO8601().withMessage('Valid from date is required'),
    query('toDate').optional().isISO8601().withMessage('Valid to date is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { fromDate, toDate } = req.query;
      
      const performance = await reportingService.getProductTypePerformance(
        fromDate ? new Date(fromDate) : null,
        toDate ? new Date(toDate) : null
      );

      res.json({
        success: true,
        data: performance
      });
    } catch (error) {
      console.error('Get product type performance error:', error);
      res.status(500).json({
        error: 'Failed to fetch product type performance'
      });
    }
  }
);

/**
 * @route GET /api/reports/sla-compliance
 * @desc Get SLA compliance report
 * @access HoM, HoP, ADMIN
 */
router.get('/sla-compliance',
  requirePermission('VIEW_REPORTS'),
  [
    query('fromDate').optional().isISO8601().withMessage('Valid from date is required'),
    query('toDate').optional().isISO8601().withMessage('Valid to date is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { fromDate, toDate } = req.query;
      
      const compliance = await reportingService.getSLACompliance(
        fromDate ? new Date(fromDate) : null,
        toDate ? new Date(toDate) : null
      );

      res.json({
        success: true,
        data: compliance
      });
    } catch (error) {
      console.error('Get SLA compliance error:', error);
      res.status(500).json({
        error: 'Failed to fetch SLA compliance'
      });
    }
  }
);

/**
 * @route GET /api/reports/recent-activity
 * @desc Get recent activity
 * @access HoM, HoP, HOD_PREPRESS, ADMIN
 */
router.get('/recent-activity',
  requirePermission('VIEW_REPORTS'),
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Valid limit is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      
      const activity = await reportingService.getRecentActivity(limit);

      res.json({
        success: true,
        data: activity
      });
    } catch (error) {
      console.error('Get recent activity error:', error);
      res.status(500).json({
        error: 'Failed to fetch recent activity'
      });
    }
  }
);

/**
 * @route GET /api/reports/exports/csv
 * @desc Export report data to CSV
 * @access HoM, HoP, ADMIN
 */
router.get('/exports/csv',
  requirePermission('EXPORT_REPORTS'),
  [
    query('type').isIn(['summary', 'merchandisers', 'designers', 'companies', 'product-types', 'sla-compliance']).withMessage('Valid report type is required'),
    query('fromDate').optional().isISO8601().withMessage('Valid from date is required'),
    query('toDate').optional().isISO8601().withMessage('Valid to date is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { type, fromDate, toDate } = req.query;
      
      let data = [];
      let headers = [];
      let filename = '';

      const fromDateObj = fromDate ? new Date(fromDate) : null;
      const toDateObj = toDate ? new Date(toDate) : null;

      switch (type) {
        case 'summary':
          data = [await reportingService.getSystemSummary(fromDateObj, toDateObj)];
          headers = Object.keys(data[0] || {});
          filename = reportingService.generateReportFilename('system_summary');
          break;

        case 'merchandisers':
          data = await reportingService.getMerchandiserPerformance(fromDateObj, toDateObj);
          headers = ['first_name', 'last_name', 'email', 'total_jobs', 'completed_jobs', 'in_progress_jobs', 'pending_jobs', 'avg_turnaround_seconds', 'unique_companies', 'unique_product_types'];
          filename = reportingService.generateReportFilename('merchandiser_performance');
          break;

        case 'designers':
          data = await reportingService.getDesignerProductivity(fromDateObj, toDateObj);
          headers = ['first_name', 'last_name', 'email', 'total_jobs', 'completed_jobs', 'in_progress_jobs', 'hod_review_jobs', 'rejected_jobs', 'avg_cycle_time_seconds', 'active_days', 'high_priority_jobs'];
          filename = reportingService.generateReportFilename('designer_productivity');
          break;

        case 'companies':
          data = await reportingService.getCompanyPerformance(fromDateObj, toDateObj);
          headers = ['name', 'code', 'country', 'total_jobs', 'completed_jobs', 'in_progress_jobs', 'pending_jobs', 'total_quantity', 'avg_quantity_per_job', 'avg_turnaround_seconds', 'unique_product_types'];
          filename = reportingService.generateReportFilename('company_performance');
          break;

        case 'product-types':
          data = await reportingService.getProductTypePerformance(fromDateObj, toDateObj);
          headers = ['product_type', 'total_jobs', 'completed_jobs', 'in_progress_jobs', 'pending_jobs', 'total_quantity', 'avg_quantity_per_job', 'avg_turnaround_seconds', 'unique_companies'];
          filename = reportingService.generateReportFilename('product_type_performance');
          break;

        case 'sla-compliance':
          data = await reportingService.getSLACompliance(fromDateObj, toDateObj);
          headers = ['process_type', 'total_items', 'completed_items', 'on_time_items', 'overdue_items', 'avg_processing_time_seconds'];
          filename = reportingService.generateReportFilename('sla_compliance');
          break;

        default:
          return res.status(400).json({
            error: 'Invalid report type'
          });
      }

      const csvData = await reportingService.exportToCSV(data, headers);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvData);
    } catch (error) {
      console.error('Export CSV error:', error);
      res.status(500).json({
        error: 'Failed to export data to CSV'
      });
    }
  }
);

/**
 * @route GET /api/reports/exports/pdf
 * @desc Export report data to PDF (placeholder)
 * @access HoM, HoP, ADMIN
 */
router.get('/exports/pdf',
  requirePermission('EXPORT_REPORTS'),
  [
    query('type').isIn(['summary', 'merchandisers', 'designers', 'companies', 'product-types', 'sla-compliance']).withMessage('Valid report type is required'),
    query('fromDate').optional().isISO8601().withMessage('Valid from date is required'),
    query('toDate').optional().isISO8601().withMessage('Valid to date is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      // For now, return a placeholder response
      // In a real implementation, you would use a PDF library like jsPDF or Puppeteer
      res.json({
        success: false,
        message: 'PDF export not yet implemented. Please use CSV export for now.',
        availableFormats: ['csv']
      });
    } catch (error) {
      console.error('Export PDF error:', error);
      res.status(500).json({
        error: 'Failed to export data to PDF'
      });
    }
  }
);

export default router;
