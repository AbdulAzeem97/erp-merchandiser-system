-- Add admin@erp.local user with correct schema

INSERT INTO users ("firstName", "lastName", email, password, role, department, "isActive", "updatedAt") 
VALUES ('Admin', 'Local', 'admin@erp.local', '$2a$10$d4Rbdgc0auTrqYy8hOS.e.iVaq1D0id1UFIj16M5lhEK79Otf2DWW', 'ADMIN', 'Administration', true, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;

SELECT id, email, role, department FROM users ORDER BY id;

