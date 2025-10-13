-- Create process_sequences table (different from product_process_sequences)
CREATE TABLE IF NOT EXISTS process_sequences (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  product_type VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add complete process sequences for all departments
INSERT INTO process_sequences (name, product_type, description, "isActive") VALUES
('Offset Printing Process', 'Offset', 'Complete offset printing workflow with 31 steps', true),
('Heat Transfer Label Process', 'Heat Transfer', 'Heat transfer label production workflow with 11 steps', true),
('PFL - Printed Fabric Label Process', 'PFL', 'Printed fabric label workflow with 12 steps', true),
('Woven Label Process', 'Woven', 'Woven label production workflow with 14 steps', true),
('Leather Patch Process', 'Leather', 'Leather patch production workflow with 8 steps', true),
('Digital Printing Process', 'Digital', 'Digital printing workflow with 12 steps', true)
ON CONFLICT (product_type) DO NOTHING;

-- Verify
SELECT id, name, product_type FROM process_sequences ORDER BY id;
SELECT 'Process sequences created!' AS status;

