-- Add missing product_process_selections table
CREATE TABLE IF NOT EXISTS product_process_selections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    process_step_id UUID REFERENCES process_steps(id) ON DELETE CASCADE,
    is_selected BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, process_step_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_product_process_selections_product_id ON product_process_selections(product_id);
CREATE INDEX IF NOT EXISTS idx_product_process_selections_process_step_id ON product_process_selections(process_step_id);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_product_process_selections_updated_at ON product_process_selections;
CREATE TRIGGER update_product_process_selections_updated_at BEFORE UPDATE ON product_process_selections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();