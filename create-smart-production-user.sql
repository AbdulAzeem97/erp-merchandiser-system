-- Create Smart Production Dashboard User
-- This script creates a user with PRODUCTION_MANAGER role to access Smart Production Dashboard

-- Note: Replace 'your_password_here' with the actual password hash
-- To generate password hash, use: node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('production123', 10).then(h => console.log(h));"

-- Option 1: Production Manager (Full Access)
INSERT INTO users ("firstName", "lastName", email, password, role, department, "isActive")
VALUES 
('Production', 'Manager', 'production.manager@horizonsourcing.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'PRODUCTION_MANAGER', 'Production', TRUE)
ON CONFLICT (email) DO UPDATE SET role = 'PRODUCTION_MANAGER';

-- Option 2: Cutting Head (Full Access)
INSERT INTO users ("firstName", "lastName", email, password, role, department, "isActive")
VALUES 
('Cutting', 'Head', 'cutting.head@horizonsourcing.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'CUTTING_HEAD', 'Cutting', TRUE)
ON CONFLICT (email) DO UPDATE SET role = 'CUTTING_HEAD';

-- Option 3: Director (Read-Only Access)
INSERT INTO users ("firstName", "lastName", email, password, role, department, "isActive")
VALUES 
('Production', 'Director', 'production.director@horizonsourcing.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'DIRECTOR', 'Production', TRUE)
ON CONFLICT (email) DO UPDATE SET role = 'DIRECTOR';

-- Option 4: Finance (Read-Only Access)
INSERT INTO users ("firstName", "lastName", email, password, role, department, "isActive")
VALUES 
('Finance', 'Manager', 'finance.manager@horizonsourcing.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'FINANCE', 'Finance', TRUE)
ON CONFLICT (email) DO UPDATE SET role = 'FINANCE';

-- Note: The password hash above is for password: 'production123'
-- All users created above will have the same password: production123

