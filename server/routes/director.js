import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import directorAnalyticsService from '../services/directorAnalyticsService.js';

const router = express.Router();

// Get team performance metrics
router.get('/team-performance', authenticateToken, asyncHandler(async (req, res) => {
  const timeframe = req.query.timeframe || 'month';
  const data = await directorAnalyticsService.getTeamPerformance(req.user, timeframe);
  res.json({
    success: true,
    data: data
  });
}));

// Get team stats for a specific senior
router.get('/team/:seniorId', authenticateToken, asyncHandler(async (req, res) => {
  const { seniorId } = req.params;
  const timeframe = req.query.timeframe || 'month';
  const dateRange = directorAnalyticsService.getDateRange(timeframe);
  const data = await directorAnalyticsService.getTeamMetrics(parseInt(seniorId), dateRange);
  res.json({
    success: true,
    data: data
  });
}));

// Get team comparison
router.get('/team-comparison', authenticateToken, asyncHandler(async (req, res) => {
  const timeframe = req.query.timeframe || 'month';
  const data = await directorAnalyticsService.getTeamComparison(req.user, timeframe);
  res.json({
    success: true,
    data: data
  });
}));

// Get team trends
router.get('/team-trends', authenticateToken, asyncHandler(async (req, res) => {
  const period = req.query.period || 'month';
  const data = await directorAnalyticsService.getTeamTrends(req.user, period);
  res.json({
    success: true,
    data: data
  });
}));

export default router;

