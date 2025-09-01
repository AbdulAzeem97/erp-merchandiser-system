-- ERP Merchandiser System Database Schema (SQLite)
-- Simplified for development

-- Users and Authentication
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Companies/Clients
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    country TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Materials
CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    gsm_range TEXT,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Products Master
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    product_item_code TEXT UNIQUE NOT NULL,
    brand TEXT NOT NULL,
    material_id TEXT,
    gsm INTEGER NOT NULL,
    product_type TEXT NOT NULL,
    category_id TEXT,
    fsc TEXT,
    fsc_claim TEXT,
    color_specifications TEXT,
    remarks TEXT,
    is_active INTEGER DEFAULT 1,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES materials(id),
    FOREIGN KEY (category_id) REFERENCES product_categories(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Job Cards
CREATE TABLE IF NOT EXISTS job_cards (
    id TEXT PRIMARY KEY,
    job_card_id TEXT UNIQUE NOT NULL,
    product_id TEXT,
    company_id TEXT,
    po_number TEXT,
    quantity INTEGER NOT NULL,
    delivery_date TEXT NOT NULL,
    target_date TEXT,
    customer_notes TEXT,
    special_instructions TEXT,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'Pending',
    progress INTEGER DEFAULT 0,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Job Attachments
CREATE TABLE IF NOT EXISTS job_attachments (
    id TEXT PRIMARY KEY,
    job_card_id TEXT,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT,
    uploaded_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Process Sequences
CREATE TABLE IF NOT EXISTS process_sequences (
    id TEXT PRIMARY KEY,
    product_type TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Process Steps
CREATE TABLE IF NOT EXISTS process_steps (
    id TEXT PRIMARY KEY,
    process_sequence_id TEXT,
    name TEXT NOT NULL,
    is_compulsory INTEGER DEFAULT 0,
    step_order INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (process_sequence_id) REFERENCES process_sequences(id) ON DELETE CASCADE
);

-- Product Process Selections (stores which process steps are selected for each product)
CREATE TABLE IF NOT EXISTS product_process_selections (
    id TEXT PRIMARY KEY,
    product_id TEXT,
    process_step_id TEXT,
    is_selected INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (process_step_id) REFERENCES process_steps(id) ON DELETE CASCADE,
    UNIQUE(product_id, process_step_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_job_cards_status ON job_cards(status);
CREATE INDEX IF NOT EXISTS idx_job_cards_company ON job_cards(company_id);
CREATE INDEX IF NOT EXISTS idx_job_cards_delivery_date ON job_cards(delivery_date);
CREATE INDEX IF NOT EXISTS idx_product_process_selections_product_id ON product_process_selections(product_id);
CREATE INDEX IF NOT EXISTS idx_product_process_selections_process_step_id ON product_process_selections(process_step_id);
