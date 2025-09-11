-- =====================================================
-- MODERN POSTGRESQL SCHEMA FOR ERP MERCHANDISER SYSTEM
-- =====================================================
-- Designed for 200+ users with proper relationships,
-- departments, modern database structure, and performance

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- CORE SYSTEM TABLES
-- =====================================================

-- Users table with enhanced security and roles
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    department_id UUID REFERENCES departments(id),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Modern departments structure
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    parent_department_id UUID REFERENCES departments(id),
    head_user_id UUID REFERENCES users(id),
    cost_center VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Companies with enhanced contact management
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    country VARCHAR(50),
    postal_code VARCHAR(20),
    tax_id VARCHAR(50),
    credit_limit DECIMAL(15,2) DEFAULT 0,
    payment_terms INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PRODUCT MANAGEMENT
-- =====================================================

-- Product categories with hierarchy
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES product_categories(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Materials with enhanced specifications
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    gsm_range VARCHAR(20),
    description TEXT,
    unit_of_measurement VARCHAR(20) DEFAULT 'KG',
    cost_per_unit DECIMAL(10,4) DEFAULT 0,
    supplier_id UUID REFERENCES suppliers(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products with comprehensive specifications
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_item_code VARCHAR(50) UNIQUE NOT NULL,
    brand VARCHAR(100) NOT NULL,
    material_id UUID REFERENCES materials(id),
    gsm INTEGER NOT NULL,
    product_type VARCHAR(50) NOT NULL,
    category_id UUID REFERENCES product_categories(id),
    fsc VARCHAR(20),
    fsc_claim VARCHAR(100),
    color_specifications TEXT,
    dimensions VARCHAR(100),
    weight DECIMAL(8,3),
    remarks TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- JOB MANAGEMENT SYSTEM
-- =====================================================

-- Job cards with enhanced tracking
CREATE TABLE job_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_card_id VARCHAR(50) UNIQUE NOT NULL,
    product_id UUID REFERENCES products(id),
    company_id UUID REFERENCES companies(id),
    po_number VARCHAR(50),
    quantity INTEGER NOT NULL,
    delivery_date DATE NOT NULL,
    target_date DATE,
    customer_notes TEXT,
    special_instructions TEXT,
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    status VARCHAR(20) DEFAULT 'PENDING',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    estimated_cost DECIMAL(15,2),
    actual_cost DECIMAL(15,2),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    punched_by UUID REFERENCES users(id),
    punched_at TIMESTAMP WITH TIME ZONE
);

-- Job lifecycle with comprehensive tracking
CREATE TABLE job_lifecycle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_card_id VARCHAR(50) REFERENCES job_cards(job_card_id),
    status VARCHAR(30) NOT NULL DEFAULT 'CREATED',
    current_stage VARCHAR(50) DEFAULT 'job_creation',
    product_type VARCHAR(50) DEFAULT 'Offset',
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    prepress_job_id UUID,
    prepress_status VARCHAR(30),
    prepress_notes TEXT,
    assigned_designer_id UUID REFERENCES users(id),
    current_department_id UUID REFERENCES departments(id),
    estimated_completion_date TIMESTAMP WITH TIME ZONE,
    actual_completion_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Job lifecycle history for audit trail
CREATE TABLE job_lifecycle_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_lifecycle_id UUID REFERENCES job_lifecycle(id),
    status_from VARCHAR(30),
    status_to VARCHAR(30) NOT NULL,
    notes TEXT,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- =====================================================
-- PREPRESS SYSTEM
-- =====================================================

-- Prepress jobs with enhanced workflow
CREATE TABLE prepress_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_card_id VARCHAR(50) REFERENCES job_cards(job_card_id),
    assigned_designer_id UUID REFERENCES users(id),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    due_date TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    hod_last_remark TEXT,
    quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PRODUCTION SYSTEM
-- =====================================================

-- Production departments
CREATE TABLE production_departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    parent_department_id UUID REFERENCES production_departments(id),
    head_user_id UUID REFERENCES users(id),
    cost_center VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Production processes
CREATE TABLE production_processes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID REFERENCES production_departments(id),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT,
    sequence_order INTEGER DEFAULT 1,
    estimated_duration_hours DECIMAL(8,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INVENTORY SYSTEM
-- =====================================================

-- Suppliers
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    payment_terms INTEGER DEFAULT 30,
    lead_time_days INTEGER DEFAULT 7,
    rating DECIMAL(3,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory materials
CREATE TABLE inventory_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID REFERENCES materials(id),
    category_id UUID REFERENCES product_categories(id),
    unit_of_measurement VARCHAR(20) NOT NULL,
    unit_cost DECIMAL(10,2) DEFAULT 0.00,
    minimum_stock_level INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 0,
    maximum_stock_level INTEGER NOT NULL DEFAULT 1000,
    lead_time_days INTEGER DEFAULT 7,
    supplier_code VARCHAR(20),
    storage_location VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- NOTIFICATIONS & AUDIT
-- =====================================================

-- Notifications system
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    body TEXT,
    type VARCHAR(20) DEFAULT 'INFO',
    link VARCHAR(500),
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department_id);

-- Job card indexes
CREATE INDEX idx_job_cards_status ON job_cards(status);
CREATE INDEX idx_job_cards_company ON job_cards(company_id);
CREATE INDEX idx_job_cards_created_at ON job_cards(created_at);
CREATE INDEX idx_job_cards_delivery_date ON job_cards(delivery_date);

-- Lifecycle indexes
CREATE INDEX idx_job_lifecycle_status ON job_lifecycle(status);
CREATE INDEX idx_job_lifecycle_stage ON job_lifecycle(current_stage);
CREATE INDEX idx_job_lifecycle_updated_at ON job_lifecycle(updated_at);

-- Prepress indexes
CREATE INDEX idx_prepress_jobs_status ON prepress_jobs(status);
CREATE INDEX idx_prepress_jobs_designer ON prepress_jobs(assigned_designer_id);

-- Full-text search indexes
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', product_item_code || ' ' || brand));
CREATE INDEX idx_companies_search ON companies USING gin(to_tsvector('english', name || ' ' || code));

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_cards_updated_at BEFORE UPDATE ON job_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_lifecycle_updated_at BEFORE UPDATE ON job_lifecycle FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Job overview view
CREATE VIEW job_overview AS
SELECT 
    jc.job_card_id,
    jc.quantity,
    jc.delivery_date,
    jc.status as job_status,
    jc.priority,
    p.product_item_code,
    p.brand as product_name,
    c.name as company_name,
    jl.status as lifecycle_status,
    jl.current_stage,
    u.first_name || ' ' || u.last_name as created_by_name
FROM job_cards jc
LEFT JOIN products p ON jc.product_id = p.id
LEFT JOIN companies c ON jc.company_id = c.id
LEFT JOIN job_lifecycle jl ON jc.job_card_id = jl.job_card_id
LEFT JOIN users u ON jc.created_by = u.id;

-- Department performance view
CREATE VIEW department_performance AS
SELECT 
    d.name as department_name,
    d.code as department_code,
    COUNT(jc.id) as total_jobs,
    COUNT(CASE WHEN jc.status = 'COMPLETED' THEN 1 END) as completed_jobs,
    AVG(jc.progress) as avg_progress
FROM departments d
LEFT JOIN users u ON d.id = u.department_id
LEFT JOIN job_cards jc ON u.id = jc.created_by
GROUP BY d.id, d.name, d.code;

