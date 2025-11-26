-- Complete Schema Migration
-- This file combines all migrations (001-010) into one comprehensive migration
-- Can be run on fresh database or existing database safely (uses IF NOT EXISTS)
-- Version: 1.0.0
-- Date: 2025-01-26

-- ============================================================================
-- SECTION 1: Material Sizes Table
-- ============================================================================
-- Migration: 001_add_material_sizes.sql

CREATE TABLE IF NOT EXISTS material_sizes (
    id SERIAL PRIMARY KEY,
    inventory_material_id INTEGER,
    size_name TEXT NOT NULL,
    width_mm DECIMAL(10,2) NOT NULL,
    height_mm DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2),
    is_default INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(inventory_material_id, size_name)
);

-- Add foreign key constraint only if inventory_materials table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inventory_materials') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_material_sizes_inventory_material'
        ) THEN
            ALTER TABLE material_sizes 
            ADD CONSTRAINT fk_material_sizes_inventory_material 
            FOREIGN KEY (inventory_material_id) REFERENCES inventory_materials(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Update inventory_stock to link to specific size (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inventory_stock') THEN
        ALTER TABLE inventory_stock ADD COLUMN IF NOT EXISTS material_size_id INTEGER;
        IF EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_inventory_stock_material_size') THEN
            ALTER TABLE inventory_stock DROP CONSTRAINT fk_inventory_stock_material_size;
        END IF;
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_inventory_stock_material_size'
        ) THEN
            ALTER TABLE inventory_stock 
            ADD CONSTRAINT fk_inventory_stock_material_size 
            FOREIGN KEY (material_size_id) REFERENCES material_sizes(id);
        END IF;
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_material_sizes_material_id ON material_sizes(inventory_material_id);
CREATE INDEX IF NOT EXISTS idx_material_sizes_active ON material_sizes(is_active);
CREATE INDEX IF NOT EXISTS idx_material_sizes_default ON material_sizes(is_default);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_size_id ON inventory_stock(material_size_id);

-- ============================================================================
-- SECTION 2: Production Planning Table
-- ============================================================================
-- Migration: 002_add_production_planning_fields.sql

CREATE TABLE IF NOT EXISTS job_production_planning (
    id SERIAL PRIMARY KEY,
    job_card_id INTEGER NOT NULL UNIQUE,
    selected_material_size_id INTEGER,
    selected_sheet_size_id INTEGER,
    cutting_layout_type TEXT,
    grid_pattern TEXT,
    blanks_per_sheet INTEGER,
    efficiency_percentage DECIMAL(5,2),
    scrap_percentage DECIMAL(5,2),
    base_required_sheets INTEGER,
    additional_sheets INTEGER DEFAULT 0,
    final_total_sheets INTEGER,
    material_cost DECIMAL(12,2),
    wastage_justification TEXT,
    planning_status TEXT DEFAULT 'PENDING',
    planned_at TIMESTAMP,
    planned_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE CASCADE,
    FOREIGN KEY (selected_sheet_size_id) REFERENCES material_sizes(id),
    FOREIGN KEY (planned_by) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_production_planning_job_id ON job_production_planning(job_card_id);
CREATE INDEX IF NOT EXISTS idx_job_production_planning_status ON job_production_planning(planning_status);
CREATE INDEX IF NOT EXISTS idx_job_production_planning_sheet_size ON job_production_planning(selected_sheet_size_id);

-- ============================================================================
-- SECTION 3: Ratio Report Fields
-- ============================================================================
-- Migration: 003_add_ratio_report_fields.sql

ALTER TABLE job_production_planning 
ADD COLUMN IF NOT EXISTS ratio_report_sheets INTEGER;

ALTER TABLE job_production_planning 
ADD COLUMN IF NOT EXISTS from_ratio_report BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_job_production_planning_ratio_report 
ON job_production_planning(from_ratio_report);

-- ============================================================================
-- SECTION 4: Job Workflow Steps Table
-- ============================================================================
-- Migration: 003_add_job_workflow_steps.sql

CREATE TABLE IF NOT EXISTS job_workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id INTEGER NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  step_name VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  requires_qa BOOLEAN DEFAULT false,
  auto_action BOOLEAN DEFAULT false,
  status VARCHAR(50) NOT NULL DEFAULT 'inactive' CHECK (status IN (
    'inactive',
    'pending',
    'in_progress',
    'submitted',
    'qa_review',
    'revision_required',
    'approved',
    'completed'
  )),
  status_message TEXT,
  assigned_to INTEGER REFERENCES users(id),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(job_card_id, sequence_number)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_workflow_steps_job_card ON job_workflow_steps(job_card_id);
CREATE INDEX IF NOT EXISTS idx_job_workflow_steps_status ON job_workflow_steps(status);
CREATE INDEX IF NOT EXISTS idx_job_workflow_steps_department ON job_workflow_steps(department);
CREATE INDEX IF NOT EXISTS idx_job_workflow_steps_sequence ON job_workflow_steps(job_card_id, sequence_number);

-- Add workflow tracking columns to job_cards
ALTER TABLE job_cards
  ADD COLUMN IF NOT EXISTS current_step VARCHAR(255),
  ADD COLUMN IF NOT EXISTS current_department VARCHAR(100),
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(50) CHECK (workflow_status IN (
    'pending',
    'in_progress',
    'submitted',
    'qa_review',
    'approved',
    'rejected',
    'revision_required',
    'completed'
  )),
  ADD COLUMN IF NOT EXISTS status_message TEXT,
  ADD COLUMN IF NOT EXISTS last_updated_by INTEGER REFERENCES users(id);

-- Create index for workflow queries
CREATE INDEX IF NOT EXISTS idx_job_cards_workflow_status ON job_cards(workflow_status);
CREATE INDEX IF NOT EXISTS idx_job_cards_current_step ON job_cards(current_step);
CREATE INDEX IF NOT EXISTS idx_job_cards_current_department ON job_cards(current_department);

-- ============================================================================
-- SECTION 5: Process Sequences and Steps
-- ============================================================================
-- Migration: 004_set_default_offset_sequence.sql

-- Ensure Offset process sequence exists with correct steps
DO $$
DECLARE
    offset_sequence_id INTEGER;
    step_id INTEGER;
BEGIN
    -- Get or create Offset sequence
    SELECT id INTO offset_sequence_id
    FROM process_sequences
    WHERE name = 'Offset' OR name LIKE 'Offset%'
    LIMIT 1;

    IF offset_sequence_id IS NULL THEN
        INSERT INTO process_sequences (name, description, "isActive")
        VALUES ('Offset', 'Standard offset printing process with Prepress (Design, QA, CTP)', true)
        RETURNING id INTO offset_sequence_id;
    END IF;

    -- Only insert steps if they don't exist
    IF NOT EXISTS (SELECT 1 FROM process_steps WHERE "sequenceId" = offset_sequence_id AND "stepNumber" = 1 AND name = 'Design') THEN
        INSERT INTO process_steps ("sequenceId", "stepNumber", name, description, "isQualityCheck", "isActive", "createdAt", "updatedAt")
        VALUES (offset_sequence_id, 1, 'Design', 'Design creation and review', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM process_steps WHERE "sequenceId" = offset_sequence_id AND "stepNumber" = 2 AND name = 'QA Review (Prepress)') THEN
        INSERT INTO process_steps ("sequenceId", "stepNumber", name, description, "isQualityCheck", "isActive", "createdAt", "updatedAt")
        VALUES (offset_sequence_id, 2, 'QA Review (Prepress)', 'Quality assurance review for prepress design', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM process_steps WHERE "sequenceId" = offset_sequence_id AND "stepNumber" = 3 AND name = 'CTP') THEN
        INSERT INTO process_steps ("sequenceId", "stepNumber", name, description, "isQualityCheck", "isActive", "createdAt", "updatedAt")
        VALUES (offset_sequence_id, 3, 'CTP', 'Computer-to-Plate - Plate making', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    END IF;

    -- Job Planning step (step 4)
    IF NOT EXISTS (SELECT 1 FROM process_steps WHERE "sequenceId" = offset_sequence_id AND "stepNumber" = 4 AND name = 'Job Planning') THEN
        INSERT INTO process_steps ("sequenceId", "stepNumber", name, description, "isQualityCheck", "isActive", "createdAt", "updatedAt")
        VALUES (offset_sequence_id, 4, 'Job Planning', 'Smart production planning and sheet optimization', false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    END IF;

    -- Additional production steps
    IF NOT EXISTS (SELECT 1 FROM process_steps WHERE "sequenceId" = offset_sequence_id AND "stepNumber" = 5 AND name = 'Press Cutting') THEN
        INSERT INTO process_steps ("sequenceId", "stepNumber", name, description, "isQualityCheck", "isActive", "createdAt", "updatedAt")
        VALUES (offset_sequence_id, 5, 'Press Cutting', 'Material cutting process', false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    END IF;

END $$;

-- ============================================================================
-- SECTION 6: Job CTP Machines Table
-- ============================================================================
-- Migration: 007_add_job_ctp_machines_table.sql

CREATE TABLE IF NOT EXISTS job_ctp_machines (
  id SERIAL PRIMARY KEY,
  prepress_job_id INTEGER NOT NULL REFERENCES prepress_jobs(id) ON DELETE CASCADE,
  ctp_machine_id INTEGER NOT NULL REFERENCES ctp_machines(id) ON DELETE CASCADE,
  plate_count INTEGER NOT NULL DEFAULT 0 CHECK (plate_count >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(prepress_job_id, ctp_machine_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_job_ctp_machines_prepress_job ON job_ctp_machines(prepress_job_id);
CREATE INDEX IF NOT EXISTS idx_job_ctp_machines_ctp_machine ON job_ctp_machines(ctp_machine_id);
CREATE INDEX IF NOT EXISTS idx_job_ctp_machines_created_at ON job_ctp_machines(created_at);

-- Create trigger for updated_at (if function exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP TRIGGER IF EXISTS update_job_ctp_machines_updated_at ON job_ctp_machines;
        CREATE TRIGGER update_job_ctp_machines_updated_at 
          BEFORE UPDATE ON job_ctp_machines 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================================================
-- SECTION 7: Blank Size to Prepress Jobs
-- ============================================================================
-- Migration: 009_add_blank_size_to_prepress.sql

ALTER TABLE prepress_jobs 
ADD COLUMN IF NOT EXISTS blank_width_mm DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS blank_height_mm DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS blank_width_inches DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS blank_height_inches DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS blank_size_unit VARCHAR(10) DEFAULT 'mm';

-- Add check constraint to ensure unit is valid
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_blank_size_unit'
    ) THEN
        ALTER TABLE prepress_jobs
        ADD CONSTRAINT check_blank_size_unit 
        CHECK (blank_size_unit IN ('mm', 'inches') OR blank_size_unit IS NULL);
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_prepress_jobs_blank_size ON prepress_jobs(blank_width_mm, blank_height_mm);

-- ============================================================================
-- SECTION 8: CTP Machines Cleanup
-- ============================================================================
-- Migration: 010_cleanup_ctp_machines.sql

-- Ensure we have only the required machines
DO $$
BEGIN
    -- Delete generic machines
    DELETE FROM ctp_machines WHERE machine_code LIKE 'MACH-%' OR machine_code LIKE 'CTP-%';
    
    -- Delete unwanted SM52 variants (keeping only SM52-1)
    DELETE FROM ctp_machines WHERE machine_code IN ('SM52-2', 'SM52-5');
    
    -- Delete GTO-46-1
    DELETE FROM ctp_machines WHERE machine_code = 'GTO-46-1';
    
    -- Delete any other machines not in allowed list
    DELETE FROM ctp_machines 
    WHERE machine_code NOT IN ('SM52-1', 'SORK-Z', 'SM72-Z', 'CD74', 'GTO-52-1', 'GTO-45-1');
    
    -- Insert or update the required machines
    INSERT INTO ctp_machines (machine_code, machine_name, machine_type, manufacturer, model, status, location, description, max_plate_size, is_active)
    VALUES
      ('SM52-1', 'SM52', 'CTP', 'Heidelberg', 'SM52', 'ACTIVE', 'CTP Room 1', 'Heidelberg SM52 CTP machine', 'Standard', true),
      ('SORK-Z', 'SORK-Z', 'CTP', 'Heidelberg', 'SORK-Z', 'ACTIVE', 'CTP Room 1', 'Heidelberg SORK-Z CTP machine', 'Standard', true),
      ('SM72-Z', 'SMZ72', 'CTP', 'Heidelberg', 'SMZ72', 'ACTIVE', 'CTP Room 1', 'Heidelberg SMZ72 CTP machine', 'Standard', true),
      ('CD74', 'CD74', 'CTP', 'Heidelberg', 'CD74', 'ACTIVE', 'CTP Room 2', 'Heidelberg CD74 CTP machine', 'Standard', true),
      ('GTO-52-1', 'GTO 52', 'CTP', 'Heidelberg', 'GTO 52', 'ACTIVE', 'CTP Room 2', 'Heidelberg GTO 52 CTP machine', 'Standard', true),
      ('GTO-45-1', 'GTO 45', 'CTP', 'Heidelberg', 'GTO 45', 'ACTIVE', 'CTP Room 3', 'Heidelberg GTO 45 CTP machine', 'Standard', true)
    ON CONFLICT (machine_code) 
    DO UPDATE SET
      machine_name = EXCLUDED.machine_name,
      machine_type = EXCLUDED.machine_type,
      manufacturer = EXCLUDED.manufacturer,
      model = EXCLUDED.model,
      status = EXCLUDED.status,
      location = EXCLUDED.location,
      description = EXCLUDED.description,
      max_plate_size = EXCLUDED.max_plate_size,
      is_active = EXCLUDED.is_active,
      updated_at = CURRENT_TIMESTAMP;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

SELECT 'Complete schema migration applied successfully!' as message;

