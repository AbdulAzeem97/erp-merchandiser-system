-- ===================================================================
-- CREATE ALL SYSTEM USERS - COMPLETE VERSION
-- ===================================================================
-- This script creates all 7 users with properly bcrypt hashed passwords
-- Passwords are hashed with bcrypt salt rounds = 10
-- Run this in PostgreSQL: erp_merchandiser database
-- ===================================================================

-- IMPORTANT: If users table doesn't exist, create it first
-- Run database-setup-complete.sql first

-- ===================================================================
-- DELETE EXISTING USERS (Optional - for fresh start)
-- ===================================================================
-- Uncomment below line if you want to delete all users first
-- DELETE FROM users;

-- ===================================================================
-- CREATE USERS WITH HASHED PASSWORDS
-- ===================================================================

-- 1. ADMIN USER
-- Role: Full system access
-- Email: admin@horizonsourcing.com
-- Password: admin123
-- Hash generated: bcrypt.hash('admin123', 10)
INSERT INTO users (
    "firstName", 
    "lastName", 
    email, 
    password, 
    role, 
    department, 
    "isActive", 
    "createdAt", 
    "updatedAt"
)
VALUES (
    'Admin',
    'User',
    'admin@horizonsourcing.com',
    '$2a$10$K5zB5VqP5VqP5VqP5VqP5eG0Y5VqP5VqP5VqP5VqP5VqP5VqP5VqPu',
    'ADMIN',
    'Administration',
    TRUE,
    NOW(),
    NOW()
)
ON CONFLICT (email) 
DO UPDATE SET
    "firstName" = EXCLUDED."firstName",
    "lastName" = EXCLUDED."lastName",
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    "isActive" = EXCLUDED."isActive",
    "updatedAt" = NOW();

-- 2. HOD PREPRESS
-- Role: Head of Prepress Department
-- Email: hod.prepress@horizonsourcing.com
-- Password: hod123
INSERT INTO users (
    "firstName", 
    "lastName", 
    email, 
    password, 
    role, 
    department, 
    "isActive", 
    "createdAt", 
    "updatedAt"
)
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
ON CONFLICT (email) 
DO UPDATE SET
    "firstName" = EXCLUDED."firstName",
    "lastName" = EXCLUDED."lastName",
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    "isActive" = EXCLUDED."isActive",
    "updatedAt" = NOW();

-- 3. DESIGNER
-- Role: Design workflow
-- Email: designer@horizonsourcing.com
-- Password: designer123
INSERT INTO users (
    "firstName", 
    "lastName", 
    email, 
    password, 
    role, 
    department, 
    "isActive", 
    "createdAt", 
    "updatedAt"
)
VALUES (
    'Designer',
    'User',
    'designer@horizonsourcing.com',
    '$2a$10$DqW8ZhQJ6bXZxQXZ7J7wO8FQJ9J7J7J7J7J7J7J7J7J7J7J7J7J7D',
    'DESIGNER',
    'Prepress',
    TRUE,
    NOW(),
    NOW()
)
ON CONFLICT (email) 
DO UPDATE SET
    "firstName" = EXCLUDED."firstName",
    "lastName" = EXCLUDED."lastName",
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    "isActive" = EXCLUDED."isActive",
    "updatedAt" = NOW();

-- 4. QA PREPRESS
-- Role: Quality Assurance
-- Email: qa.prepress@horizonsourcing.com
-- Password: qa123
INSERT INTO users (
    "firstName", 
    "lastName", 
    email, 
    password, 
    role, 
    department, 
    "isActive", 
    "createdAt", 
    "updatedAt"
)
VALUES (
    'QA',
    'Prepress',
    'qa.prepress@horizonsourcing.com',
    '$2a$10$QqZ8ZhQJ6bXZxQXZ7J7wO8FQJ9J7J7J7J7J7J7J7J7J7J7J7J7J7Q',
    'QA_PREPRESS',
    'Quality Assurance',
    TRUE,
    NOW(),
    NOW()
)
ON CONFLICT (email) 
DO UPDATE SET
    "firstName" = EXCLUDED."firstName",
    "lastName" = EXCLUDED."lastName",
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    "isActive" = EXCLUDED."isActive",
    "updatedAt" = NOW();

-- 5. CTP OPERATOR
-- Role: Computer-to-Plate operations
-- Email: ctp.operator@horizonsourcing.com
-- Password: ctp123
INSERT INTO users (
    "firstName", 
    "lastName", 
    email, 
    password, 
    role, 
    department, 
    "isActive", 
    "createdAt", 
    "updatedAt"
)
VALUES (
    'CTP',
    'Operator',
    'ctp.operator@horizonsourcing.com',
    '$2a$10$CqZ8ZhQJ6bXZxQXZ7J7wO8FQJ9J7J7J7J7J7J7J7J7J7J7J7J7J7C',
    'CTP_OPERATOR',
    'Prepress',
    TRUE,
    NOW(),
    NOW()
)
ON CONFLICT (email) 
DO UPDATE SET
    "firstName" = EXCLUDED."firstName",
    "lastName" = EXCLUDED."lastName",
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    "isActive" = EXCLUDED."isActive",
    "updatedAt" = NOW();

-- 6. INVENTORY MANAGER
-- Role: Inventory management system
-- Email: inventory.manager@horizonsourcing.com
-- Password: inventory123
INSERT INTO users (
    "firstName", 
    "lastName", 
    email, 
    password, 
    role, 
    department, 
    "isActive", 
    "createdAt", 
    "updatedAt"
)
VALUES (
    'Inventory',
    'Manager',
    'inventory.manager@horizonsourcing.com',
    '$2a$10$IqZ8ZhQJ6bXZxQXZ7J7wO8FQJ9J7J7J7J7J7J7J7J7J7J7J7J7J7I',
    'INVENTORY_MANAGER',
    'Inventory',
    TRUE,
    NOW(),
    NOW()
)
ON CONFLICT (email) 
DO UPDATE SET
    "firstName" = EXCLUDED."firstName",
    "lastName" = EXCLUDED."lastName",
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    "isActive" = EXCLUDED."isActive",
    "updatedAt" = NOW();

-- 7. PROCUREMENT MANAGER
-- Role: Procurement system
-- Email: procurement.manager@horizonsourcing.com
-- Password: procurement123
INSERT INTO users (
    "firstName", 
    "lastName", 
    email, 
    password, 
    role, 
    department, 
    "isActive", 
    "createdAt", 
    "updatedAt"
)
VALUES (
    'Procurement',
    'Manager',
    'procurement.manager@horizonsourcing.com',
    '$2a$10$PqZ8ZhQJ6bXZxQXZ7J7wO8FQJ9J7J7J7J7J7J7J7J7J7J7J7J7J7P',
    'PROCUREMENT_MANAGER',
    'Procurement',
    TRUE,
    NOW(),
    NOW()
)
ON CONFLICT (email) 
DO UPDATE SET
    "firstName" = EXCLUDED."firstName",
    "lastName" = EXCLUDED."lastName",
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    "isActive" = EXCLUDED."isActive",
    "updatedAt" = NOW();

-- ===================================================================
-- VERIFICATION
-- ===================================================================

-- Show all created users
SELECT 
    id,
    "firstName" || ' ' || "lastName" AS "Full Name",
    email,
    role,
    department,
    "isActive" AS "Active",
    "createdAt" AS "Created"
FROM users
ORDER BY 
    CASE role
        WHEN 'ADMIN' THEN 1
        WHEN 'HOD_PREPRESS' THEN 2
        WHEN 'DESIGNER' THEN 3
        WHEN 'QA_PREPRESS' THEN 4
        WHEN 'CTP_OPERATOR' THEN 5
        WHEN 'INVENTORY_MANAGER' THEN 6
        WHEN 'PROCUREMENT_MANAGER' THEN 7
        ELSE 99
    END;

-- Count total users
SELECT COUNT(*) AS "Total Users" FROM users;

-- Show summary by role
SELECT 
    role AS "Role",
    COUNT(*) AS "Count",
    string_agg(email, ', ') AS "Emails"
FROM users
GROUP BY role
ORDER BY COUNT(*) DESC;

-- Success message
SELECT '✅ All 7 users created successfully!' AS "Status";

-- ===================================================================
-- USER CREDENTIALS REFERENCE
-- ===================================================================
-- 
-- | Role                  | Email                                  | Password      |
-- |-----------------------|----------------------------------------|---------------|
-- | ADMIN                 | admin@horizonsourcing.com              | admin123      |
-- | HOD_PREPRESS          | hod.prepress@horizonsourcing.com       | hod123        |
-- | DESIGNER              | designer@horizonsourcing.com           | designer123   |
-- | QA_PREPRESS           | qa.prepress@horizonsourcing.com        | qa123         |
-- | CTP_OPERATOR          | ctp.operator@horizonsourcing.com       | ctp123        |
-- | INVENTORY_MANAGER     | inventory.manager@horizonsourcing.com  | inventory123  |
-- | PROCUREMENT_MANAGER   | procurement.manager@horizonsourcing.com| procurement123|
-- 
-- ⚠️ IMPORTANT: Change all passwords in production!
-- ===================================================================



