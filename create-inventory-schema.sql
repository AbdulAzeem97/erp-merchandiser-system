-- =====================================================
-- INVENTORY MANAGEMENT SYSTEM - COMPLETE SCHEMA
-- Normalized, ERP-Compatible Database Design
-- =====================================================

-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. INVENTORY CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_categories (
    category_id SERIAL PRIMARY KEY,
    department VARCHAR(100) NOT NULL,
    master_category VARCHAR(100) NOT NULL,
    control_category VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique combination of department, master, and control category
    UNIQUE(department, master_category, control_category)
);

-- =====================================================
-- 2. INVENTORY LOCATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_locations (
    location_id SERIAL PRIMARY KEY,
    location_name VARCHAR(100) NOT NULL UNIQUE,
    location_code VARCHAR(20) UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. INVENTORY ITEMS TABLE (Master Data)
-- =====================================================
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes will be created separately
);

-- =====================================================
-- 4. ITEM LOCATION MAPPING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS item_location_mapping (
    mapping_id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES inventory_items(item_id) ON DELETE CASCADE,
    location_id INTEGER REFERENCES inventory_locations(location_id) ON DELETE CASCADE,
    balance_qty DECIMAL(12,2) DEFAULT 0,
    min_stock_level DECIMAL(12,2) DEFAULT 0,
    max_stock_level DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique item-location combination
    UNIQUE(item_id, location_id)
);

-- =====================================================
-- 5. INVENTORY TRANSACTIONS TABLE (Movement Log)
-- =====================================================
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'OPENING_BALANCE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS inventory_transactions (
    txn_id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES inventory_items(item_id),
    location_id INTEGER REFERENCES inventory_locations(location_id),
    txn_type transaction_type NOT NULL,
    txn_date DATE NOT NULL,
    qty DECIMAL(12,2) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    ref_no VARCHAR(100),
    department VARCHAR(100),
    job_card_no VARCHAR(100), -- Link to production jobs
    remarks TEXT,
    unit_cost DECIMAL(12,2) DEFAULT 0,
    total_value DECIMAL(15,2) DEFAULT 0,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. INVENTORY BALANCES TABLE (Fast Access)
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_balances (
    balance_id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES inventory_items(item_id) ON DELETE CASCADE,
    location_id INTEGER REFERENCES inventory_locations(location_id) ON DELETE CASCADE,
    opening_qty DECIMAL(12,2) DEFAULT 0,
    in_qty DECIMAL(12,2) DEFAULT 0,
    out_qty DECIMAL(12,2) DEFAULT 0,
    adjustment_qty DECIMAL(12,2) DEFAULT 0,
    balance_qty DECIMAL(12,2) DEFAULT 0,
    unit_cost DECIMAL(12,2) DEFAULT 0,
    total_value DECIMAL(15,2) DEFAULT 0,
    last_txn_date DATE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique item-location combination
    UNIQUE(item_id, location_id)
);

-- =====================================================
-- 7. INVENTORY REPORTS CONFIGURATION
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_report_config (
    config_id SERIAL PRIMARY KEY,
    report_name VARCHAR(100) NOT NULL,
    report_type VARCHAR(50) NOT NULL, -- 'ITEM_WISE', 'CATEGORY_WISE', 'MOVEMENT', etc.
    config_data JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 8. AUDIT LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_audit_log (
    audit_id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 9. CREATE TRIGGERS FOR AUTO-UPDATES
-- =====================================================

-- Function to update inventory balances
CREATE OR REPLACE FUNCTION update_inventory_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        INSERT INTO inventory_balances (item_id, location_id, balance_qty, last_txn_date, last_updated)
        VALUES (NEW.item_id, NEW.location_id, 
                CASE 
                    WHEN NEW.txn_type = 'IN' THEN NEW.qty
                    WHEN NEW.txn_type = 'OUT' THEN -NEW.qty
                    WHEN NEW.txn_type = 'ADJUSTMENT' THEN NEW.qty
                    ELSE 0
                END,
                NEW.txn_date, CURRENT_TIMESTAMP)
        ON CONFLICT (item_id, location_id)
        DO UPDATE SET
            balance_qty = inventory_balances.balance_qty + 
                CASE 
                    WHEN NEW.txn_type = 'IN' THEN NEW.qty
                    WHEN NEW.txn_type = 'OUT' THEN -NEW.qty
                    WHEN NEW.txn_type = 'ADJUSTMENT' THEN NEW.qty
                    ELSE 0
                END,
            in_qty = CASE WHEN NEW.txn_type = 'IN' THEN inventory_balances.in_qty + NEW.qty ELSE inventory_balances.in_qty END,
            out_qty = CASE WHEN NEW.txn_type = 'OUT' THEN inventory_balances.out_qty + NEW.qty ELSE inventory_balances.out_qty END,
            adjustment_qty = CASE WHEN NEW.txn_type = 'ADJUSTMENT' THEN inventory_balances.adjustment_qty + NEW.qty ELSE inventory_balances.adjustment_qty END,
            last_txn_date = NEW.txn_date,
            last_updated = CURRENT_TIMESTAMP;
    END IF;
    
    -- Handle UPDATE
    IF TG_OP = 'UPDATE' THEN
        -- Recalculate balance by subtracting old transaction and adding new
        UPDATE inventory_balances 
        SET balance_qty = balance_qty - 
            CASE 
                WHEN OLD.txn_type = 'IN' THEN OLD.qty
                WHEN OLD.txn_type = 'OUT' THEN -OLD.qty
                WHEN OLD.txn_type = 'ADJUSTMENT' THEN OLD.qty
                ELSE 0
            END +
            CASE 
                WHEN NEW.txn_type = 'IN' THEN NEW.qty
                WHEN NEW.txn_type = 'OUT' THEN -NEW.qty
                WHEN NEW.txn_type = 'ADJUSTMENT' THEN NEW.qty
                ELSE 0
            END,
            last_updated = CURRENT_TIMESTAMP
        WHERE item_id = NEW.item_id AND location_id = NEW.location_id;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        UPDATE inventory_balances 
        SET balance_qty = balance_qty - 
            CASE 
                WHEN OLD.txn_type = 'IN' THEN OLD.qty
                WHEN OLD.txn_type = 'OUT' THEN -OLD.qty
                WHEN OLD.txn_type = 'ADJUSTMENT' THEN OLD.qty
                ELSE 0
            END,
            last_updated = CURRENT_TIMESTAMP
        WHERE item_id = OLD.item_id AND location_id = OLD.location_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory_transactions
DROP TRIGGER IF EXISTS trigger_update_inventory_balance ON inventory_transactions;
CREATE TRIGGER trigger_update_inventory_balance
    AFTER INSERT OR UPDATE OR DELETE ON inventory_transactions
    FOR EACH ROW EXECUTE FUNCTION update_inventory_balance();

-- =====================================================
-- 10. CREATE VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for item-wise consolidated report
CREATE OR REPLACE VIEW v_item_wise_consolidated AS
SELECT 
    i.item_id,
    i.item_code,
    i.item_name,
    i.unit,
    c.department,
    c.master_category,
    c.control_category,
    l.location_name,
    COALESCE(ib.opening_qty, 0) as opening_qty,
    COALESCE(ib.in_qty, 0) as in_qty,
    COALESCE(ib.out_qty, 0) as out_qty,
    COALESCE(ib.balance_qty, 0) as balance_qty,
    COALESCE(ib.unit_cost, 0) as unit_cost,
    COALESCE(ib.total_value, 0) as total_value,
    ib.last_txn_date,
    ib.last_updated
FROM inventory_items i
LEFT JOIN inventory_categories c ON i.category_id = c.category_id
LEFT JOIN inventory_balances ib ON i.item_id = ib.item_id
LEFT JOIN inventory_locations l ON ib.location_id = l.location_id
WHERE i.is_active = TRUE;

-- View for category-wise summary
CREATE OR REPLACE VIEW v_category_wise_summary AS
SELECT 
    c.department,
    c.master_category,
    c.control_category,
    COUNT(DISTINCT i.item_id) as total_items,
    SUM(COALESCE(ib.opening_qty, 0)) as total_opening,
    SUM(COALESCE(ib.in_qty, 0)) as total_in,
    SUM(COALESCE(ib.out_qty, 0)) as total_out,
    SUM(COALESCE(ib.balance_qty, 0)) as total_balance,
    SUM(COALESCE(ib.total_value, 0)) as total_value
FROM inventory_categories c
LEFT JOIN inventory_items i ON c.category_id = i.category_id AND i.is_active = TRUE
LEFT JOIN inventory_balances ib ON i.item_id = ib.item_id
GROUP BY c.department, c.master_category, c.control_category, c.category_id
ORDER BY c.department, c.master_category, c.control_category;

-- View for reorder alerts
CREATE OR REPLACE VIEW v_reorder_alerts AS
SELECT 
    i.item_id,
    i.item_code,
    i.item_name,
    i.unit,
    c.department,
    c.master_category,
    c.control_category,
    COALESCE(ib.balance_qty, 0) as current_stock,
    i.reorder_level,
    i.reorder_qty,
    CASE 
        WHEN COALESCE(ib.balance_qty, 0) <= i.reorder_level THEN 'REORDER_REQUIRED'
        WHEN COALESCE(ib.balance_qty, 0) <= (i.reorder_level * 1.5) THEN 'LOW_STOCK'
        ELSE 'OK'
    END as stock_status
FROM inventory_items i
LEFT JOIN inventory_categories c ON i.category_id = c.category_id
LEFT JOIN inventory_balances ib ON i.item_id = ib.item_id
WHERE i.is_active = TRUE 
AND COALESCE(ib.balance_qty, 0) <= (i.reorder_level * 1.5);

-- =====================================================
-- 11. INSERT DEFAULT DATA
-- =====================================================

-- Insert default locations
INSERT INTO inventory_locations (location_name, location_code, description) VALUES
('Main Store', 'MAIN', 'Primary inventory storage location'),
('CTP Room', 'CTP', 'Computer-to-Plate equipment and materials'),
('Production Floor', 'PROD', 'Production area inventory'),
('Quality Control', 'QC', 'QC department inventory'),
('Finished Goods', 'FG', 'Completed products storage')
ON CONFLICT (location_name) DO NOTHING;

-- Insert default categories
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

-- =====================================================
-- 12. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Inventory items indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_code ON inventory_items(item_code);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_active ON inventory_items(is_active);

-- Item location mapping indexes
CREATE INDEX IF NOT EXISTS idx_item_location_item ON item_location_mapping(item_id);
CREATE INDEX IF NOT EXISTS idx_item_location_location ON item_location_mapping(location_id);

-- Inventory transactions indexes
CREATE INDEX IF NOT EXISTS idx_inventory_txn_item ON inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_txn_date ON inventory_transactions(txn_date);
CREATE INDEX IF NOT EXISTS idx_inventory_txn_type ON inventory_transactions(txn_type);
CREATE INDEX IF NOT EXISTS idx_inventory_txn_ref ON inventory_transactions(ref_no);
CREATE INDEX IF NOT EXISTS idx_inventory_txn_job ON inventory_transactions(job_card_no);
CREATE INDEX IF NOT EXISTS idx_inventory_txn_item_date ON inventory_transactions(item_id, txn_date);
CREATE INDEX IF NOT EXISTS idx_inventory_txn_type_date ON inventory_transactions(txn_type, txn_date);

-- Inventory balances indexes
CREATE INDEX IF NOT EXISTS idx_inventory_balance_item ON inventory_balances(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_balance_location ON inventory_balances(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_balance_qty ON inventory_balances(balance_qty);
CREATE INDEX IF NOT EXISTS idx_inventory_balance_qty_status ON inventory_balances(balance_qty) WHERE balance_qty > 0;

-- =====================================================
-- SCHEMA CREATION COMPLETE
-- =====================================================

-- Display success message
DO $$
BEGIN
    RAISE NOTICE '✅ Inventory Management Schema created successfully!';
    RAISE NOTICE '📊 Tables created: inventory_categories, inventory_locations, inventory_items, item_location_mapping, inventory_transactions, inventory_balances, inventory_report_config, inventory_audit_log';
    RAISE NOTICE '🔧 Triggers created: Auto-update inventory balances';
    RAISE NOTICE '📈 Views created: v_item_wise_consolidated, v_category_wise_summary, v_reorder_alerts';
    RAISE NOTICE '🏪 Default locations and categories inserted';
    RAISE NOTICE '⚡ Performance indexes created';
END $$;
