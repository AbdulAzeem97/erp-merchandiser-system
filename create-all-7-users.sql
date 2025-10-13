-- Create All 7 Users for ERP Merchandiser System
-- Using Prisma table structure

DELETE FROM users;

INSERT INTO users (username, email, password, role, "firstName", "lastName", "isActive", "updatedAt") VALUES
('admin', 'admin@horizonsourcing.com', '$2a$10$P0BvSnxD8wQPvLX6M3a/rOqx/rzyAvD9sc1Qh2tgqeY87Scru3aD.', 'ADMIN', 'Admin', 'User', true, CURRENT_TIMESTAMP),
('hod_prepress', 'hod.prepress@horizonsourcing.com', '$2a$10$nVBbw.XgVdxhiImGQ1OilOKKvSGwD3ibZb2Hc7cEaaDPC0ZOroLPO', 'HOD_PREPRESS', 'HOD', 'Prepress', true, CURRENT_TIMESTAMP),
('designer', 'designer@horizonsourcing.com', '$2a$10$xOIG6ZOrIX0ggkvX9bIzaukXiX.SSwTgwYriCqQffSxA2VevKs/8W', 'DESIGNER', 'Designer', 'User', true, CURRENT_TIMESTAMP),
('qa_prepress', 'qa.prepress@horizonsourcing.com', '$2a$10$a3WU8qCUcqthiF4J9JAytOWoBQXLLg/GLOlDKBaF3i5kgseHfPqem', 'QA_PREPRESS', 'QA', 'Prepress', true, CURRENT_TIMESTAMP),
('ctp_operator', 'ctp.operator@horizonsourcing.com', '$2a$10$9PiUNXL5cL7Za6msj7QEXuwTe4S9ASS2mQVkcD4mQDwGRNv7mTy2q', 'CTP_OPERATOR', 'CTP', 'Operator', true, CURRENT_TIMESTAMP),
('inventory_manager', 'inventory.manager@horizonsourcing.com', '$2a$10$lFoQYX3UCyr5p0UvUHXbR.wqyn8nlTLQwaVG3hzeQvU3YrRYSUzaW', 'INVENTORY_MANAGER', 'Inventory', 'Manager', true, CURRENT_TIMESTAMP),
('procurement_manager', 'procurement.manager@horizonsourcing.com', '$2a$10$r5psyYr/1uRrZMNdWRWtBOGbb4DhnVBKcws3aknc886VXT5kPQMYm', 'PROCUREMENT_MANAGER', 'Procurement', 'Manager', true, CURRENT_TIMESTAMP);

-- Verify users created
SELECT email, role, "firstName", "lastName", "isActive" FROM users ORDER BY id;

SELECT 'All 7 users created successfully!' AS status;

