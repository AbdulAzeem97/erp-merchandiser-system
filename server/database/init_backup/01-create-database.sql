-- =====================================================
-- ERP MERCHANDISER SYSTEM - COMPLETE POSTGRESQL SCHEMA
-- =====================================================
-- Production-ready database schema with all features
-- Supports: Job Lifecycle, Prepress, Inventory, Production, QA, Dispatch

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- =====================================================
-- CORE SYSTEM TABLES
-- =====================================================

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE,
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    contact_person VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    parent_department_id UUID REFERENCES departments(id),
    head_user_id UUID,
    cost_center VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users table with enhanced roles
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'USER',
    department_id UUID REFERENCES departments(id),
    manager_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    permissions JSONB DEFAULT '[]',
    profile_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key for department head after users table creation
ALTER TABLE departments ADD CONSTRAINT fk_departments_head_user 
    FOREIGN KEY (head_user_id) REFERENCES users(id);

-- =====================================================
-- PRODUCT AND MATERIAL MANAGEMENT
-- =====================================================

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Materials table
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE,
    category_id UUID REFERENCES categories(id),
    unit VARCHAR(20) NOT NULL,
    cost_per_unit DECIMAL(10,2),
    minimum_stock INTEGER DEFAULT 0,
    current_stock INTEGER DEFAULT 0,
    supplier_info JSONB DEFAULT '{}',
    specifications JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(100) UNIQUE,
    description TEXT,
    category_id UUID REFERENCES categories(id),
    company_id UUID REFERENCES companies(id),
    product_type VARCHAR(50),
    specifications JSONB DEFAULT '{}',
    material_requirements JSONB DEFAULT '[]',
    process_requirements JSONB DEFAULT '[]',
    quality_standards JSONB DEFAULT '{}',
    estimated_cost DECIMAL(10,2),
    lead_time_days INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- JOB MANAGEMENT SYSTEM
-- =====================================================

-- Job cards table
CREATE TABLE IF NOT EXISTS job_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_number VARCHAR(50) UNIQUE NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    created_by UUID NOT NULL REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    quantity INTEGER NOT NULL,
    unit VARCHAR(20) NOT NULL,
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    due_date DATE,
    status VARCHAR(50) DEFAULT 'CREATED',
    special_instructions TEXT,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    punched_by UUID REFERENCES users(id),
    punched_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Job lifecycle tracking
CREATE TABLE IF NOT EXISTS job_lifecycle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_card_id UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
    current_status VARCHAR(50) NOT NULL,
    current_department VARCHAR(50),
    current_process VARCHAR(50),
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Prepress tracking
    prepress_status VARCHAR(50) DEFAULT 'PENDING',
    prepress_assigned_to UUID REFERENCES users(id),
    prepress_started_at TIMESTAMP WITH TIME ZONE,
    prepress_completed_at TIMESTAMP WITH TIME ZONE,
    prepress_notes TEXT,
    
    -- Inventory tracking
    inventory_status VARCHAR(50) DEFAULT 'PENDING',
    inventory_assigned_to UUID REFERENCES users(id),
    inventory_started_at TIMESTAMP WITH TIME ZONE,
    inventory_completed_at TIMESTAMP WITH TIME ZONE,
    inventory_notes TEXT,
    
    -- Production tracking
    production_status VARCHAR(50) DEFAULT 'PENDING',
    production_assigned_to UUID REFERENCES users(id),
    production_started_at TIMESTAMP WITH TIME ZONE,
    production_completed_at TIMESTAMP WITH TIME ZONE,
    production_notes TEXT,
    
    -- QA tracking
    qa_status VARCHAR(50) DEFAULT 'PENDING',
    qa_assigned_to UUID REFERENCES users(id),
    qa_started_at TIMESTAMP WITH TIME ZONE,
    qa_completed_at TIMESTAMP WITH TIME ZONE,
    qa_notes TEXT,
    
    -- Dispatch tracking
    dispatch_status VARCHAR(50) DEFAULT 'PENDING',
    dispatch_assigned_to UUID REFERENCES users(id),
    dispatch_started_at TIMESTAMP WITH TIME ZONE,
    dispatch_completed_at TIMESTAMP WITH TIME ZONE,
    dispatch_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(job_card_id)
);

-- Job lifecycle history for audit trail
CREATE TABLE IF NOT EXISTS job_lifecycle_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_card_id UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    department VARCHAR(50),
    process VARCHAR(50),
    changed_by UUID NOT NULL REFERENCES users(id),
    change_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PREPRESS DEPARTMENT
-- =====================================================

-- Prepress jobs with category support
CREATE TABLE IF NOT EXISTS prepress_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_card_id UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
    assigned_designer_id UUID REFERENCES users(id),
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    due_date TIMESTAMP WITH TIME ZONE,
    
    -- Overall status
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    
    -- Category-specific statuses
    design_status VARCHAR(50) DEFAULT 'PENDING',
    die_plate_status VARCHAR(50) DEFAULT 'PENDING',
    other_status VARCHAR(50) DEFAULT 'PENDING',
    
    -- Category-specific notes
    design_notes TEXT,
    die_plate_notes TEXT,
    other_notes TEXT,
    
    -- Category-specific timestamps
    design_started_at TIMESTAMP WITH TIME ZONE,
    design_completed_at TIMESTAMP WITH TIME ZONE,
    die_plate_started_at TIMESTAMP WITH TIME ZONE,
    die_plate_completed_at TIMESTAMP WITH TIME ZONE,
    other_started_at TIMESTAMP WITH TIME ZONE,
    other_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- HOD approval workflow
    hod_approval_required BOOLEAN DEFAULT false,
    hod_approved_by UUID REFERENCES users(id),
    hod_approved_at TIMESTAMP WITH TIME ZONE,
    hod_approval_notes TEXT,
    
    -- Metadata
    work_hours DECIMAL(5,2) DEFAULT 0,
    estimated_hours DECIMAL(5,2),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(job_card_id)
);

-- Prepress activity log
CREATE TABLE IF NOT EXISTS prepress_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prepress_job_id UUID NOT NULL REFERENCES prepress_jobs(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    category VARCHAR(20), -- 'DESIGN', 'DIE_PLATE', 'OTHER'
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    actor_id UUID NOT NULL REFERENCES users(id),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Prepress attachments
CREATE TABLE IF NOT EXISTS prepress_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prepress_job_id UUID NOT NULL REFERENCES prepress_jobs(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    attachment_type VARCHAR(50), -- 'ARTWORK', 'PREVIEW', 'REFERENCE', 'FINAL'
    category VARCHAR(20), -- 'DESIGN', 'DIE_PLATE', 'OTHER'
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INVENTORY MANAGEMENT
-- =====================================================

-- Material requests
CREATE TABLE IF NOT EXISTS material_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_card_id UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id),
    requested_quantity DECIMAL(10,2) NOT NULL,
    approved_quantity DECIMAL(10,2),
    issued_quantity DECIMAL(10,2),
    unit VARCHAR(20) NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING',
    urgency VARCHAR(20) DEFAULT 'NORMAL',
    requested_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    issued_by UUID REFERENCES users(id),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP WITH TIME ZONE,
    issued_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory transactions
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES materials(id),
    transaction_type VARCHAR(20) NOT NULL, -- 'IN', 'OUT', 'ADJUSTMENT'
    quantity DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    reference_type VARCHAR(30), -- 'JOB_CARD', 'PURCHASE', 'ADJUSTMENT'
    reference_id UUID,
    performed_by UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PRODUCTION SYSTEM
-- =====================================================

-- Production departments
CREATE TABLE IF NOT EXISTS production_departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    department_type VARCHAR(50), -- 'OFFSET', 'WOVEN', 'DIGITAL', 'FINISHING'
    capacity_per_day INTEGER,
    active_workers INTEGER,
    head_user_id UUID REFERENCES users(id),
    equipment_info JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Production processes
CREATE TABLE IF NOT EXISTS production_processes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    department_id UUID REFERENCES production_departments(id),
    sequence_order INTEGER NOT NULL,
    estimated_time_hours DECIMAL(5,2),
    required_skills JSONB DEFAULT '[]',
    equipment_required JSONB DEFAULT '[]',
    quality_checkpoints JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Production job assignments
CREATE TABLE IF NOT EXISTS production_job_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_card_id UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES production_departments(id),
    process_id UUID NOT NULL REFERENCES production_processes(id),
    assigned_to UUID REFERENCES users(id),
    status VARCHAR(30) DEFAULT 'PENDING',
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    scheduled_start TIMESTAMP WITH TIME ZONE,
    actual_start TIMESTAMP WITH TIME ZONE,
    estimated_end TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    work_hours DECIMAL(5,2),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- QUALITY ASSURANCE
-- =====================================================

-- QA checkpoints
CREATE TABLE IF NOT EXISTS qa_checkpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    checkpoint_type VARCHAR(50), -- 'INCOMING', 'IN_PROCESS', 'FINAL'
    department VARCHAR(50),
    criteria JSONB NOT NULL DEFAULT '[]',
    is_mandatory BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- QA job inspections
CREATE TABLE IF NOT EXISTS qa_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_card_id UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
    checkpoint_id UUID NOT NULL REFERENCES qa_checkpoints(id),
    inspector_id UUID NOT NULL REFERENCES users(id),
    inspection_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL, -- 'PASS', 'FAIL', 'CONDITIONAL_PASS'
    score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    findings TEXT,
    corrective_actions TEXT,
    re_inspection_required BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- DISPATCH DEPARTMENT
-- =====================================================

-- Dispatch jobs
CREATE TABLE IF NOT EXISTS dispatch_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_card_id UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
    packaging_type VARCHAR(50),
    packaging_notes TEXT,
    shipping_method VARCHAR(50),
    courier_service VARCHAR(100),
    tracking_number VARCHAR(100),
    estimated_delivery DATE,
    actual_delivery DATE,
    delivery_address TEXT NOT NULL,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    status VARCHAR(30) DEFAULT 'PENDING',
    assigned_to UUID REFERENCES users(id),
    packed_by UUID REFERENCES users(id),
    packed_at TIMESTAMP WITH TIME ZONE,
    dispatched_by UUID REFERENCES users(id),
    dispatched_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    delivery_proof JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(job_card_id)
);

-- =====================================================
-- NOTIFICATION SYSTEM
-- =====================================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL, -- 'INFO', 'WARNING', 'ERROR', 'SUCCESS'
    category VARCHAR(50), -- 'JOB_ASSIGNMENT', 'STATUS_UPDATE', 'APPROVAL_REQUEST'
    priority VARCHAR(20) DEFAULT 'NORMAL', -- 'LOW', 'NORMAL', 'HIGH', 'URGENT'
    reference_type VARCHAR(30),
    reference_id UUID,
    metadata JSONB DEFAULT '{}',
    read_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- AUDIT AND LOGGING
-- =====================================================

-- Comprehensive audit log
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    user_id UUID REFERENCES users(id),
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(category, key)
);

-- User sessions for enhanced security
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(500) NOT NULL UNIQUE,
    refresh_token VARCHAR(500) UNIQUE,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Job cards indexes
CREATE INDEX IF NOT EXISTS idx_job_cards_status ON job_cards(status);
CREATE INDEX IF NOT EXISTS idx_job_cards_company ON job_cards(company_id);
CREATE INDEX IF NOT EXISTS idx_job_cards_product ON job_cards(product_id);
CREATE INDEX IF NOT EXISTS idx_job_cards_created_by ON job_cards(created_by);
CREATE INDEX IF NOT EXISTS idx_job_cards_due_date ON job_cards(due_date);
CREATE INDEX IF NOT EXISTS idx_job_cards_created_at ON job_cards(created_at);

-- Job lifecycle indexes
CREATE INDEX IF NOT EXISTS idx_job_lifecycle_status ON job_lifecycle(current_status);
CREATE INDEX IF NOT EXISTS idx_job_lifecycle_department ON job_lifecycle(current_department);
CREATE INDEX IF NOT EXISTS idx_job_lifecycle_prepress_assigned ON job_lifecycle(prepress_assigned_to);
CREATE INDEX IF NOT EXISTS idx_job_lifecycle_production_assigned ON job_lifecycle(production_assigned_to);

-- Prepress indexes
CREATE INDEX IF NOT EXISTS idx_prepress_jobs_designer ON prepress_jobs(assigned_designer_id);
CREATE INDEX IF NOT EXISTS idx_prepress_jobs_status ON prepress_jobs(status);
CREATE INDEX IF NOT EXISTS idx_prepress_jobs_due_date ON prepress_jobs(due_date);
CREATE INDEX IF NOT EXISTS idx_prepress_activities_job ON prepress_activities(prepress_job_id);
CREATE INDEX IF NOT EXISTS idx_prepress_activities_date ON prepress_activities(created_at);

-- Material and inventory indexes
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category_id);
CREATE INDEX IF NOT EXISTS idx_materials_code ON materials(code);
CREATE INDEX IF NOT EXISTS idx_material_requests_job ON material_requests(job_card_id);
CREATE INDEX IF NOT EXISTS idx_material_requests_material ON material_requests(material_id);
CREATE INDEX IF NOT EXISTS idx_material_requests_status ON material_requests(status);

-- Production indexes
CREATE INDEX IF NOT EXISTS idx_production_assignments_job ON production_job_assignments(job_card_id);
CREATE INDEX IF NOT EXISTS idx_production_assignments_department ON production_job_assignments(department_id);
CREATE INDEX IF NOT EXISTS idx_production_assignments_assigned ON production_job_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_production_assignments_status ON production_job_assignments(status);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_record ON audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_companies_search ON companies USING gin(to_tsvector('english', name || ' ' || COALESCE(contact_person, '')));

-- =====================================================
-- TRIGGERS FOR AUTOMATED FUNCTIONALITY
-- =====================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply timestamp triggers to all tables with updated_at column
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_cards_updated_at BEFORE UPDATE ON job_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_lifecycle_updated_at BEFORE UPDATE ON job_lifecycle FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prepress_jobs_updated_at BEFORE UPDATE ON prepress_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_material_requests_updated_at BEFORE UPDATE ON material_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_production_job_assignments_updated_at BEFORE UPDATE ON production_job_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dispatch_jobs_updated_at BEFORE UPDATE ON dispatch_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, user_id)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), COALESCE(current_setting('app.current_user_id', true)::UUID, NULL));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW), COALESCE(current_setting('app.current_user_id', true)::UUID, NULL));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW), COALESCE(current_setting('app.current_user_id', true)::UUID, NULL));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_job_cards AFTER INSERT OR UPDATE OR DELETE ON job_cards FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_job_lifecycle AFTER INSERT OR UPDATE OR DELETE ON job_lifecycle FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_prepress_jobs AFTER INSERT OR UPDATE OR DELETE ON prepress_jobs FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_material_requests AFTER INSERT OR UPDATE OR DELETE ON material_requests FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- =====================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- =====================================================

-- Dashboard statistics view
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dashboard_stats AS
SELECT 
    COUNT(*) as total_jobs,
    COUNT(*) FILTER (WHERE status = 'CREATED') as jobs_created,
    COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as jobs_in_progress,
    COUNT(*) FILTER (WHERE status = 'COMPLETED') as jobs_completed,
    COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status != 'COMPLETED') as overdue_jobs,
    AVG(EXTRACT(DAY FROM (completed_at - created_at))) FILTER (WHERE completed_at IS NOT NULL) as avg_completion_days,
    COUNT(DISTINCT company_id) as active_companies,
    COUNT(DISTINCT created_by) as active_users
FROM job_cards
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_dashboard_stats_unique ON mv_dashboard_stats ((1));

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INITIAL DATA SETUP COMPLETE
-- =====================================================

-- Log schema creation
DO $$
BEGIN
    RAISE NOTICE 'ERP Merchandiser Database Schema Created Successfully';
    RAISE NOTICE 'Tables Created: %', (
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    );
END $$;