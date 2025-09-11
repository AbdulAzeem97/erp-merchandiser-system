import dbAdapter from '../database/adapter.js';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Production role hierarchy and permissions
const PRODUCTION_PERMISSIONS = {
  DIRECTOR: [
    'VIEW_ALL_DEPARTMENTS',
    'MANAGE_ALL_DEPARTMENTS',
    'VIEW_ALL_JOBS',
    'ASSIGN_JOBS',
    'REASSIGN_JOBS',
    'VIEW_REPORTS',
    'GENERATE_REPORTS',
    'MANAGE_USERS',
    'MANAGE_EQUIPMENT',
    'VIEW_ANALYTICS',
    'APPROVE_QUALITY',
    'MANAGE_WORKFLOWS',
    'VIEW_MATERIAL_CONSUMPTION',
    'APPROVE_MATERIAL_REQUESTS',
    'MANAGE_PRODUCTION_SCHEDULES'
  ],
  HOD: [
    'VIEW_DEPARTMENT_JOBS',
    'MANAGE_DEPARTMENT_JOBS',
    'ASSIGN_DEPARTMENT_JOBS',
    'VIEW_DEPARTMENT_REPORTS',
    'GENERATE_DEPARTMENT_REPORTS',
    'MANAGE_DEPARTMENT_USERS',
    'MANAGE_DEPARTMENT_EQUIPMENT',
    'APPROVE_DEPARTMENT_QUALITY',
    'VIEW_DEPARTMENT_ANALYTICS',
    'VIEW_DEPARTMENT_MATERIAL_CONSUMPTION',
    'REQUEST_MATERIALS'
  ],
  SUPERVISOR: [
    'VIEW_ASSIGNED_JOBS',
    'UPDATE_JOB_STATUS',
    'ADD_JOB_REMARKS',
    'VIEW_TEAM_JOBS',
    'ASSIGN_TEAM_JOBS',
    'RECORD_MATERIAL_CONSUMPTION',
    'RECORD_EQUIPMENT_USAGE',
    'VIEW_TEAM_REPORTS',
    'MANAGE_TEAM_SCHEDULES'
  ],
  OPERATOR: [
    'VIEW_ASSIGNED_JOBS',
    'UPDATE_JOB_STATUS',
    'ADD_JOB_REMARKS',
    'RECORD_MATERIAL_CONSUMPTION',
    'RECORD_EQUIPMENT_USAGE',
    'VIEW_JOB_INSTRUCTIONS'
  ],
  QUALITY_INSPECTOR: [
    'VIEW_QUALITY_JOBS',
    'CONDUCT_QUALITY_CHECK',
    'APPROVE_QUALITY',
    'REJECT_QUALITY',
    'REQUEST_REWORK',
    'ADD_QUALITY_REMARKS',
    'VIEW_QUALITY_REPORTS',
    'GENERATE_QUALITY_REPORTS'
  ]
};

// Get user's production roles and permissions
export async function getUserProductionRoles(userId) {
  try {
    const roles = pool.prepare(`
      SELECT 
        pur.*,
        pd.name as department_name,
        pd.code as department_code
      FROM production_user_roles pur
      LEFT JOIN production_departments pd ON pur.department_id = pd.id
      WHERE pur.user_id = ? AND pur.is_active = 1
    `).all(userId);

    // Combine permissions from all roles
    const allPermissions = new Set();
    const departmentAccess = [];

    roles.forEach(role => {
      const rolePermissions = JSON.parse(role.permissions || '[]');
      const defaultPermissions = PRODUCTION_PERMISSIONS[role.role_type] || [];
      
      // Add both stored permissions and default permissions
      [...rolePermissions, ...defaultPermissions].forEach(permission => {
        allPermissions.add(permission);
      });

      departmentAccess.push({
        departmentId: role.department_id,
        departmentName: role.department_name,
        departmentCode: role.department_code,
        roleType: role.role_type
      });
    });

    return {
      roles,
      permissions: Array.from(allPermissions),
      departmentAccess,
      hasDirectorAccess: roles.some(r => r.role_type === 'DIRECTOR')
    };
  } catch (error) {
    console.error('Error fetching user production roles:', error);
    return {
      roles: [],
      permissions: [],
      departmentAccess: [],
      hasDirectorAccess: false
    };
  }
}

// Check if user has specific production permission
export const requireProductionPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'Please log in to access production features' 
        });
      }

      const productionRoles = await getUserProductionRoles(req.user.id);
      req.productionRoles = productionRoles;

      if (!productionRoles.permissions.includes(requiredPermission)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          message: `You need '${requiredPermission}' permission to access this resource`,
          requiredPermission
        });
      }

      next();
    } catch (error) {
      console.error('Production permission check error:', error);
      return res.status(500).json({ 
        error: 'Permission check failed',
        message: 'Internal server error' 
      });
    }
  };
};

// Check if user can access specific department
export const requireDepartmentAccess = (departmentIdParam = 'departmentId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'Please log in to access production features' 
        });
      }

      const departmentId = req.params[departmentIdParam] || req.body.departmentId;
      if (!departmentId) {
        return res.status(400).json({ 
          error: 'Department ID required',
          message: 'Department ID must be provided' 
        });
      }

      const productionRoles = await getUserProductionRoles(req.user.id);
      req.productionRoles = productionRoles;

      // Director has access to all departments
      if (productionRoles.hasDirectorAccess) {
        return next();
      }

      // Check if user has access to this specific department
      const hasDepartmentAccess = productionRoles.departmentAccess.some(
        dept => dept.departmentId === departmentId
      );

      if (!hasDepartmentAccess) {
        return res.status(403).json({ 
          error: 'Department access denied',
          message: 'You do not have access to this department',
          departmentId
        });
      }

      next();
    } catch (error) {
      console.error('Department access check error:', error);
      return res.status(500).json({ 
        error: 'Access check failed',
        message: 'Internal server error' 
      });
    }
  };
};

// Check if user has production role
export const requireProductionRole = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'Please log in to access production features' 
        });
      }

      const productionRoles = await getUserProductionRoles(req.user.id);
      req.productionRoles = productionRoles;

      const userRoleTypes = productionRoles.roles.map(r => r.role_type);
      const hasRequiredRole = Array.isArray(requiredRoles) 
        ? requiredRoles.some(role => userRoleTypes.includes(role))
        : userRoleTypes.includes(requiredRoles);

      if (!hasRequiredRole) {
        return res.status(403).json({ 
          error: 'Insufficient role',
          message: `You need one of these roles: ${Array.isArray(requiredRoles) ? requiredRoles.join(', ') : requiredRoles}`,
          requiredRoles
        });
      }

      next();
    } catch (error) {
      console.error('Production role check error:', error);
      return res.status(500).json({ 
        error: 'Role check failed',
        message: 'Internal server error' 
      });
    }
  };
};

// Get filtered job assignments based on user's access level
export const getFilteredJobAssignments = async (userId, filters = {}) => {
  try {
    const productionRoles = await getUserProductionRoles(userId);
    
    let query = `
      SELECT 
        pja.*,
        jc.job_card_id,
        jc.po_number,
        c.name as company_name,
        p.product_item_code,
        pd.name as department_name,
        pd.code as department_code,
        pp.name as process_name,
        u.first_name || ' ' || u.last_name as assigned_to_name
      FROM production_job_assignments pja
      JOIN job_cards jc ON pja.job_card_id = jc.id
      JOIN companies c ON jc.company_id = c.id
      JOIN products p ON jc.product_id = p.id
      JOIN production_departments pd ON pja.department_id = pd.id
      JOIN production_processes pp ON pja.process_id = pp.id
      LEFT JOIN users u ON pja.assigned_to_user_id = u.id
      WHERE pja.is_active = 1
    `;

    const params = [];
    
    // Apply access control
    if (!productionRoles.hasDirectorAccess) {
      // If not director, filter by accessible departments
      const departmentIds = productionRoles.departmentAccess.map(d => d.departmentId).filter(id => id);
      
      if (departmentIds.length === 0) {
        // No department access, show only jobs assigned to user
        query += ` AND pja.assigned_to_user_id = ?`;
        params.push(userId);
      } else {
        // Filter by department access or assigned jobs
        query += ` AND (pja.department_id IN (${departmentIds.map(() => '?').join(',')}) OR pja.assigned_to_user_id = ?)`;
        params.push(...departmentIds, userId);
      }
    }

    // Apply additional filters
    if (filters.departmentId) {
      query += ` AND pja.department_id = ?`;
      params.push(filters.departmentId);
    }
    
    if (filters.status) {
      query += ` AND pja.status = ?`;
      params.push(filters.status);
    }
    
    if (filters.assignedToUserId) {
      query += ` AND pja.assigned_to_user_id = ?`;
      params.push(filters.assignedToUserId);
    }

    if (filters.priority) {
      query += ` AND pja.priority = ?`;
      params.push(filters.priority);
    }

    // Default ordering
    query += ` ORDER BY pja.assigned_date DESC, pja.priority DESC`;

    if (filters.limit) {
      query += ` LIMIT ?`;
      params.push(filters.limit);
    }

    const assignments = pool.prepare(query).all(params);
    return assignments;

  } catch (error) {
    console.error('Error getting filtered job assignments:', error);
    throw error;
  }
};

// Assign production user role
export const assignProductionRole = async (userId, departmentId, roleType, assignedBy, permissions = null) => {
  try {
    const roleId = pool.prepare('SELECT id FROM production_user_roles WHERE user_id = ? AND department_id = ? AND role_type = ?')
      .get(userId, departmentId, roleType);

    const defaultPermissions = PRODUCTION_PERMISSIONS[roleType] || [];
    const finalPermissions = permissions || defaultPermissions;

    if (roleId) {
      // Update existing role
      pool.prepare(`
        UPDATE production_user_roles 
        SET permissions = ?, is_active = 1, updated_at = datetime('now')
        WHERE id = ?
      `).run(JSON.stringify(finalPermissions), roleId.id);
    } else {
      // Create new role
      pool.prepare(`
        INSERT INTO production_user_roles 
        (id, user_id, department_id, role_type, permissions, is_active, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, ?, datetime('now'), datetime('now'))
      `).run(
        uuidv4(),
        userId,
        departmentId,
        roleType,
        JSON.stringify(finalPermissions),
        assignedBy
      );
    }

    return true;
  } catch (error) {
    console.error('Error assigning production role:', error);
    throw error;
  }
};

// Production authentication middleware for different login types
export function authenticateProductionUser(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required for production module' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user details
    const user = pool.prepare(`
      SELECT 
        id, username, email, first_name, last_name, role, company_id
      FROM users 
      WHERE id = ? AND is_active = 1
    `).get(decoded.userId);

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid user' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Production authentication error:', error);
    return res.status(403).json({ 
      error: 'Invalid or expired token' 
    });
  }
}

export { PRODUCTION_PERMISSIONS };