import { Pool } from 'pg';
import fs from 'fs';

console.log('🔧 Creating complete PostgreSQL schema...');

const pool = new Pool({
  user: process.env.PG_USER || 'erp_user',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DATABASE || 'erp_merchandiser',
  password: process.env.PG_PASSWORD || 'secure_password_123',
  port: process.env.PG_PORT || 5432,
});

const completeSchema = `
-- Drop existing tables if they exist
DROP TABLE IF EXISTS job_lifecycle_history CASCADE;
DROP TABLE IF EXISTS job_lifecycle CASCADE;
DROP TABLE IF EXISTS prepress_jobs CASCADE;
DROP TABLE IF EXISTS job_cards CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS process_sequences CASCADE;
DROP TABLE IF EXISTS process_steps CASCADE;
DROP TABLE IF EXISTS product_process_selections CASCADE;
DROP TABLE IF EXISTS production_departments CASCADE;
DROP TABLE IF EXISTS production_processes CASCADE;
DROP TABLE IF EXISTS production_job_assignments CASCADE;
DROP TABLE IF EXISTS production_job_status_history CASCADE;
DROP TABLE IF EXISTS production_quality_checks CASCADE;
DROP TABLE IF EXISTS inventory_materials CASCADE;

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'HOD_PREPRESS', 'DESIGNER', 'MERCHANDISER', 'INVENTORY_MANAGER', 'PRODUCTION_MANAGER', 'QUALITY_CONTROLLER')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create product categories table
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create materials table
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    gsm_range VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_item_code VARCHAR(50) UNIQUE NOT NULL,
    brand VARCHAR(100) NOT NULL,
    product_type VARCHAR(50) NOT NULL,
    material_id UUID REFERENCES materials(id),
    category_id UUID REFERENCES product_categories(id),
    description TEXT,
    specifications JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create job cards table
CREATE TABLE job_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_id VARCHAR(50) UNIQUE NOT NULL,
    company_id UUID REFERENCES companies(id),
    product_id UUID REFERENCES products(id),
    po_number VARCHAR(50),
    quantity INTEGER NOT NULL,
    priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    delivery_date DATE,
    special_instructions TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create prepress jobs table
CREATE TABLE prepress_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_id VARCHAR(50) REFERENCES job_cards(job_card_id),
    assigned_designer_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED')),
    priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    design_requirements TEXT,
    artwork_files JSONB,
    feedback TEXT,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create job lifecycle table
CREATE TABLE job_lifecycle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_id VARCHAR(50) REFERENCES job_cards(job_card_id),
    prepress_job_id UUID REFERENCES prepress_jobs(id),
    current_stage VARCHAR(50) DEFAULT 'CREATED',
    status VARCHAR(20) DEFAULT 'PENDING',
    assigned_to UUID REFERENCES users(id),
    estimated_completion_date TIMESTAMP,
    actual_completion_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create job lifecycle history table
CREATE TABLE job_lifecycle_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_lifecycle_id UUID REFERENCES job_lifecycle(id),
    stage_from VARCHAR(50),
    stage_to VARCHAR(50),
    status_from VARCHAR(20),
    status_to VARCHAR(20),
    changed_by UUID REFERENCES users(id),
    change_reason TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create process sequences table
CREATE TABLE process_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_type VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create process steps table
CREATE TABLE process_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_sequence_id UUID REFERENCES process_sequences(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_compulsory BOOLEAN DEFAULT false,
    step_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create product process selections table
CREATE TABLE product_process_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    process_step_id UUID REFERENCES process_steps(id),
    is_selected BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create production departments table
CREATE TABLE production_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    head_user_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create production processes table
CREATE TABLE production_processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    department_id UUID REFERENCES production_departments(id),
    estimated_duration_hours INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create production job assignments table
CREATE TABLE production_job_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_id VARCHAR(50) REFERENCES job_cards(job_card_id),
    department_id UUID REFERENCES production_departments(id),
    process_id UUID REFERENCES production_processes(id),
    assigned_by UUID REFERENCES users(id),
    assigned_to_user_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'REWORK')),
    priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    estimated_completion_date TIMESTAMP,
    actual_completion_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create production job status history table
CREATE TABLE production_job_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_assignment_id UUID REFERENCES production_job_assignments(id),
    status_from VARCHAR(20),
    status_to VARCHAR(20),
    remarks TEXT,
    attachments JSONB,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create production quality checks table
CREATE TABLE production_quality_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_assignment_id UUID REFERENCES production_job_assignments(id),
    checked_by UUID REFERENCES users(id),
    quality_status VARCHAR(20) NOT NULL CHECK (quality_status IN ('PASSED', 'FAILED', 'REWORK', 'REJECTED')),
    quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
    defects_found JSONB,
    remarks TEXT,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create inventory materials table
CREATE TABLE inventory_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID REFERENCES materials(id),
    quantity_in_stock INTEGER DEFAULT 0,
    minimum_stock_level INTEGER DEFAULT 0,
    maximum_stock_level INTEGER DEFAULT 0,
    unit_cost DECIMAL(10,2),
    supplier VARCHAR(100),
    last_restocked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_job_cards_company_id ON job_cards(company_id);
CREATE INDEX idx_job_cards_product_id ON job_cards(product_id);
CREATE INDEX idx_job_cards_status ON job_cards(status);
CREATE INDEX idx_prepress_jobs_job_card_id ON prepress_jobs(job_card_id);
CREATE INDEX idx_prepress_jobs_assigned_designer_id ON prepress_jobs(assigned_designer_id);
CREATE INDEX idx_job_lifecycle_job_card_id ON job_lifecycle(job_card_id);
CREATE INDEX idx_job_lifecycle_current_stage ON job_lifecycle(current_stage);
CREATE INDEX idx_products_product_item_code ON products(product_item_code);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
`;

try {
  console.log('🗑️ Dropping existing tables...');
  await pool.query(completeSchema);
  console.log('✅ Complete PostgreSQL schema created successfully');
  
  // Test the schema
  const result = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);
  
  console.log('📋 Created tables:');
  result.rows.forEach(row => {
    console.log(`  - ${row.table_name}`);
  });
  
} catch (error) {
  console.error('❌ Error creating schema:', error.message);
} finally {
  await pool.end();
}
