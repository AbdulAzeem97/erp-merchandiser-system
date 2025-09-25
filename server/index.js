import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routes
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import jobRoutes from './routes/jobs.js';
import companyRoutes from './routes/companies.js';
import dashboardRoutes from './routes/dashboard.js';
import uploadRoutes from './routes/upload.js';
import processSequenceRoutes from './routes/processSequences.js';
import prepressRoutes from './routes/prepress.js';
import enhancedPrepressRoutes, { initializePrepressService } from './routes/enhancedPrepress.js';
import prepressWorkflowRoutes from './routes/prepressWorkflow.js';
import reportsRoutes from './routes/reports.js';
import jobLifecycleRoutes, { setLifecycleSocketHandler } from './routes/jobLifecycle.js';
import completeJobLifecycleRoutes from './routes/completeJobLifecycle.js';
import inventoryRoutes from './routes/inventory.js';
// import productionRoutes from './routes/production.js';
import jobAssignmentRoutes from './routes/jobAssignment.js';
import jobAssignmentHistoryRoutes from './routes/jobAssignmentHistory.js';
import prismaApiRoutes from './routes/prisma-api.js';
import prismaAuthRoutes from './routes/prisma-auth.js';

// Import middleware
import { authenticateToken } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

// Import socket handler
import SocketHandler from './socket/socketHandler.js';
import EnhancedSocketHandler from './socket/enhancedSocketHandler.js';

// Import services
import EnhancedJobLifecycleService from './services/enhancedJobLifecycleService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'development' ? true : [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://localhost:8083',
      'http://localhost:8084',
      'http://localhost:8081',
      'http://localhost:3000',
      /^http:\/\/192\.168\.\d+\.\d+:8080$/,  // Allow local network access
      /^http:\/\/10\.\d+\.\d+\.\d+:8080$/,   // Allow local network access
      /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+:8080$/  // Allow local network access
    ],
    credentials: true,
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5001;

// Initialize socket handlers
const socketHandler = new SocketHandler(io);
const enhancedSocketHandler = new EnhancedSocketHandler(io);

// Make socket handler available to routes
app.set('io', io);
app.set('socketHandler', socketHandler);

// Initialize enhanced job lifecycle service with socket handler
const jobLifecycleService = new EnhancedJobLifecycleService(enhancedSocketHandler);
setLifecycleSocketHandler(io);

// Initialize enhanced prepress service with Socket.io
initializePrepressService(io);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting - more permissive for development
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // limit each IP to 1000 requests per minute in development
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => process.env.NODE_ENV === 'development' // Skip rate limiting in development
});
app.use('/api/', limiter);

// CORS configuration - more permissive for development
const corsOptions = {
  origin: process.env.NODE_ENV === 'development' ? true : [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:8083',
    'http://localhost:8084',
    'http://localhost:3000',
    /^http:\/\/192\.168\.\d+\.\d+:(8080|8081|8082|8083|8084)$/,  // Allow local network access
    /^http:\/\/10\.\d+\.\d+\.\d+:(8080|8081|8082|8083|8084)$/,   // Allow local network access
    /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+:(8080|8081|8082|8083|8084)$/  // Allow local network access
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes); // Re-enabled with SQLite syntax
app.use('/api/jobs', jobRoutes); // Re-enabled for job lifecycle
app.use('/api/companies', authenticateToken, companyRoutes); // Re-enabled for job lifecycle
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/upload', authenticateToken, uploadRoutes); // Re-enabled for job lifecycle
app.use('/api/process-sequences', processSequenceRoutes); // Re-enabled for job lifecycle
app.use('/api/prepress', prepressRoutes);
app.use('/api/enhanced-prepress', enhancedPrepressRoutes);
app.use('/api/prepress-workflow', authenticateToken, prepressWorkflowRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/job-lifecycle', authenticateToken, jobLifecycleRoutes);
app.use('/api/complete-job-lifecycle', authenticateToken, completeJobLifecycleRoutes);
app.use('/api/inventory', authenticateToken, inventoryRoutes);
// app.use('/api/production', authenticateToken, productionRoutes);
app.use('/api/job-assignment', jobAssignmentRoutes);
app.use('/api/job-assignment-history', authenticateToken, jobAssignmentHistoryRoutes);

// NEW: Prisma-based API routes (working with correct column names)
app.use('/api/v2', prismaApiRoutes);
app.use('/api/v2/auth', prismaAuthRoutes);

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Initialize database adapter after environment variables are loaded
(async () => {
  try {
    const dbAdapter = (await import('./database/adapter.js')).default;
    await dbAdapter.initialize();

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 ERP Merchandiser Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 Network access: http://0.0.0.0:${PORT}`);
      console.log(`🔌 Socket.io server initialized`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
})();

// Make socket handler, io instance, and services available globally for use in routes
global.socketHandler = socketHandler;
global.jobLifecycleService = jobLifecycleService;
app.set('io', io);

export { socketHandler, jobLifecycleService };

export default app;