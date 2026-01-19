import { Server } from 'socket.io';
import CompleteJobLifecycleService from '../services/completeJobLifecycleService.js';
import EnhancedPrepressService from '../services/enhancedPrepressService.js';
import InventoryService from '../services/inventoryService.js';
import NotificationService from '../services/notificationService.js';

class EnhancedSocketHandler {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map();
    this.jobRooms = new Map();
    
    // Initialize services
    this.jobLifecycleService = new CompleteJobLifecycleService(this);
    this.prepressService = new EnhancedPrepressService(this);
    this.inventoryService = new InventoryService(this);
    this.notificationService = new NotificationService(this);
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Enhanced Socket connected: ${socket.id}`);
      
      // User authentication and room joining
      socket.on('authenticate', (data) => {
        this.handleAuthentication(socket, data);
      });

      // Job lifecycle events
      socket.on('join_job_updates', () => {
        this.handleJoinJobUpdates(socket);
      });

      socket.on('join_job_room', (jobCardId) => {
        this.handleJoinJobRoom(socket, jobCardId);
      });

      socket.on('leave_job_room', (jobCardId) => {
        this.handleLeaveJobRoom(socket, jobCardId);
      });

      // Prepress events
      socket.on('join_prepress_updates', () => {
        this.handleJoinPrepressUpdates(socket);
      });

      socket.on('prepress_status_update', (data) => {
        this.handlePrepressStatusUpdate(socket, data);
      });

      // Inventory events
      socket.on('join_inventory_updates', () => {
        this.handleJoinInventoryUpdates(socket);
      });

      socket.on('inventory_status_update', (data) => {
        this.handleInventoryStatusUpdate(socket, data);
      });

      // Production events
      socket.on('join_production_updates', () => {
        this.handleJoinProductionUpdates(socket);
      });

      socket.on('production_status_update', (data) => {
        this.handleProductionStatusUpdate(socket, data);
      });

      // QA events
      socket.on('join_qa_updates', () => {
        this.handleJoinQAUpdates(socket);
      });

      socket.on('qa_status_update', (data) => {
        this.handleQAStatusUpdate(socket, data);
      });

      // Dispatch events
      socket.on('join_dispatch_updates', () => {
        this.handleJoinDispatchUpdates(socket);
      });

      socket.on('dispatch_status_update', (data) => {
        this.handleDispatchStatusUpdate(socket, data);
      });

      // Offset Printing events
      socket.on('join_offset_printing_updates', () => {
        this.handleJoinOffsetPrintingUpdates(socket);
      });

      socket.on('offset_printing_status_update', (data) => {
        this.handleOffsetPrintingStatusUpdate(socket, data);
      });

      // Notification events
      socket.on('join_notifications', (userId) => {
        this.handleJoinNotifications(socket, userId);
      });

      socket.on('mark_notification_read', (notificationId) => {
        this.handleMarkNotificationRead(socket, notificationId);
      });

      // Disconnect handling
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  handleAuthentication(socket, data) {
    const { userId, role, department } = data;
    
    this.connectedUsers.set(socket.id, {
      userId,
      role,
      department,
      socketId: socket.id,
      connectedAt: new Date()
    });

    // Join role-based rooms
    socket.join(`role_${role}`);
    if (department) {
      socket.join(`department_${department}`);
    }

    console.log(`✅ User ${userId} (${role}) authenticated and joined rooms`);
    
    socket.emit('authenticated', {
      success: true,
      userId,
      role,
      department
    });
  }

  handleJoinJobUpdates(socket) {
    socket.join('job_updates');
    console.log(`📊 Socket ${socket.id} joined job updates`);
  }

  handleJoinJobRoom(socket, jobCardId) {
    socket.join(`job_${jobCardId}`);
    this.jobRooms.set(socket.id, jobCardId);
    console.log(`📋 Socket ${socket.id} joined job room: ${jobCardId}`);
  }

  handleLeaveJobRoom(socket, jobCardId) {
    socket.leave(`job_${jobCardId}`);
    this.jobRooms.delete(socket.id);
    console.log(`📋 Socket ${socket.id} left job room: ${jobCardId}`);
  }

  handleJoinPrepressUpdates(socket) {
    socket.join('prepress_updates');
    console.log(`🎨 Socket ${socket.id} joined prepress updates`);
  }

  handlePrepressStatusUpdate(socket, data) {
    const { prepressJobId, category, status, notes, updatedBy } = data;
    
    // Update prepress status
    this.prepressService.updateCategoryStatus(
      prepressJobId,
      category,
      status,
      updatedBy,
      notes
    ).then(() => {
      // Broadcast to prepress room
      this.io.to('prepress_updates').emit('prepress_status_updated', {
        prepressJobId,
        category,
        status,
        notes,
        updatedBy,
        timestamp: new Date().toISOString()
      });
    }).catch(error => {
      console.error('Error updating prepress status:', error);
      socket.emit('error', { message: 'Failed to update prepress status' });
    });
  }

  handleJoinInventoryUpdates(socket) {
    socket.join('inventory_updates');
    console.log(`📦 Socket ${socket.id} joined inventory updates`);
  }

  handleInventoryStatusUpdate(socket, data) {
    const { inventoryJobId, status, notes, updatedBy } = data;
    
    // Update inventory status
    this.inventoryService.updateInventoryJobStatus(
      inventoryJobId,
      status,
      updatedBy,
      notes
    ).then(() => {
      // Broadcast to inventory room
      this.io.to('inventory_updates').emit('inventory_status_updated', {
        inventoryJobId,
        status,
        notes,
        updatedBy,
        timestamp: new Date().toISOString()
      });
    }).catch(error => {
      console.error('Error updating inventory status:', error);
      socket.emit('error', { message: 'Failed to update inventory status' });
    });
  }

  handleJoinProductionUpdates(socket) {
    socket.join('production_updates');
    console.log(`🏭 Socket ${socket.id} joined production updates`);
  }

  handleProductionStatusUpdate(socket, data) {
    const { jobCardId, productionStatus, departmentId, processId, notes, updatedBy } = data;
    
    // Update production status
    this.jobLifecycleService.updateProductionStatus(
      jobCardId,
      productionStatus,
      departmentId,
      processId,
      updatedBy,
      notes
    ).then(() => {
      // Broadcast to production room
      this.io.to('production_updates').emit('production_status_updated', {
        jobCardId,
        productionStatus,
        departmentId,
        processId,
        notes,
        updatedBy,
        timestamp: new Date().toISOString()
      });
    }).catch(error => {
      console.error('Error updating production status:', error);
      socket.emit('error', { message: 'Failed to update production status' });
    });
  }

  handleJoinQAUpdates(socket) {
    socket.join('qa_updates');
    console.log(`🔍 Socket ${socket.id} joined QA updates`);
  }

  handleQAStatusUpdate(socket, data) {
    const { jobCardId, qaStatus, notes, updatedBy } = data;
    
    // Update QA status
    this.jobLifecycleService.updateQAStatus(
      jobCardId,
      qaStatus,
      updatedBy,
      notes
    ).then(() => {
      // Broadcast to QA room
      this.io.to('qa_updates').emit('qa_status_updated', {
        jobCardId,
        qaStatus,
        notes,
        updatedBy,
        timestamp: new Date().toISOString()
      });
    }).catch(error => {
      console.error('Error updating QA status:', error);
      socket.emit('error', { message: 'Failed to update QA status' });
    });
  }

  handleJoinDispatchUpdates(socket) {
    socket.join('dispatch_updates');
    console.log(`🚚 Socket ${socket.id} joined dispatch updates`);
  }

  handleDispatchStatusUpdate(socket, data) {
    const { jobCardId, dispatchStatus, notes, updatedBy } = data;
    
    // Update dispatch status
    this.jobLifecycleService.updateDispatchStatus(
      jobCardId,
      dispatchStatus,
      updatedBy,
      notes
    ).then(() => {
      // Broadcast to dispatch room
      this.io.to('dispatch_updates').emit('dispatch_status_updated', {
        jobCardId,
        dispatchStatus,
        notes,
        updatedBy,
        timestamp: new Date().toISOString()
      });
    }).catch(error => {
      console.error('Error updating dispatch status:', error);
      socket.emit('error', { message: 'Failed to update dispatch status' });
    });
  }

  handleJoinOffsetPrintingUpdates(socket) {
    socket.join('offset_printing_updates');
    console.log(`🖨️ Socket ${socket.id} joined offset printing updates`);
  }

  handleOffsetPrintingStatusUpdate(socket, data) {
    // Events are already emitted from the service, but we can add additional handling here if needed
    // The service methods emit: offset_printing:progress_updated, offset_printing:plate_completed, etc.
    // These are broadcast automatically via the service's socketHandler
    console.log(`🖨️ Offset printing status update received:`, data);
  }

  handleJoinNotifications(socket, userId) {
    socket.join(`notifications_${userId}`);
    console.log(`🔔 Socket ${socket.id} joined notifications for user ${userId}`);
  }

  handleMarkNotificationRead(socket, notificationId) {
    this.notificationService.markNotificationAsRead(notificationId, 'user')
      .then(() => {
        socket.emit('notification_marked_read', { notificationId });
      })
      .catch(error => {
        console.error('Error marking notification as read:', error);
        socket.emit('error', { message: 'Failed to mark notification as read' });
      });
  }

  handleDisconnect(socket) {
    const user = this.connectedUsers.get(socket.id);
    if (user) {
      console.log(`👋 User ${user.userId} disconnected`);
      this.connectedUsers.delete(socket.id);
    }
    
    const jobCardId = this.jobRooms.get(socket.id);
    if (jobCardId) {
      this.jobRooms.delete(socket.id);
    }
    
    console.log(`🔌 Socket ${socket.id} disconnected`);
  }

  // Emit methods for services to use
  emitJobLifecycleUpdate(jobCardId, eventType, data) {
    const update = {
      jobCardId,
      eventType,
      data,
      timestamp: new Date().toISOString()
    };

    // Emit to job-specific room
    this.io.to(`job_${jobCardId}`).emit('job_lifecycle_update', update);
    
    // Emit to general job updates room
    this.io.to('job_updates').emit('job_lifecycle_update', update);
    
    console.log(`📊 Emitted job lifecycle update for ${jobCardId}: ${eventType}`);
  }

  emitPrepressUpdate(jobCardId, eventType, data) {
    const update = {
      jobCardId,
      eventType,
      data,
      timestamp: new Date().toISOString()
    };

    // Emit to prepress room
    this.io.to('prepress_updates').emit('prepress_job_update', update);
    
    // Emit to job-specific room
    this.io.to(`job_${jobCardId}`).emit('prepress_job_update', update);
    
    console.log(`🎨 Emitted prepress update for ${jobCardId}: ${eventType}`);
  }

  emitInventoryUpdate(jobCardId, eventType, data) {
    const update = {
      jobCardId,
      eventType,
      data,
      timestamp: new Date().toISOString()
    };

    // Emit to inventory room
    this.io.to('inventory_updates').emit('inventory_job_update', update);
    
    // Emit to job-specific room
    this.io.to(`job_${jobCardId}`).emit('inventory_job_update', update);
    
    console.log(`📦 Emitted inventory update for ${jobCardId}: ${eventType}`);
  }

  emitNotification(notification) {
    // Emit to user-specific notification room
    this.io.to(`notifications_${notification.created_by}`).emit('notification', notification);
    
    // Emit to general notifications room
    this.io.to('notifications').emit('notification', notification);
    
    console.log(`🔔 Emitted notification: ${notification.title}`);
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get users by role
  getUsersByRole(role) {
    const users = [];
    for (const [socketId, user] of this.connectedUsers) {
      if (user.role === role) {
        users.push(user);
      }
    }
    return users;
  }

  // Get users by department
  getUsersByDepartment(department) {
    const users = [];
    for (const [socketId, user] of this.connectedUsers) {
      if (user.department === department) {
        users.push(user);
      }
    }
    return users;
  }

  // Broadcast to role
  broadcastToRole(role, event, data) {
    this.io.to(`role_${role}`).emit(event, data);
  }

  // Broadcast to department
  broadcastToDepartment(department, event, data) {
    this.io.to(`department_${department}`).emit(event, data);
  }

  // Broadcast to all
  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }

  // Broadcast team performance update to directors
  broadcastTeamPerformanceUpdate(teamData) {
    this.broadcastToRole('DIRECTOR', 'team:performance_updated', teamData);
  }
}

export default EnhancedSocketHandler;