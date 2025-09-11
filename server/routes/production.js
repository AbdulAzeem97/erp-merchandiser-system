import express from 'express';
import dbAdapter from '../database/adapter.js';
import { authenticateToken } from '../middleware/auth.js';
import { 
  requireProductionPermission, 
  requireDepartmentAccess, 
  requireProductionRole,
  getUserProductionRoles,
  getFilteredJobAssignments,
  assignProductionRole
} from '../middleware/production-auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// ============ DEPARTMENT MANAGEMENT ============

// Get all departments (Director only) or user's departments
router.get('/departments', authenticateToken, async (req, res) => {
  try {
    const productionRoles = await getUserProductionRoles(req.user.id);
    
    let query = `
      SELECT 
        pd.*,
        u.first_name || ' ' || u.last_name as head_name,
        (SELECT COUNT(*) FROM production_processes pp WHERE pp.department_id = pd.id AND pp.is_active = true) as process_count,
        (SELECT COUNT(*) FROM production_equipment pe WHERE pe.department_id = pd.id AND pe.is_active = true) as equipment_count
      FROM production_departments pd
      LEFT JOIN users u ON pd.head_user_id = u.id
      WHERE pd.is_active = true
    `;
    
    let params = [];

    if (!productionRoles.hasDirectorAccess) {
      const departmentIds = productionRoles.departmentAccess.map(d => d.departmentId).filter(id => id);
      if (departmentIds.length > 0) {
        query += ` AND pd.id IN (${departmentIds.map(() => '?').join(',')})`;
        params = departmentIds;
      } else {
        // No department access
        return res.json([]);
      }
    }
    
    query += ` ORDER BY pd.name`;

    const departments = await dbAdapter.query(query, [params]);
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Get department details
router.get('/departments/:id', authenticateToken, requireDepartmentAccess('id'), async (req, res) => {
  try {
    const department = await dbAdapter.query(`
      SELECT 
        pd.*,
        u.first_name || ' ' || u.last_name as head_name,
        u.email as head_email
      FROM production_departments pd
      LEFT JOIN users u ON pd.head_user_id = u.id
      WHERE pd.id = ? AND pd.is_active = true
    `, [req.params.id]);

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Get processes
    const processes = await dbAdapter.query(`
      SELECT * FROM production_processes 
      WHERE department_id = ? AND is_active = true 
      ORDER BY sequence_order
    `, [req.params.id]);

    // Get equipment
    const equipment = await dbAdapter.query(`
      SELECT * FROM production_equipment 
      WHERE department_id = ? AND is_active = true 
      ORDER BY name
    `, [req.params.id]);

    // Get active jobs
    const activeJobs = await dbAdapter.query(`
      SELECT COUNT(*) as count 
      FROM production_job_assignments 
      WHERE department_id = ? AND status IN ('PENDING', 'IN_PROGRESS') AND is_active = true
    `, [req.params.id]);

    res.json({
      ...department,
      processes,
      equipment,
      activeJobsCount: activeJobs.count
    });
  } catch (error) {
    console.error('Error fetching department details:', error);
    res.status(500).json({ error: 'Failed to fetch department details' });
  }
});

// Create new department (Director only)
router.post('/departments', authenticateToken, requireProductionRole('DIRECTOR'), async (req, res) => {
  try {
    const { name, code, description, headUserId } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    const departmentId = uuidv4();
    
    await dbAdapter.query(`
      INSERT INTO production_departments 
      (id, name, code, description, head_user_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [departmentId, name, code, description, headUserId || null]);

    const department = await dbAdapter.query('SELECT * FROM production_departments WHERE id = ?', [departmentId]);
    res.status(201).json(department);
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// ============ PROCESS MANAGEMENT ============

// Get processes for department
router.get('/departments/:departmentId/processes', authenticateToken, requireDepartmentAccess(), async (req, res) => {
  try {
    const processes = await dbAdapter.query(`
      SELECT * FROM production_processes 
      WHERE department_id = ? AND is_active = true 
      ORDER BY sequence_order, name
    `, [req.params.departmentId]);

    res.json(processes);
  } catch (error) {
    console.error('Error fetching processes:', error);
    res.status(500).json({ error: 'Failed to fetch processes' });
  }
});

// ============ JOB ASSIGNMENT MANAGEMENT ============

// Get job assignments (filtered by user access)
router.get('/job-assignments', authenticateToken, async (req, res) => {
  try {
    const filters = {
      departmentId: req.query.departmentId,
      status: req.query.status,
      assignedToUserId: req.query.assignedToUserId,
      priority: req.query.priority,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const assignments = await getFilteredJobAssignments(req.user.id, filters);
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching job assignments:', error);
    res.status(500).json({ error: 'Failed to fetch job assignments' });
  }
});

// Get specific job assignment details
router.get('/job-assignments/:id', authenticateToken, async (req, res) => {
  try {
    const assignment = await dbAdapter.query(`
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
        pp.name as process_name,
        u.first_name || ' ' || u.last_name as assigned_to_name,
        u.email as assigned_to_email
      FROM production_job_assignments pja
      JOIN job_cards jc ON pja.job_card_id = jc.id
      JOIN companies c ON jc.company_id = c.id
      JOIN products p ON jc.product_id = p.id
      JOIN production_departments pd ON pja.department_id = pd.id
      JOIN production_processes pp ON pja.process_id = pp.id
      LEFT JOIN users u ON pja.assigned_to_user_id = u.id
      WHERE pja.id = ? AND pja.is_active = true
    `, [req.params.id]);

    if (!assignment) {
      return res.status(404).json({ error: 'Job assignment not found' });
    }

    // Check access
    const productionRoles = await getUserProductionRoles(req.user.id);
    const hasAccess = productionRoles.hasDirectorAccess || 
                     productionRoles.departmentAccess.some(d => d.departmentId === assignment.department_id) ||
                     assignment.assigned_to_user_id === req.user.id;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this job assignment' });
    }

    // Get status history
    const statusHistory = await dbAdapter.query(`
      SELECT 
        pjsh.*,
        u.first_name || ' ' || u.last_name as changed_by_name
      FROM production_job_status_history pjsh
      JOIN users u ON pjsh.changed_by = u.id
      WHERE pjsh.production_assignment_id = ?
      ORDER BY pjsh.changed_at DESC
    `, [req.params.id]);

    // Get quality checks
    const qualityChecks = await dbAdapter.query(`
      SELECT 
        pqc.*,
        u.first_name || ' ' || u.last_name as checked_by_name
      FROM production_quality_checks pqc
      JOIN users u ON pqc.checked_by = u.id
      WHERE pqc.production_assignment_id = ?
      ORDER BY pqc.checked_at DESC
    `, [req.params.id]);

    res.json({
      ...assignment,
      statusHistory,
      qualityChecks
    });
  } catch (error) {
    console.error('Error fetching job assignment details:', error);
    res.status(500).json({ error: 'Failed to fetch job assignment details' });
  }
});

// Create job assignment
router.post('/job-assignments', authenticateToken, requireProductionPermission('ASSIGN_JOBS'), async (req, res) => {
  try {
    const { 
      jobCardId, 
      departmentId, 
      processId, 
      assignedToUserId, 
      priority = 'MEDIUM',
      estimatedCompletionDate,
      notes 
    } = req.body;

    if (!jobCardId || !departmentId || !processId) {
      return res.status(400).json({ error: 'Job card, department, and process are required' });
    }

    const assignmentId = uuidv4();
    
    await dbAdapter.query(`
      INSERT INTO production_job_assignments 
      (id, job_card_id, department_id, process_id, assigned_by, assigned_to_user_id, 
       status, priority, estimated_completion_date, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      assignmentId, 
      jobCardId, 
      departmentId, 
      processId, 
      req.user.id, 
      assignedToUserId || null,
      priority,
      estimatedCompletionDate || null,
      notes || null
    ]);

    // Record status history
    await dbAdapter.query(`
      INSERT INTO production_job_status_history 
      (id, production_assignment_id, status_to, remarks, changed_by, changed_at)
      VALUES (?, ?, 'PENDING', 'Job assignment created', ?, CURRENT_TIMESTAMP)
    `, [uuidv4(), assignmentId, req.user.id]);

    const assignment = await dbAdapter.query(`
      SELECT 
        pja.*,
        jc.job_card_id,
        pd.name as department_name,
        pp.name as process_name
      FROM production_job_assignments pja
      JOIN job_cards jc ON pja.job_card_id = jc.id
      JOIN production_departments pd ON pja.department_id = pd.id
      JOIN production_processes pp ON pja.process_id = pp.id
      WHERE pja.id = ?
    `, [assignmentId]);

    res.status(201).json(assignment);
  } catch (error) {
    console.error('Error creating job assignment:', error);
    res.status(500).json({ error: 'Failed to create job assignment' });
  }
});

// Update job assignment status
router.patch('/job-assignments/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, remarks, attachments } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['PENDING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'REWORK'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status', validStatuses });
    }

    // Get current assignment
    const assignment = await dbAdapter.query('SELECT * FROM production_job_assignments WHERE id = ? AND is_active = true')
      .get(req.params.id);

    if (!assignment) {
      return res.status(404).json({ error: 'Job assignment not found' });
    }

    // Check access
    const productionRoles = await getUserProductionRoles(req.user.id);
    const hasAccess = productionRoles.hasDirectorAccess || 
                     productionRoles.departmentAccess.some(d => d.departmentId === assignment.department_id) ||
                     assignment.assigned_to_user_id === req.user.id ||
                     productionRoles.permissions.includes('UPDATE_JOB_STATUS');

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to update this job assignment' });
    }

    const currentStatus = assignment.status;
    
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
    }

    const updateFields = Object.keys(updateData);
    const updateQuery = `
      UPDATE production_job_assignments 
      SET ${updateFields.map(field => `${field} = ?`).join(', ')}
      WHERE id = ?
    `;
    
    await dbAdapter.query(updateQuery, [Object.values(updateData), req.params.id]);

    // Record status history
    await dbAdapter.query(`
      INSERT INTO production_job_status_history 
      (id, production_assignment_id, status_from, status_to, remarks, attachments, changed_by, changed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
    `, [
      uuidv4(), 
      req.params.id, 
      currentStatus, 
      status, 
      remarks || null,
      attachments ? JSON.stringify(attachments) : null,
      req.user.id
    ]);

    const updatedAssignment = await dbAdapter.query(`
      SELECT 
        pja.*,
        jc.job_card_id,
        pd.name as department_name,
        pp.name as process_name
      FROM production_job_assignments pja
      JOIN job_cards jc ON pja.job_card_id = jc.id
      JOIN production_departments pd ON pja.department_id = pd.id
      JOIN production_processes pp ON pja.process_id = pp.id
      WHERE pja.id = ?
    `, [req.params.id]);

    res.json(updatedAssignment);
  } catch (error) {
    console.error('Error updating job assignment status:', error);
    res.status(500).json({ error: 'Failed to update job assignment status' });
  }
});

// ============ QUALITY CONTROL ============

// Create quality check
router.post('/job-assignments/:id/quality-check', authenticateToken, requireProductionPermission('CONDUCT_QUALITY_CHECK'), async (req, res) => {
  try {
    const { qualityStatus, qualityScore, defectsFound, remarks } = req.body;

    if (!qualityStatus) {
      return res.status(400).json({ error: 'Quality status is required' });
    }

    const validQualityStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'REWORK'];
    if (!validQualityStatuses.includes(qualityStatus)) {
      return res.status(400).json({ error: 'Invalid quality status', validQualityStatuses });
    }

    const qualityCheckId = uuidv4();
    
    await dbAdapter.query(`
      INSERT INTO production_quality_checks 
      (id, production_assignment_id, checked_by, quality_status, quality_score, defects_found, remarks, checked_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      qualityCheckId,
      req.params.id,
      req.user.id,
      qualityStatus,
      qualityScore || null,
      defectsFound ? JSON.stringify(defectsFound) : null,
      remarks || null
    );

    // If quality is rejected or requires rework, update job status
    if (qualityStatus === 'REJECTED' || qualityStatus === 'REWORK') {
      await dbAdapter.query(`
        UPDATE production_job_assignments 
        SET status = 'REWORK', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [req.params.id]);

      // Record status change
      await dbAdapter.query(`
        INSERT INTO production_job_status_history 
        (id, production_assignment_id, status_to, remarks, changed_by, changed_at)
        VALUES (?, ?, 'REWORK', ?, ?, CURRENT_TIMESTAMP)
      `, [
        uuidv4(),
        req.params.id,
        `Quality check: ${qualityStatus} - ${remarks || 'Quality issues found'}`,
        req.user.id
      );
    }

    const qualityCheck = await dbAdapter.query(`
      SELECT 
        pqc.*,
        u.first_name || ' ' || u.last_name as checked_by_name
      FROM production_quality_checks pqc
      JOIN users u ON pqc.checked_by = u.id
      WHERE pqc.id = ?
    `, [qualityCheckId]);

    res.status(201).json(qualityCheck);
  } catch (error) {
    console.error('Error creating quality check:', error);
    res.status(500).json({ error: 'Failed to create quality check' });
  }
});

// ============ USER ROLE MANAGEMENT ============

// Get production users and their roles
router.get('/users', authenticateToken, requireProductionRole(['DIRECTOR', 'HOD']), async (req, res) => {
  try {
    const { departmentId } = req.query;
    const productionRoles = await getUserProductionRoles(req.user.id);

    let query = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.is_active,
        GROUP_CONCAT(
          CASE 
            WHEN pur.department_id IS NULL THEN pur.role_type
            ELSE pd.code || ':' || pur.role_type
          END
        ) as production_roles
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

// Assign production role to user
router.post('/users/:userId/roles', authenticateToken, requireProductionRole(['DIRECTOR', 'HOD']), async (req, res) => {
  try {
    const { departmentId, roleType, permissions } = req.body;

    if (!roleType) {
      return res.status(400).json({ error: 'Role type is required' });
    }

    const validRoles = ['DIRECTOR', 'HOD', 'SUPERVISOR', 'OPERATOR', 'QUALITY_INSPECTOR'];
    if (!validRoles.includes(roleType)) {
      return res.status(400).json({ error: 'Invalid role type', validRoles });
    }

    // Check if user can assign this role
    const productionRoles = await getUserProductionRoles(req.user.id);
    if (!productionRoles.hasDirectorAccess) {
      // HODs can only assign roles in their departments and below their level
      if (roleType === 'DIRECTOR' || roleType === 'HOD') {
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

// ============ DASHBOARD DATA ============

// Get production dashboard data
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const productionRoles = await getUserProductionRoles(req.user.id);
    const { departmentId } = req.query;

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

    // Get job statistics
    const jobStats = await dbAdapter.query(`
      SELECT 
        COUNT(*) as total_jobs,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_jobs,
        SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_jobs,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_jobs,
        SUM(CASE WHEN status = 'ON_HOLD' THEN 1 ELSE 0 END) as on_hold_jobs,
        SUM(CASE WHEN status = 'REWORK' THEN 1 ELSE 0 END) as rework_jobs
      FROM production_job_assignments pja
      WHERE is_active = true ${departmentFilter}
    `, [...departmentParams]);

    // Get recent activities
    const recentActivities = await dbAdapter.query(`
      SELECT 
        pjsh.*,
        jc.job_card_id,
        pd.name as department_name,
        pp.name as process_name,
        u.first_name || ' ' || u.last_name as changed_by_name
      FROM production_job_status_history pjsh
      JOIN production_job_assignments pja ON pjsh.production_assignment_id = pja.id
      JOIN job_cards jc ON pja.job_card_id = jc.id
      JOIN production_departments pd ON pja.department_id = pd.id
      JOIN production_processes pp ON pja.process_id = pp.id
      JOIN users u ON pjsh.changed_by = u.id
      WHERE pja.is_active = true ${departmentFilter}
      ORDER BY pjsh.changed_at DESC
      LIMIT 20
    `, [...departmentParams]);

    // Get department performance (if director or specific department)
    let departmentPerformance = [];
    if (productionRoles.hasDirectorAccess || departmentId) {
      departmentPerformance = await dbAdapter.query(`
        SELECT 
          pd.name as department_name,
          pd.code as department_code,
          COUNT(pja.id) as total_assignments,
          SUM(CASE WHEN pja.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_assignments,
          ROUND(
            CAST(SUM(CASE WHEN pja.status = 'COMPLETED' THEN 1 ELSE 0 END) AS REAL) / 
            CAST(COUNT(pja.id) AS REAL) * 100, 2
          ) as completion_rate
        FROM production_departments pd
        LEFT JOIN production_job_assignments pja ON pd.id = pja.department_id AND pja.is_active = true
        WHERE pd.is_active = true ${departmentId ? 'AND pd.id = ?' : ''}
        GROUP BY pd.id, pd.name, pd.code
        ORDER BY completion_rate DESC
      `, [departmentId ? [departmentId] : []]);
    }

    res.json({
      jobStats,
      recentActivities,
      departmentPerformance,
      userAccess: {
        hasDirectorAccess: productionRoles.hasDirectorAccess,
        permissions: productionRoles.permissions,
        departmentAccess: productionRoles.departmentAccess
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;