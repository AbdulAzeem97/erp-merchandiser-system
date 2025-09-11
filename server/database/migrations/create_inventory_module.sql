-- Inventory Module Database Schema
-- Comprehensive inventory management with material procurement and job-based issuance

-- Material Categories (for better organization)
CREATE TABLE IF NOT EXISTS material_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    code TEXT UNIQUE,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced Materials table with inventory specifics
CREATE TABLE IF NOT EXISTS inventory_materials (
    id TEXT PRIMARY KEY,
    material_id TEXT NOT NULL,
    category_id TEXT,
    unit_of_measurement TEXT NOT NULL, -- 'sheets', 'kg', 'rolls', 'pcs'
    unit_cost DECIMAL(10,2) DEFAULT 0.00,
    minimum_stock_level INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 0,
    maximum_stock_level INTEGER NOT NULL DEFAULT 1000,
    lead_time_days INTEGER DEFAULT 7,
    supplier_code TEXT,
    storage_location TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES material_categories(id)
);

-- Stock Levels and Inventory
CREATE TABLE IF NOT EXISTS inventory_stock (
    id TEXT PRIMARY KEY,
    inventory_material_id TEXT NOT NULL,
    current_stock INTEGER NOT NULL DEFAULT 0,
    reserved_stock INTEGER NOT NULL DEFAULT 0, -- Stock allocated to jobs
    available_stock INTEGER GENERATED ALWAYS AS (current_stock - reserved_stock) STORED,
    last_stock_update DATETIME DEFAULT CURRENT_TIMESTAMP,
    stock_value DECIMAL(12,2) DEFAULT 0.00,
    location TEXT,
    batch_number TEXT,
    expiry_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_material_id) REFERENCES inventory_materials(id) ON DELETE CASCADE
);

-- Stock Movement History
CREATE TABLE IF NOT EXISTS stock_movements (
    id TEXT PRIMARY KEY,
    inventory_stock_id TEXT NOT NULL,
    movement_type TEXT NOT NULL, -- 'IN', 'OUT', 'ADJUSTMENT', 'RESERVATION', 'RELEASE'
    quantity INTEGER NOT NULL,
    reference_type TEXT, -- 'PURCHASE', 'JOB', 'ADJUSTMENT', 'RETURN'
    reference_id TEXT, -- PO number, Job ID, etc.
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(12,2),
    reason TEXT,
    performed_by TEXT NOT NULL,
    performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (inventory_stock_id) REFERENCES inventory_stock(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id)
);

-- Job Material Requirements
CREATE TABLE IF NOT EXISTS job_material_requirements (
    id TEXT PRIMARY KEY,
    job_card_id TEXT NOT NULL,
    inventory_material_id TEXT NOT NULL,
    required_quantity INTEGER NOT NULL,
    allocated_quantity INTEGER DEFAULT 0,
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'PARTIALLY_ALLOCATED', 'FULLY_ALLOCATED', 'INSUFFICIENT_STOCK'
    priority INTEGER DEFAULT 5, -- 1-10 scale
    special_requirements TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_material_id) REFERENCES inventory_materials(id)
);

-- Job Material Allocations
CREATE TABLE IF NOT EXISTS job_material_allocations (
    id TEXT PRIMARY KEY,
    job_material_requirement_id TEXT NOT NULL,
    inventory_stock_id TEXT NOT NULL,
    allocated_quantity INTEGER NOT NULL,
    allocation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    allocated_by TEXT NOT NULL,
    status TEXT DEFAULT 'ALLOCATED', -- 'ALLOCATED', 'ISSUED', 'RETURNED'
    notes TEXT,
    FOREIGN KEY (job_material_requirement_id) REFERENCES job_material_requirements(id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_stock_id) REFERENCES inventory_stock(id),
    FOREIGN KEY (allocated_by) REFERENCES users(id)
);

-- Job Acceptance/Approval by Inventory Head
CREATE TABLE IF NOT EXISTS inventory_job_approvals (
    id TEXT PRIMARY KEY,
    job_card_id TEXT NOT NULL UNIQUE,
    requested_by TEXT,
    reviewed_by TEXT,
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'PENDING_PROCUREMENT'
    approval_date DATETIME,
    approval_percentage DECIMAL(5,2) DEFAULT 0.00, -- For partial approvals (50%, 75%, etc.)
    special_approval_reason TEXT, -- For cases like 50% stock forward
    procurement_required INTEGER DEFAULT 0,
    estimated_fulfillment_date DATE,
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Purchase Requests
CREATE TABLE IF NOT EXISTS purchase_requests (
    id TEXT PRIMARY KEY,
    request_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED'
    priority TEXT DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'URGENT'
    requested_by TEXT NOT NULL,
    approved_by TEXT,
    total_estimated_cost DECIMAL(12,2) DEFAULT 0.00,
    supplier TEXT,
    expected_delivery_date DATE,
    request_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requested_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Purchase Request Items
CREATE TABLE IF NOT EXISTS purchase_request_items (
    id TEXT PRIMARY KEY,
    purchase_request_id TEXT NOT NULL,
    inventory_material_id TEXT NOT NULL,
    requested_quantity INTEGER NOT NULL,
    estimated_unit_cost DECIMAL(10,2),
    estimated_total_cost DECIMAL(12,2),
    reason TEXT,
    job_card_ids TEXT, -- JSON array of related job IDs
    FOREIGN KEY (purchase_request_id) REFERENCES purchase_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_material_id) REFERENCES inventory_materials(id)
);

-- Suppliers Management
CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    payment_terms TEXT,
    lead_time_days INTEGER DEFAULT 7,
    rating DECIMAL(3,2) DEFAULT 0.00, -- Out of 5
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Stock Alerts/Notifications
CREATE TABLE IF NOT EXISTS stock_alerts (
    id TEXT PRIMARY KEY,
    inventory_material_id TEXT NOT NULL,
    alert_type TEXT NOT NULL, -- 'LOW_STOCK', 'REORDER_POINT', 'OVERSTOCK', 'EXPIRY_WARNING'
    current_level INTEGER,
    threshold_level INTEGER,
    status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'
    acknowledged_by TEXT,
    acknowledged_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_material_id) REFERENCES inventory_materials(id) ON DELETE CASCADE,
    FOREIGN KEY (acknowledged_by) REFERENCES users(id)
);

-- Inventory Transactions Log
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id TEXT PRIMARY KEY,
    transaction_type TEXT NOT NULL, -- 'JOB_ACCEPTANCE', 'STOCK_ISSUE', 'PURCHASE_RECEIVED', 'STOCK_ADJUSTMENT'
    reference_id TEXT, -- Job ID, Purchase Request ID, etc.
    performed_by TEXT NOT NULL,
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    metadata TEXT, -- JSON data for additional transaction details
    FOREIGN KEY (performed_by) REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_materials_material_id ON inventory_materials(material_id);
CREATE INDEX IF NOT EXISTS idx_inventory_materials_category ON inventory_materials(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_material_id ON inventory_stock(inventory_material_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_available ON inventory_stock(available_stock);
CREATE INDEX IF NOT EXISTS idx_stock_movements_stock_id ON stock_movements(inventory_stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(performed_at);
CREATE INDEX IF NOT EXISTS idx_job_material_req_job_id ON job_material_requirements(job_card_id);
CREATE INDEX IF NOT EXISTS idx_job_material_req_status ON job_material_requirements(status);
CREATE INDEX IF NOT EXISTS idx_job_approvals_status ON inventory_job_approvals(status);
CREATE INDEX IF NOT EXISTS idx_job_approvals_job_id ON inventory_job_approvals(job_card_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_type ON stock_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_status ON stock_alerts(status);

-- Insert default material categories
INSERT OR IGNORE INTO material_categories (id, name, description, code) VALUES
    ('mat_cat_paper', 'Paper Materials', 'All types of paper materials', 'PAPER'),
    ('mat_cat_ink', 'Inks & Colors', 'Printing inks and color materials', 'INK'),
    ('mat_cat_adhesive', 'Adhesives', 'Glues and binding materials', 'ADHESIVE'),
    ('mat_cat_packaging', 'Packaging', 'Packaging and wrapping materials', 'PACK'),
    ('mat_cat_finishing', 'Finishing Materials', 'Coating, lamination, and finishing supplies', 'FINISH');