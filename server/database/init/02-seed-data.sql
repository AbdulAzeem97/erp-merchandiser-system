-- Seed data for ERP Merchandiser System
-- This script populates the database with initial data

-- Insert product categories
INSERT INTO product_categories (name, description) VALUES
('Hang Tags', 'Product identification tags'),
('Price Tags', 'Pricing information tags'),
('Care Labels', 'Care instruction labels'),
('Size Labels', 'Size specification labels'),
('Brand Labels', 'Brand identification labels')
ON CONFLICT (name) DO NOTHING;

-- Insert materials
INSERT INTO materials (name, code, type, gsm_range, description) VALUES
('Art Card', 'AC001', 'Paper', '200-300 GSM', 'High quality art paper'),
('Craft Card', 'CC001', 'Paper', '150-250 GSM', 'Standard craft paper'),
('Tyvek', 'TY001', 'Synthetic', '50-100 GSM', 'Durable synthetic material'),
('Yupo Paper', 'YP001', 'Synthetic', '80-120 GSM', 'Premium synthetic paper'),
('Cotton Fabric', 'CF001', 'Fabric', '120-200 GSM', 'Natural cotton material'),
('Polyester Fabric', 'PF001', 'Fabric', '100-180 GSM', 'Synthetic polyester material')
ON CONFLICT (code) DO NOTHING;

-- Insert sample companies
INSERT INTO companies (name, code, contact_person, email, phone, address, country) VALUES
('Nike', 'NIKE', 'John Smith', 'john@nike.com', '+1-555-0123', '123 Nike St, Oregon, USA', 'USA'),
('Adidas', 'ADIDAS', 'Sarah Johnson', 'sarah@adidas.com', '+49-555-0456', '456 Adidas Ave, Germany', 'Germany'),
('Puma', 'PUMA', 'Mike Wilson', 'mike@puma.com', '+49-555-0789', '789 Puma Rd, Germany', 'Germany'),
('Under Armour', 'UA', 'Lisa Brown', 'lisa@ua.com', '+1-555-0321', '321 UA Blvd, Maryland, USA', 'USA'),
('H&M', 'HM', 'Anna Andersson', 'anna@hm.com', '+46-555-0654', '654 Fashion St, Stockholm, Sweden', 'Sweden')
ON CONFLICT (code) DO NOTHING;

-- Insert basic process steps
INSERT INTO process_steps (name, description, category, estimated_duration, sort_order) VALUES
('Design Review', 'Review and approve artwork design', 'Design', 30, 1),
('Material Preparation', 'Prepare and cut materials to size', 'Preparation', 45, 2),
('Printing Setup', 'Set up printing equipment and test runs', 'Printing', 60, 3),
('Digital Printing', 'Execute digital printing process', 'Printing', 90, 4),
('Quality Check - Printing', 'Inspect printed materials for quality', 'Quality', 15, 5),
('Die Cutting', 'Cut materials to final shape and size', 'Finishing', 45, 6),
('Finishing Operations', 'Apply special finishes (lamination, foiling, etc.)', 'Finishing', 60, 7),
('Quality Check - Final', 'Final quality inspection before packaging', 'Quality', 20, 8),
('Packaging', 'Package finished products', 'Packaging', 30, 9),
('Shipping Preparation', 'Prepare for shipment and labeling', 'Shipping', 15, 10);

-- Insert default process sequences
INSERT INTO process_sequences (name, product_category_id, description, is_default) VALUES
('Standard Hang Tag Process', 1, 'Default process for hang tag production', true),
('Standard Price Tag Process', 2, 'Default process for price tag production', true),
('Standard Label Process', 3, 'Default process for label production', true);

-- Link process steps to sequences
INSERT INTO process_sequence_steps (sequence_id, step_id, step_order, is_optional) VALUES
-- Standard Hang Tag Process
(1, 1, 1, false), -- Design Review
(1, 2, 2, false), -- Material Preparation
(1, 3, 3, false), -- Printing Setup
(1, 4, 4, false), -- Digital Printing
(1, 5, 5, false), -- Quality Check - Printing
(1, 6, 6, false), -- Die Cutting
(1, 7, 7, true),  -- Finishing Operations (optional)
(1, 8, 8, false), -- Quality Check - Final
(1, 9, 9, false), -- Packaging
(1, 10, 10, false), -- Shipping Preparation

-- Standard Price Tag Process
(2, 1, 1, false), -- Design Review
(2, 2, 2, false), -- Material Preparation
(2, 3, 3, false), -- Printing Setup
(2, 4, 4, false), -- Digital Printing
(2, 5, 5, false), -- Quality Check - Printing
(2, 6, 6, false), -- Die Cutting
(2, 8, 7, false), -- Quality Check - Final
(2, 9, 8, false), -- Packaging
(2, 10, 9, false), -- Shipping Preparation

-- Standard Label Process
(3, 1, 1, false), -- Design Review
(3, 2, 2, false), -- Material Preparation
(3, 3, 3, false), -- Printing Setup
(3, 4, 4, false), -- Digital Printing
(3, 5, 5, false), -- Quality Check - Printing
(3, 7, 6, true),  -- Finishing Operations (optional)
(3, 8, 7, false), -- Quality Check - Final
(3, 9, 8, false), -- Packaging
(3, 10, 9, false); -- Shipping Preparation

-- Initialize inventory for materials
INSERT INTO inventory (material_id, current_stock, minimum_stock, maximum_stock, unit, unit_cost) VALUES
(1, 1000, 100, 5000, 'sheets', 0.25), -- Art Card
(2, 800, 100, 3000, 'sheets', 0.15),  -- Craft Card
(3, 500, 50, 2000, 'sheets', 0.45),   -- Tyvek
(4, 300, 30, 1000, 'sheets', 0.35),   -- Yupo Paper
(5, 200, 20, 800, 'meters', 1.25),    -- Cotton Fabric
(6, 150, 15, 600, 'meters', 0.85);    -- Polyester Fabric