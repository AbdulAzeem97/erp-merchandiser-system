-- Simple Inventory Schema for Testing
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. INVENTORY CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS inventory_categories (
    category_id SERIAL PRIMARY KEY,
    department VARCHAR(100) NOT NULL,
    master_category VARCHAR(100) NOT NULL,
    control_category VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(department, master_category, control_category)
);

-- 2. INVENTORY LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS inventory_locations (
    location_id SERIAL PRIMARY KEY,
    location_name VARCHAR(100) NOT NULL UNIQUE,
    location_code VARCHAR(20) UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. INVENTORY ITEMS TABLE
CREATE TABLE IF NOT EXISTS inventory_items (
    item_id SERIAL PRIMARY KEY,
    item_code VARCHAR(50) NOT NULL UNIQUE,
    item_name VARCHAR(255) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    category_id INTEGER,
    reorder_level DECIMAL(12,2) DEFAULT 0,
    reorder_qty DECIMAL(12,2) DEFAULT 0,
    unit_cost DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint after table creation
ALTER TABLE inventory_items 
ADD CONSTRAINT fk_inventory_items_category 
FOREIGN KEY (category_id) REFERENCES inventory_categories(category_id);

-- 4. INVENTORY TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS inventory_transactions (
    txn_id SERIAL PRIMARY KEY,
    item_id INTEGER,
    location_id INTEGER,
    txn_type VARCHAR(20) NOT NULL CHECK (txn_type IN ('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'OPENING_BALANCE')),
    txn_date DATE NOT NULL,
    qty DECIMAL(12,2) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    ref_no VARCHAR(100),
    department VARCHAR(100),
    job_card_no VARCHAR(100),
    remarks TEXT,
    unit_cost DECIMAL(12,2) DEFAULT 0,
    total_value DECIMAL(15,2) DEFAULT 0,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints after table creation
ALTER TABLE inventory_transactions 
ADD CONSTRAINT fk_inventory_transactions_item 
FOREIGN KEY (item_id) REFERENCES inventory_items(item_id);

ALTER TABLE inventory_transactions 
ADD CONSTRAINT fk_inventory_transactions_location 
FOREIGN KEY (location_id) REFERENCES inventory_locations(location_id);

-- 5. INVENTORY BALANCES TABLE
CREATE TABLE IF NOT EXISTS inventory_balances (
    balance_id SERIAL PRIMARY KEY,
    item_id INTEGER,
    location_id INTEGER,
    opening_qty DECIMAL(12,2) DEFAULT 0,
    in_qty DECIMAL(12,2) DEFAULT 0,
    out_qty DECIMAL(12,2) DEFAULT 0,
    adjustment_qty DECIMAL(12,2) DEFAULT 0,
    balance_qty DECIMAL(12,2) DEFAULT 0,
    unit_cost DECIMAL(12,2) DEFAULT 0,
    total_value DECIMAL(15,2) DEFAULT 0,
    last_txn_date DATE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints and unique constraint after table creation
ALTER TABLE inventory_balances 
ADD CONSTRAINT fk_inventory_balances_item 
FOREIGN KEY (item_id) REFERENCES inventory_items(item_id) ON DELETE CASCADE;

ALTER TABLE inventory_balances 
ADD CONSTRAINT fk_inventory_balances_location 
FOREIGN KEY (location_id) REFERENCES inventory_locations(location_id) ON DELETE CASCADE;

ALTER TABLE inventory_balances 
ADD CONSTRAINT uk_inventory_balances_item_location 
UNIQUE (item_id, location_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_code ON inventory_items(item_code);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_txn_item ON inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_txn_date ON inventory_transactions(txn_date);
CREATE INDEX IF NOT EXISTS idx_inventory_balance_item ON inventory_balances(item_id);

-- Insert default data
INSERT INTO inventory_locations (location_name, location_code, description) VALUES
('Main Store', 'MAIN', 'Primary inventory storage location'),
('CTP Room', 'CTP', 'Computer-to-Plate equipment and materials'),
('Production Floor', 'PROD', 'Production area inventory'),
('Quality Control', 'QC', 'QC department inventory'),
('Finished Goods', 'FG', 'Completed products storage')
ON CONFLICT (location_name) DO NOTHING;

INSERT INTO inventory_categories (department, master_category, control_category, description) VALUES
('Printing', 'Printing', 'Flexo Ink', 'Flexographic printing inks'),
('Printing', 'Printing', 'Screen Ink', 'Screen printing inks'),
('Printing', 'Printing', 'Offset Ink', 'Offset printing inks'),
('Printing', 'Printing', 'Digital Ink', 'Digital printing inks'),
('Production', 'Packing Material', 'Boxes', 'Various types of boxes'),
('Production', 'Packing Material', 'Bags', 'Various types of bags'),
('Production', 'Packing Material', 'Labels', 'Product labels and stickers'),
('CTP', 'CTP Materials', 'Plates', 'Printing plates'),
('CTP', 'CTP Materials', 'Chemicals', 'CTP processing chemicals'),
('Production', 'Raw Materials', 'Paper', 'Various paper types'),
('Production', 'Raw Materials', 'Board', 'Cardboard and board materials')
ON CONFLICT (department, master_category, control_category) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Simple Inventory Schema created successfully!';
END $$;
