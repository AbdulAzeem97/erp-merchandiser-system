import express from 'express';
import dbAdapter from '../database/adapter.js';
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

  const overallStatsResult = await dbAdapter.query(overallStatsQuery);
  const overallStats = overallStatsResult.rows?.[0] || {};

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

  const jobStatusResult = await dbAdapter.query(jobStatusQuery);
  const jobStatus = jobStatusResult.rows || [];

  res.json(jobStatus);
}));

// Get recent activity
router.get('/recent-activity', asyncHandler(async (req, res) => {
  const recentActivityQuery = `
    SELECT 
      'job' as type,
      jc.job_card_id as identifier,
      p.product_item_code as product_code,
      jc.status,
      jc.created_at,
      jc.delivery_date as due_date,
      jc.priority,
      NULL as progress,
      p.brand as product_name,
      c.name as company_name
    FROM job_cards jc
    LEFT JOIN products p ON jc.product_id = p.id
    LEFT JOIN companies c ON jc.company_id = c.id
    WHERE jc.created_at >= CURRENT_DATE - INTERVAL '30 days'
    ORDER BY
      CASE WHEN jc.product_id IS NOT NULL OR jc.company_id IS NOT NULL THEN 0 ELSE 1 END,
      jc.created_at DESC
    LIMIT 10
  `;

  const recentActivityResult = await dbAdapter.query(recentActivityQuery);
  const recentActivity = recentActivityResult.rows || [];

  res.json(recentActivity);
}));

// Get monthly trends
router.get('/monthly-trends', asyncHandler(async (req, res) => {
  const monthlyTrendsQuery = `
    SELECT 
      TO_CHAR(created_at, 'YYYY-MM') as month,
      COUNT(*) as job_count,
      COUNT(*) as avg_progress
    FROM job_cards
    WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY TO_CHAR(created_at, 'YYYY-MM')
    ORDER BY month DESC
  `;

  const monthlyTrendsResult = await dbAdapter.query(monthlyTrendsQuery);
  const monthlyTrends = monthlyTrendsResult.rows || [];

  res.json(monthlyTrends);
}));

// Get products summary
router.get('/products-summary', asyncHandler(async (req, res) => {
  const productsSummaryQuery = `
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as active,
      COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as created_today
    FROM products
    WHERE is_active = true
  `;

  const productsSummaryResult = await dbAdapter.query(productsSummaryQuery);
  const productsSummary = productsSummaryResult.rows?.[0] || {};

  res.json(productsSummary);
}));

// Get recent products
router.get('/recent-products', asyncHandler(async (req, res) => {
  const recentProductsQuery = `
    SELECT 
      p.*,
      m.name as material_name,
      pc.name as category_name
    FROM products p
    LEFT JOIN materials m ON p.material_id = m.id
    LEFT JOIN product_categories pc ON p.category_id = pc.id   
    WHERE p.is_active = true
    ORDER BY p.created_at DESC
    LIMIT 5
  `;

  const recentProductsResult = await dbAdapter.query(recentProductsQuery);
  const recentProducts = recentProductsResult.rows || [];

  res.json(recentProducts);
}));

export default router;