-- Enhanced Job Lifecycle Database Schema - Simple Version
-- Complete workflow support for Prepress → Inventory → Production → QA → Dispatch

-- Enhanced job_lifecycle table with all department statuses
ALTER TABLE job_lifecycle ADD COLUMN IF NOT EXISTS product_type TEXT;
ALTER TABLE job_lifecycle ADD COLUMN IF NOT EXISTS current_department_id TEXT;
ALTER TABLE job_lifecycle ADD COLUMN IF NOT EXISTS current_process_id TEXT;
ALTER TABLE job_lifecycle ADD COLUMN IF NOT EXISTS prepress_status TEXT;
ALTER TABLE job_lifecycle ADD COLUMN IF NOT EXISTS prepress_notes TEXT;
ALTER TABLE job_lifecycle ADD COLUMN IF NOT EXISTS inventory_status TEXT;
ALTER TABLE job_lifecycle ADD COLUMN IF NOT EXISTS inventory_notes TEXT;
ALTER TABLE job_lifecycle ADD COLUMN IF NOT EXISTS production_status TEXT;
ALTER TABLE job_lifecycle ADD COLUMN IF NOT EXISTS production_notes TEXT;
ALTER TABLE job_lifecycle ADD COLUMN IF NOT EXISTS qa_status TEXT;
ALTER TABLE job_lifecycle ADD COLUMN IF NOT EXISTS qa_notes TEXT;
ALTER TABLE job_lifecycle ADD COLUMN IF NOT EXISTS dispatch_status TEXT;
ALTER TABLE job_lifecycle ADD COLUMN IF NOT EXISTS dispatch_notes TEXT;
ALTER TABLE job_lifecycle ADD COLUMN IF NOT EXISTS progress_percentage REAL DEFAULT 0;

-- Enhanced prepress_jobs table with category support
CREATE TABLE IF NOT EXISTS prepress_jobs (
    id TEXT PRIMARY KEY,
    job_card_id TEXT NOT NULL,
    assigned_designer_id TEXT,
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    due_date TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'PENDING',
    design_status TEXT DEFAULT 'PENDING',
    die_plate_status TEXT DEFAULT 'PENDING',
    other_status TEXT DEFAULT 'PENDING',
    design_notes TEXT,
    die_plate_notes TEXT,
    other_notes TEXT,
    hod_approval_required INTEGER DEFAULT 0,
    hod_approved_by TEXT,
    hod_approved_at TIMESTAMP,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory module tables
CREATE TABLE IF NOT EXISTS inventory_jobs (
    id TEXT PRIMARY KEY,
    job_card_id TEXT NOT NULL,
    assigned_to TEXT,
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    due_date TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'PENDING',
    material_request_status TEXT DEFAULT 'PENDING',
    material_issuance_status TEXT DEFAULT 'PENDING',
    material_procurement_status TEXT DEFAULT 'PENDING',
    material_request_notes TEXT,
    material_issuance_notes TEXT,
    material_procurement_notes TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Material requests table
CREATE TABLE IF NOT EXISTS material_requests (
    id TEXT PRIMARY KEY,
    inventory_job_id TEXT NOT NULL,
    material_id TEXT NOT NULL,
    quantity_requested REAL NOT NULL,
    quantity_approved REAL DEFAULT 0,
    quantity_issued REAL DEFAULT 0,
    unit TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    requested_by TEXT NOT NULL,
    approved_by TEXT,
    issued_by TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    issued_at TIMESTAMP,
    notes TEXT
);

-- Production job assignments (enhanced)
CREATE TABLE IF NOT EXISTS production_job_assignments (
    id TEXT PRIMARY KEY,
    job_card_id TEXT NOT NULL,
    department_id TEXT NOT NULL,
    process_id TEXT NOT NULL,
    assigned_by TEXT NOT NULL,
    assigned_to_user_id TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    workflow_step_id TEXT,
    previous_step_id TEXT,
    next_step_id TEXT,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    start_date TIMESTAMP,
    estimated_completion_date TIMESTAMP,
    actual_completion_date TIMESTAMP,
    setup_time_minutes INTEGER DEFAULT 0,
    production_time_minutes INTEGER DEFAULT 0,
    quality_check_time_minutes INTEGER DEFAULT 0,
    total_time_minutes INTEGER DEFAULT 0,
    quantity_planned INTEGER DEFAULT 0,
    quantity_completed INTEGER DEFAULT 0,
    quantity_rejected INTEGER DEFAULT 0,
    efficiency_percentage REAL DEFAULT 0,
    notes TEXT,
    internal_remarks TEXT,
    customer_remarks TEXT,
    attachments TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- QA jobs table
CREATE TABLE IF NOT EXISTS qa_jobs (
    id TEXT PRIMARY KEY,
    job_card_id TEXT NOT NULL,
    assigned_to TEXT,
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    due_date TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'PENDING',
    quality_score INTEGER,
    defects_found TEXT,
    measurements TEXT,
    test_results TEXT,
    sample_size INTEGER DEFAULT 0,
    passed_samples INTEGER DEFAULT 0,
    failed_samples INTEGER DEFAULT 0,
    rework_required INTEGER DEFAULT 0,
    approval_required INTEGER DEFAULT 0,
    approved_by TEXT,
    approved_at TIMESTAMP,
    remarks TEXT,
    corrective_actions TEXT,
    preventive_actions TEXT,
    images TEXT,
    documents TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dispatch jobs table
CREATE TABLE IF NOT EXISTS dispatch_jobs (
    id TEXT PRIMARY KEY,
    job_card_id TEXT NOT NULL,
    assigned_to TEXT,
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    due_date TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'PENDING',
    packaging_status TEXT DEFAULT 'PENDING',
    packaging_notes TEXT,
    tracking_number TEXT,
    courier_name TEXT,
    dispatch_date TIMESTAMP,
    expected_delivery_date TIMESTAMP,
    actual_delivery_date TIMESTAMP,
    delivery_notes TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced job_lifecycle_history table
CREATE TABLE IF NOT EXISTS job_lifecycle_history (
    id TEXT PRIMARY KEY,
    job_lifecycle_id TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT,
    changed_by TEXT NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table for real-time alerts
CREATE TABLE IF NOT EXISTS job_notifications (
    id TEXT PRIMARY KEY,
    job_card_id TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'MEDIUM',
    is_read INTEGER DEFAULT 0,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Process sequences table for product type workflows
CREATE TABLE IF NOT EXISTS process_sequences (
    id TEXT PRIMARY KEY,
    product_type TEXT NOT NULL,
    sequence_name TEXT NOT NULL,
    steps TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Process steps table
CREATE TABLE IF NOT EXISTS process_steps (
    id TEXT PRIMARY KEY,
    sequence_id TEXT NOT NULL,
    step_name TEXT NOT NULL,
    department_id TEXT NOT NULL,
    process_id TEXT,
    step_order INTEGER NOT NULL,
    is_compulsory INTEGER DEFAULT 0,
    estimated_duration_hours REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity logging tables
CREATE TABLE IF NOT EXISTS prepress_activities (
    id TEXT PRIMARY KEY,
    prepress_job_id TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata TEXT,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_activities (
    id TEXT PRIMARY KEY,
    inventory_job_id TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata TEXT,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
