-- Complete Production Module Database Schema
-- Comprehensive hierarchical production management system

-- Enhanced Production Departments with complete hierarchy
DROP TABLE IF EXISTS production_departments CASCADE;
CREATE TABLE production_departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_department_id TEXT,
    head_user_id TEXT,
    hierarchy_level INTEGER DEFAULT 0, -- 0=Director, 1=Department Head, 2=Sub-department
    department_type TEXT DEFAULT 'PRODUCTION',
    color_code TEXT,
    location TEXT,
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

-- Enhanced Production Processes with complete workflow mapping
DROP TABLE IF EXISTS production_processes CASCADE;
CREATE TABLE production_processes (
    id TEXT PRIMARY KEY,
    department_id TEXT NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    sequence_order INTEGER DEFAULT 1,
    estimated_duration_hours REAL DEFAULT 0,
    quality_check_required INTEGER DEFAULT 0,
    material_required INTEGER DEFAULT 0,
    equipment_required INTEGER DEFAULT 0,
    skill_level_required TEXT DEFAULT 'BASIC', -- BASIC, INTERMEDIATE, ADVANCED, EXPERT
    safety_requirements TEXT, -- JSON array of safety requirements
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES production_departments(id) ON DELETE CASCADE,
    UNIQUE(department_id, name)
);

-- Production Workflow Templates with complete department mappings
DROP TABLE IF EXISTS production_workflows CASCADE;
CREATE TABLE production_workflows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    product_category TEXT NOT NULL,
    workflow_steps TEXT NOT NULL, -- JSON array of step objects with department_id, process_id, sequence
    estimated_total_time REAL DEFAULT 0,
    complexity_level TEXT DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    quality_points TEXT, -- JSON array of quality checkpoints
    material_requirements TEXT, -- JSON array of materials needed
    equipment_requirements TEXT, -- JSON array of equipment needed
    is_default INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE(name, product_category)
);

-- Enhanced Production User Roles with detailed permissions
DROP TABLE IF EXISTS production_user_roles CASCADE;
CREATE TABLE production_user_roles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    department_id TEXT,
    role_type TEXT NOT NULL,
    permissions TEXT NOT NULL, -- JSON array of detailed permissions
    reporting_to TEXT, -- User ID of supervisor
    can_approve_jobs INTEGER DEFAULT 0,
    can_assign_jobs INTEGER DEFAULT 0,
    can_view_all_departments INTEGER DEFAULT 0,
    max_priority_level INTEGER DEFAULT 1, -- 1=LOW, 2=MEDIUM, 3=HIGH, 4=CRITICAL
    is_active INTEGER DEFAULT 1,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES production_departments(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (reporting_to) REFERENCES users(id),
    UNIQUE(user_id, department_id, role_type)
);

-- Enhanced Production Job Assignments
DROP TABLE IF EXISTS production_job_assignments CASCADE;
CREATE TABLE production_job_assignments (
    id TEXT PRIMARY KEY,
    job_card_id TEXT NOT NULL,
    department_id TEXT NOT NULL,
    process_id TEXT NOT NULL,
    assigned_by TEXT NOT NULL,
    assigned_to_user_id TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    workflow_step_id TEXT, -- Links to workflow template step
    previous_step_id TEXT, -- Previous job assignment in workflow
    next_step_id TEXT, -- Next job assignment in workflow
    assigned_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    start_date DATETIME,
    estimated_completion_date DATETIME,
    actual_completion_date DATETIME,
    setup_time_minutes INTEGER DEFAULT 0,
    production_time_minutes INTEGER DEFAULT 0,
    quality_check_time_minutes INTEGER DEFAULT 0,
    total_time_minutes INTEGER DEFAULT 0,
    quantity_planned INTEGER DEFAULT 0,
    quantity_completed INTEGER DEFAULT 0,
    quantity_rejected INTEGER DEFAULT 0,
    efficiency_percentage REAL DEFAULT 0,
    notes TEXT,
    internal_remarks TEXT, -- Only visible to department and above
    customer_remarks TEXT, -- Visible to customer
    attachments TEXT, -- JSON array of file paths
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES production_departments(id),
    FOREIGN KEY (process_id) REFERENCES production_processes(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(id),
    FOREIGN KEY (previous_step_id) REFERENCES production_job_assignments(id),
    FOREIGN KEY (next_step_id) REFERENCES production_job_assignments(id)
);

-- Production Job Workflow Status Tracking
DROP TABLE IF EXISTS production_workflow_progress CASCADE;
CREATE TABLE production_workflow_progress (
    id TEXT PRIMARY KEY,
    job_card_id TEXT NOT NULL,
    workflow_id TEXT NOT NULL,
    current_step_id TEXT,
    current_department_id TEXT,
    current_process_id TEXT,
    overall_status TEXT NOT NULL DEFAULT 'NOT_STARTED',
    total_steps INTEGER DEFAULT 0,
    completed_steps INTEGER DEFAULT 0,
    progress_percentage REAL DEFAULT 0,
    estimated_completion_date DATETIME,
    actual_start_date DATETIME,
    actual_completion_date DATETIME,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE CASCADE,
    FOREIGN KEY (workflow_id) REFERENCES production_workflows(id),
    FOREIGN KEY (current_step_id) REFERENCES production_job_assignments(id),
    FOREIGN KEY (current_department_id) REFERENCES production_departments(id),
    FOREIGN KEY (current_process_id) REFERENCES production_processes(id)
);

-- Production Job Status History with enhanced tracking
DROP TABLE IF EXISTS production_job_status_history CASCADE;
CREATE TABLE production_job_status_history (
    id TEXT PRIMARY KEY,
    production_assignment_id TEXT NOT NULL,
    workflow_progress_id TEXT,
    status_from TEXT,
    status_to TEXT NOT NULL,
    remarks TEXT,
    internal_notes TEXT,
    time_taken_minutes INTEGER,
    quantity_processed INTEGER,
    quality_score INTEGER, -- 1-10
    efficiency_rating INTEGER, -- 1-5 stars
    attachments TEXT, -- JSON array of attachment file paths
    location_scanned TEXT, -- QR/Barcode scan location
    changed_by TEXT NOT NULL,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (production_assignment_id) REFERENCES production_job_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (workflow_progress_id) REFERENCES production_workflow_progress(id),
    FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- Enhanced Production Quality Control
DROP TABLE IF EXISTS production_quality_checks CASCADE;
CREATE TABLE production_quality_checks (
    id TEXT PRIMARY KEY,
    production_assignment_id TEXT NOT NULL,
    workflow_progress_id TEXT,
    checked_by TEXT NOT NULL,
    quality_status TEXT NOT NULL DEFAULT 'PENDING',
    quality_score INTEGER, -- 1-10 rating
    defects_found TEXT, -- JSON array of defect objects
    measurements TEXT, -- JSON array of measurement data
    test_results TEXT, -- JSON array of test results
    sample_size INTEGER DEFAULT 0,
    passed_samples INTEGER DEFAULT 0,
    failed_samples INTEGER DEFAULT 0,
    rework_required INTEGER DEFAULT 0,
    approval_required INTEGER DEFAULT 0,
    approved_by TEXT,
    approved_at DATETIME,
    remarks TEXT,
    corrective_actions TEXT, -- JSON array of actions taken
    preventive_actions TEXT, -- JSON array of prevention measures
    images TEXT, -- JSON array of image file paths
    documents TEXT, -- JSON array of document file paths
    checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (production_assignment_id) REFERENCES production_job_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (workflow_progress_id) REFERENCES production_workflow_progress(id),
    FOREIGN KEY (checked_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Production Material Consumption with enhanced tracking
DROP TABLE IF EXISTS production_material_consumption CASCADE;
CREATE TABLE production_material_consumption (
    id TEXT PRIMARY KEY,
    production_assignment_id TEXT NOT NULL,
    material_id TEXT NOT NULL,
    material_name TEXT NOT NULL,
    material_code TEXT,
    quantity_planned REAL NOT NULL DEFAULT 0,
    quantity_used REAL NOT NULL DEFAULT 0,
    quantity_wasted REAL DEFAULT 0,
    unit TEXT NOT NULL,
    cost_per_unit REAL DEFAULT 0,
    total_cost REAL DEFAULT 0,
    supplier_batch_number TEXT,
    lot_number TEXT,
    expiry_date DATE,
    quality_grade TEXT,
    consumed_by TEXT NOT NULL,
    approved_by TEXT,
    consumed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (production_assignment_id) REFERENCES production_job_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (consumed_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Enhanced Production Equipment Management
DROP TABLE IF EXISTS production_equipment CASCADE;
CREATE TABLE production_equipment (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    department_id TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT, -- PRINTING, CUTTING, BINDING, PACKAGING, etc.
    model TEXT,
    manufacturer TEXT,
    serial_number TEXT,
    purchase_date DATE,
    warranty_expiry DATE,
    status TEXT NOT NULL DEFAULT 'AVAILABLE',
    condition_status TEXT DEFAULT 'GOOD', -- EXCELLENT, GOOD, FAIR, POOR
    capacity_per_hour REAL DEFAULT 0,
    power_consumption_kw REAL DEFAULT 0,
    maintenance_frequency_days INTEGER DEFAULT 30,
    last_maintenance_date DATETIME,
    next_maintenance_date DATETIME,
    total_operating_hours REAL DEFAULT 0,
    current_operator_id TEXT,
    location_details TEXT,
    safety_certifications TEXT, -- JSON array
    operating_instructions TEXT,
    maintenance_instructions TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES production_departments(id),
    FOREIGN KEY (current_operator_id) REFERENCES users(id)
);

-- Production Equipment Usage Log with detailed tracking
DROP TABLE IF EXISTS production_equipment_usage CASCADE;
CREATE TABLE production_equipment_usage (
    id TEXT PRIMARY KEY,
    equipment_id TEXT NOT NULL,
    production_assignment_id TEXT NOT NULL,
    operated_by TEXT NOT NULL,
    setup_start_time DATETIME,
    setup_end_time DATETIME,
    production_start_time DATETIME,
    production_end_time DATETIME,
    cleanup_start_time DATETIME,
    cleanup_end_time DATETIME,
    total_setup_minutes INTEGER DEFAULT 0,
    total_production_minutes INTEGER DEFAULT 0,
    total_cleanup_minutes INTEGER DEFAULT 0,
    total_duration_minutes INTEGER DEFAULT 0,
    units_produced INTEGER DEFAULT 0,
    efficiency_percentage REAL DEFAULT 0,
    power_consumed_kwh REAL DEFAULT 0,
    material_waste_percentage REAL DEFAULT 0,
    downtime_minutes INTEGER DEFAULT 0,
    downtime_reason TEXT,
    maintenance_performed TEXT,
    issues_reported TEXT,
    remarks TEXT,
    FOREIGN KEY (equipment_id) REFERENCES production_equipment(id),
    FOREIGN KEY (production_assignment_id) REFERENCES production_job_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (operated_by) REFERENCES users(id)
);

-- Production Daily Reports with comprehensive metrics
DROP TABLE IF EXISTS production_daily_reports CASCADE;
CREATE TABLE production_daily_reports (
    id TEXT PRIMARY KEY,
    department_id TEXT NOT NULL,
    report_date DATE NOT NULL,
    total_jobs_assigned INTEGER DEFAULT 0,
    jobs_completed INTEGER DEFAULT 0,
    jobs_in_progress INTEGER DEFAULT 0,
    jobs_pending INTEGER DEFAULT 0,
    jobs_on_hold INTEGER DEFAULT 0,
    jobs_cancelled INTEGER DEFAULT 0,
    jobs_rework INTEGER DEFAULT 0,
    total_production_time_minutes INTEGER DEFAULT 0,
    total_setup_time_minutes INTEGER DEFAULT 0,
    total_downtime_minutes INTEGER DEFAULT 0,
    efficiency_percentage REAL DEFAULT 0,
    quality_score REAL DEFAULT 0,
    defect_rate_percentage REAL DEFAULT 0,
    material_waste_percentage REAL DEFAULT 0,
    energy_consumption_kwh REAL DEFAULT 0,
    overtime_hours REAL DEFAULT 0,
    staff_present INTEGER DEFAULT 0,
    staff_absent INTEGER DEFAULT 0,
    equipment_utilization_percentage REAL DEFAULT 0,
    safety_incidents INTEGER DEFAULT 0,
    total_units_produced INTEGER DEFAULT 0,
    cost_per_unit REAL DEFAULT 0,
    revenue_generated REAL DEFAULT 0,
    profit_margin_percentage REAL DEFAULT 0,
    customer_complaints INTEGER DEFAULT 0,
    on_time_delivery_percentage REAL DEFAULT 0,
    generated_by TEXT NOT NULL,
    approved_by TEXT,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_at DATETIME,
    FOREIGN KEY (department_id) REFERENCES production_departments(id),
    FOREIGN KEY (generated_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    UNIQUE(department_id, report_date)
);

-- Production Alerts and Notifications
CREATE TABLE IF NOT EXISTS production_alerts (
    id TEXT PRIMARY KEY,
    alert_type TEXT NOT NULL, -- QUALITY_ISSUE, EQUIPMENT_DOWN, DEADLINE_RISK, MATERIAL_SHORTAGE
    severity TEXT NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    department_id TEXT,
    job_assignment_id TEXT,
    equipment_id TEXT,
    triggered_by TEXT NOT NULL,
    assigned_to TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN', -- OPEN, ACKNOWLEDGED, IN_PROGRESS, RESOLVED, CLOSED
    resolution_notes TEXT,
    resolved_by TEXT,
    resolved_at DATETIME,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES production_departments(id),
    FOREIGN KEY (job_assignment_id) REFERENCES production_job_assignments(id),
    FOREIGN KEY (equipment_id) REFERENCES production_equipment(id),
    FOREIGN KEY (triggered_by) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id)
);

-- Performance Indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_production_departments_head ON production_departments(head_user_id);
CREATE INDEX IF NOT EXISTS idx_production_departments_parent ON production_departments(parent_department_id);
CREATE INDEX IF NOT EXISTS idx_production_departments_hierarchy ON production_departments(hierarchy_level);

CREATE INDEX IF NOT EXISTS idx_production_processes_department ON production_processes(department_id);
CREATE INDEX IF NOT EXISTS idx_production_processes_sequence ON production_processes(department_id, sequence_order);

CREATE INDEX IF NOT EXISTS idx_production_workflows_category ON production_workflows(product_category);
CREATE INDEX IF NOT EXISTS idx_production_workflows_active ON production_workflows(is_active);

CREATE INDEX IF NOT EXISTS idx_production_job_assignments_job_card ON production_job_assignments(job_card_id);
CREATE INDEX IF NOT EXISTS idx_production_job_assignments_department ON production_job_assignments(department_id);
CREATE INDEX IF NOT EXISTS idx_production_job_assignments_status ON production_job_assignments(status);
CREATE INDEX IF NOT EXISTS idx_production_job_assignments_assigned_to ON production_job_assignments(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_production_job_assignments_priority ON production_job_assignments(priority);
CREATE INDEX IF NOT EXISTS idx_production_job_assignments_dates ON production_job_assignments(assigned_date, estimated_completion_date);

CREATE INDEX IF NOT EXISTS idx_production_workflow_progress_job_card ON production_workflow_progress(job_card_id);
CREATE INDEX IF NOT EXISTS idx_production_workflow_progress_current ON production_workflow_progress(current_department_id, current_process_id);

CREATE INDEX IF NOT EXISTS idx_production_job_status_history_assignment ON production_job_status_history(production_assignment_id);
CREATE INDEX IF NOT EXISTS idx_production_job_status_history_changed_at ON production_job_status_history(changed_at);

CREATE INDEX IF NOT EXISTS idx_production_quality_checks_assignment ON production_quality_checks(production_assignment_id);
CREATE INDEX IF NOT EXISTS idx_production_quality_checks_status ON production_quality_checks(quality_status);

CREATE INDEX IF NOT EXISTS idx_production_material_consumption_assignment ON production_material_consumption(production_assignment_id);

CREATE INDEX IF NOT EXISTS idx_production_equipment_department ON production_equipment(department_id);
CREATE INDEX IF NOT EXISTS idx_production_equipment_status ON production_equipment(status);
CREATE INDEX IF NOT EXISTS idx_production_equipment_category ON production_equipment(category);

CREATE INDEX IF NOT EXISTS idx_production_equipment_usage_equipment ON production_equipment_usage(equipment_id);
CREATE INDEX IF NOT EXISTS idx_production_equipment_usage_assignment ON production_equipment_usage(production_assignment_id);

CREATE INDEX IF NOT EXISTS idx_production_user_roles_user ON production_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_production_user_roles_department ON production_user_roles(department_id);
CREATE INDEX IF NOT EXISTS idx_production_user_roles_role_type ON production_user_roles(role_type);

CREATE INDEX IF NOT EXISTS idx_production_daily_reports_department_date ON production_daily_reports(department_id, report_date);
CREATE INDEX IF NOT EXISTS idx_production_daily_reports_date ON production_daily_reports(report_date);

CREATE INDEX IF NOT EXISTS idx_production_alerts_type ON production_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_production_alerts_severity ON production_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_production_alerts_status ON production_alerts(status);
CREATE INDEX IF NOT EXISTS idx_production_alerts_department ON production_alerts(department_id);