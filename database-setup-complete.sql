-- ===================================================================
-- COMPLETE DATABASE SETUP FOR ERP MERCHANDISER SYSTEM
-- ===================================================================
-- This script creates all tables and seeds initial data
-- Run this on a fresh PostgreSQL database
-- ===================================================================

-- ===================================================================
-- 1. CREATE ENUMS
-- ===================================================================

-- User roles enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'ADMIN',
        'HEAD_OF_MERCHANDISER',
        'HEAD_OF_PRODUCTION',
        'HOD_PREPRESS',
        'DESIGNER',
        'MERCHANDISER',
        'QA',
        'QA_PREPRESS',
        'CTP_OPERATOR',
        'INVENTORY_MANAGER',
        'PROCUREMENT_MANAGER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Job card status enum
DO $$ BEGIN
    CREATE TYPE job_status AS ENUM (
        'PENDING',
        'IN_PROGRESS',
        'IN_DESIGN',
        'DESIGN_SUBMITTED',
        'APPROVED',
        'IN_QA',
        'QA_APPROVED',
        'QA_REJECTED',
        'REWORK',
        'COMPLETED',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Prepress job status enum
DO $$ BEGIN
    CREATE TYPE prepress_status AS ENUM (
        'ASSIGNED',
        'IN_PROGRESS',
        'SUBMITTED_FOR_QA',
        'IN_QA_REVIEW',
        'APPROVED_BY_QA',
        'REJECTED_BY_QA',
        'REWORK',
        'COMPLETED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Transaction type enum for inventory
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Purchase order status enum
DO $$ BEGIN
    CREATE TYPE po_status AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Requisition status enum
DO $$ BEGIN
    CREATE TYPE requisition_status AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- GRN status enum
DO $$ BEGIN
    CREATE TYPE grn_status AS ENUM ('PENDING', 'COMPLETED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===================================================================
-- 2. CREATE CORE TABLES
-- ===================================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    department VARCHAR(100),
    "isActive" BOOLEAN DEFAULT TRUE,
    "lastLogin" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    "contactPerson" VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Materials table
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(100),
    description TEXT,
    unit VARCHAR(50),
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id),
    brand VARCHAR(100),
    gsm VARCHAR(50),
    fsc_certified BOOLEAN DEFAULT FALSE,
    fsc_certificate_number VARCHAR(100),
    product_type VARCHAR(100),
    base_price DECIMAL(12, 2),
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Process Steps table
CREATE TABLE IF NOT EXISTS process_steps (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    sequence_order INTEGER,
    department VARCHAR(100),
    estimated_time_hours DECIMAL(10, 2),
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Process Sequences table
CREATE TABLE IF NOT EXISTS product_process_sequences (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    process_step_id INTEGER REFERENCES process_steps(id) ON DELETE CASCADE,
    sequence_order INTEGER NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE,
    estimated_duration_hours DECIMAL(10, 2),
    notes TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, sequence_order)
);

-- Job Cards table
CREATE TABLE IF NOT EXISTS job_cards (
    id SERIAL PRIMARY KEY,
    "jobNumber" VARCHAR(100) UNIQUE NOT NULL,
    "productId" INTEGER REFERENCES products(id),
    "companyId" INTEGER REFERENCES companies(id),
    customer_name VARCHAR(255),
    quantity INTEGER NOT NULL,
    status job_status DEFAULT 'PENDING',
    priority VARCHAR(50) DEFAULT 'MEDIUM',
    deadline DATE,
    notes TEXT,
    design_link TEXT,
    final_design_link TEXT,
    ratio_excel_link TEXT,
    ratio_report_data JSONB,
    item_specifications_excel_link TEXT,
    item_specifications_data JSONB,
    "createdBy" INTEGER REFERENCES users(id),
    "assignedTo" INTEGER REFERENCES users(id),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prepress Jobs table
CREATE TABLE IF NOT EXISTS prepress_jobs (
    id SERIAL PRIMARY KEY,
    job_card_id INTEGER REFERENCES job_cards(id) ON DELETE CASCADE,
    assigned_designer_id INTEGER REFERENCES users(id),
    assigned_qa_id INTEGER REFERENCES users(id),
    status prepress_status DEFAULT 'ASSIGNED',
    design_notes TEXT,
    qa_notes TEXT,
    ctp_notes TEXT,
    design_submitted_at TIMESTAMP,
    qa_started_at TIMESTAMP,
    qa_completed_at TIMESTAMP,
    plate_generated BOOLEAN DEFAULT FALSE,
    plate_generated_at TIMESTAMP,
    plate_generated_by INTEGER REFERENCES users(id),
    plate_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Job Lifecycle table
CREATE TABLE IF NOT EXISTS job_lifecycle (
    id SERIAL PRIMARY KEY,
    job_card_id INTEGER REFERENCES job_cards(id) ON DELETE CASCADE,
    process_step_id INTEGER REFERENCES process_steps(id),
    sequence_order INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    assigned_to INTEGER REFERENCES users(id),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    notes TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- 3. CREATE INVENTORY TABLES
-- ===================================================================

-- Inventory Categories
CREATE TABLE IF NOT EXISTS inventory_categories (
    category_id SERIAL PRIMARY KEY,
    department VARCHAR(100) NOT NULL,
    master_category VARCHAR(100) NOT NULL,
    control_category VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Locations
CREATE TABLE IF NOT EXISTS inventory_locations (
    location_id SERIAL PRIMARY KEY,
    location_name VARCHAR(100) NOT NULL UNIQUE,
    location_type VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Items
CREATE TABLE IF NOT EXISTS inventory_items (
    item_id SERIAL PRIMARY KEY,
    item_code VARCHAR(50) NOT NULL UNIQUE,
    item_name VARCHAR(255) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    category_id INTEGER REFERENCES inventory_categories(category_id),
    reorder_level DECIMAL(12,2) DEFAULT 0,
    reorder_qty DECIMAL(12,2) DEFAULT 0,
    unit_cost DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Transactions
CREATE TABLE IF NOT EXISTS inventory_transactions (
    txn_id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES inventory_items(item_id),
    location_id INTEGER REFERENCES inventory_locations(location_id),
    txn_type transaction_type NOT NULL,
    txn_date DATE NOT NULL DEFAULT CURRENT_DATE,
    qty DECIMAL(12,2) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    ref_no VARCHAR(100),
    department VARCHAR(100),
    remarks TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Balances
CREATE TABLE IF NOT EXISTS inventory_balances (
    balance_id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES inventory_items(item_id),
    location_id INTEGER REFERENCES inventory_locations(location_id),
    opening_qty DECIMAL(12,2) DEFAULT 0,
    in_qty DECIMAL(12,2) DEFAULT 0,
    out_qty DECIMAL(12,2) DEFAULT 0,
    balance_qty DECIMAL(12,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(item_id, location_id)
);

-- ===================================================================
-- 4. CREATE PROCUREMENT TABLES
-- ===================================================================

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id SERIAL PRIMARY KEY,
    supplier_code VARCHAR(50) NOT NULL UNIQUE,
    supplier_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    payment_terms VARCHAR(100),
    credit_limit DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Requisitions
CREATE TABLE IF NOT EXISTS purchase_requisitions (
    requisition_id SERIAL PRIMARY KEY,
    requisition_no VARCHAR(50) NOT NULL UNIQUE,
    requisition_date DATE NOT NULL DEFAULT CURRENT_DATE,
    department VARCHAR(100),
    requested_by INTEGER REFERENCES users(id),
    status requisition_status DEFAULT 'DRAFT',
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    remarks TEXT,
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Requisition Details
CREATE TABLE IF NOT EXISTS purchase_requisition_details (
    detail_id SERIAL PRIMARY KEY,
    requisition_id INTEGER REFERENCES purchase_requisitions(requisition_id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES inventory_items(item_id),
    qty_requested DECIMAL(12,2) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    estimated_cost DECIMAL(12,2),
    remarks TEXT
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
    po_id SERIAL PRIMARY KEY,
    po_number VARCHAR(50) NOT NULL UNIQUE,
    po_date DATE NOT NULL DEFAULT CURRENT_DATE,
    supplier_id INTEGER REFERENCES suppliers(supplier_id),
    requisition_id INTEGER REFERENCES purchase_requisitions(requisition_id),
    delivery_date DATE,
    payment_terms VARCHAR(100),
    status po_status DEFAULT 'DRAFT',
    total_amount DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    tax DECIMAL(12,2) DEFAULT 0,
    net_amount DECIMAL(12,2) DEFAULT 0,
    remarks TEXT,
    created_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Order Details
CREATE TABLE IF NOT EXISTS purchase_order_details (
    detail_id SERIAL PRIMARY KEY,
    po_id INTEGER REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES inventory_items(item_id),
    qty_ordered DECIMAL(12,2) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    remarks TEXT
);

-- Goods Receipt Notes (GRN)
CREATE TABLE IF NOT EXISTS goods_receipt_notes (
    grn_id SERIAL PRIMARY KEY,
    grn_number VARCHAR(50) NOT NULL UNIQUE,
    grn_date DATE NOT NULL DEFAULT CURRENT_DATE,
    po_id INTEGER REFERENCES purchase_orders(po_id),
    supplier_id INTEGER REFERENCES suppliers(supplier_id),
    invoice_no VARCHAR(100),
    invoice_date DATE,
    status grn_status DEFAULT 'PENDING',
    remarks TEXT,
    received_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GRN Details
CREATE TABLE IF NOT EXISTS grn_details (
    detail_id SERIAL PRIMARY KEY,
    grn_id INTEGER REFERENCES goods_receipt_notes(grn_id) ON DELETE CASCADE,
    po_detail_id INTEGER REFERENCES purchase_order_details(detail_id),
    item_id INTEGER REFERENCES inventory_items(item_id),
    qty_received DECIMAL(12,2) NOT NULL,
    qty_rejected DECIMAL(12,2) DEFAULT 0,
    unit VARCHAR(10) NOT NULL,
    remarks TEXT
);

-- Supplier Invoices
CREATE TABLE IF NOT EXISTS supplier_invoices (
    invoice_id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_date DATE NOT NULL,
    grn_id INTEGER REFERENCES goods_receipt_notes(grn_id),
    supplier_id INTEGER REFERENCES suppliers(supplier_id),
    po_id INTEGER REFERENCES purchase_orders(po_id),
    total_amount DECIMAL(12,2) NOT NULL,
    tax DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    net_amount DECIMAL(12,2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    payment_date DATE,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ===================================================================

-- Job Cards indexes
CREATE INDEX IF NOT EXISTS idx_job_cards_status ON job_cards(status);
CREATE INDEX IF NOT EXISTS idx_job_cards_company ON job_cards("companyId");
CREATE INDEX IF NOT EXISTS idx_job_cards_product ON job_cards("productId");
CREATE INDEX IF NOT EXISTS idx_job_cards_created_by ON job_cards("createdBy");

-- Prepress Jobs indexes
CREATE INDEX IF NOT EXISTS idx_prepress_jobs_status ON prepress_jobs(status);
CREATE INDEX IF NOT EXISTS idx_prepress_jobs_designer ON prepress_jobs(assigned_designer_id);
CREATE INDEX IF NOT EXISTS idx_prepress_jobs_qa ON prepress_jobs(assigned_qa_id);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item ON inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(txn_date);
CREATE INDEX IF NOT EXISTS idx_inventory_balances_item ON inventory_balances(item_id);

-- Procurement indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_grn_po ON goods_receipt_notes(po_id);
CREATE INDEX IF NOT EXISTS idx_grn_supplier ON goods_receipt_notes(supplier_id);

-- ===================================================================
-- 6. SEED INITIAL DATA
-- ===================================================================

-- Insert Admin User (password: admin123)
INSERT INTO users ("firstName", "lastName", email, password, role, department, "isActive")
VALUES 
('Admin', 'User', 'admin@horizonsourcing.com', '$2a$10$YourHashedPasswordHere', 'ADMIN', 'Administration', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Insert HOD Prepress User (password: hod123)
INSERT INTO users ("firstName", "lastName", email, password, role, department, "isActive")
VALUES 
('HOD', 'Prepress', 'hod.prepress@horizonsourcing.com', '$2a$10$3KqZ8ZhQJ6bXZxQXZ7J7wO8FQJ9J7J7J7J7J7J7J7J7J7J7J7J7J7', 'HOD_PREPRESS', 'Prepress', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Insert Designer User (password: designer123)
INSERT INTO users ("firstName", "lastName", email, password, role, department, "isActive")
VALUES 
('Designer', 'User', 'designer@horizonsourcing.com', '$2a$10$DesignerHashedPassword', 'DESIGNER', 'Prepress', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Insert QA User (password: qa123)
INSERT INTO users ("firstName", "lastName", email, password, role, department, "isActive")
VALUES 
('QA', 'Prepress', 'qa.prepress@horizonsourcing.com', '$2a$10$QAHashedPassword', 'QA_PREPRESS', 'Quality Assurance', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Insert CTP Operator User (password: ctp123)
INSERT INTO users ("firstName", "lastName", email, password, role, department, "isActive")
VALUES 
('CTP', 'Operator', 'ctp.operator@horizonsourcing.com', '$2a$10$CTPHashedPassword', 'CTP_OPERATOR', 'Prepress', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Insert Inventory Manager User (password: inventory123)
INSERT INTO users ("firstName", "lastName", email, password, role, department, "isActive")
VALUES 
('Inventory', 'Manager', 'inventory.manager@horizonsourcing.com', '$2a$10$InventoryHashedPassword', 'INVENTORY_MANAGER', 'Inventory', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Insert Procurement Manager User (password: procurement123)
INSERT INTO users ("firstName", "lastName", email, password, role, department, "isActive")
VALUES 
('Procurement', 'Manager', 'procurement.manager@horizonsourcing.com', '$2a$10$ProcurementHashedPassword', 'PROCUREMENT_MANAGER', 'Procurement', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Insert Sample Categories
INSERT INTO categories (name, description) VALUES
('Labels', 'Various types of labels'),
('Packaging', 'Packaging materials'),
('Printed Materials', 'Printed products')
ON CONFLICT (name) DO NOTHING;

-- Insert Sample Materials
INSERT INTO materials (name, type, unit) VALUES
('Paper', 'Raw Material', 'KG'),
('Ink', 'Consumable', 'LTR'),
('Adhesive', 'Consumable', 'KG')
ON CONFLICT (name) DO NOTHING;

-- Insert Sample Companies
INSERT INTO companies (name, "contactPerson", email, phone, city, country) VALUES
('ABC Corporation', 'John Smith', 'john@abc.com', '+1-234-567-8900', 'New York', 'USA'),
('XYZ Industries', 'Jane Doe', 'jane@xyz.com', '+1-345-678-9012', 'Los Angeles', 'USA')
ON CONFLICT DO NOTHING;

-- Insert Process Steps
INSERT INTO process_steps (name, description, department, sequence_order) VALUES
('Design', 'Create initial design', 'Prepress', 1),
('Quality Check', 'QA review of design', 'Quality Assurance', 2),
('Plate Generation', 'Generate printing plates', 'Prepress', 3),
('Printing', 'Print the product', 'Production', 4),
('Finishing', 'Final finishing operations', 'Production', 5)
ON CONFLICT (name) DO NOTHING;

-- Insert Inventory Categories
INSERT INTO inventory_categories (department, master_category, control_category, description) VALUES
('Printing', 'Printing Materials', 'Flexo Ink', 'Flexographic printing inks'),
('Printing', 'Printing Materials', 'Screen Ink', 'Screen printing inks'),
('Production', 'Packing Material', 'Carton Boxes', 'Packaging cartons'),
('Production', 'Packing Material', 'Plastic Film', 'Plastic wrapping films')
ON CONFLICT DO NOTHING;

-- Insert Inventory Locations
INSERT INTO inventory_locations (location_name, location_type, description) VALUES
('Main Warehouse', 'Warehouse', 'Primary storage facility'),
('Production Floor', 'Production', 'Production area storage'),
('Quality Check Area', 'QA', 'Quality assurance storage')
ON CONFLICT (location_name) DO NOTHING;

-- Insert Sample Inventory Items
INSERT INTO inventory_items (item_code, item_name, unit, category_id, reorder_level, unit_cost) VALUES
('INK-FLX-001', 'Flexo Ink - Cyan', 'LTR', 1, 50.00, 25.50),
('INK-FLX-002', 'Flexo Ink - Magenta', 'LTR', 1, 50.00, 25.50),
('INK-SCR-001', 'Screen Ink - White', 'KG', 2, 30.00, 15.75),
('PKG-CTN-001', 'Carton Box - Small', 'PCS', 3, 100.00, 2.50),
('PKG-FLM-001', 'Plastic Film Roll', 'MTR', 4, 500.00, 0.85)
ON CONFLICT (item_code) DO NOTHING;

-- Insert Sample Suppliers
INSERT INTO suppliers (supplier_code, supplier_name, contact_person, email, phone, city, country, payment_terms) VALUES
('SUP-001', 'Ink Solutions Ltd', 'Michael Brown', 'michael@inksolutions.com', '+1-456-789-0123', 'Chicago', 'USA', 'Net 30'),
('SUP-002', 'Packaging Pro', 'Sarah Wilson', 'sarah@packagingpro.com', '+1-567-890-1234', 'Houston', 'USA', 'Net 45'),
('SUP-003', 'Materials Direct', 'Robert Johnson', 'robert@materialsdirect.com', '+1-678-901-2345', 'Phoenix', 'USA', 'Net 30')
ON CONFLICT (supplier_code) DO NOTHING;

-- ===================================================================
-- 7. GRANT PERMISSIONS (Optional - adjust as needed)
-- ===================================================================

-- Grant permissions to application user if needed
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- ===================================================================
-- SETUP COMPLETE
-- ===================================================================

SELECT 'Database setup completed successfully!' AS status;
SELECT 'Total tables created: ' || COUNT(*) AS tables_count 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

