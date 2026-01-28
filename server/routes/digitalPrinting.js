import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import DigitalPrintingWorkflowService from '../services/digitalPrintingWorkflowService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
const digitalPrintingService = new DigitalPrintingWorkflowService();

// Middleware to set socket handler if needed
router.use((req, res, next) => {
    if (req.app.get('io') && !digitalPrintingService.socketHandler) {
        digitalPrintingService.setSocketHandler(req.app.get('io'));
    }
    next();
});

/**
 * GET /api/digital-printing/jobs
 * Get all Digital Printing jobs
 */
router.get('/jobs', authenticateToken, requirePermission(['HOD_DIGITAL', 'DIGITAL_OPERATOR', 'ADMIN']), asyncHandler(async (req, res) => {
    const filters = {
        status: req.query.status,
        priority: req.query.priority,
        assignedTo: req.query.assignedTo
    };

    const jobs = await digitalPrintingService.getDigitalPrintingJobs(filters);
    res.json({ success: true, jobs });
}));

/**
 * POST /api/digital-printing/start
 * Start Digital Printing for a job
 */
router.post('/start', authenticateToken, requirePermission(['HOD_DIGITAL', 'DIGITAL_OPERATOR', 'ADMIN']), asyncHandler(async (req, res) => {
    const { jobId } = req.body;
    const userId = req.user.id;

    await digitalPrintingService.startDigitalPrinting(jobId, userId);
    res.json({ success: true, message: 'Digital Printing started' });
}));

/**
 * POST /api/digital-printing/update
 * Update Digital Printing data (machine, sheets, status)
 */
router.post('/update', authenticateToken, requirePermission(['HOD_DIGITAL', 'DIGITAL_OPERATOR', 'ADMIN']), asyncHandler(async (req, res) => {
    const { jobId, machineType, outputSheets, rejectSheets, status, notes } = req.body;
    const userId = req.user.id;

    await digitalPrintingService.updateDigitalData(jobId, {
        machineType,
        outputSheets,
        rejectSheets,
        status,
        notes
    }, userId);

    res.json({ success: true, message: 'Digital Printing data updated' });
}));

export default router;
