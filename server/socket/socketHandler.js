import jwt from 'jsonwebtoken';
import dbAdapter from '../database/adapter.js';

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    // Authentication middleware for socket connections
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // Get user data from database
        const userResult = await dbAdapter.query(
          'SELECT id, username, email, first_name, last_name, role, is_active FROM users WHERE id = $1',
          [decoded.id]
        );

        const user = userResult.rows[0];
        if (!user || !user.is_active) {
          return next(new Error('User not found or inactive'));
        }

        socket.user = user;

        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.user.first_name} ${socket.user.last_name} (${socket.user.role})`);
      
      // Join user-specific room
      socket.join(`user:${socket.user.id}`);
      
      // Join role-specific rooms
      socket.join(`role:${socket.user.role}`);
      
      // Join specific rooms based on role
      this.joinRoleSpecificRooms(socket);

      // Handle prepress job updates
      socket.on('join_prepress_job', (jobId) => {
        socket.join(`prepress:job:${jobId}`);
        console.log(`📋 User ${socket.user.id} joined prepress job ${jobId}`);
      });

      socket.on('leave_prepress_job', (jobId) => {
        socket.leave(`prepress:job:${jobId}`);
        console.log(`📋 User ${socket.user.id} left prepress job ${jobId}`);
      });

      // Handle designer queue updates
      if (socket.user.role === 'DESIGNER') {
        socket.join(`prepress:designer:${socket.user.id}`);
      }

      // Handle HOD prepress updates
      if (['HOD_PREPRESS', 'ADMIN'].includes(socket.user.role)) {
        socket.join('prepress:hod');
      }

      // Handle dashboard updates
      if (['HEAD_OF_MERCHANDISER', 'HEAD_OF_PRODUCTION', 'ADMIN'].includes(socket.user.role)) {
        socket.join('dashboard:kpis');
      }

      // Handle product updates
      socket.on('join_product_updates', () => {
        socket.join('product_updates');
        console.log(`📦 User ${socket.user.id} joined product updates`);
      });

      // Handle job updates
      socket.on('join_job_updates', () => {
        socket.join('job_updates');
        console.log(`🏭 User ${socket.user.id} joined job updates`);
      });

      // Handle job lifecycle monitoring
      socket.on('join_job_monitoring', (jobCardId) => {
        this.joinJobMonitoring(socket, jobCardId);
      });

      socket.on('leave_job_monitoring', (jobCardId) => {
        this.leaveJobMonitoring(socket, jobCardId);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`🔌 User disconnected: ${socket.user.first_name} ${socket.user.last_name}`);
      });
    });
  }

  joinRoleSpecificRooms(socket) {
    const userRole = socket.user.role;
    
    switch (userRole) {
      case 'ADMIN':
        socket.join(['admin:all', 'dashboard:kpis', 'prepress:hod']);
        break;
      case 'HEAD_OF_MERCHANDISER':
        socket.join(['hom:dashboard', 'dashboard:kpis']);
        break;
      case 'HEAD_OF_PRODUCTION':
        socket.join(['hop:dashboard', 'dashboard:kpis']);
        break;
      case 'HOD_PREPRESS':
        socket.join(['prepress:hod', 'dashboard:kpis']);
        break;
      case 'DESIGNER':
        socket.join(`prepress:designer:${socket.user.id}`);
        break;
      case 'MERCHANDISER':
        socket.join(`merchandiser:${socket.user.id}`);
        break;
    }
  }

  // Emit prepress job updates
  emitPrepressJobUpdate(jobId, updateType, data) {
    this.io.to(`prepress:job:${jobId}`).emit('prepress_job_update', {
      jobId,
      updateType,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Emit designer queue updates
  emitDesignerQueueUpdate(designerId, updateType, data) {
    this.io.to(`prepress:designer:${designerId}`).emit('designer_queue_update', {
      designerId,
      updateType,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Emit HOD prepress updates
  emitHODPrepressUpdate(updateType, data) {
    this.io.to('prepress:hod').emit('hod_prepress_update', {
      updateType,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Emit dashboard KPI updates
  emitDashboardKPIUpdate(updateType, data) {
    this.io.to('dashboard:kpis').emit('dashboard_kpi_update', {
      updateType,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Emit user notification
  emitUserNotification(userId, notification) {
    this.io.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  // Emit role-specific updates
  emitRoleUpdate(role, updateType, data) {
    this.io.to(`role:${role}`).emit('role_update', {
      role,
      updateType,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Emit product updates
  emitProductUpdate(updateType, data) {
    this.io.to('product_updates').emit('productUpdated', {
      updateType,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Emit job updates
  emitJobUpdate(updateType, data) {
    this.io.to('job_updates').emit('jobUpdated', {
      updateType,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Emit new job creation
  emitJobCreated(jobData) {
    this.io.to('job_updates').emit('jobCreated', {
      data: jobData,
      timestamp: new Date().toISOString()
    });
  }

  // Emit job assignment to designer
  emitJobAssigned(jobData) {
    this.io.to(`prepress:designer:${jobData.assigned_designer_id}`).emit('jobAssigned', {
      data: jobData,
      timestamp: new Date().toISOString()
    });
  }

  // Emit job lifecycle updates
  emitJobLifecycleUpdate(jobCardId, updateType, data) {
    // Emit to all job update subscribers
    this.io.to('job_updates').emit('job_lifecycle_update', {
      jobCardId,
      updateType,
      data,
      timestamp: new Date().toISOString()
    });

    // Emit to specific job room if anyone is monitoring it
    this.io.to(`job:${jobCardId}`).emit('job_status_update', {
      jobCardId,
      updateType,
      data,
      timestamp: new Date().toISOString()
    });

    // Emit to merchandisers and admins for monitoring
    this.io.to('role:MERCHANDISER').emit('job_lifecycle_update', {
      jobCardId,
      updateType,
      data,
      timestamp: new Date().toISOString()
    });

    this.io.to('role:ADMIN').emit('job_lifecycle_update', {
      jobCardId,
      updateType,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Join job monitoring room
  joinJobMonitoring(socket, jobCardId) {
    socket.join(`job:${jobCardId}`);
    console.log(`📊 User ${socket.user.id} joined monitoring for job ${jobCardId}`);
  }

  // Leave job monitoring room
  leaveJobMonitoring(socket, jobCardId) {
    socket.leave(`job:${jobCardId}`);
    console.log(`📊 User ${socket.user.id} left monitoring for job ${jobCardId}`);
  }

  // Broadcast system-wide updates
  broadcastSystemUpdate(updateType, data) {
    this.io.emit('system_update', {
      updateType,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.io.engine.clientsCount;
  }

  // Get connected users by role
  getConnectedUsersByRole() {
    const roleCounts = {};
    
    this.io.sockets.sockets.forEach((socket) => {
      if (socket.user) {
        const role = socket.user.role;
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      }
    });
    
    return roleCounts;
  }
}

export default SocketHandler;
