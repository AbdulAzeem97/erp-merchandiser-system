import express from 'express';
import pool from '../database/config.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Get overall statistics
router.get('/overall-stats', asyncHandler(async (req, res) => {
  const overallStatsQuery = `
    SELECT 
      (SELECT COUNT(*) FROM products WHERE is_active = true) as total_products,
      (SELECT COUNT(*) FROM job_cards) as total_jobs,
      (SELECT COUNT(*) FROM companies WHERE is_active = true) as total_companies,
      (SELECT COUNT(*) FROM users WHERE is_active = true) as total_users
  `;

  const overallStatsResult = await pool.query(overallStatsQuery);
  const overallStats = overallStatsResult.rows[0];

  res.json(overallStats);
}));

// Get job status statistics
router.get('/job-status', asyncHandler(async (req, res) => {
  const jobStatusQuery = `
    SELECT 
      status,
      COUNT(*) as count
    FROM job_cards
    GROUP BY status
    ORDER BY count DESC
  `;

  const jobStatusResult = await pool.query(jobStatusQuery);
  const jobStatus = jobStatusResult.rows;

  res.json(jobStatus);
}));

// Get recent activity
router.get('/recent-activity', asyncHandler(async (req, res) => {
  const recentActivityQuery = `
    SELECT 
      'job' as type,
      jc.job_card_id as identifier,
      jc.status,
      jc.created_at,
      p.brand as product_name,
      c.name as company_name
    FROM job_cards jc
    LEFT JOIN products p ON jc.product_id = p.id
    LEFT JOIN companies c ON jc.company_id = c.id
    WHERE jc.created_at >= CURRENT_DATE - INTERVAL '7 days'
    ORDER BY jc.created_at DESC
    LIMIT 10
  `;

  const recentActivityResult = await pool.query(recentActivityQuery);
  const recentActivity = recentActivityResult.rows;

  res.json(recentActivity);
}));

// Get monthly trends
router.get('/monthly-trends', asyncHandler(async (req, res) => {
  const monthlyTrendsQuery = `
    SELECT 
      DATE_TRUNC('month', created_at) as month,
      COUNT(*) as job_count,
      AVG(progress) as avg_progress
    FROM job_cards
    WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month DESC
  `;

  const monthlyTrendsResult = await pool.query(monthlyTrendsQuery);
  const monthlyTrends = monthlyTrendsResult.rows;

  res.json(monthlyTrends);
}));

// Get dashboard overview statistics (legacy endpoint)
router.get('/stats', asyncHandler(async (req, res) => {
  // Overall statistics
  const overallStatsQuery = `
    SELECT 
      (SELECT COUNT(*) FROM products WHERE is_active = true) as total_products,
      (SELECT COUNT(*) FROM job_cards) as total_jobs,
      (SELECT COUNT(*) FROM companies WHERE is_active = true) as total_companies,
      (SELECT COUNT(*) FROM users WHERE is_active = true) as total_users
  `;

  const overallStatsResult = await pool.query(overallStatsQuery);
  const overallStats = overallStatsResult.rows[0];

  // Job status breakdown
  const jobStatusQuery = `
    SELECT 
      status,
      COUNT(*) as count
    FROM job_cards
    GROUP BY status
    ORDER BY count DESC
  `;

  const jobStatusResult = await pool.query(jobStatusQuery);
  const jobStatus = jobStatusResult.rows;

  // Recent activity
  const recentActivityQuery = `
    SELECT 
      'job' as type,
      jc.job_card_id as identifier,
      jc.status,
      jc.created_at,
      p.brand as product_name,
      c.name as company_name
    FROM job_cards jc
    LEFT JOIN products p ON jc.product_id = p.id
    LEFT JOIN companies c ON jc.company_id = c.id
    WHERE jc.created_at >= CURRENT_DATE - INTERVAL '7 days'
    ORDER BY jc.created_at DESC
    LIMIT 10
  `;

  const recentActivityResult = await pool.query(recentActivityQuery);
  const recentActivity = recentActivityResult.rows;

  // Monthly job trends
  const monthlyTrendsQuery = `
    SELECT 
      DATE_TRUNC('month', created_at) as month,
      COUNT(*) as job_count,
      AVG(progress) as avg_progress
    FROM job_cards
    WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month DESC
  `;

  const monthlyTrendsResult = await pool.query(monthlyTrendsQuery);
  const monthlyTrends = monthlyTrendsResult.rows;

  res.json({
    overallStats,
    jobStatus,
    recentActivity,
    monthlyTrends
  });
}));

// Get recent jobs for dashboard
router.get('/recent-jobs', asyncHandler(async (req, res) => {
  const query = `
    SELECT 
      jc.*,
      p.product_item_code,
      p.brand,
      p.product_type,
      c.name as company_name,
      c.code as company_code,
      u.first_name || ' ' || u.last_name as created_by_name
    FROM job_cards jc
    LEFT JOIN products p ON jc.product_id = p.id
    LEFT JOIN companies c ON jc.company_id = c.id
    LEFT JOIN users u ON jc.created_by = u.id
    ORDER BY jc.created_at DESC
    LIMIT 10
  `;

  const result = await pool.query(query);
  const recentJobs = result.rows;

  res.json({
    recentJobs
  });
}));

// Get production metrics
router.get('/production-metrics', asyncHandler(async (req, res) => {
  // Production efficiency
  const efficiencyQuery = `
    SELECT 
      COUNT(*) as total_jobs,
      COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_jobs,
      COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_jobs,
      COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_jobs,
      AVG(progress) as average_progress,
      AVG(CASE WHEN status = 'Completed' THEN 
        EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600 
      END) as avg_completion_hours
    FROM job_cards
  `;

  const efficiencyResult = await pool.query(efficiencyQuery);
  const efficiency = efficiencyResult.rows[0];

  // Top performing companies
  const topCompaniesQuery = `
    SELECT 
      c.name as company_name,
      COUNT(jc.id) as total_jobs,
      COUNT(CASE WHEN jc.status = 'Completed' THEN 1 END) as completed_jobs,
      AVG(jc.progress) as avg_progress
    FROM companies c
    LEFT JOIN job_cards jc ON c.id = jc.company_id
    WHERE c.is_active = true
    GROUP BY c.id, c.name
    HAVING COUNT(jc.id) > 0
    ORDER BY completed_jobs DESC, avg_progress DESC
    LIMIT 5
  `;

  const topCompaniesResult = await pool.query(topCompaniesQuery);
  const topCompanies = topCompaniesResult.rows;

  // Product type performance
  const productPerformanceQuery = `
    SELECT 
      p.product_type,
      COUNT(jc.id) as total_jobs,
      COUNT(CASE WHEN jc.status = 'Completed' THEN 1 END) as completed_jobs,
      AVG(jc.progress) as avg_progress
    FROM products p
    LEFT JOIN job_cards jc ON p.id = jc.product_id
    WHERE p.is_active = true
    GROUP BY p.product_type
    HAVING COUNT(jc.id) > 0
    ORDER BY completed_jobs DESC
    LIMIT 5
  `;

  const productPerformanceResult = await pool.query(productPerformanceQuery);
  const productPerformance = productPerformanceResult.rows;

  res.json({
    efficiency,
    topCompanies,
    productPerformance
  });
}));

export default router;
