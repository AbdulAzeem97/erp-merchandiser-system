import express from 'express';
import dbAdapter from '../database/adapter.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Get overall statistics
router.get('/overall-stats', asyncHandler(async (req, res) => {
  const overallStatsQuery = `
    SELECT
      (SELECT COUNT(*) FROM products WHERE "isActive" = true) as total_products,
      (SELECT COUNT(*) FROM companies WHERE "isActive" = true) as total_companies,
      (SELECT COUNT(*) FROM users WHERE "isActive" = true) as total_users
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
  // Return recent products as activity since job_cards table may not exist yet
  const recentActivityQuery = `
    SELECT
      'product' as type,
      p.sku as identifier,
      p.sku as product_code,
      'active' as status,
      p."createdAt",
      p."createdAt" as due_date,
      'normal' as priority,
      100 as progress,
      p.name as product_name,
      c.name as company_name
    FROM products p
    LEFT JOIN categories c ON p."categoryId" = c.id
    WHERE p."isActive" = true
    ORDER BY p."createdAt" DESC
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
      TO_CHAR("createdAt", 'YYYY-MM') as month,
      COUNT(*) as job_count,
      COUNT(*) as avg_progress
    FROM job_cards
    WHERE "createdAt" >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
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
      COUNT(CASE WHEN "createdAt" >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as active,
      COUNT(CASE WHEN "createdAt" >= CURRENT_DATE THEN 1 END) as created_today
    FROM products
    WHERE "isActive" = true
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
      c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p."categoryId" = c.id
    WHERE p."isActive" = true
    ORDER BY p."createdAt" DESC
    LIMIT 5
  `;

  const recentProductsResult = await dbAdapter.query(recentProductsQuery);
  const recentProducts = recentProductsResult.rows || [];

  res.json(recentProducts);
}));

export default router;