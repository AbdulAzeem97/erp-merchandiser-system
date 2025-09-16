-- Create process_sequences table if it doesn't exist
CREATE TABLE IF NOT EXISTS process_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  product_type VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create process_steps table if it doesn't exist
CREATE TABLE IF NOT EXISTS process_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_sequence_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  step_order INTEGER NOT NULL,
  is_compulsory BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (process_sequence_id) REFERENCES process_sequences(id) ON DELETE CASCADE
);

-- Insert Offset process sequence if it doesn't exist
INSERT INTO process_sequences (name, product_type, description, is_active)
SELECT 'Offset Printing', 'Offset', 'Complete offset printing process workflow', true
WHERE NOT EXISTS (
  SELECT 1 FROM process_sequences WHERE product_type = 'Offset'
);

-- Get the sequence ID for Offset and insert steps
DO $$
DECLARE
    sequence_id UUID;
BEGIN
    -- Get the sequence ID
    SELECT id INTO sequence_id FROM process_sequences WHERE product_type = 'Offset' LIMIT 1;
    
    -- Insert process steps for Offset if they don't exist
    IF NOT EXISTS (SELECT 1 FROM process_steps WHERE process_sequence_id = sequence_id) THEN
        INSERT INTO process_steps (process_sequence_id, name, description, step_order, is_compulsory, is_active) VALUES
        (sequence_id, 'Design Creation', 'Create artwork and design files', 1, true, true),
        (sequence_id, 'Prepress Preparation', 'Prepare files for printing', 2, true, true),
        (sequence_id, 'Plate Making', 'Create printing plates', 3, true, true),
        (sequence_id, 'Color Matching', 'Match colors to specifications', 4, true, true),
        (sequence_id, 'Printing Setup', 'Setup printing press', 5, true, true),
        (sequence_id, 'Printing', 'Execute the printing process', 6, true, true),
        (sequence_id, 'Quality Check', 'Inspect print quality', 7, true, true),
        (sequence_id, 'Finishing', 'Cut, fold, and finish products', 8, true, true),
        (sequence_id, 'Packaging', 'Package finished products', 9, true, true);
    END IF;
END $$;

-- Verify the data
SELECT 
  ps.id as sequence_id,
  ps.name as product_type,
  ps.description,
  pst.id as step_id,
  pst.name as step_name,
  pst.is_compulsory,
  pst.step_order
FROM process_sequences ps
LEFT JOIN process_steps pst ON ps.id = pst.process_sequence_id
WHERE ps.product_type = 'Offset'
ORDER BY pst.step_order ASC;

