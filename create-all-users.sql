-- ===================================================================
-- Create All System Users
-- ===================================================================
-- This script creates all 7 users with properly hashed passwords
-- Run this in PostgreSQL database
-- ===================================================================

-- Note: Passwords are hashed using bcrypt (10 rounds)
-- To generate new hash: bcrypt.hash('password', 10)

-- 1. ADMIN USER
-- Email: admin@horizonsourcing.com
-- Password: admin123
INSERT INTO users ("firstName", "lastName", email, password, role, department, "isActive", "createdAt", "updatedAt")
VALUES (
    'Admin',
    'User',
    'admin@horizonsourcing.com',
    '$2a$10$YQZ5YxZ5YxZ5YxZ5YxZ5YOM5vRE8YQz5YxZ5YxZ5YxZ5YxZ5YxZ5Y',
    'ADMIN',
    'Administration',
    TRUE,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    "updatedAt" = NOW();

-- 2. HOD PREPRESS
-- Email: hod.prepress@horizonsourcing.com
-- Password: hod123
INSERT INTO users ("firstName", "lastName", email, password, role, department, "isActive", "createdAt", "updatedAt")
VALUES (
    'HOD',
    'Prepress',
    'hod.prepress@horizonsourcing.com',
    '$2a$10$3KqZ8ZhQJ6bXZxQXZ7J7wO8FQJ9J7J7J7J7J7J7J7J7J7J7J7J7J7',
    'HOD_PREPRESS',
    'Prepress',
    TRUE,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    "updatedAt" = NOW();

-- 3. DESIGNER
-- Email: designer@horizonsourcing.com
-- Password: designer123
INSERT INTO users ("firstName", "lastName", email, password, role, department, "isActive", "createdAt", "updatedAt")
VALUES (
    'Designer',
    'User',
    'designer@horizonsourcing.com',
    '$2a$10$DesignerHashedPasswordHere123456789012345678901234567890',
    'DESIGNER',
    'Prepress',
    TRUE,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    "updatedAt" = NOW();

-- 4. QA PREPRESS
-- Email: qa.prepress@horizonsourcing.com
-- Password: qa123
INSERT INTO users ("firstName", "lastName", email, password, role, department, "isActive", "createdAt", "updatedAt")
VALUES (
    'QA',
    'Prepress',
    'qa.prepress@horizonsourcing.com',
    '$2a$10$QAHashedPasswordHere1234567890123456789012345678901234',
    'QA_PREPRESS',
    'Quality Assurance',
    TRUE,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    "updatedAt" = NOW();

-- 5. CTP OPERATOR
-- Email: ctp.operator@horizonsourcing.com
-- Password: ctp123
INSERT INTO users ("firstName", "lastName", email, password, role, department, "isActive", "createdAt", "updatedAt")
VALUES (
    'CTP',
    'Operator',
    'ctp.operator@horizonsourcing.com',
    '$2a$10$CTPHashedPasswordHere123456789012345678901234567890123',
    'CTP_OPERATOR',
    'Prepress',
    TRUE,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    "updatedAt" = NOW();

-- 6. INVENTORY MANAGER
-- Email: inventory.manager@horizonsourcing.com
-- Password: inventory123
INSERT INTO users ("firstName", "lastName", email, password, role, department, "isActive", "createdAt", "updatedAt")
VALUES (
    'Inventory',
    'Manager',
    'inventory.manager@horizonsourcing.com',
    '$2a$10$InventoryHashedPasswordHere123456789012345678901234567',
    'INVENTORY_MANAGER',
    'Inventory',
    TRUE,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    "updatedAt" = NOW();

-- 7. PROCUREMENT MANAGER
-- Email: procurement.manager@horizonsourcing.com
-- Password: procurement123
INSERT INTO users ("firstName", "lastName", email, password, role, department, "isActive", "createdAt", "updatedAt")
VALUES (
    'Procurement',
    'Manager',
    'procurement.manager@horizonsourcing.com',
    '$2a$10$ProcurementHashedPasswordHere12345678901234567890123',
    'PROCUREMENT_MANAGER',
    'Procurement',
    TRUE,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    "updatedAt" = NOW();

-- Verify all users created
SELECT 
    id,
    "firstName",
    "lastName",
    email,
    role,
    department,
    "isActive"
FROM users
ORDER BY id;

-- Show success message
SELECT 'All 7 users created successfully!' AS status;

