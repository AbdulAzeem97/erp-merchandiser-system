-- Production Planning Fields Migration
-- Adds fields to track sheet planning, cutting layouts, and cost calculations
-- Migration: 002_add_production_planning_fields.sql

-- Create job_production_planning table to store planning data
CREATE TABLE IF NOT EXISTS job_production_planning (
    id SERIAL PRIMARY KEY,
    job_card_id INTEGER NOT NULL UNIQUE,
    selected_material_size_id INTEGER, -- Selected material size
    selected_sheet_size_id INTEGER, -- Selected sheet size (references material_sizes.id)
    cutting_layout_type TEXT, -- 'horizontal', 'vertical', 'smart'
    grid_pattern TEXT, -- e.g., '25x11'
    blanks_per_sheet INTEGER,
    efficiency_percentage DECIMAL(5,2),
    scrap_percentage DECIMAL(5,2),
    base_required_sheets INTEGER,
    additional_sheets INTEGER DEFAULT 0,
    final_total_sheets INTEGER,
    material_cost DECIMAL(12,2),
    wastage_justification TEXT,
    planning_status TEXT DEFAULT 'PENDING', -- 'PENDING', 'PLANNED', 'LOCKED', 'APPLIED'
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

-- Comments for documentation
-- planning_status values:
-- PENDING: Planning not started
-- PLANNED: Planning completed but not locked
-- LOCKED: Planning locked, ready to apply
-- APPLIED: Planning applied, inventory deducted, workflow progressed

