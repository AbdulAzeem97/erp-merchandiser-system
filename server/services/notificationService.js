import dbAdapter from '../database/adapter.js';
import { v4 as uuidv4 } from 'uuid';

class NotificationService {
  constructor(socketHandler = null) {
    this.socketHandler = socketHandler;
  }

  setSocketHandler(socketHandler) {
    this.socketHandler = socketHandler;
  }

  // Notification Types
  static NOTIFICATION_TYPES = {
    JOB_CREATED: 'JOB_CREATED',
    JOB_STATUS_CHANGED: 'JOB_STATUS_CHANGED',
    JOB_ASSIGNED: 'JOB_ASSIGNED',
    JOB_COMPLETED: 'JOB_COMPLETED',
    JOB_DELAYED: 'JOB_DELAYED',
    JOB_OVERDUE: 'JOB_OVERDUE',
    MATERIAL_SHORTAGE: 'MATERIAL_SHORTAGE',
    QUALITY_ISSUE: 'QUALITY_ISSUE',
    EQUIPMENT_DOWN: 'EQUIPMENT_DOWN',
    DEADLINE_RISK: 'DEADLINE_RISK',
    DEPARTMENT_UPDATE: 'DEPARTMENT_UPDATE',
    SYSTEM_ALERT: 'SYSTEM_ALERT'
  };

  // Notification Priorities
  static PRIORITIES = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
  };

  // Create notification
  async createNotification(jobCardId, type, title, message, priority = 'MEDIUM', createdBy, metadata = {}) {
    try {
      const notificationId = uuidv4();
      const currentTime = new Date().toISOString();
      
      const insertQuery = `
        INSERT INTO job_notifications (
          id, job_card_id, notification_type, title, message, priority, created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      await dbAdapter.query(insertQuery, [
        notificationId,
        jobCardId,
        type,
        title,
        message,
        priority,
        createdBy,
        currentTime
      ]);

      // Emit real-time notification
      if (this.socketHandler) {
        this.socketHandler.emitNotification({
          id: notificationId,
          jobCardId,
          type,
          title,
          message,
          priority,
          timestamp: currentTime,
          metadata
        });
      }

      return { 
        id: notificationId, 
        success: true 
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Create job status change notification
  async notifyJobStatusChange(jobCardId, oldStatus, newStatus, changedBy, metadata = {}) {
    const title = 'Job Status Changed';
    const message = `Job ${jobCardId} status changed from ${oldStatus} to ${newStatus}`;
    const priority = this.getPriorityForStatusChange(oldStatus, newStatus);
    
    return await this.createNotification(
      jobCardId,
      NotificationService.NOTIFICATION_TYPES.JOB_STATUS_CHANGED,
      title,
      message,
      priority,
      changedBy,
      { oldStatus, newStatus, ...metadata }
    );
  }

  // Create job assignment notification
  async notifyJobAssignment(jobCardId, assignedTo, department, assignedBy, metadata = {}) {
    const title = 'Job Assigned';
    const message = `Job ${jobCardId} has been assigned to ${assignedTo} in ${department}`;
    
    return await this.createNotification(
      jobCardId,
      NotificationService.NOTIFICATION_TYPES.JOB_ASSIGNED,
      title,
      message,
      'MEDIUM',
      assignedBy,
      { assignedTo, department, ...metadata }
    );
  }

  // Create job completion notification
  async notifyJobCompletion(jobCardId, completedBy, department, metadata = {}) {
    const title = 'Job Completed';
    const message = `Job ${jobCardId} has been completed in ${department}`;
    
    return await this.createNotification(
      jobCardId,
      NotificationService.NOTIFICATION_TYPES.JOB_COMPLETED,
      title,
      message,
      'HIGH',
      completedBy,
      { department, ...metadata }
    );
  }

  // Create job delay notification
  async notifyJobDelay(jobCardId, delayReason, delayedBy, metadata = {}) {
    const title = 'Job Delayed';
    const message = `Job ${jobCardId} has been delayed: ${delayReason}`;
    
    return await this.createNotification(
      jobCardId,
      NotificationService.NOTIFICATION_TYPES.JOB_DELAYED,
      title,
      message,
      'HIGH',
      delayedBy,
      { delayReason, ...metadata }
    );
  }

  // Create overdue job notification
  async notifyJobOverdue(jobCardId, daysOverdue, metadata = {}) {
    const title = 'Job Overdue';
    const message = `Job ${jobCardId} is ${daysOverdue} days overdue`;
    
    return await this.createNotification(
      jobCardId,
      NotificationService.NOTIFICATION_TYPES.JOB_OVERDUE,
      title,
      message,
      'CRITICAL',
      'system',
      { daysOverdue, ...metadata }
    );
  }

  // Create material shortage notification
  async notifyMaterialShortage(materialName, currentStock, requiredQuantity, jobCardId = null, metadata = {}) {
    const title = 'Material Shortage Alert';
    const message = `Insufficient stock for ${materialName}. Current: ${currentStock}, Required: ${requiredQuantity}`;
    
    return await this.createNotification(
      jobCardId,
      NotificationService.NOTIFICATION_TYPES.MATERIAL_SHORTAGE,
      title,
      message,
      'HIGH',
      'system',
      { materialName, currentStock, requiredQuantity, ...metadata }
    );
  }

  // Create quality issue notification
  async notifyQualityIssue(jobCardId, issueDescription, department, reportedBy, metadata = {}) {
    const title = 'Quality Issue Reported';
    const message = `Quality issue in ${department} for job ${jobCardId}: ${issueDescription}`;
    
    return await this.createNotification(
      jobCardId,
      NotificationService.NOTIFICATION_TYPES.QUALITY_ISSUE,
      title,
      message,
      'HIGH',
      reportedBy,
      { issueDescription, department, ...metadata }
    );
  }

  // Create equipment down notification
  async notifyEquipmentDown(equipmentName, department, reportedBy, metadata = {}) {
    const title = 'Equipment Down';
    const message = `${equipmentName} in ${department} is down and needs attention`;
    
    return await this.createNotification(
      null,
      NotificationService.NOTIFICATION_TYPES.EQUIPMENT_DOWN,
      title,
      message,
      'CRITICAL',
      reportedBy,
      { equipmentName, department, ...metadata }
    );
  }

  // Create deadline risk notification
  async notifyDeadlineRisk(jobCardId, daysUntilDeadline, department, metadata = {}) {
    const title = 'Deadline Risk Alert';
    const message = `Job ${jobCardId} in ${department} has only ${daysUntilDeadline} days until deadline`;
    
    return await this.createNotification(
      jobCardId,
      NotificationService.NOTIFICATION_TYPES.DEADLINE_RISK,
      title,
      message,
      daysUntilDeadline <= 1 ? 'CRITICAL' : 'HIGH',
      'system',
      { daysUntilDeadline, department, ...metadata }
    );
  }

  // Get priority for status change
  getPriorityForStatusChange(oldStatus, newStatus) {
    // Critical status changes
    if (newStatus === 'CANCELLED' || newStatus === 'ON_HOLD') {
      return NotificationService.PRIORITIES.CRITICAL;
    }
    
    // High priority status changes
    if (newStatus === 'COMPLETED' || newStatus.includes('DELAYED')) {
      return NotificationService.PRIORITIES.HIGH;
    }
    
    // Medium priority for other changes
    return NotificationService.PRIORITIES.MEDIUM;
  }

  // Get notifications for user
  async getNotificationsForUser(userId, filters = {}) {
    try {
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 0;

      if (filters.isRead !== undefined) {
        paramCount++;
        whereClause += ` AND is_read = $${paramCount}`;
        params.push(filters.isRead);
      }

      if (filters.priority) {
        paramCount++;
        whereClause += ` AND priority = $${paramCount}`;
        params.push(filters.priority);
      }

      if (filters.type) {
        paramCount++;
        whereClause += ` AND notification_type = $${paramCount}`;
        params.push(filters.type);
      }

      if (filters.jobCardId) {
        paramCount++;
        whereClause += ` AND job_card_id = $${paramCount}`;
        params.push(filters.jobCardId);
      }

      const query = `
        SELECT jn.*, jc.job_card_id as job_card_id_display, jc.product_item_code,
               jc.brand, c.name as company_name
        FROM job_notifications jn
        LEFT JOIN job_cards jc ON jn.job_card_id = jc.id
        LEFT JOIN companies c ON jc.company_id = c.id
        ${whereClause}
        ORDER BY jn.created_at DESC
        LIMIT ${filters.limit || 50}
      `;

      const result = await dbAdapter.query(query, params);
      return result.rows || [];
    } catch (error) {
      console.error('Error getting notifications for user:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId, userId) {
    try {
      const updateQuery = `
        UPDATE job_notifications 
        SET is_read = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;

      await dbAdapter.query(updateQuery, [notificationId]);

      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for user
  async markAllNotificationsAsRead(userId) {
    try {
      const updateQuery = `
        UPDATE job_notifications 
        SET is_read = true, updated_at = CURRENT_TIMESTAMP
        WHERE is_read = false
      `;

      await dbAdapter.query(updateQuery);

      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get notification statistics
  async getNotificationStats(userId = null) {
    try {
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 0;

      if (userId) {
        paramCount++;
        whereClause += ` AND created_by = $${paramCount}`;
        params.push(userId);
      }

      const query = `
        SELECT 
          COUNT(*) as total_notifications,
          COUNT(CASE WHEN is_read = false THEN 1 END) as unread_notifications,
          COUNT(CASE WHEN priority = 'CRITICAL' AND is_read = false THEN 1 END) as critical_unread,
          COUNT(CASE WHEN priority = 'HIGH' AND is_read = false THEN 1 END) as high_unread,
          COUNT(CASE WHEN priority = 'MEDIUM' AND is_read = false THEN 1 END) as medium_unread,
          COUNT(CASE WHEN priority = 'LOW' AND is_read = false THEN 1 END) as low_unread,
          COUNT(CASE WHEN notification_type = 'JOB_STATUS_CHANGED' THEN 1 END) as status_change_notifications,
          COUNT(CASE WHEN notification_type = 'JOB_DELAYED' THEN 1 END) as delay_notifications,
          COUNT(CASE WHEN notification_type = 'JOB_OVERDUE' THEN 1 END) as overdue_notifications,
          COUNT(CASE WHEN notification_type = 'MATERIAL_SHORTAGE' THEN 1 END) as material_shortage_notifications
        FROM job_notifications
        ${whereClause}
      `;

      const result = await dbAdapter.query(query, params);
      return result.rows?.[0] || {};
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }

  // Clean up old notifications
  async cleanupOldNotifications(daysOld = 30) {
    try {
      const deleteQuery = `
        DELETE FROM job_notifications 
        WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '${daysOld} days'
        AND is_read = true
      `;

      const result = await dbAdapter.query(deleteQuery);
      
      console.log(`Cleaned up ${result.rowCount} old notifications`);
      return { success: true, deletedCount: result.rowCount };
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }

  // Send bulk notifications
  async sendBulkNotifications(notifications) {
    try {
      const results = [];
      
      for (const notification of notifications) {
        const result = await this.createNotification(
          notification.jobCardId,
          notification.type,
          notification.title,
          notification.message,
          notification.priority,
          notification.createdBy,
          notification.metadata
        );
        results.push(result);
      }
      
      return { success: true, results };
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw error;
    }
  }
}

export default NotificationService;
