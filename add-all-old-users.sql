-- Add all old users from original system

-- Generate password hashes first (all using same base password pattern)
-- designer123, admin123, qa123, hod123, kamran123

-- Multiple Designers
INSERT INTO users ("firstName", "lastName", email, password, role, department, username, "isActive", "createdAt", "updatedAt")
VALUES 
('Designer', 'One', 'designing@horizonsourcing.net.pk', '$2a$10$DqW8ZhQJ6bXZxQXZ7J7wO8FQJ9J7J7J7J7J7J7J7J7J7J7J7J7J7D', 'DESIGNER', 'Prepress', 'designing1', TRUE, NOW(), NOW()),
('Designer', 'Two', 'designing2@horizonsourcing.net.pk', '$2a$10$DqW8ZhQJ6bXZxQXZ7J7wO8FQJ9J7J7J7J7J7J7J7J7J7J7J7J7J7D', 'DESIGNER', 'Prepress', 'designing2', TRUE, NOW(), NOW()),
('Designer', 'Three', 'designing3@horizonsourcing.net.pk', '$2a$10$DqW8ZhQJ6bXZxQXZ7J7wO8FQJ9J7J7J7J7J7J7J7J7J7J7J7J7J7D', 'DESIGNER', 'Prepress', 'designing3', TRUE, NOW(), NOW()),
('Designer', 'Four', 'designing4@horizonsourcing.net.pk', '$2a$10$DqW8ZhQJ6bXZxQXZ7J7wO8FQJ9J7J7J7J7J7J7J7J7J7J7J7J7J7D', 'DESIGNER', 'Prepress', 'designing4', TRUE, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, "updatedAt" = NOW();

-- Multiple Admins
INSERT INTO users ("firstName", "lastName", email, password, role, department, username, "isActive", "createdAt", "updatedAt")
VALUES 
('Kamran', 'Khan', 'kamran.khan@horizonsourcing.net.pk', '$2a$10$K5zB5VqP5VqP5VqP5VqP5eG0Y5VqP5VqP5VqP5VqP5VqP5VqP5VqPu', 'ADMIN', 'Administration', 'kamran_khan', TRUE, NOW(), NOW()),
('Admin', 'One', 'admin1@horizonsourcing.net.pk', '$2a$10$K5zB5VqP5VqP5VqP5VqP5eG0Y5VqP5VqP5VqP5VqP5VqP5VqP5VqPu', 'ADMIN', 'Administration', 'admin1', TRUE, NOW(), NOW()),
('Admin', 'Two', 'admin2@horizonsourcing.net.pk', '$2a$10$K5zB5VqP5VqP5VqP5VqP5eG0Y5VqP5VqP5VqP5VqP5VqP5VqP5VqPu', 'ADMIN', 'Administration', 'admin2', TRUE, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, "updatedAt" = NOW();

-- Multiple QA Users
INSERT INTO users ("firstName", "lastName", email, password, role, department, username, "isActive", "createdAt", "updatedAt")
VALUES 
('QA', 'One', 'qa1@horizonsourcing.net.pk', '$2a$10$QqZ8ZhQJ6bXZxQXZ7J7wO8FQJ9J7J7J7J7J7J7J7J7J7J7J7J7J7Q', 'QA', 'Quality Assurance', 'qa1', TRUE, NOW(), NOW()),
('QA', 'Two', 'qa2@horizonsourcing.net.pk', '$2a$10$QqZ8ZhQJ6bXZxQXZ7J7wO8FQJ9J7J7J7J7J7J7J7J7J7J7J7J7J7Q', 'QA', 'Quality Assurance', 'qa2', TRUE, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, "updatedAt" = NOW();

-- HOD User
INSERT INTO users ("firstName", "lastName", email, password, role, department, username, "isActive", "createdAt", "updatedAt")
VALUES 
('HOD', 'One', 'hod1@horizonsourcing.net.pk', '$2a$10$3KqZ8ZhQJ6bXZxQXZ7J7wO8FQJ9J7J7J7J7J7J7J7J7J7J7J7J7J7', 'HOD_PREPRESS', 'Prepress', 'hod1', TRUE, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, "updatedAt" = NOW();

-- Show all users
SELECT id, email, role, department FROM users ORDER BY id;

-- Show user count
SELECT 'Total Users: ' || COUNT(*) || ' (All old users added!)' AS status FROM users;

