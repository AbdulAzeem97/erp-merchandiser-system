-- ERP Merchandiser System Database Schema (PostgreSQL)
-- Complete production-ready schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users and Authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companies/Clients
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Materials
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(100) NOT NULL,
    gsm_range VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Master
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_item_code VARCHAR(100) UNIQUE NOT NULL,
    brand VARCHAR(255) NOT NULL,
    material_id UUID REFERENCES materials(id),
    gsm INTEGER NOT NULL,
    product_type VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES product_categories(id),
    fsc VARCHAR(50),
    fsc_claim VARCHAR(255),
    color_specifications TEXT,
    remarks TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job Cards
CREATE TABLE IF NOT EXISTS job_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_card_id VARCHAR(100) UNIQUE NOT NULL,
    product_id UUID REFERENCES products(id),
    company_id UUID REFERENCES companies(id),
    po_number VARCHAR(100),
    quantity INTEGER NOT NULL,
    delivery_date DATE NOT NULL,
    target_date DATE,
    customer_notes TEXT,
    special_instructions TEXT,
    priority VARCHAR(20) DEFAULT 'Medium',
    status VARCHAR(50) DEFAULT 'Pending',
    progress INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job Attachments
CREATE TABLE IF NOT EXISTS job_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_card_id UUID REFERENCES job_cards(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Process Sequences
CREATE TABLE IF NOT EXISTS process_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_type VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Process Steps
CREATE TABLE IF NOT EXISTS process_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    process_sequence_id UUID REFERENCES process_sequences(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_compulsory BOOLEAN DEFAULT false,
    step_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Process Selections (stores which process steps are selected for each product)
CREATE TABLE IF NOT EXISTS product_process_selections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    process_step_id UUID REFERENCES process_steps(id) ON DELETE CASCADE,
    is_selected BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, process_step_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_job_cards_status ON job_cards(status);
CREATE INDEX IF NOT EXISTS idx_job_cards_priority ON job_cards(priority);
CREATE INDEX IF NOT EXISTS idx_job_cards_delivery_date ON job_cards(delivery_date);
CREATE INDEX IF NOT EXISTS idx_job_cards_created_at ON job_cards(created_at);
CREATE INDEX IF NOT EXISTS idx_product_process_selections_product_id ON product_process_selections(product_id);
CREATE INDEX IF NOT EXISTS idx_product_process_selections_process_step_id ON product_process_selections(process_step_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (drop and recreate to avoid conflicts)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_job_cards_updated_at ON job_cards;
DROP TRIGGER IF EXISTS update_product_process_selections_updated_at ON product_process_selections;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_cards_updated_at BEFORE UPDATE ON job_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_process_selections_updated_at BEFORE UPDATE ON product_process_selections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
