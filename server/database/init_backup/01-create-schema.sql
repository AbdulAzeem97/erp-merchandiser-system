-- PostgreSQL Schema for ERP Merchandiser System
-- This script initializes the complete database schema
-- Compatible with existing schema using UUIDs

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Only create tables if they don't already exist
-- This ensures compatibility with existing database

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    country VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product categories table
CREATE TABLE IF NOT EXISTS product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Materials table
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    type VARCHAR(50),
    gsm_range VARCHAR(20),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES product_categories(id) ON DELETE SET NULL,
    material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL,
    description TEXT,
    specifications JSONB,
    dimensions JSONB,
    artwork_requirements JSONB,
    special_instructions TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Process steps table
CREATE TABLE IF NOT EXISTS process_steps (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    estimated_duration INTEGER, -- in minutes
    requires_approval BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Process sequences table
CREATE TABLE IF NOT EXISTS process_sequences (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    product_category_id INTEGER REFERENCES product_categories(id),
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Process sequence steps junction table
CREATE TABLE IF NOT EXISTS process_sequence_steps (
    id SERIAL PRIMARY KEY,
    sequence_id INTEGER REFERENCES process_sequences(id) ON DELETE CASCADE,
    step_id INTEGER REFERENCES process_steps(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    is_optional BOOLEAN DEFAULT FALSE,
    estimated_duration INTEGER, -- override for this sequence
    UNIQUE(sequence_id, step_order)
);

-- Job cards table
CREATE TABLE IF NOT EXISTS job_cards (
    id SERIAL PRIMARY KEY,
    job_number VARCHAR(50) UNIQUE NOT NULL,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    urgency VARCHAR(20) DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'critical')),
    due_date DATE,
    special_instructions TEXT,
    artwork_status VARCHAR(20) DEFAULT 'pending' CHECK (artwork_status IN ('pending', 'received', 'approved', 'rejected')),
    artwork_files JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'on_hold')),
    created_by INTEGER REFERENCES users(id),
    assigned_to INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job lifecycle tracking table
CREATE TABLE IF NOT EXISTS job_lifecycle (
    id SERIAL PRIMARY KEY,
    job_card_id INTEGER REFERENCES job_cards(id) ON DELETE CASCADE,
    process_step_id INTEGER REFERENCES process_steps(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'failed')),
    assigned_to INTEGER REFERENCES users(id),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    notes TEXT,
    attachments JSONB,
    quality_check JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory table for materials and supplies
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
    supplier VARCHAR(100),
    current_stock INTEGER DEFAULT 0,
    minimum_stock INTEGER DEFAULT 0,
    maximum_stock INTEGER,
    unit VARCHAR(20) DEFAULT 'pieces',
    unit_cost DECIMAL(10,2),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Inventory transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id SERIAL PRIMARY KEY,
    inventory_id INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('in', 'out', 'adjustment')),
    quantity INTEGER NOT NULL,
    reference_type VARCHAR(20), -- 'job_card', 'purchase', 'adjustment', etc.
    reference_id INTEGER,
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_job_cards_status ON job_cards(status);
CREATE INDEX IF NOT EXISTS idx_job_cards_company_id ON job_cards(company_id);
CREATE INDEX IF NOT EXISTS idx_job_cards_created_at ON job_cards(created_at);
CREATE INDEX IF NOT EXISTS idx_job_lifecycle_job_card_id ON job_lifecycle(job_card_id);
CREATE INDEX IF NOT EXISTS idx_job_lifecycle_status ON job_lifecycle(status);
CREATE INDEX IF NOT EXISTS idx_inventory_material_id ON inventory(material_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_cards_updated_at BEFORE UPDATE ON job_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_lifecycle_updated_at BEFORE UPDATE ON job_lifecycle FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();