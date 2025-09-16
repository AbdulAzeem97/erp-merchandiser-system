-- Enhanced Job Lifecycle Database Schema
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
    due_date DATETIME,
    status TEXT NOT NULL DEFAULT 'PENDING',
    design_status TEXT DEFAULT 'PENDING',
    die_plate_status TEXT DEFAULT 'PENDING',
    other_status TEXT DEFAULT 'PENDING',
    design_notes TEXT,
    die_plate_notes TEXT,
    other_notes TEXT,
    hod_approval_required INTEGER DEFAULT 0,
    hod_approved_by TEXT,
    hod_approved_at DATETIME,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_designer_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (hod_approved_by) REFERENCES users(id)
);

-- Inventory module tables
CREATE TABLE IF NOT EXISTS inventory_jobs (
    id TEXT PRIMARY KEY,
    job_card_id TEXT NOT NULL,
    assigned_to TEXT,
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    due_date DATETIME,
    status TEXT NOT NULL DEFAULT 'PENDING',
    material_request_status TEXT DEFAULT 'PENDING',
    material_issuance_status TEXT DEFAULT 'PENDING',
    material_procurement_status TEXT DEFAULT 'PENDING',
    material_request_notes TEXT,
    material_issuance_notes TEXT,
    material_procurement_notes TEXT,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
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
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_at DATETIME,
    issued_at DATETIME,
    notes TEXT,
    FOREIGN KEY (inventory_job_id) REFERENCES inventory_jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id),
    FOREIGN KEY (requested_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (issued_by) REFERENCES users(id)
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
    internal_remarks TEXT,
    customer_remarks TEXT,
    attachments TEXT,
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

-- QA jobs table
CREATE TABLE IF NOT EXISTS qa_jobs (
    id TEXT PRIMARY KEY,
    job_card_id TEXT NOT NULL,
    assigned_to TEXT,
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    due_date DATETIME,
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
    approved_at DATETIME,
    remarks TEXT,
    corrective_actions TEXT,
    preventive_actions TEXT,
    images TEXT,
    documents TEXT,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Dispatch jobs table
CREATE TABLE IF NOT EXISTS dispatch_jobs (
    id TEXT PRIMARY KEY,
    job_card_id TEXT NOT NULL,
    assigned_to TEXT,
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    due_date DATETIME,
    status TEXT NOT NULL DEFAULT 'PENDING',
    packaging_status TEXT DEFAULT 'PENDING',
    packaging_notes TEXT,
    tracking_number TEXT,
    courier_name TEXT,
    dispatch_date DATETIME,
    expected_delivery_date DATETIME,
    actual_delivery_date DATETIME,
    delivery_notes TEXT,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Enhanced job_lifecycle_history table
CREATE TABLE IF NOT EXISTS job_lifecycle_history (
    id TEXT PRIMARY KEY,
    job_lifecycle_id TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT,
    changed_by TEXT NOT NULL,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_lifecycle_id) REFERENCES job_lifecycle(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id)
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Process sequences table for product type workflows
CREATE TABLE IF NOT EXISTS process_sequences (
    id TEXT PRIMARY KEY,
    product_type TEXT NOT NULL,
    sequence_name TEXT NOT NULL,
    steps TEXT NOT NULL, -- JSON array of process steps
    is_active INTEGER DEFAULT 1,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sequence_id) REFERENCES process_sequences(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES production_departments(id),
    FOREIGN KEY (process_id) REFERENCES production_processes(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_lifecycle_job_card ON job_lifecycle(job_card_id);
CREATE INDEX IF NOT EXISTS idx_job_lifecycle_status ON job_lifecycle(status);
CREATE INDEX IF NOT EXISTS idx_job_lifecycle_current_department ON job_lifecycle(current_department_id);
CREATE INDEX IF NOT EXISTS idx_job_lifecycle_updated_at ON job_lifecycle(updated_at);

CREATE INDEX IF NOT EXISTS idx_prepress_jobs_job_card ON prepress_jobs(job_card_id);
CREATE INDEX IF NOT EXISTS idx_prepress_jobs_designer ON prepress_jobs(assigned_designer_id);
CREATE INDEX IF NOT EXISTS idx_prepress_jobs_status ON prepress_jobs(status);

CREATE INDEX IF NOT EXISTS idx_inventory_jobs_job_card ON inventory_jobs(job_card_id);
CREATE INDEX IF NOT EXISTS idx_inventory_jobs_assigned_to ON inventory_jobs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_inventory_jobs_status ON inventory_jobs(status);

CREATE INDEX IF NOT EXISTS idx_material_requests_inventory_job ON material_requests(inventory_job_id);
CREATE INDEX IF NOT EXISTS idx_material_requests_material ON material_requests(material_id);
CREATE INDEX IF NOT EXISTS idx_material_requests_status ON material_requests(status);

CREATE INDEX IF NOT EXISTS idx_production_job_assignments_job_card ON production_job_assignments(job_card_id);
CREATE INDEX IF NOT EXISTS idx_production_job_assignments_department ON production_job_assignments(department_id);
CREATE INDEX IF NOT EXISTS idx_production_job_assignments_status ON production_job_assignments(status);

CREATE INDEX IF NOT EXISTS idx_qa_jobs_job_card ON qa_jobs(job_card_id);
CREATE INDEX IF NOT EXISTS idx_qa_jobs_assigned_to ON qa_jobs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_qa_jobs_status ON qa_jobs(status);

CREATE INDEX IF NOT EXISTS idx_dispatch_jobs_job_card ON dispatch_jobs(job_card_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_jobs_assigned_to ON dispatch_jobs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_dispatch_jobs_status ON dispatch_jobs(status);

CREATE INDEX IF NOT EXISTS idx_job_lifecycle_history_lifecycle ON job_lifecycle_history(job_lifecycle_id);
CREATE INDEX IF NOT EXISTS idx_job_lifecycle_history_changed_at ON job_lifecycle_history(changed_at);

CREATE INDEX IF NOT EXISTS idx_job_notifications_job_card ON job_notifications(job_card_id);
CREATE INDEX IF NOT EXISTS idx_job_notifications_type ON job_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_job_notifications_is_read ON job_notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_process_sequences_product_type ON process_sequences(product_type);
CREATE INDEX IF NOT EXISTS idx_process_steps_sequence ON process_steps(sequence_id);
CREATE INDEX IF NOT EXISTS idx_process_steps_department ON process_steps(department_id);
