-- =====================================================
-- PROCUREMENT MANAGEMENT SYSTEM - COMPLETE SCHEMA
-- ERP-Compatible Database Design
-- =====================================================

-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. SUPPLIERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id SERIAL PRIMARY KEY,
    supplier_code VARCHAR(50) NOT NULL UNIQUE,
    supplier_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    tax_id VARCHAR(100),
    payment_terms VARCHAR(100),
    credit_limit DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. SUPPLIER ITEMS TABLE (What suppliers can provide)
-- =====================================================
CREATE TABLE IF NOT EXISTS supplier_items (
    supplier_item_id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES inventory_items(item_id) ON DELETE CASCADE,
    supplier_item_code VARCHAR(100),
    supplier_item_name VARCHAR(255),
    unit_price DECIMAL(12,2) NOT NULL,
    minimum_order_qty DECIMAL(12,2) DEFAULT 1,
    lead_time_days INTEGER DEFAULT 0,
    is_preferred BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(supplier_id, item_id)
);

-- =====================================================
-- 3. PURCHASE REQUISITIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_requisitions (
    requisition_id SERIAL PRIMARY KEY,
    requisition_number VARCHAR(50) NOT NULL UNIQUE,
    requested_by VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    requisition_date DATE NOT NULL,
    required_date DATE,
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED')),
    total_estimated_cost DECIMAL(15,2) DEFAULT 0,
    justification TEXT,
    approved_by VARCHAR(100),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. PURCHASE REQUISITION ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_requisition_items (
    requisition_item_id SERIAL PRIMARY KEY,
    requisition_id INTEGER REFERENCES purchase_requisitions(requisition_id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES inventory_items(item_id),
    quantity DECIMAL(12,2) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    estimated_unit_price DECIMAL(12,2),
    estimated_total_price DECIMAL(15,2),
    specifications TEXT,
    required_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. PURCHASE ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
    po_id SERIAL PRIMARY KEY,
    po_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id INTEGER REFERENCES suppliers(supplier_id),
    requisition_id INTEGER REFERENCES purchase_requisitions(requisition_id),
    po_date DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'ACKNOWLEDGED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED', 'CLOSED')),
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    payment_terms VARCHAR(100),
    shipping_address TEXT,
    billing_address TEXT,
    notes TEXT,
    created_by VARCHAR(100),
    approved_by VARCHAR(100),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. PURCHASE ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_order_items (
    po_item_id SERIAL PRIMARY KEY,
    po_id INTEGER REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES inventory_items(item_id),
    quantity_ordered DECIMAL(12,2) NOT NULL,
    quantity_received DECIMAL(12,2) DEFAULT 0,
    unit VARCHAR(10) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    specifications TEXT,
    expected_delivery_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 7. GOODS RECEIPT NOTES (GRN) TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS goods_receipt_notes (
    grn_id SERIAL PRIMARY KEY,
    grn_number VARCHAR(50) NOT NULL UNIQUE,
    po_id INTEGER REFERENCES purchase_orders(po_id),
    supplier_id INTEGER REFERENCES suppliers(supplier_id),
    grn_date DATE NOT NULL,
    received_by VARCHAR(100) NOT NULL,
    location_id INTEGER REFERENCES inventory_locations(location_id),
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'RECEIVED', 'INSPECTED', 'ACCEPTED', 'REJECTED')),
    total_items INTEGER DEFAULT 0,
    total_quantity DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 8. GRN ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS grn_items (
    grn_item_id SERIAL PRIMARY KEY,
    grn_id INTEGER REFERENCES goods_receipt_notes(grn_id) ON DELETE CASCADE,
    po_item_id INTEGER REFERENCES purchase_order_items(po_item_id),
    item_id INTEGER REFERENCES inventory_items(item_id),
    quantity_received DECIMAL(12,2) NOT NULL,
    quantity_accepted DECIMAL(12,2) DEFAULT 0,
    quantity_rejected DECIMAL(12,2) DEFAULT 0,
    unit VARCHAR(10) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    batch_number VARCHAR(100),
    expiry_date DATE,
    quality_status VARCHAR(20) DEFAULT 'PENDING' CHECK (quality_status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CONDITIONAL')),
    inspection_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 9. INVOICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
    invoice_id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    supplier_id INTEGER REFERENCES suppliers(supplier_id),
    po_id INTEGER REFERENCES purchase_orders(po_id),
    grn_id INTEGER REFERENCES goods_receipt_notes(grn_id),
    invoice_date DATE NOT NULL,
    due_date DATE,
    subtotal DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'APPROVED', 'PAID', 'DISPUTED', 'CANCELLED')),
    payment_terms VARCHAR(100),
    payment_method VARCHAR(50),
    paid_date DATE,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 10. PROCUREMENT REPORTS CONFIGURATION
-- =====================================================
CREATE TABLE IF NOT EXISTS procurement_report_config (
    config_id SERIAL PRIMARY KEY,
    report_name VARCHAR(100) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    config_data JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 11. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Suppliers indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(supplier_code);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(supplier_name);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);

-- Supplier items indexes
CREATE INDEX IF NOT EXISTS idx_supplier_items_supplier ON supplier_items(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_items_item ON supplier_items(item_id);
CREATE INDEX IF NOT EXISTS idx_supplier_items_preferred ON supplier_items(is_preferred);

-- Purchase requisitions indexes
CREATE INDEX IF NOT EXISTS idx_purchase_req_number ON purchase_requisitions(requisition_number);
CREATE INDEX IF NOT EXISTS idx_purchase_req_status ON purchase_requisitions(status);
CREATE INDEX IF NOT EXISTS idx_purchase_req_date ON purchase_requisitions(requisition_date);
CREATE INDEX IF NOT EXISTS idx_purchase_req_department ON purchase_requisitions(department);

-- Purchase orders indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_number ON purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(po_date);

-- GRN indexes
CREATE INDEX IF NOT EXISTS idx_grn_number ON goods_receipt_notes(grn_number);
CREATE INDEX IF NOT EXISTS idx_grn_po ON goods_receipt_notes(po_id);
CREATE INDEX IF NOT EXISTS idx_grn_supplier ON goods_receipt_notes(supplier_id);
CREATE INDEX IF NOT EXISTS idx_grn_date ON goods_receipt_notes(grn_date);

-- Invoice indexes
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_supplier ON invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);

-- =====================================================
-- 12. INSERT DEFAULT DATA
-- =====================================================

-- Insert sample suppliers
INSERT INTO suppliers (supplier_code, supplier_name, contact_person, email, phone, address, city, state, country, payment_terms, credit_limit, currency) VALUES
('SUP-001', 'Printing Supplies Co.', 'John Smith', 'john@printingsupplies.com', '+1-555-0101', '123 Industrial Ave', 'New York', 'NY', 'USA', 'Net 30', 50000.00, 'USD'),
('SUP-002', 'Ink & Chemical Solutions', 'Sarah Johnson', 'sarah@inkchemicals.com', '+1-555-0102', '456 Chemical Blvd', 'Los Angeles', 'CA', 'USA', 'Net 15', 75000.00, 'USD'),
('SUP-003', 'Paper & Board Suppliers', 'Mike Wilson', 'mike@paperboard.com', '+1-555-0103', '789 Paper Street', 'Chicago', 'IL', 'USA', 'Net 30', 100000.00, 'USD'),
('SUP-004', 'CTP Equipment & Materials', 'Lisa Brown', 'lisa@ctpequipment.com', '+1-555-0104', '321 Technology Dr', 'Houston', 'TX', 'USA', 'Net 45', 25000.00, 'USD'),
('SUP-005', 'Packaging Solutions Inc.', 'David Lee', 'david@packagingsolutions.com', '+1-555-0105', '654 Packaging Way', 'Phoenix', 'AZ', 'USA', 'Net 30', 40000.00, 'USD')
ON CONFLICT (supplier_code) DO NOTHING;

-- =====================================================
-- SCHEMA CREATION COMPLETE
-- =====================================================

-- Display success message
DO $$
BEGIN
    RAISE NOTICE '✅ Procurement Management Schema created successfully!';
    RAISE NOTICE '📊 Tables created: suppliers, supplier_items, purchase_requisitions, purchase_requisition_items, purchase_orders, purchase_order_items, goods_receipt_notes, grn_items, invoices, procurement_report_config';
    RAISE NOTICE '🔧 Indexes created for performance optimization';
    RAISE NOTICE '🏢 Sample suppliers inserted';
END $$;
