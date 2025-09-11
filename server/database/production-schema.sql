-- Production Module Database Schema
-- Hierarchical production management system

-- Production Departments with enhanced hierarchy
CREATE TABLE IF NOT EXISTS production_departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_department_id TEXT,
    head_user_id TEXT,
    hierarchy_level INTEGER DEFAULT 0, -- 0=Director level, 1=Department level, 2=Sub-department
    department_type TEXT DEFAULT 'PRODUCTION', -- PRODUCTION, QUALITY, MATERIAL, DISPATCH
    color_code TEXT, -- For UI visualization
    location TEXT, -- Physical location/floor
    contact_number TEXT,
    email TEXT,
    capacity_per_day INTEGER DEFAULT 0,
    working_hours_start TIME DEFAULT '09:00',
    working_hours_end TIME DEFAULT '17:00',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_department_id) REFERENCES production_departments(id),
    FOREIGN KEY (head_user_id) REFERENCES users(id)
);

-- Production Processes for each department
CREATE TABLE IF NOT EXISTS production_processes (
    id TEXT PRIMARY KEY,
    department_id TEXT NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    sequence_order INTEGER DEFAULT 1,
    estimated_duration_hours REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES production_departments(id) ON DELETE CASCADE,
    UNIQUE(department_id, name)
);

-- Production Job Assignments
CREATE TABLE IF NOT EXISTS production_job_assignments (
    id TEXT PRIMARY KEY,
    job_card_id TEXT NOT NULL,
    department_id TEXT NOT NULL,
    process_id TEXT NOT NULL,
    assigned_by TEXT NOT NULL,
    assigned_to_user_id TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    assigned_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    start_date DATETIME,
    estimated_completion_date DATETIME,
    actual_completion_date DATETIME,
    notes TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES production_departments(id),
    FOREIGN KEY (process_id) REFERENCES production_processes(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(id)
);

-- Production Job Status Tracking
CREATE TABLE IF NOT EXISTS production_job_status_history (
    id TEXT PRIMARY KEY,
    production_assignment_id TEXT NOT NULL,
    status_from TEXT,
    status_to TEXT NOT NULL,
    remarks TEXT,
    attachments TEXT, -- JSON array of attachment file paths
    changed_by TEXT NOT NULL,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (production_assignment_id) REFERENCES production_job_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- Production Quality Check
CREATE TABLE IF NOT EXISTS production_quality_checks (
    id TEXT PRIMARY KEY,
    production_assignment_id TEXT NOT NULL,
    checked_by TEXT NOT NULL,
    quality_status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, REWORK
    quality_score INTEGER, -- 1-10 rating
    defects_found TEXT, -- JSON array of defects
    remarks TEXT,
    checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (production_assignment_id) REFERENCES production_job_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (checked_by) REFERENCES users(id)
);

-- Production Material Consumption
CREATE TABLE IF NOT EXISTS production_material_consumption (
    id TEXT PRIMARY KEY,
    production_assignment_id TEXT NOT NULL,
    material_id TEXT NOT NULL,
    quantity_used REAL NOT NULL,
    unit TEXT NOT NULL,
    waste_quantity REAL DEFAULT 0,
    cost_per_unit REAL DEFAULT 0,
    total_cost REAL DEFAULT 0,
    consumed_by TEXT NOT NULL,
    consumed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (production_assignment_id) REFERENCES production_job_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id),
    FOREIGN KEY (consumed_by) REFERENCES users(id)
);

-- Production Equipment Usage
CREATE TABLE IF NOT EXISTS production_equipment (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    department_id TEXT NOT NULL,
    type TEXT NOT NULL,
    model TEXT,
    manufacturer TEXT,
    status TEXT NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, IN_USE, MAINTENANCE, BREAKDOWN
    last_maintenance_date DATETIME,
    next_maintenance_date DATETIME,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES production_departments(id)
);

-- Production Equipment Usage Log
CREATE TABLE IF NOT EXISTS production_equipment_usage (
    id TEXT PRIMARY KEY,
    equipment_id TEXT NOT NULL,
    production_assignment_id TEXT NOT NULL,
    operated_by TEXT NOT NULL,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    duration_minutes INTEGER,
    remarks TEXT,
    FOREIGN KEY (equipment_id) REFERENCES production_equipment(id),
    FOREIGN KEY (production_assignment_id) REFERENCES production_job_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (operated_by) REFERENCES users(id)
);

-- Production User Roles and Permissions
CREATE TABLE IF NOT EXISTS production_user_roles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    department_id TEXT,
    role_type TEXT NOT NULL, -- DIRECTOR, HOD, SUPERVISOR, OPERATOR, QUALITY_INSPECTOR
    permissions TEXT NOT NULL, -- JSON array of permissions
    is_active INTEGER DEFAULT 1,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES production_departments(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE(user_id, department_id, role_type)
);

-- Production Workflow Templates
CREATE TABLE IF NOT EXISTS production_workflows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    product_type TEXT NOT NULL,
    description TEXT,
    workflow_steps TEXT NOT NULL, -- JSON array of department->process mappings
    is_default INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE(name, product_type)
);

-- Production Reports and Analytics
CREATE TABLE IF NOT EXISTS production_daily_reports (
    id TEXT PRIMARY KEY,
    department_id TEXT NOT NULL,
    report_date DATE NOT NULL,
    total_jobs_assigned INTEGER DEFAULT 0,
    jobs_completed INTEGER DEFAULT 0,
    jobs_in_progress INTEGER DEFAULT 0,
    jobs_delayed INTEGER DEFAULT 0,
    efficiency_percentage REAL DEFAULT 0,
    quality_score REAL DEFAULT 0,
    material_waste_percentage REAL DEFAULT 0,
    generated_by TEXT NOT NULL,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES production_departments(id),
    FOREIGN KEY (generated_by) REFERENCES users(id),
    UNIQUE(department_id, report_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_production_departments_head ON production_departments(head_user_id);
CREATE INDEX IF NOT EXISTS idx_production_processes_department ON production_processes(department_id);
CREATE INDEX IF NOT EXISTS idx_production_job_assignments_job_card ON production_job_assignments(job_card_id);
CREATE INDEX IF NOT EXISTS idx_production_job_assignments_department ON production_job_assignments(department_id);
CREATE INDEX IF NOT EXISTS idx_production_job_assignments_status ON production_job_assignments(status);
CREATE INDEX IF NOT EXISTS idx_production_job_assignments_assigned_to ON production_job_assignments(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_production_job_status_history_assignment ON production_job_status_history(production_assignment_id);
CREATE INDEX IF NOT EXISTS idx_production_quality_checks_assignment ON production_quality_checks(production_assignment_id);
CREATE INDEX IF NOT EXISTS idx_production_material_consumption_assignment ON production_material_consumption(production_assignment_id);
CREATE INDEX IF NOT EXISTS idx_production_equipment_department ON production_equipment(department_id);
CREATE INDEX IF NOT EXISTS idx_production_equipment_status ON production_equipment(status);
CREATE INDEX IF NOT EXISTS idx_production_equipment_usage_equipment ON production_equipment_usage(equipment_id);
CREATE INDEX IF NOT EXISTS idx_production_equipment_usage_assignment ON production_equipment_usage(production_assignment_id);
CREATE INDEX IF NOT EXISTS idx_production_user_roles_user ON production_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_production_user_roles_department ON production_user_roles(department_id);
CREATE INDEX IF NOT EXISTS idx_production_workflows_product_type ON production_workflows(product_type);
CREATE INDEX IF NOT EXISTS idx_production_daily_reports_department_date ON production_daily_reports(department_id, report_date);