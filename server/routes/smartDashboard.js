import express from 'express';
import smartDashboardController from '../controllers/smartDashboardController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Test route to verify routing works
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Smart dashboard routes are working' });
});

// Get all jobs after CTP completion
router.get(
  '/jobs',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await smartDashboardController.getPostCTPJobs(req, res);
  })
);

// Get detailed job data with material info
router.get(
  '/jobs/:jobId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await smartDashboardController.getJobDetails(req, res);
  })
);

// Get available sizes for a material
router.get(
  '/materials/:materialId/sizes',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await smartDashboardController.getMaterialSizes(req, res);
  })
);

// Add new sheet size for a material
router.post(
  '/materials/:materialId/sizes',
  authenticateToken,
  asyncHandler(async (req, res, next) => {
    console.log('📥 POST /materials/:materialId/sizes route hit');
    console.log('Params:', req.params);
    console.log('Body:', req.body);
    try {
      await smartDashboardController.addMaterialSize(req, res);
    } catch (error) {
      console.error('Error in addMaterialSize route:', error);
      next(error);
    }
  })
);

// Calculate optimal sheet selection
router.post(
  '/jobs/:jobId/optimize',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await smartDashboardController.optimizeSheetSelection(req, res);
  })
);

// Save or update planning
router.post(
  '/jobs/:jobId/planning',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await smartDashboardController.savePlanning(req, res);
  })
);

// Apply planning (lock + update inventory + workflow)
router.post(
  '/jobs/:jobId/apply',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await smartDashboardController.applyPlanning(req, res);
  })
);

// Calculate cost
router.post(
  '/jobs/:jobId/cost',
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const { baseSheets, additionalSheets, sheetSizeId } = req.body;
      const costCalculationService = (await import('../services/costCalculationService.js')).default;
      const costSummary = await costCalculationService.getTotalCost(
        baseSheets,
        additionalSheets,
        sheetSizeId
      );
      res.json({
        success: true,
        costSummary
      });
    } catch (error) {
      console.error('Error calculating cost:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate cost',
        message: error.message
      });
    }
  })
);

// Generate PDF cutting guide
router.get(
  '/jobs/:jobId/cutting-guide-pdf',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await smartDashboardController.generateCuttingGuide(req, res);
  })
);

// Log all registered routes for debugging
console.log('📋 Smart Dashboard routes registered:');
console.log('  GET  /materials/:materialId/sizes');
console.log('  POST /materials/:materialId/sizes');
console.log('  GET  /jobs');
console.log('  GET  /jobs/:jobId');
console.log('  POST /jobs/:jobId/optimize');
console.log('  POST /jobs/:jobId/planning');
console.log('  POST /jobs/:jobId/apply');

export default router;

