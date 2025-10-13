-- Add admin@erp.local user

INSERT INTO users (username, email, password, role, "firstName", "lastName", "isActive", "updatedAt") 
VALUES ('admin_local', 'admin@erp.local', '$2a$10$O/gKLK4Axs7nvpf4ppCBAOJEh9k9h8atZ6LYo3y5AsePYdYj/awfe', 'ADMIN', 'Admin', 'Local', true, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;

SELECT email, role, "firstName", "lastName", "isActive" FROM users WHERE email = 'admin@erp.local';

SELECT 'Admin@erp.local user added successfully!' AS status;

