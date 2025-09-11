import dbAdapter from '../database/adapter.js';

// Production Role Types
export const PRODUCTION_ROLES = {
  DIRECTOR: 'DIRECTOR',
  HOD: 'HOD', // Head of Department
  SUPERVISOR: 'SUPERVISOR',
  OPERATOR: 'OPERATOR',
  QUALITY_INSPECTOR: 'QUALITY_INSPECTOR'
};

// Production Permission Types
export const PRODUCTION_PERMISSIONS = {
  // Director Level Permissions
  VIEW_ALL_DEPARTMENTS: 'VIEW_ALL_DEPARTMENTS',
  MANAGE_ALL_USERS: 'MANAGE_ALL_USERS',
  ASSIGN_DEPARTMENT_HEADS: 'ASSIGN_DEPARTMENT_HEADS',
  CREATE_DEPARTMENTS: 'CREATE_DEPARTMENTS',
  DELETE_DEPARTMENTS: 'DELETE_DEPARTMENTS',
  VIEW_FINANCIAL_DATA: 'VIEW_FINANCIAL_DATA',
  APPROVE_LARGE_ORDERS: 'APPROVE_LARGE_ORDERS',
  SYSTEM_CONFIGURATION: 'SYSTEM_CONFIGURATION',
  
  // HOD Level Permissions
  MANAGE_DEPARTMENT: 'MANAGE_DEPARTMENT',
  ASSIGN_SUPERVISORS: 'ASSIGN_SUPERVISORS',
  ASSIGN_OPERATORS: 'ASSIGN_OPERATORS',
  VIEW_DEPARTMENT_REPORTS: 'VIEW_DEPARTMENT_REPORTS',
  APPROVE_DEPARTMENT_JOBS: 'APPROVE_DEPARTMENT_JOBS',
  MANAGE_EQUIPMENT: 'MANAGE_EQUIPMENT',
  SCHEDULE_MAINTENANCE: 'SCHEDULE_MAINTENANCE',
  
  // Supervisor Level Permissions
  ASSIGN_JOBS: 'ASSIGN_JOBS',
  UPDATE_JOB_STATUS: 'UPDATE_JOB_STATUS',
  VIEW_TEAM_PERFORMANCE: 'VIEW_TEAM_PERFORMANCE',
  CONDUCT_QUALITY_CHECK: 'CONDUCT_QUALITY_CHECK',
  MANAGE_MATERIALS: 'MANAGE_MATERIALS',
  ISSUE_MATERIALS: 'ISSUE_MATERIALS',
  
  // Operator Level Permissions
  VIEW_ASSIGNED_JOBS: 'VIEW_ASSIGNED_JOBS',
  UPDATE_OWN_JOB_STATUS: 'UPDATE_OWN_JOB_STATUS',
  RECORD_MATERIAL_CONSUMPTION: 'RECORD_MATERIAL_CONSUMPTION',
  REPORT_ISSUES: 'REPORT_ISSUES',
  
  // Quality Inspector Permissions
  CONDUCT_QUALITY_INSPECTIONS: 'CONDUCT_QUALITY_INSPECTIONS',
  APPROVE_QUALITY: 'APPROVE_QUALITY',
  REJECT_QUALITY: 'REJECT_QUALITY',
  VIEW_QUALITY_REPORTS: 'VIEW_QUALITY_REPORTS'
};

// Default permissions for each role
export const ROLE_PERMISSIONS = {
  [PRODUCTION_ROLES.DIRECTOR]: [
    PRODUCTION_PERMISSIONS.VIEW_ALL_DEPARTMENTS,
    PRODUCTION_PERMISSIONS.MANAGE_ALL_USERS,
    PRODUCTION_PERMISSIONS.ASSIGN_DEPARTMENT_HEADS,
    PRODUCTION_PERMISSIONS.CREATE_DEPARTMENTS,
    PRODUCTION_PERMISSIONS.DELETE_DEPARTMENTS,
    PRODUCTION_PERMISSIONS.VIEW_FINANCIAL_DATA,
    PRODUCTION_PERMISSIONS.APPROVE_LARGE_ORDERS,
    PRODUCTION_PERMISSIONS.SYSTEM_CONFIGURATION,
    // Also has all lower level permissions
    ...Object.values(PRODUCTION_PERMISSIONS).filter(p => !Object.values(PRODUCTION_PERMISSIONS).slice(0, 8).includes(p))
  ],
  
  [PRODUCTION_ROLES.HOD]: [
    PRODUCTION_PERMISSIONS.MANAGE_DEPARTMENT,
    PRODUCTION_PERMISSIONS.ASSIGN_SUPERVISORS,
    PRODUCTION_PERMISSIONS.ASSIGN_OPERATORS,
    PRODUCTION_PERMISSIONS.VIEW_DEPARTMENT_REPORTS,
    PRODUCTION_PERMISSIONS.APPROVE_DEPARTMENT_JOBS,
    PRODUCTION_PERMISSIONS.MANAGE_EQUIPMENT,
    PRODUCTION_PERMISSIONS.SCHEDULE_MAINTENANCE,
    PRODUCTION_PERMISSIONS.ASSIGN_JOBS,
    PRODUCTION_PERMISSIONS.UPDATE_JOB_STATUS,
    PRODUCTION_PERMISSIONS.VIEW_TEAM_PERFORMANCE,
    PRODUCTION_PERMISSIONS.CONDUCT_QUALITY_CHECK,
    PRODUCTION_PERMISSIONS.MANAGE_MATERIALS,
    PRODUCTION_PERMISSIONS.ISSUE_MATERIALS
  ],
  
  [PRODUCTION_ROLES.SUPERVISOR]: [
    PRODUCTION_PERMISSIONS.ASSIGN_JOBS,
    PRODUCTION_PERMISSIONS.UPDATE_JOB_STATUS,
    PRODUCTION_PERMISSIONS.VIEW_TEAM_PERFORMANCE,
    PRODUCTION_PERMISSIONS.CONDUCT_QUALITY_CHECK,
    PRODUCTION_PERMISSIONS.MANAGE_MATERIALS,
    PRODUCTION_PERMISSIONS.ISSUE_MATERIALS,
    PRODUCTION_PERMISSIONS.VIEW_ASSIGNED_JOBS,
    PRODUCTION_PERMISSIONS.UPDATE_OWN_JOB_STATUS,
    PRODUCTION_PERMISSIONS.RECORD_MATERIAL_CONSUMPTION,
    PRODUCTION_PERMISSIONS.REPORT_ISSUES
  ],
  
  [PRODUCTION_ROLES.OPERATOR]: [
    PRODUCTION_PERMISSIONS.VIEW_ASSIGNED_JOBS,
    PRODUCTION_PERMISSIONS.UPDATE_OWN_JOB_STATUS,
    PRODUCTION_PERMISSIONS.RECORD_MATERIAL_CONSUMPTION,
    PRODUCTION_PERMISSIONS.REPORT_ISSUES
  ],
  
  [PRODUCTION_ROLES.QUALITY_INSPECTOR]: [
    PRODUCTION_PERMISSIONS.CONDUCT_QUALITY_INSPECTIONS,
    PRODUCTION_PERMISSIONS.APPROVE_QUALITY,
    PRODUCTION_PERMISSIONS.REJECT_QUALITY,
    PRODUCTION_PERMISSIONS.VIEW_QUALITY_REPORTS,
    PRODUCTION_PERMISSIONS.VIEW_ASSIGNED_JOBS,
    PRODUCTION_PERMISSIONS.UPDATE_OWN_JOB_STATUS,
    PRODUCTION_PERMISSIONS.REPORT_ISSUES
  ]
};

// Get user's production roles and permissions
export async function getUserProductionRoles(userId) {
  try {
    const roles = pool.prepare(`
      SELECT 
        pur.*,
        pd.name as department_name,
        pd.code as department_code,
        pd.hierarchy_level
      FROM production_user_roles pur
      LEFT JOIN production_departments pd ON pur.department_id = pd.id
      WHERE pur.user_id = ? AND pur.is_active = 1
    `).all(userId);

    let hasDirectorAccess = false;
    let departmentAccess = [];
    let allPermissions = new Set();

    for (const role of roles) {
      const rolePermissions = JSON.parse(role.permissions || '[]');
      rolePermissions.forEach(p => allPermissions.add(p));

      if (role.role_type === PRODUCTION_ROLES.DIRECTOR) {
        hasDirectorAccess = true;
      }

      if (role.department_id) {
        departmentAccess.push({
          departmentId: role.department_id,
          departmentName: role.department_name,
          departmentCode: role.department_code,
          roleType: role.role_type,
          permissions: rolePermissions,
          canApproveJobs: role.can_approve_jobs === 1,
          canAssignJobs: role.can_assign_jobs === 1,
          maxPriorityLevel: role.max_priority_level
        });
      }
    }

    return {
      hasDirectorAccess,
      departmentAccess,
      permissions: Array.from(allPermissions),
      roles: roles.map(role => ({
        ...role,
        permissions: JSON.parse(role.permissions || '[]')
      }))
    };
  } catch (error) {
    console.error('Error getting user production roles:', error);
    return {
      hasDirectorAccess: false,
      departmentAccess: [],
      permissions: [],
      roles: []
    };
  }
}

// Middleware to check if user has specific production role
export function requireProductionRole(requiredRoles) {
  return async (req, res, next) => {
    try {
      const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      const productionRoles = await getUserProductionRoles(req.user.id);
      
      const hasRequiredRole = productionRoles.roles.some(role => 
        rolesArray.includes(role.role_type)
      );

      if (!hasRequiredRole) {
        return res.status(403).json({ 
          error: 'Access denied. Required production role not found.',
          requiredRoles: rolesArray 
        });
      }

      req.productionRoles = productionRoles;
      next();
    } catch (error) {
      console.error('Production role check error:', error);
      res.status(500).json({ error: 'Internal server error during role verification' });
    }
  };
}

// Middleware to check if user has specific production permission
export function requireProductionPermission(requiredPermissions) {
  return async (req, res, next) => {
    try {
      const permissionsArray = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
      const productionRoles = await getUserProductionRoles(req.user.id);
      
      const hasRequiredPermission = permissionsArray.some(permission => 
        productionRoles.permissions.includes(permission)
      );

      if (!hasRequiredPermission) {
        return res.status(403).json({ 
          error: 'Access denied. Required production permission not found.',
          requiredPermissions: permissionsArray,
          userPermissions: productionRoles.permissions
        });
      }

      req.productionRoles = productionRoles;
      next();
    } catch (error) {
      console.error('Production permission check error:', error);
      res.status(500).json({ error: 'Internal server error during permission verification' });
    }
  };
}

// Middleware to check department access
export function requireDepartmentAccess(paramName = 'departmentId') {
  return async (req, res, next) => {
    try {
      const departmentId = req.params[paramName] || req.query[paramName] || req.body[paramName];
      
      if (!departmentId) {
        return res.status(400).json({ error: 'Department ID is required' });
      }

      const productionRoles = await getUserProductionRoles(req.user.id);
      
      // Directors have access to all departments
      if (productionRoles.hasDirectorAccess) {
        req.productionRoles = productionRoles;
        return next();
      }

      // Check if user has access to this specific department
      const hasAccess = productionRoles.departmentAccess.some(dept => 
        dept.departmentId === departmentId
      );

      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Access denied to this department.',
          departmentId,
          accessibleDepartments: productionRoles.departmentAccess.map(d => d.departmentId)
        });
      }

      req.productionRoles = productionRoles;
      next();
    } catch (error) {
      console.error('Department access check error:', error);
      res.status(500).json({ error: 'Internal server error during department access verification' });
    }
  };
}

// Get filtered job assignments based on user access
export async function getFilteredJobAssignments(userId, filters = {}) {
  try {
    const productionRoles = await getUserProductionRoles(userId);
    
    let query = `
      SELECT 
        pja.*,
        jc.job_card_id,
        jc.po_number,
        jc.quantity,
        jc.delivery_date,
        c.name as company_name,
        p.product_item_code,
        p.brand,
        pd.name as department_name,
        pd.code as department_code,
        pp.name as process_name,
        u.first_name || ' ' || u.last_name as assigned_to_name,
        pw.name as workflow_name,
        pwp.progress_percentage,
        pwp.overall_status as workflow_status
      FROM production_job_assignments pja
      JOIN job_cards jc ON pja.job_card_id = jc.id
      JOIN companies c ON jc.company_id = c.id
      JOIN products p ON jc.product_id = p.id
      JOIN production_departments pd ON pja.department_id = pd.id
      JOIN production_processes pp ON pja.process_id = pp.id
      LEFT JOIN users u ON pja.assigned_to_user_id = u.id
      LEFT JOIN production_workflow_progress pwp ON pja.job_card_id = pwp.job_card_id AND pwp.is_active = 1
      LEFT JOIN production_workflows pw ON pwp.workflow_id = pw.id
      WHERE pja.is_active = 1
    `;

    let params = [];
    
    // Apply user access filters
    if (!productionRoles.hasDirectorAccess) {
      const departmentIds = productionRoles.departmentAccess.map(d => d.departmentId).filter(id => id);
      if (departmentIds.length > 0) {
        query += ` AND (pja.department_id IN (${departmentIds.map(() => '?').join(',')}) OR pja.assigned_to_user_id = ?)`;
        params.push(...departmentIds, userId);
      } else {
        query += ` AND pja.assigned_to_user_id = ?`;
        params.push(userId);
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

    query += ` ORDER BY 
      CASE pja.priority 
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        WHEN 'LOW' THEN 4
        ELSE 5
      END,
      pja.estimated_completion_date ASC,
      pja.created_at DESC
    `;

    if (filters.limit) {
      query += ` LIMIT ?`;
      params.push(filters.limit);
    }

    return pool.prepare(query).all(params);
  } catch (error) {
    console.error('Error getting filtered job assignments:', error);
    throw error;
  }
}

// Assign production role to user
export async function assignProductionRole(userId, departmentId, roleType, assignedBy, permissions = null) {
  try {
    // Validate role type
    if (!Object.values(PRODUCTION_ROLES).includes(roleType)) {
      throw new Error('Invalid role type');
    }

    // Get default permissions if not provided
    const rolePermissions = permissions || ROLE_PERMISSIONS[roleType] || [];

    // Check if role already exists
    const existingRole = pool.prepare(`
      SELECT id FROM production_user_roles 
      WHERE user_id = ? AND department_id = ? AND role_type = ? AND is_active = 1
    `).get(userId, departmentId, roleType);

    if (existingRole) {
      // Update existing role
      pool.prepare(`
        UPDATE production_user_roles 
        SET permissions = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(JSON.stringify(rolePermissions), existingRole.id);
    } else {
      // Create new role
      const roleId = require('uuid').v4();
      
      pool.prepare(`
        INSERT INTO production_user_roles 
        (id, user_id, department_id, role_type, permissions, can_approve_jobs, can_assign_jobs, 
         can_view_all_departments, max_priority_level, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(
        roleId,
        userId,
        departmentId,
        roleType,
        JSON.stringify(rolePermissions),
        roleType === PRODUCTION_ROLES.DIRECTOR || roleType === PRODUCTION_ROLES.HOD ? 1 : 0,
        roleType === PRODUCTION_ROLES.DIRECTOR || roleType === PRODUCTION_ROLES.HOD || roleType === PRODUCTION_ROLES.SUPERVISOR ? 1 : 0,
        roleType === PRODUCTION_ROLES.DIRECTOR ? 1 : 0,
        roleType === PRODUCTION_ROLES.DIRECTOR ? 4 : roleType === PRODUCTION_ROLES.HOD ? 3 : 2,
        assignedBy
      );
    }

    return true;
  } catch (error) {
    console.error('Error assigning production role:', error);
    throw error;
  }
}

// Get production hierarchy
export async function getProductionHierarchy() {
  try {
    const departments = pool.prepare(`
      SELECT 
        pd.*,
        u.first_name || ' ' || u.last_name as head_name,
        u.email as head_email,
        COUNT(DISTINCT pja.id) as active_jobs,
        COUNT(DISTINCT pur.id) as total_staff
      FROM production_departments pd
      LEFT JOIN users u ON pd.head_user_id = u.id
      LEFT JOIN production_job_assignments pja ON pd.id = pja.department_id AND pja.is_active = 1
      LEFT JOIN production_user_roles pur ON pd.id = pur.department_id AND pur.is_active = 1
      WHERE pd.is_active = 1
      GROUP BY pd.id
      ORDER BY pd.hierarchy_level, pd.name
    `).all();

    // Build hierarchy tree
    const hierarchy = [];
    const departmentMap = {};

    // First, create all department objects
    departments.forEach(dept => {
      departmentMap[dept.id] = {
        ...dept,
        children: []
      };
    });

    // Then, build the tree structure
    departments.forEach(dept => {
      if (dept.parent_department_id && departmentMap[dept.parent_department_id]) {
        departmentMap[dept.parent_department_id].children.push(departmentMap[dept.id]);
      } else {
        hierarchy.push(departmentMap[dept.id]);
      }
    });

    return hierarchy;
  } catch (error) {
    console.error('Error getting production hierarchy:', error);
    throw error;
  }
}

// Check if user can access job
export async function canAccessJob(userId, jobId) {
  try {
    const productionRoles = await getUserProductionRoles(userId);
    
    if (productionRoles.hasDirectorAccess) {
      return true;
    }

    const job = pool.prepare(`
      SELECT department_id, assigned_to_user_id 
      FROM production_job_assignments 
      WHERE id = ? AND is_active = 1
    `).get(jobId);

    if (!job) {
      return false;
    }

    // Check if assigned to user or user has department access
    return job.assigned_to_user_id === userId || 
           productionRoles.departmentAccess.some(dept => dept.departmentId === job.department_id);
  } catch (error) {
    console.error('Error checking job access:', error);
    return false;
  }
}

export default {
  PRODUCTION_ROLES,
  PRODUCTION_PERMISSIONS,
  ROLE_PERMISSIONS,
  getUserProductionRoles,
  requireProductionRole,
  requireProductionPermission,
  requireDepartmentAccess,
  getFilteredJobAssignments,
  assignProductionRole,
  getProductionHierarchy,
  canAccessJob
};