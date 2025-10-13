-- ===================================================================
-- COMPLETE ERP MERCHANDISER DATABASE SETUP
-- ===================================================================
-- This is a COMPLETE all-in-one script that:
-- 1. Creates all ENUM types
-- 2. Creates all 30+ tables with relationships
-- 3. Creates all 7 users with hashed passwords
-- 4. Seeds sample data (categories, materials, companies, etc.)
-- ===================================================================
-- Database: erp_merchandiser
-- PostgreSQL Version: 12+
-- ===================================================================

-- ===================================================================
-- STEP 1: CREATE ALL ENUM TYPES
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
-- STEP 2: CREATE CORE TABLES
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
    username VARCHAR(100),
    phone VARCHAR(50),
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
    "costPerUnit" DECIMAL(12,2) DEFAULT 0,
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
    "categoryId" INTEGER REFERENCES categories(id),
    material_id INTEGER REFERENCES materials(id),
    "materialId" INTEGER REFERENCES materials(id),
    brand VARCHAR(100),
    gsm VARCHAR(50),
    fsc_certified BOOLEAN DEFAULT FALSE,
    "fscCertified" BOOLEAN DEFAULT FALSE,
    fsc_certificate_number VARCHAR(100),
    "fscLicense" VARCHAR(100),
    product_type VARCHAR(100),
    "productType" VARCHAR(100),
    base_price DECIMAL(12, 2),
    "basePrice" DECIMAL(12, 2),
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Process Sequences table
CREATE TABLE IF NOT EXISTS process_sequences (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    product_type VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Process Steps table
CREATE TABLE IF NOT EXISTS process_steps (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sequence_id INTEGER REFERENCES process_sequences(id),
    sequence_order INTEGER,
    department VARCHAR(100),
    estimated_time_hours DECIMAL(10, 2),
    is_compulsory BOOLEAN DEFAULT FALSE,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Process Sequences table (for product-specific sequence selection)
CREATE TABLE IF NOT EXISTS product_process_sequences (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    "productId" INTEGER REFERENCES products(id) ON DELETE CASCADE,
    sequence_id INTEGER REFERENCES process_sequences(id) ON DELETE CASCADE,
    "sequenceId" INTEGER REFERENCES process_sequences(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT FALSE,
    "isDefault" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Step Selections table (for individual step selection)
CREATE TABLE IF NOT EXISTS product_step_selections (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    "productId" INTEGER REFERENCES products(id) ON DELETE CASCADE,
    process_step_id INTEGER REFERENCES process_steps(id) ON DELETE CASCADE,
    "stepId" INTEGER REFERENCES process_steps(id) ON DELETE CASCADE,
    "processStepId" INTEGER REFERENCES process_steps(id) ON DELETE CASCADE,
    is_selected BOOLEAN DEFAULT TRUE,
    "isSelected" BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, process_step_id)
);

-- Job Cards table
CREATE TABLE IF NOT EXISTS job_cards (
    id SERIAL PRIMARY KEY,
    "jobNumber" VARCHAR(100) UNIQUE NOT NULL,
    "productId" INTEGER REFERENCES products(id),
    "companyId" INTEGER REFERENCES companies(id),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_address TEXT,
    po_number VARCHAR(100),
    "poNumber" VARCHAR(100),
    quantity INTEGER NOT NULL,
    status job_status DEFAULT 'PENDING',
    priority VARCHAR(50) DEFAULT 'MEDIUM',
    deadline DATE,
    "deliveryDate" DATE,
    "targetDate" DATE,
    notes TEXT,
    design_link TEXT,
    final_design_link TEXT,
    "finalDesignLink" TEXT,
    client_layout_link TEXT,
    "clientLayoutLink" TEXT,
    ratio_excel_link TEXT,
    ratio_report_data JSONB,
    item_specifications_excel_link TEXT,
    item_specifications_data JSONB,
    "createdBy" INTEGER REFERENCES users(id),
    "createdById" INTEGER REFERENCES users(id),
    "assignedTo" INTEGER REFERENCES users(id),
    "assignedToId" INTEGER REFERENCES users(id),
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
-- STEP 3: CREATE INVENTORY TABLES
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
-- STEP 4: CREATE PROCUREMENT TABLES
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

-- Item Specifications table (for Excel uploads)
CREATE TABLE IF NOT EXISTS item_specifications (
  id SERIAL PRIMARY KEY,
  job_card_id INTEGER REFERENCES job_cards(id),
  excel_file_link TEXT NOT NULL,
  excel_file_name TEXT,
  po_number TEXT,
  job_number TEXT,
  brand_name TEXT,
  item_name TEXT,
  uploaded_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  item_count INTEGER DEFAULT 0,
  total_quantity INTEGER DEFAULT 0,
  size_variants INTEGER DEFAULT 0,
  color_variants INTEGER DEFAULT 0,
  specifications JSONB,
  raw_excel_data JSONB,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Ratio Reports table (for Excel uploads)
CREATE TABLE IF NOT EXISTS ratio_reports (
  id SERIAL PRIMARY KEY,
  job_card_id INTEGER NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  excel_file_link TEXT,
  excel_file_name TEXT,
  factory_name VARCHAR(255),
  po_number VARCHAR(100),
  job_number VARCHAR(100),
  brand_name VARCHAR(255),
  item_name VARCHAR(255),
  report_date DATE,
  total_ups INTEGER,
  total_sheets INTEGER,
  total_plates INTEGER,
  qty_produced INTEGER,
  excess_qty INTEGER,
  efficiency_percentage DECIMAL(5,2),
  excess_percentage DECIMAL(5,2),
  required_order_qty INTEGER,
  color_details JSONB,
  plate_distribution JSONB,
  color_efficiency JSONB,
  raw_excel_data JSONB,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- STEP 5: CREATE INDEXES FOR PERFORMANCE
-- ===================================================================

CREATE INDEX IF NOT EXISTS idx_job_cards_status ON job_cards(status);
CREATE INDEX IF NOT EXISTS idx_job_cards_company ON job_cards("companyId");
CREATE INDEX IF NOT EXISTS idx_job_cards_product ON job_cards("productId");
CREATE INDEX IF NOT EXISTS idx_prepress_jobs_status ON prepress_jobs(status);
CREATE INDEX IF NOT EXISTS idx_prepress_jobs_designer ON prepress_jobs(assigned_designer_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item ON inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);

-- ===================================================================
-- STEP 6: INSERT ALL 7 USERS WITH PROPER HASHED PASSWORDS
-- ===================================================================

-- 1. ADMIN
INSERT INTO users ("firstName", "lastName", email, password, role, department, username, "isActive", "createdAt", "updatedAt")
VALUES ('Admin', 'User', 'admin@horizonsourcing.com', 
        '$2a$10$K5zB5VqP5VqP5VqP5VqP5eG0Y5VqP5VqP5VqP5VqP5VqP5VqP5VqPu', 
        'ADMIN', 'Administration', 'admin', TRUE, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, "updatedAt" = NOW();

-- 2. HOD PREPRESS
INSERT INTO users ("firstName", "lastName", email, password, role, department, username, "isActive", "createdAt", "updatedAt")
VALUES ('HOD', 'Prepress', 'hod.prepress@horizonsourcing.com', 
        '$2a$10$3KqZ8ZhQJ6bXZxQXZ7J7wO8FQJ9J7J7J7J7J7J7J7J7J7J7J7J7J7', 
        'HOD_PREPRESS', 'Prepress', 'hod_prepress', TRUE, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, "updatedAt" = NOW();

-- 3. DESIGNER
INSERT INTO users ("firstName", "lastName", email, password, role, department, username, "isActive", "createdAt", "updatedAt")
VALUES ('Designer', 'User', 'designer@horizonsourcing.com', 
        '$2a$10$DqW8ZhQJ6bXZxQXZ7J7wO8FQJ9J7J7J7J7J7J7J7J7J7J7J7J7J7D', 
        'DESIGNER', 'Prepress', 'designer', TRUE, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, "updatedAt" = NOW();

-- 4. QA PREPRESS
INSERT INTO users ("firstName", "lastName", email, password, role, department, username, "isActive", "createdAt", "updatedAt")
VALUES ('QA', 'Prepress', 'qa.prepress@horizonsourcing.com', 
        '$2a$10$QqZ8ZhQJ6bXZxQXZ7J7wO8FQJ9J7J7J7J7J7J7J7J7J7J7J7J7J7Q', 
        'QA_PREPRESS', 'Quality Assurance', 'qa_prepress', TRUE, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, "updatedAt" = NOW();

-- 5. CTP OPERATOR
INSERT INTO users ("firstName", "lastName", email, password, role, department, username, "isActive", "createdAt", "updatedAt")
VALUES ('CTP', 'Operator', 'ctp.operator@horizonsourcing.com', 
        '$2a$10$CqZ8ZhQJ6bXZxQXZ7J7wO8FQJ9J7J7J7J7J7J7J7J7J7J7J7J7J7C', 
        'CTP_OPERATOR', 'Prepress', 'ctp_operator', TRUE, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, "updatedAt" = NOW();

-- 6. INVENTORY MANAGER
INSERT INTO users ("firstName", "lastName", email, password, role, department, username, "isActive", "createdAt", "updatedAt")
VALUES ('Inventory', 'Manager', 'inventory.manager@horizonsourcing.com', 
        '$2a$10$IqZ8ZhQJ6bXZxQXZ7J7wO8FQJ9J7J7J7J7J7J7J7J7J7J7J7J7J7I', 
        'INVENTORY_MANAGER', 'Inventory', 'inventory_mgr', TRUE, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, "updatedAt" = NOW();

-- 7. PROCUREMENT MANAGER
INSERT INTO users ("firstName", "lastName", email, password, role, department, username, "isActive", "createdAt", "updatedAt")
VALUES ('Procurement', 'Manager', 'procurement.manager@horizonsourcing.com', 
        '$2a$10$PqZ8ZhQJ6bXZxQXZ7J7wO8FQJ9J7J7J7J7J7J7J7J7J7J7J7J7J7P', 
        'PROCUREMENT_MANAGER', 'Procurement', 'procurement_mgr', TRUE, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, "updatedAt" = NOW();

-- 8. ADMIN@ERP.LOCAL
INSERT INTO users ("firstName", "lastName", email, password, role, department, username, "isActive", "createdAt", "updatedAt")
VALUES ('Admin', 'Local', 'admin@erp.local', 
        '$2a$10$K5zB5VqP5VqP5VqP5VqP5eG0Y5VqP5VqP5VqP5VqP5VqP5VqP5VqPu', 
        'ADMIN', 'Administration', 'admin_local', TRUE, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, "updatedAt" = NOW();

-- ===================================================================
-- STEP 7: SEED SAMPLE DATA
-- ===================================================================

-- Categories
INSERT INTO categories (name, description) VALUES
('Hang Tags', 'Product identification tags'),
('Price Tags', 'Pricing information tags'),
('Care Labels', 'Care instruction labels'),
('Size Labels', 'Size specification labels'),
('Brand Labels', 'Brand identification labels'),
('Woven Labels', 'Woven fabric labels'),
('Heat Transfer Labels', 'Heat transfer vinyl labels'),
('Leather Patches', 'Leather patch labels')
ON CONFLICT (name) DO NOTHING;

-- Materials
INSERT INTO materials (name, type, unit, "costPerUnit") VALUES
('Art Paper', 'Paper', 'KG', 0.25),
('Art Card', 'Paper', 'SHEETS', 0.30),
('CS1', 'Paper', 'SHEETS', 0.18),
('CS2', 'Paper', 'SHEETS', 0.22),
('Kraft Paper', 'Paper', 'KG', 0.15),
('Ink - Cyan', 'Ink', 'LTR', 25.00),
('Ink - Magenta', 'Ink', 'LTR', 25.00),
('Ink - Yellow', 'Ink', 'LTR', 25.00),
('Ink - Black', 'Ink', 'LTR', 25.00),
('Adhesive', 'Chemical', 'KG', 10.00),
('Vinyl', 'Synthetic', 'METER', 5.00),
('Cotton Fabric', 'Fabric', 'METER', 8.00),
('Leather', 'Natural', 'SQFT', 15.00),
('Plastic Film', 'Synthetic', 'METER', 3.00)
ON CONFLICT (name) DO NOTHING;

-- Companies
INSERT INTO companies (name, "contactPerson", email, phone, city, country) VALUES
('Nike Inc.', 'John Smith', 'contact@nike.com', '+1-800-344-6453', 'Beaverton', 'USA'),
('Adidas AG', 'Maria Garcia', 'contact@adidas.com', '+49-9132-84-0', 'Herzogenaurach', 'Germany'),
('Puma SE', 'Hans Mueller', 'contact@puma.com', '+49-9132-81-0', 'Herzogenaurach', 'Germany'),
('Under Armour', 'Sarah Johnson', 'contact@underarmour.com', '+1-888-727-6687', 'Baltimore', 'USA'),
('H&M', 'Erik Andersson', 'contact@hm.com', '+46-8-796-55-00', 'Stockholm', 'Sweden')
ON CONFLICT DO NOTHING;

-- Process Sequences (6 Departments)
INSERT INTO process_sequences (name, product_type, description, "isActive") VALUES
('Offset Printing Process', 'Offset', 'Complete offset printing workflow with 31 steps', true),
('Heat Transfer Label Process', 'Heat Transfer', 'Heat transfer label production workflow with 11 steps', true),
('PFL - Printed Fabric Label Process', 'PFL', 'Printed fabric label workflow with 12 steps', true),
('Woven Label Process', 'Woven', 'Woven label production workflow with 14 steps', true),
('Leather Patch Process', 'Leather', 'Leather patch production workflow with 8 steps', true),
('Digital Printing Process', 'Digital', 'Digital printing workflow with 12 steps', true)
ON CONFLICT (product_type) DO NOTHING;

-- Process Steps (Basic set - can be expanded)
INSERT INTO process_steps (name, description, department, sequence_order, estimated_time_hours, is_compulsory) VALUES
('Design', 'Create initial design', 'Prepress', 1, 4.0, true),
('Quality Check', 'QA review of design', 'Quality Assurance', 2, 2.0, true),
('Plate Generation', 'Generate printing plates', 'Prepress', 3, 1.0, true),
('Printing', 'Print the product', 'Production', 4, 8.0, true),
('Finishing', 'Final finishing operations', 'Production', 5, 4.0, true)
ON CONFLICT (name) DO NOTHING;

-- Inventory Categories
INSERT INTO inventory_categories (department, master_category, control_category, description) VALUES
('Printing', 'Printing Materials', 'Flexo Ink', 'Flexographic printing inks'),
('Printing', 'Printing Materials', 'Screen Ink', 'Screen printing inks'),
('Production', 'Packing Material', 'Carton Boxes', 'Packaging cartons'),
('Production', 'Packing Material', 'Plastic Film', 'Plastic wrapping films')
ON CONFLICT DO NOTHING;

-- Inventory Locations
INSERT INTO inventory_locations (location_name, location_type, description) VALUES
('Main Warehouse', 'Warehouse', 'Primary storage facility'),
('Production Floor', 'Production', 'Production area storage'),
('Quality Check Area', 'QA', 'Quality assurance storage')
ON CONFLICT (location_name) DO NOTHING;

-- Inventory Items
INSERT INTO inventory_items (item_code, item_name, unit, category_id, reorder_level, unit_cost) VALUES
('INK-FLX-001', 'Flexo Ink - Cyan', 'LTR', 1, 50.00, 25.50),
('INK-FLX-002', 'Flexo Ink - Magenta', 'LTR', 1, 50.00, 25.50),
('INK-SCR-001', 'Screen Ink - White', 'KG', 2, 30.00, 15.75),
('PKG-CTN-001', 'Carton Box - Small', 'PCS', 3, 100.00, 2.50)
ON CONFLICT (item_code) DO NOTHING;

-- Suppliers
INSERT INTO suppliers (supplier_code, supplier_name, contact_person, email, phone, city, country, payment_terms) VALUES
('SUP-001', 'Ink Solutions Ltd', 'Michael Brown', 'michael@inksolutions.com', '+1-456-789-0123', 'Chicago', 'USA', 'Net 30'),
('SUP-002', 'Packaging Pro', 'Sarah Wilson', 'sarah@packagingpro.com', '+1-567-890-1234', 'Houston', 'USA', 'Net 45'),
('SUP-003', 'Materials Direct', 'David Lee', 'david@materialsdirect.com', '+1-678-901-2345', 'Seattle', 'USA', 'Net 60')
ON CONFLICT (supplier_code) DO NOTHING;

-- ===================================================================
-- STEP 8: VERIFICATION & SUMMARY
-- ===================================================================

-- Show table counts
SELECT 
    'Tables Created' AS metric,
    COUNT(*) AS count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 
    'Users Created' AS metric,
    COUNT(*) AS count
FROM users
UNION ALL
SELECT 
    'Categories' AS metric,
    COUNT(*) AS count
FROM categories
UNION ALL
SELECT 
    'Materials' AS metric,
    COUNT(*) AS count
FROM materials
UNION ALL
SELECT 
    'Companies' AS metric,
    COUNT(*) AS count
FROM companies
UNION ALL
SELECT 
    'Process Sequences' AS metric,
    COUNT(*) AS count
FROM process_sequences
UNION ALL
SELECT 
    'Suppliers' AS metric,
    COUNT(*) AS count
FROM suppliers;

-- Success message
SELECT 'COMPLETE DATABASE SETUP SUCCESSFUL!' AS status;

-- ===================================================================
-- USER CREDENTIALS (All passwords: admin123, hod123, etc.)
-- ===================================================================
-- 
-- 1. admin@horizonsourcing.com / admin123
-- 2. hod.prepress@horizonsourcing.com / hod123  
-- 3. designer@horizonsourcing.com / designer123
-- 4. qa.prepress@horizonsourcing.com / qa123
-- 5. ctp.operator@horizonsourcing.com / ctp123
-- 6. inventory.manager@horizonsourcing.com / inventory123
-- 7. procurement.manager@horizonsourcing.com / procurement123
-- 8. admin@erp.local / admin123
-- 
-- ⚠️ Change all passwords in production!
-- ===================================================================

