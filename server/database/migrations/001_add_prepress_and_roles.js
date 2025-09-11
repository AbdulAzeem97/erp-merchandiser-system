// Migration utilities for prepress module
import dbAdapter from '../adapter.js';

/**
 * Log prepress activity
 */
export async function logPrepressActivity(prepressJobId, actorId, action, fromStatus = null, toStatus = null, remark = null, metadata = null) {
  try {
    const result = await pool.query(`
      INSERT INTO prepress_activity (prepress_job_id, actor_id, action, from_status, to_status, remark, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [prepressJobId, actorId, action, fromStatus, toStatus, remark, metadata ? JSON.stringify(metadata) : null]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error logging prepress activity:', error);
    throw error;
  }
}

/**
 * Validate prepress status transition
 */
export function validatePrepressStatusTransition(fromStatus, toStatus, userRole) {
  // Prepress status state machine
  const STATUS_TRANSITIONS = {
    PENDING: ['ASSIGNED'],
    ASSIGNED: ['IN_PROGRESS', 'REASSIGNED'],
    IN_PROGRESS: ['PAUSED', 'HOD_REVIEW', 'REJECTED'],
    PAUSED: ['IN_PROGRESS', 'REJECTED'],
    HOD_REVIEW: ['COMPLETED', 'REJECTED'],
    COMPLETED: [], // Terminal state
    REJECTED: ['ASSIGNED', 'IN_PROGRESS'] // Can be reassigned
  };

  // Role-based transition permissions
  const ROLE_TRANSITIONS = {
    HOD_PREPRESS: ['ASSIGNED', 'REASSIGNED', 'HOD_REVIEW', 'REJECTED', 'COMPLETED'],
    DESIGNER: ['STARTED', 'PAUSED', 'RESUMED', 'COMPLETED'],
    ADMIN: ['*'] // Can do any transition
  };

  // Admin can do any transition
  if (userRole === 'ADMIN') {
    return true;
  }

  // Check if transition is allowed in state machine
  const allowedTransitions = STATUS_TRANSITIONS[fromStatus] || [];
  if (!allowedTransitions.includes(toStatus)) {
    return false;
  }

  // Check role permissions
  const roleTransitions = ROLE_TRANSITIONS[userRole] || [];
  return roleTransitions.includes('*') || roleTransitions.includes(toStatus);
}

/**
 * Get action name from status change
 */
export function getActionFromStatusChange(fromStatus, toStatus) {
  const actionMap = {
    'PENDING->ASSIGNED': 'ASSIGNED',
    'ASSIGNED->IN_PROGRESS': 'STARTED',
    'IN_PROGRESS->PAUSED': 'PAUSED',
    'PAUSED->IN_PROGRESS': 'RESUMED',
    'IN_PROGRESS->HOD_REVIEW': 'COMPLETED',
    'HOD_REVIEW->COMPLETED': 'APPROVED',
    'HOD_REVIEW->REJECTED': 'REJECTED',
    'ASSIGNED->REASSIGNED': 'REASSIGNED'
  };

  return actionMap[`${fromStatus}->${toStatus}`] || 'STATUS_CHANGED';
}
