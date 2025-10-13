-- Seed Fresh Database with Complete Data

-- Insert Users
INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active) VALUES
('admin', 'admin@horizonsourcing.com', '$2a$10$XalemB6cbJCU7Qhd6hGWEuMqikFL6bm050QqRk3MPmd.lYfdVrwPq', 'Admin', 'User', 'ADMIN', true),
('hod_prepress', 'hod.prepress@horizonsourcing.com', '$2a$10$XalemB6cbJCU7Qhd6hGWEuMqikFL6bm050QqRk3MPmd.lYfdVrwPq', 'HOD', 'Prepress', 'HOD_PREPRESS', true),
('designer', 'designer@horizonsourcing.com', '$2a$10$XalemB6cbJCU7Qhd6hGWEuMqikFL6bm050QqRk3MPmd.lYfdVrwPq', 'Designer', 'User', 'DESIGNER', true),
('qa_prepress', 'qa.prepress@horizonsourcing.com', '$2a$10$XalemB6cbJCU7Qhd6hGWEuMqikFL6bm050QqRk3MPmd.lYfdVrwPq', 'QA', 'Prepress', 'QA_PREPRESS', true),
('ctp_operator', 'ctp.operator@horizonsourcing.com', '$2a$10$XalemB6cbJCU7Qhd6hGWEuMqikFL6bm050QqRk3MPmd.lYfdVrwPq', 'CTP', 'Operator', 'CTP_OPERATOR', true),
('inventory_mgr', 'inventory.manager@horizonsourcing.com', '$2a$10$XalemB6cbJCU7Qhd6hGWEuMqikFL6bm050QqRk3MPmd.lYfdVrwPq', 'Inventory', 'Manager', 'INVENTORY_MANAGER', true),
('procurement_mgr', 'procurement.manager@horizonsourcing.com', '$2a$10$XalemB6cbJCU7Qhd6hGWEuMqikFL6bm050QqRk3MPmd.lYfdVrwPq', 'Procurement', 'Manager', 'PROCUREMENT_MANAGER', true),
('admin_local', 'admin@erp.local', '$2a$10$XalemB6cbJCU7Qhd6hGWEuMqikFL6bm050QqRk3MPmd.lYfdVrwPq', 'Admin', 'Local', 'ADMIN', true)
ON CONFLICT (email) DO NOTHING;

-- Insert Product Categories  
INSERT INTO product_categories (name, description) VALUES
('Hang Tags', 'Product identification tags'),
('Price Tags', 'Pricing information tags'),
('Care Labels', 'Care instruction labels'),
('Size Labels', 'Size specification labels'),
('Brand Labels', 'Brand identification labels'),
('Woven Labels', 'Woven fabric labels'),
('Heat Transfer Labels', 'Heat transfer vinyl labels'),
('Leather Patches', 'Leather patch labels')
ON CONFLICT DO NOTHING;

-- Insert Materials
INSERT INTO materials (name, code, type, description, is_active) VALUES
('Art Paper', 'ART-001', 'Paper', 'Premium art paper', true),
('Art Card', 'AC-001', 'Paper', 'Art card material', true),
('CS1', 'CS1-001', 'Paper', 'Coated paper 1-side', true),
('CS2', 'CS2-001', 'Paper', 'Coated paper 2-side', true),
('Kraft Paper', 'KRAFT-001', 'Paper', 'Natural kraft paper', true),
('Vinyl', 'VINYL-001', 'Synthetic', 'Heat transfer vinyl', true),
('Cotton Fabric', 'COTTON-001', 'Fabric', 'Cotton for woven labels', true),
('Leather', 'LEATHER-001', 'Natural', 'Genuine leather', true)
ON CONFLICT DO NOTHING;

-- Insert Companies
INSERT INTO companies (name, code, contact_person, email, phone, country, is_active) VALUES
('Nike Inc.', 'NIKE', 'John Smith', 'contact@nike.com', '+1-800-344-6453', 'USA', true),
('Adidas AG', 'ADIDAS', 'Maria Garcia', 'contact@adidas.com', '+49-9132-84-0', 'Germany', true),
('Puma SE', 'PUMA', 'Hans Mueller', 'contact@puma.com', '+49-9132-81-0', 'Germany', true),
('Under Armour', 'UA', 'Sarah Johnson', 'contact@underarmour.com', '+1-888-727-6687', 'USA', true),
('H&M', 'HM', 'Erik Andersson', 'contact@hm.com', '+46-8-796-55-00', 'Sweden', true)
ON CONFLICT DO NOTHING;

-- Verify
SELECT 'Database seeded successfully!' AS status;
SELECT (SELECT COUNT(*) FROM users) as users, 
       (SELECT COUNT(*) FROM product_categories) as categories,
       (SELECT COUNT(*) FROM materials) as materials,
       (SELECT COUNT(*) FROM companies) as companies;

