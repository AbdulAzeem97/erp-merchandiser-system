import express from 'express';
import dbAdapter from '../database/adapter.js';
import { authenticateToken } from '../middleware/auth.js';
import { 
  requireProductionPermission, 
  requireDepartmentAccess, 
  requireProductionRole,
  getUserProductionRoles,
  getFilteredJobAssignments,
  assignProductionRole,
  getProductionHierarchy,
  canAccessJob,
  PRODUCTION_ROLES,
  PRODUCTION_PERMISSIONS,
  ROLE_PERMISSIONS
} from '../middleware/complete-production-auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// ============ PRODUCTION HIERARCHY MANAGEMENT ============

// Get complete production hierarchy
router.get('/hierarchy', authenticateToken, async (req, res) => {
  try {
    const hierarchy = await getProductionHierarchy();
    res.json(hierarchy);
  } catch (error) {
    console.error('Error fetching production hierarchy:', error);
    res.status(500).json({ error: 'Failed to fetch production hierarchy' });
  }
});

// Get production dashboard data based on user access
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const productionRoles = await getUserProductionRoles(req.user.id);
    const { departmentId, timeRange = '7' } = req.query;

    // Base filters for user access
    let departmentFilter = '';
    let departmentParams = [];

    if (departmentId) {
      departmentFilter = 'AND pja.department_id = ?';
      departmentParams = [departmentId];
    } else if (!productionRoles.hasDirectorAccess) {
      const departmentIds = productionRoles.departmentAccess.map(d => d.departmentId).filter(id => id);
      if (departmentIds.length > 0) {
        departmentFilter = `AND pja.department_id IN (${departmentIds.map(() => '?').join(',')})`;
        departmentParams = departmentIds;
      } else {
        departmentFilter = 'AND pja.assigned_to_user_id = ?';
        departmentParams = [req.user.id];
      }
    }

    // Get comprehensive job statistics
    const jobStats = pool.prepare(`
      SELECT 
        COUNT(*) as total_jobs,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_jobs,
        SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_jobs,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_jobs,
        SUM(CASE WHEN status = 'ON_HOLD' THEN 1 ELSE 0 END) as on_hold_jobs,
        SUM(CASE WHEN status = 'REWORK' THEN 1 ELSE 0 END) as rework_jobs,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_jobs,
        AVG(CASE WHEN status = 'COMPLETED' AND total_time_minutes > 0 THEN efficiency_percentage ELSE NULL END) as avg_efficiency,
        SUM(CASE WHEN status = 'COMPLETED' THEN quantity_completed ELSE 0 END) as total_units_produced,
        SUM(CASE WHEN status = 'COMPLETED' THEN quantity_rejected ELSE 0 END) as total_units_rejected
      FROM production_job_assignments pja
      WHERE is_active = true 
      AND created_at >= CURRENT_DATE - INTERVAL '1 day' * ?
      ${departmentFilter}
    `).get(timeRange, ...departmentParams);

    // Get department performance
    let departmentPerformance = [];
    if (productionRoles.hasDirectorAccess || departmentId) {
      departmentPerformance = pool.prepare(`
        SELECT 
          pd.id,
          pd.name as department_name,
          pd.code as department_code,
          pd.color_code,
          COUNT(pja.id) as total_assignments,
          SUM(CASE WHEN pja.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_assignments,
          SUM(CASE WHEN pja.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_assignments,
          SUM(CASE WHEN pja.status = 'PENDING' THEN 1 ELSE 0 END) as pending_assignments,
          SUM(CASE WHEN pja.status = 'REWORK' THEN 1 ELSE 0 END) as rework_assignments,
          ROUND(
            CAST(SUM(CASE WHEN pja.status = 'COMPLETED' THEN 1 ELSE 0 END) AS REAL) / 
            CAST(COUNT(pja.id) AS REAL) * 100, 2
          ) as completion_rate,
          AVG(CASE WHEN pja.status = 'COMPLETED' THEN pja.efficiency_percentage ELSE NULL END) as avg_efficiency,
          SUM(CASE WHEN pja.status = 'COMPLETED' THEN pja.quantity_completed ELSE 0 END) as total_production,
          COUNT(DISTINCT pur.user_id) as staff_count
        FROM production_departments pd
        LEFT JOIN production_job_assignments pja ON pd.id = pja.department_id 
          AND pja.is_active = true 
          AND pja.created_at >= CURRENT_DATE - INTERVAL '1 day' * ?
        LEFT JOIN production_user_roles pur ON pd.id = pur.department_id AND pur.is_active = true
        WHERE pd.is_active = true ${departmentId ? 'AND pd.id = ?' : ''}
        GROUP BY pd.id, pd.name, pd.code, pd.color_code
        ORDER BY completion_rate DESC
      `).all(timeRange, ...(departmentId ? [departmentId] : []));
    }

    // Get recent workflow activities
    const recentActivities = pool.prepare(`
      SELECT 
        pjsh.*,
        jc.job_card_id,
        pd.name as department_name,
        pd.code as department_code,
        pd.color_code,
        pp.name as process_name,
        u.first_name || ' ' || u.last_name as changed_by_name,
        c.name as company_name,
        p.product_item_code
      FROM production_job_status_history pjsh
      JOIN production_job_assignments pja ON pjsh.production_assignment_id = pja.id
      JOIN job_cards jc ON pja.job_card_id = jc.id
      JOIN companies c ON jc.company_id = c.id
      JOIN products p ON jc.product_id = p.id
      JOIN production_departments pd ON pja.department_id = pd.id
      JOIN production_processes pp ON pja.process_id = pp.id
      JOIN users u ON pjsh.changed_by = u.id
      WHERE pja.is_active = true 
      AND pjsh.changed_at >= datetime('now', '-' || ? || ' days')
      ${departmentFilter}
      ORDER BY pjsh.changed_at DESC
      LIMIT 20
    `).all(timeRange, ...departmentParams);

    // Get quality statistics
    const qualityStats = pool.prepare(`
      SELECT 
        COUNT(*) as total_quality_checks,
        SUM(CASE WHEN quality_status = 'APPROVED' THEN 1 ELSE 0 END) as approved_checks,
        SUM(CASE WHEN quality_status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_checks,
        SUM(CASE WHEN quality_status = 'REWORK' THEN 1 ELSE 0 END) as rework_checks,
        AVG(CASE WHEN quality_score IS NOT NULL THEN quality_score ELSE NULL END) as avg_quality_score
      FROM production_quality_checks pqc
      JOIN production_job_assignments pja ON pqc.production_assignment_id = pja.id
      WHERE pja.is_active = true 
      AND pqc.checked_at >= datetime('now', '-' || ? || ' days')
      ${departmentFilter}
    `).get(timeRange, ...departmentParams);

    // Get equipment utilization
    const equipmentStats = pool.prepare(`
      SELECT 
        COUNT(DISTINCT pe.id) as total_equipment,
        SUM(CASE WHEN pe.status = 'AVAILABLE' THEN 1 ELSE 0 END) as available_equipment,
        SUM(CASE WHEN pe.status = 'IN_USE' THEN 1 ELSE 0 END) as in_use_equipment,
        SUM(CASE WHEN pe.status = 'MAINTENANCE' THEN 1 ELSE 0 END) as maintenance_equipment,
        SUM(CASE WHEN pe.status = 'BREAKDOWN' THEN 1 ELSE 0 END) as breakdown_equipment,
        AVG(CASE WHEN peu.efficiency_percentage IS NOT NULL THEN peu.efficiency_percentage ELSE NULL END) as avg_equipment_efficiency
      FROM production_equipment pe
      LEFT JOIN production_equipment_usage peu ON pe.id = peu.equipment_id 
        AND peu.production_start_time >= datetime('now', '-' || ? || ' days')
      WHERE pe.is_active = true
      ${departmentFilter.replace('pja.department_id', 'pe.department_id')}
    `).get(timeRange, ...departmentParams);

    // Get active alerts
    const activeAlerts = pool.prepare(`
      SELECT 
        pa.*,
        pd.name as department_name,
        pd.code as department_code
      FROM production_alerts pa
      LEFT JOIN production_departments pd ON pa.department_id = pd.id
      WHERE pa.status IN ('OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS') 
      AND pa.is_active = true
      ${departmentFilter.replace('pja.department_id', 'pa.department_id')}
      ORDER BY 
        CASE pa.severity 
          WHEN 'CRITICAL' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'MEDIUM' THEN 3
          WHEN 'LOW' THEN 4
          ELSE 5
        END,
        pa.created_at DESC
      LIMIT 10
    `).all(...departmentParams);

    res.json({
      jobStats: {
        ...jobStats,
        defect_rate: jobStats.total_units_produced > 0 ? 
          ((jobStats.total_units_rejected / jobStats.total_units_produced) * 100).toFixed(2) : 0
      },
      departmentPerformance,
      recentActivities,
      qualityStats,
      equipmentStats,
      activeAlerts,
      userAccess: {
        hasDirectorAccess: productionRoles.hasDirectorAccess,
        permissions: productionRoles.permissions,
        departmentAccess: productionRoles.departmentAccess
      }
    });
  } catch (error) {
    console.error('Error fetching production dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// ============ DEPARTMENT MANAGEMENT ============

// Get all departments with enhanced filtering
router.get('/departments', authenticateToken, async (req, res) => {
  try {
    const productionRoles = await getUserProductionRoles(req.user.id);
    const { hierarchyLevel, departmentType, includeStats = 'true' } = req.query;
    
    let query = `
      SELECT 
        pd.*,
        u.first_name || ' ' || u.last_name as head_name,
        u.email as head_email
    `;

    if (includeStats === 'true') {
      query += `,
        (SELECT COUNT(*) FROM production_processes pp WHERE pp.department_id = pd.id AND pp.is_active = true) as process_count,
        (SELECT COUNT(*) FROM production_equipment pe WHERE pe.department_id = pd.id AND pe.is_active = true) as equipment_count,
        (SELECT COUNT(*) FROM production_job_assignments pja WHERE pja.department_id = pd.id AND pja.status IN ('PENDING', 'IN_PROGRESS') AND pja.is_active = true) as active_jobs_count,
        (SELECT COUNT(*) FROM production_user_roles pur WHERE pur.department_id = pd.id AND pur.is_active = true) as staff_count
      `;
    }

    query += `
      FROM production_departments pd
      LEFT JOIN users u ON pd.head_user_id = u.id
      WHERE pd.is_active = true
    `;
    
    let params = [];

    // Apply hierarchy level filter
    if (hierarchyLevel !== undefined) {
      query += ` AND pd.hierarchy_level = ?`;
      params.push(parseInt(hierarchyLevel));
    }

    // Apply department type filter
    if (departmentType) {
      query += ` AND pd.department_type = ?`;
      params.push(departmentType);
    }

    // Apply user access restrictions
    if (!productionRoles.hasDirectorAccess) {
      const departmentIds = productionRoles.departmentAccess.map(d => d.departmentId).filter(id => id);
      if (departmentIds.length > 0) {
        query += ` AND pd.id IN (${departmentIds.map(() => '?').join(',')})`;
        params.push(...departmentIds);
      } else {
        // No department access
        return res.json([]);
      }
    }
    
    query += ` ORDER BY pd.hierarchy_level, pd.name`;

    const departments = await dbAdapter.query(query, [params]);
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Get specific department with complete details
router.get('/departments/:id', authenticateToken, requireDepartmentAccess('id'), async (req, res) => {
  try {
    const department = await dbAdapter.query(`
      SELECT 
        pd.*,
        u.first_name || ' ' || u.last_name as head_name,
        u.email as head_email,
        u.phone as head_phone,
        parent.name as parent_department_name
      FROM production_departments pd
      LEFT JOIN users u ON pd.head_user_id = u.id
      LEFT JOIN production_departments parent ON pd.parent_department_id = parent.id
      WHERE pd.id = ? AND pd.is_active = true
    `, [req.params.id]);

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Get processes with workflow information
    const processes = pool.prepare(`
      SELECT 
        pp.*,
        COUNT(pja.id) as active_assignments
      FROM production_processes pp
      LEFT JOIN production_job_assignments pja ON pp.id = pja.process_id AND pja.is_active = true
      WHERE pp.department_id = ? AND pp.is_active = true 
      GROUP BY pp.id
      ORDER BY pp.sequence_order, pp.name
    `).all(req.params.id);

    // Get equipment with usage statistics
    const equipment = pool.prepare(`
      SELECT 
        pe.*,
        peu.total_usage_hours,
        peu.avg_efficiency
      FROM production_equipment pe
      LEFT JOIN (
        SELECT 
          equipment_id,
          SUM(total_duration_minutes) / 60.0 as total_usage_hours,
          AVG(efficiency_percentage) as avg_efficiency
        FROM production_equipment_usage
        WHERE production_start_time >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY equipment_id
      ) peu ON pe.id = peu.equipment_id
      WHERE pe.department_id = ? AND pe.is_active = true 
      ORDER BY pe.name
    `).all(req.params.id);

    // Get staff members
    const staff = await dbAdapter.query(`
      SELECT 
        u.id,
        u.first_name || ' ' || u.last_name as name,
        u.email,
        pur.role_type,
        pur.can_approve_jobs,
        pur.can_assign_jobs
      FROM production_user_roles pur
      JOIN users u ON pur.user_id = u.id
      WHERE pur.department_id = ? AND pur.is_active = true AND u.is_active = true
      ORDER BY 
        CASE pur.role_type
          WHEN 'DIRECTOR' THEN 1
          WHEN 'HOD' THEN 2
          WHEN 'SUPERVISOR' THEN 3
          WHEN 'OPERATOR' THEN 4
          WHEN 'QUALITY_INSPECTOR' THEN 5
          ELSE 6
        END,
        u.first_name
    `, [req.params.id]);

    // Get recent activity
    const recentActivity = await dbAdapter.query(`
      SELECT 
        pjsh.*,
        jc.job_card_id,
        u.first_name || ' ' || u.last_name as changed_by_name
      FROM production_job_status_history pjsh
      JOIN production_job_assignments pja ON pjsh.production_assignment_id = pja.id
      JOIN job_cards jc ON pja.job_card_id = jc.id
      JOIN users u ON pjsh.changed_by = u.id
      WHERE pja.department_id = ? AND pja.is_active = true
      ORDER BY pjsh.changed_at DESC
      LIMIT 10
    `, [req.params.id]);

    // Get performance metrics
    const performance = pool.prepare(`
      SELECT 
        COUNT(*) as total_jobs,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_jobs,
        AVG(CASE WHEN status = 'COMPLETED' THEN efficiency_percentage ELSE NULL END) as avg_efficiency,
        SUM(CASE WHEN status = 'COMPLETED' THEN quantity_completed ELSE 0 END) as total_production
      FROM production_job_assignments
      WHERE department_id = ? AND is_active = true
      AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    `).get(req.params.id);

    res.json({
      ...department,
      processes,
      equipment,
      staff,
      recentActivity,
      performance
    });
  } catch (error) {
    console.error('Error fetching department details:', error);
    res.status(500).json({ error: 'Failed to fetch department details' });
  }
});

// ============ WORKFLOW MANAGEMENT ============

// Get all workflows
router.get('/workflows', authenticateToken, async (req, res) => {
  try {
    const { productCategory, isDefault } = req.query;
    
    let query = `
      SELECT 
        pw.*,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM production_workflows pw
      JOIN users u ON pw.created_by = u.id
      WHERE pw.is_active = true
    `;
    
    let params = [];
    
    if (productCategory) {
      query += ` AND pw.product_category = ?`;
      params.push(productCategory);
    }
    
    if (isDefault !== undefined) {
      query += ` AND pw.is_default = ?`;
      params.push(isDefault === 'true' ? 1 : 0);
    }
    
    query += ` ORDER BY pw.is_default DESC, pw.name`;
    
    const workflows = await dbAdapter.query(query, [params]);
    
    // Parse workflow steps for each workflow
    const workflowsWithSteps = workflows.map(workflow => ({
      ...workflow,
      workflow_steps: JSON.parse(workflow.workflow_steps || '[]')
    }));
    
    res.json(workflowsWithSteps);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

// Create job assignment with workflow
router.post('/job-assignments', authenticateToken, requireProductionPermission('ASSIGN_JOBS'), async (req, res) => {
  try {
    const { 
      jobCardId, 
      workflowId,
      priority = 'MEDIUM',
      estimatedCompletionDate,
      notes,
      autoAssign = false
    } = req.body;

    if (!jobCardId || !workflowId) {
      return res.status(400).json({ error: 'Job card and workflow are required' });
    }

    // Get workflow details
    const workflow = await dbAdapter.query(`
      SELECT * FROM production_workflows 
      WHERE id = ? AND is_active = true
    `, [workflowId]);

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const workflowSteps = JSON.parse(workflow.workflow_steps || '[]');
    
    if (workflowSteps.length === 0) {
      return res.status(400).json({ error: 'Workflow has no steps defined' });
    }

    // Transaction start - handled by dbAdapter
    db.run();

    try {
      // Create workflow progress tracking
      const progressId = uuidv4();
      const firstStep = workflowSteps[0];
      
      pool.prepare(`
        INSERT INTO production_workflow_progress 
        (id, job_card_id, workflow_id, current_department_id, current_process_id, 
         overall_status, total_steps, completed_steps, progress_percentage, 
         estimated_completion_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'NOT_STARTED', ?, 0, 0, ?, datetime('now'), datetime('now'))
      `).run(
        progressId, 
        jobCardId, 
        workflowId, 
        firstStep.departmentId, 
        firstStep.processId,
        workflowSteps.length,
        estimatedCompletionDate || null
      );

      // Create job assignments for all workflow steps
      const assignments = [];
      let previousAssignmentId = null;

      for (let i = 0; i < workflowSteps.length; i++) {
        const step = workflowSteps[i];
        const assignmentId = uuidv4();
        
        // Only the first step should be PENDING, others should be WAITING
        const initialStatus = i === 0 ? 'PENDING' : 'WAITING';
        
        pool.prepare(`
          INSERT INTO production_job_assignments 
          (id, job_card_id, department_id, process_id, assigned_by, status, priority,
           workflow_step_id, previous_step_id, estimated_completion_date, notes, 
           created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).run(
          assignmentId,
          jobCardId,
          step.departmentId,
          step.processId,
          req.user.id,
          initialStatus,
          priority,
          step.step,
          previousAssignmentId,
          estimatedCompletionDate || null,
          notes || null
        );

        // Update next_step_id for previous assignment
        if (previousAssignmentId) {
          await dbAdapter.query(`
            UPDATE production_job_assignments 
            SET next_step_id = ? 
            WHERE id = ?
          `, [assignmentId, previousAssignmentId]);
        } else {
          // Update workflow progress with current step
          await dbAdapter.query(`
            UPDATE production_workflow_progress 
            SET current_step_id = ? 
            WHERE id = ?
          `, [assignmentId, progressId]);
        }

        assignments.push({
          id: assignmentId,
          stepNumber: step.step,
          departmentId: step.departmentId,
          processId: step.processId,
          status: initialStatus
        });

        previousAssignmentId = assignmentId;
      }

      // Record initial status history for first step
      pool.prepare(`
        INSERT INTO production_job_status_history 
        (id, production_assignment_id, workflow_progress_id, status_to, remarks, changed_by, changed_at)
        VALUES (?, ?, ?, 'PENDING', 'Workflow initiated', ?, datetime('now'))
      `).run(uuidv4(), assignments[0].id, progressId, req.user.id);

      await dbAdapter.query('COMMIT');

      res.status(201).json({
        workflowProgressId: progressId,
        assignments,
        message: `Created ${assignments.length} job assignments for workflow`
      });
    } catch (error) {
      await dbAdapter.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating job assignment with workflow:', error);
    res.status(500).json({ error: 'Failed to create job assignment' });
  }
});

// ============ USER ROLE MANAGEMENT ============

// Get production users and roles
router.get('/users', authenticateToken, requireProductionRole(['DIRECTOR', 'HOD']), async (req, res) => {
  try {
    const { departmentId, roleType } = req.query;
    const productionRoles = await getUserProductionRoles(req.user.id);

    let query = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.is_active,
        GROUP_CONCAT(
          CASE 
            WHEN pur.department_id IS NULL THEN pur.role_type
            ELSE pd.code || ':' || pur.role_type
          END
        ) as production_roles,
        GROUP_CONCAT(DISTINCT pd.name) as departments
      FROM users u
      LEFT JOIN production_user_roles pur ON u.id = pur.user_id AND pur.is_active = true
      LEFT JOIN production_departments pd ON pur.department_id = pd.id
      WHERE u.is_active = true
    `;

    let params = [];

    if (departmentId) {
      query += ` AND (pur.department_id = ? OR pur.department_id IS NULL)`;
      params.push(departmentId);
    }

    if (roleType) {
      query += ` AND pur.role_type = ?`;
      params.push(roleType);
    }

    // If not director, filter to accessible departments
    if (!productionRoles.hasDirectorAccess && !departmentId) {
      const departmentIds = productionRoles.departmentAccess.map(d => d.departmentId).filter(id => id);
      if (departmentIds.length > 0) {
        query += ` AND (pur.department_id IN (${departmentIds.map(() => '?').join(',')}) OR pur.department_id IS NULL)`;
        params.push(...departmentIds);
      }
    }

    query += ` GROUP BY u.id ORDER BY u.first_name, u.last_name`;

    const users = await dbAdapter.query(query, [params]);
    res.json(users);
  } catch (error) {
    console.error('Error fetching production users:', error);
    res.status(500).json({ error: 'Failed to fetch production users' });
  }
});

// Assign production role
router.post('/users/:userId/roles', authenticateToken, requireProductionRole(['DIRECTOR', 'HOD']), async (req, res) => {
  try {
    const { departmentId, roleType, permissions } = req.body;

    if (!roleType) {
      return res.status(400).json({ error: 'Role type is required' });
    }

    const validRoles = Object.values(PRODUCTION_ROLES);
    if (!validRoles.includes(roleType)) {
      return res.status(400).json({ error: 'Invalid role type', validRoles });
    }

    // Check if user can assign this role
    const productionRoles = await getUserProductionRoles(req.user.id);
    if (!productionRoles.hasDirectorAccess) {
      // HODs can only assign roles in their departments and below their level
      if (roleType === PRODUCTION_ROLES.DIRECTOR || roleType === PRODUCTION_ROLES.HOD) {
        return res.status(403).json({ error: 'You cannot assign this role level' });
      }
      
      if (departmentId && !productionRoles.departmentAccess.some(d => d.departmentId === departmentId)) {
        return res.status(403).json({ error: 'You cannot assign roles in this department' });
      }
    }

    await assignProductionRole(req.params.userId, departmentId, roleType, req.user.id, permissions);

    res.json({ success: true, message: 'Role assigned successfully' });
  } catch (error) {
    console.error('Error assigning production role:', error);
    res.status(500).json({ error: 'Failed to assign production role' });
  }
});

// Get available roles and permissions
router.get('/roles-permissions', authenticateToken, (req, res) => {
  res.json({
    roles: PRODUCTION_ROLES,
    permissions: PRODUCTION_PERMISSIONS,
    rolePermissions: ROLE_PERMISSIONS
  });
});

// ============ JOB ASSIGNMENT MANAGEMENT ============

// Get job assignments with enhanced filtering
router.get('/job-assignments', authenticateToken, async (req, res) => {
  try {
    const filters = {
      departmentId: req.query.departmentId,
      status: req.query.status,
      assignedToUserId: req.query.assignedToUserId,
      priority: req.query.priority,
      workflowStatus: req.query.workflowStatus,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const assignments = await getFilteredJobAssignments(req.user.id, filters);
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching job assignments:', error);
    res.status(500).json({ error: 'Failed to fetch job assignments' });
  }
});

// Update job assignment status with workflow progression
router.patch('/job-assignments/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, remarks, attachments, qualityData } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['PENDING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'REWORK', 'WAITING'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status', validStatuses });
    }

    // Check access
    const canAccess = await canAccessJob(req.user.id, req.params.id);
    if (!canAccess) {
      return res.status(403).json({ error: 'Access denied to this job assignment' });
    }

    // Get current assignment with workflow information
    const assignment = await dbAdapter.query(`
      SELECT 
        pja.*,
        pwp.id as workflow_progress_id,
        pwp.total_steps,
        pwp.completed_steps
      FROM production_job_assignments pja
      LEFT JOIN production_workflow_progress pwp ON pja.job_card_id = pwp.job_card_id AND pwp.is_active = true
      WHERE pja.id = ? AND pja.is_active = true
    `, [req.params.id]);

    if (!assignment) {
      return res.status(404).json({ error: 'Job assignment not found' });
    }

    const currentStatus = assignment.status;
    // Transaction start - handled by dbAdapter
    db.run();

    try {
      // Update assignment
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'IN_PROGRESS' && !assignment.start_date) {
        updateData.start_date = new Date().toISOString();
      }

      if (status === 'COMPLETED') {
        updateData.actual_completion_date = new Date().toISOString();
        
        // If workflow exists, check if this completes the workflow
        if (assignment.workflow_progress_id) {
          const newCompletedSteps = assignment.completed_steps + 1;
          const progressPercentage = (newCompletedSteps / assignment.total_steps) * 100;
          
          // Update workflow progress
          pool.prepare(`
            UPDATE production_workflow_progress 
            SET completed_steps = ?, 
                progress_percentage = ?,
                overall_status = CASE WHEN ? >= total_steps THEN 'COMPLETED' ELSE 'IN_PROGRESS' END,
                actual_completion_date = CASE WHEN ? >= total_steps THEN datetime('now') ELSE actual_completion_date END,
                updated_at = datetime('now')
            WHERE id = ?
          `).run(
            newCompletedSteps, 
            progressPercentage, 
            newCompletedSteps, 
            newCompletedSteps, 
            assignment.workflow_progress_id
          );

          // Activate next step in workflow if exists
          if (assignment.next_step_id) {
            pool.prepare(`
              UPDATE production_job_assignments 
              SET status = 'PENDING', updated_at = datetime('now')
              WHERE id = ?
            `).run(assignment.next_step_id);

            // Update workflow current step
            await dbAdapter.query(`
              UPDATE production_workflow_progress 
              SET current_step_id = ?
              WHERE id = ?
            `, [assignment.next_step_id, assignment.workflow_progress_id]);
          }
        }
      }

      const updateFields = Object.keys(updateData);
      const updateQuery = `
        UPDATE production_job_assignments 
        SET ${updateFields.map(field => `${field} = ?`).join(', ')}
        WHERE id = ?
      `;
      
      await dbAdapter.query(updateQuery, [...Object.values(updateData]), req.params.id);

      // Record status history
      pool.prepare(`
        INSERT INTO production_job_status_history 
        (id, production_assignment_id, workflow_progress_id, status_from, status_to, remarks, attachments, changed_by, changed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        uuidv4(), 
        req.params.id, 
        assignment.workflow_progress_id,
        currentStatus, 
        status, 
        remarks || null,
        attachments ? JSON.stringify(attachments) : null,
        req.user.id
      );

      await dbAdapter.query('COMMIT');

      // Get updated assignment data
      const updatedAssignment = await dbAdapter.query(`
        SELECT 
          pja.*,
          jc.job_card_id,
          pd.name as department_name,
          pp.name as process_name,
          pwp.progress_percentage,
          pwp.overall_status as workflow_status
        FROM production_job_assignments pja
        JOIN job_cards jc ON pja.job_card_id = jc.id
        JOIN production_departments pd ON pja.department_id = pd.id
        JOIN production_processes pp ON pja.process_id = pp.id
        LEFT JOIN production_workflow_progress pwp ON pja.job_card_id = pwp.job_card_id AND pwp.is_active = true
        WHERE pja.id = ?
      `, [req.params.id]);

      res.json(updatedAssignment);
    } catch (error) {
      await dbAdapter.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating job assignment status:', error);
    res.status(500).json({ error: 'Failed to update job assignment status' });
  }
});

export default router;