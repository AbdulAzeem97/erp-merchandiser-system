import jwt from 'jsonwebtoken';
import dbAdapter from '../database/adapter.js';

// Role hierarchy and permissions
const ROLE_HIERARCHY = {
  ADMIN: ['ADMIN', 'HEAD_OF_MERCHANDISER', 'HEAD_OF_PRODUCTION', 'HOD_PREPRESS', 'DESIGNER', 'MERCHANDISER', 'QA', 'QA_PREPRESS', 'INVENTORY_MANAGER', 'PROCUREMENT_MANAGER'],
  HEAD_OF_MERCHANDISER: ['HEAD_OF_MERCHANDISER', 'MERCHANDISER'],
  HEAD_OF_PRODUCTION: ['HEAD_OF_PRODUCTION', 'HOD_PREPRESS', 'DESIGNER', 'QA', 'QA_PREPRESS'],
  HOD_PREPRESS: ['HOD_PREPRESS', 'DESIGNER'],
  DESIGNER: ['DESIGNER'],
  MERCHANDISER: ['MERCHANDISER'],
  QA: ['QA'],
  QA_PREPRESS: ['QA_PREPRESS'],
  INVENTORY_MANAGER: ['INVENTORY_MANAGER'],
  PROCUREMENT_MANAGER: ['PROCUREMENT_MANAGER']
};

const PERMISSIONS = {
  // Dashboard permissions
  VIEW_DASHBOARD: ['ADMIN', 'HEAD_OF_MERCHANDISER', 'HEAD_OF_PRODUCTION'],
  VIEW_HOM_DASHBOARD: ['ADMIN', 'HEAD_OF_MERCHANDISER'],
  VIEW_HOP_DASHBOARD: ['ADMIN', 'HEAD_OF_PRODUCTION'],
  
  // Prepress permissions
  VIEW_PREPRESS_JOBS: ['ADMIN', 'HEAD_OF_MERCHANDISER', 'HEAD_OF_PRODUCTION', 'HOD_PREPRESS', 'DESIGNER', 'QA'],
  CREATE_PREPRESS_JOBS: ['ADMIN', 'HEAD_OF_MERCHANDISER', 'HOD_PREPRESS'],
  ASSIGN_PREPRESS_JOBS: ['ADMIN', 'HOD_PREPRESS'],
  REASSIGN_PREPRESS_JOBS: ['ADMIN', 'HOD_PREPRESS'],
  APPROVE_PREPRESS_JOBS: ['ADMIN', 'HOD_PREPRESS'],
  REJECT_PREPRESS_JOBS: ['ADMIN', 'HOD_PREPRESS'],
  START_PREPRESS_JOBS: ['ADMIN', 'DESIGNER'],
  PAUSE_PREPRESS_JOBS: ['ADMIN', 'DESIGNER'],
  COMPLETE_PREPRESS_JOBS: ['ADMIN', 'DESIGNER'],
  
  // QA permissions
  VIEW_QA_JOBS: ['ADMIN', 'QA', 'QA_PREPRESS', 'HEAD_OF_PRODUCTION'],
  APPROVE_QA_JOBS: ['ADMIN', 'QA', 'QA_PREPRESS'],
  REJECT_QA_JOBS: ['ADMIN', 'QA', 'QA_PREPRESS'],
  SUBMIT_TO_QA: ['ADMIN', 'DESIGNER'],
  
  // Job card permissions
  VIEW_JOB_CARDS: ['ADMIN', 'HEAD_OF_MERCHANDISER', 'HEAD_OF_PRODUCTION', 'HOD_PREPRESS', 'DESIGNER', 'MERCHANDISER'],
  CREATE_JOB_CARDS: ['ADMIN', 'MERCHANDISER'],
  UPDATE_JOB_CARDS: ['ADMIN', 'MERCHANDISER'],
  DELETE_JOB_CARDS: ['ADMIN', 'HEAD_OF_MERCHANDISER'],
  
  // Product permissions
  VIEW_PRODUCTS: ['ADMIN', 'HEAD_OF_MERCHANDISER', 'HEAD_OF_PRODUCTION', 'HOD_PREPRESS', 'DESIGNER', 'MERCHANDISER'],
  CREATE_PRODUCTS: ['ADMIN', 'MERCHANDISER'],
  UPDATE_PRODUCTS: ['ADMIN', 'MERCHANDISER'],
  DELETE_PRODUCTS: ['ADMIN', 'HEAD_OF_MERCHANDISER'],
  
  // Company permissions
  VIEW_COMPANIES: ['ADMIN', 'HEAD_OF_MERCHANDISER', 'HEAD_OF_PRODUCTION', 'HOD_PREPRESS', 'DESIGNER', 'MERCHANDISER'],
  CREATE_COMPANIES: ['ADMIN', 'HEAD_OF_MERCHANDISER'],
  UPDATE_COMPANIES: ['ADMIN', 'HEAD_OF_MERCHANDISER'],
  DELETE_COMPANIES: ['ADMIN', 'HEAD_OF_MERCHANDISER'],
  
  // Reporting permissions
  VIEW_REPORTS: ['ADMIN', 'HEAD_OF_MERCHANDISER', 'HEAD_OF_PRODUCTION', 'HOD_PREPRESS'],
  EXPORT_REPORTS: ['ADMIN', 'HEAD_OF_MERCHANDISER', 'HEAD_OF_PRODUCTION'],
  
  // User management permissions
  VIEW_USERS: ['ADMIN', 'HEAD_OF_MERCHANDISER', 'HEAD_OF_PRODUCTION'],
  CREATE_USERS: ['ADMIN'],
  UPDATE_USERS: ['ADMIN'],
  DELETE_USERS: ['ADMIN'],
  
  // Inventory permissions
  VIEW_INVENTORY: ['ADMIN', 'INVENTORY_MANAGER'],
  MANAGE_INVENTORY_ITEMS: ['ADMIN', 'INVENTORY_MANAGER'],
  CREATE_INVENTORY_TRANSACTIONS: ['ADMIN', 'INVENTORY_MANAGER'],
  VIEW_INVENTORY_REPORTS: ['ADMIN', 'INVENTORY_MANAGER'],
  MANAGE_INVENTORY_CATEGORIES: ['ADMIN', 'INVENTORY_MANAGER'],
  MANAGE_INVENTORY_LOCATIONS: ['ADMIN', 'INVENTORY_MANAGER'],
  
  // Procurement permissions
  VIEW_PROCUREMENT: ['ADMIN', 'PROCUREMENT_MANAGER'],
  MANAGE_SUPPLIERS: ['ADMIN', 'PROCUREMENT_MANAGER'],
  CREATE_PURCHASE_ORDERS: ['ADMIN', 'PROCUREMENT_MANAGER'],
  APPROVE_PURCHASE_ORDERS: ['ADMIN', 'PROCUREMENT_MANAGER'],
  VIEW_PROCUREMENT_REPORTS: ['ADMIN', 'PROCUREMENT_MANAGER'],
  CREATE_REQUISITIONS: ['ADMIN', 'PROCUREMENT_MANAGER'],
  APPROVE_REQUISITIONS: ['ADMIN', 'PROCUREMENT_MANAGER']
};

/**
 * Middleware to authenticate JWT token
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get fresh user data from database
    const userResult = await dbAdapter.query(
      'SELECT id, username, email, "firstName", "lastName", role, "isActive" FROM users WHERE id = $1',
      [decoded.id]
    );
    const user = userResult.rows?.[0] || null;

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    if (!user.isActive) {
      return res.status(401).json({ error: 'User account is inactive' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware to require specific roles
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;
    
    // Check if user role is in allowed roles or has higher privileges
    const hasPermission = allowedRoles.some(role => {
      return ROLE_HIERARCHY[userRole] && ROLE_HIERARCHY[userRole].includes(role);
    });

    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
};

/**
 * Middleware to require specific permissions
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;
    const allowedRoles = PERMISSIONS[permission];

    if (!allowedRoles || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission,
        current: userRole
      });
    }

    next();
  };
};

/**
 * Middleware to check ownership or higher role
 */
export const requireOwnershipOrRole = (resourceUserIdField = 'created_by', allowedRoles = ['ADMIN']) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;
    const userId = req.user.id;

    // Check if user has higher role privileges
    const hasRolePermission = allowedRoles.some(role => {
      return ROLE_HIERARCHY[userRole] && ROLE_HIERARCHY[userRole].includes(role);
    });

    if (hasRolePermission) {
      return next();
    }

    // Check ownership
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    if (resourceUserId === userId) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Access denied - insufficient permissions or ownership',
      required: { ownership: resourceUserIdField, roles: allowedRoles },
      current: { userId, role: userRole }
    });
  };
};

/**
 * Helper function to check if user has permission
 */
export const hasPermission = (userRole, permission) => {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles && allowedRoles.includes(userRole);
};

/**
 * Helper function to check if user has role or higher
 */
export const hasRole = (userRole, requiredRole) => {
  return ROLE_HIERARCHY[userRole] && ROLE_HIERARCHY[userRole].includes(requiredRole);
};

/**
 * Get user's effective permissions
 */
export const getUserPermissions = (userRole) => {
  const permissions = [];
  for (const [permission, roles] of Object.entries(PERMISSIONS)) {
    if (roles.includes(userRole)) {
      permissions.push(permission);
    }
  }
  return permissions;
};

/**
 * Middleware to add user permissions to request
 */
export const addUserPermissions = (req, res, next) => {
  if (req.user) {
    req.user.permissions = getUserPermissions(req.user.role);
  }
  next();
};

export default {
  authenticateToken,
  requireRole,
  requirePermission,
  requireOwnershipOrRole,
  hasPermission,
  hasRole,
  getUserPermissions,
  addUserPermissions,
  ROLE_HIERARCHY,
  PERMISSIONS
};
