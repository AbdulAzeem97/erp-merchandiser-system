import dbAdapter from './adapter.js';
import bcrypt from 'bcryptjs';

const users = [
    // Standardized Users (.com)
    { email: 'admin@horizonsourcing.com', password: 'admin123', role: 'ADMIN', firstName: 'Admin', lastName: 'User', username: 'admin_hs', department: 'Administration' },
    { email: 'hod.prepress@horizonsourcing.com', password: 'hod123', role: 'HOD_PREPRESS', firstName: 'HOD', lastName: 'Prepress', username: 'hodprepress', department: 'Prepress' },
    { email: 'designer@horizonsourcing.com', password: 'designer123', role: 'DESIGNER', firstName: 'Designer', lastName: 'User', username: 'designer', department: 'Prepress' },
    { email: 'qa.prepress@horizonsourcing.com', password: 'qa123', role: 'QA_PREPRESS', firstName: 'QA', lastName: 'Prepress', username: 'qaprepress', department: 'Quality Assurance' },
    { email: 'ctp.operator@horizonsourcing.com', password: 'ctp123', role: 'CTP_OPERATOR', firstName: 'CTP', lastName: 'Operator', username: 'ctpoperator', department: 'Prepress' },
    { email: 'inventory.manager@horizonsourcing.com', password: 'inventory123', role: 'INVENTORY_MANAGER', firstName: 'Inventory', lastName: 'Manager', username: 'inventorymanager', department: 'Inventory' },
    { email: 'procurement.manager@horizonsourcing.com', password: 'procurement123', role: 'PROCUREMENT_MANAGER', firstName: 'Procurement', lastName: 'Manager', username: 'procurementmanager', department: 'Procurement' },
    { email: 'production.manager@horizonsourcing.com', password: 'production123', role: 'PRODUCTION_MANAGER', firstName: 'Production', lastName: 'Manager', username: 'productionmanager', department: 'Production' },
    { email: 'cutting.head@horizonsourcing.com', password: 'production123', role: 'CUTTING_HEAD', firstName: 'Cutting', lastName: 'Head', username: 'cuttinghead', department: 'Cutting' },

    // Old Format Users (.net.pk)
    { email: 'designing@horizonsourcing.net.pk', password: 'designer123', role: 'DESIGNER', firstName: 'Designer', lastName: '1', username: 'designing', department: 'Prepress' },
    { email: 'designing2@horizonsourcing.net.pk', password: 'designer123', role: 'DESIGNER', firstName: 'Designer', lastName: '2', username: 'designing2', department: 'Prepress' },
    { email: 'designing3@horizonsourcing.net.pk', password: 'designer123', role: 'DESIGNER', firstName: 'Designer', lastName: '3', username: 'designing3', department: 'Prepress' },
    { email: 'designing4@horizonsourcing.net.pk', password: 'designer123', role: 'DESIGNER', firstName: 'Designer', lastName: '4', username: 'designing4', department: 'Prepress' },
    { email: 'kamran.khan@horizonsourcing.net.pk', password: 'kamran123', role: 'ADMIN', firstName: 'Kamran', lastName: 'Khan', username: 'kamran', department: 'Administration' },
    { email: 'admin1@horizonsourcing.net.pk', password: 'admin123', role: 'ADMIN', firstName: 'Admin', lastName: '1', username: 'admin1', department: 'Administration' },
    { email: 'admin2@horizonsourcing.net.pk', password: 'admin123', role: 'ADMIN', firstName: 'Admin', lastName: '2', username: 'admin2', department: 'Administration' },
    { email: 'qa1@horizonsourcing.net.pk', password: 'qa123', role: 'QA_PREPRESS', firstName: 'QA', lastName: '1', username: 'qa1', department: 'Quality Assurance' },
    { email: 'qa2@horizonsourcing.net.pk', password: 'qa123', role: 'QA_PREPRESS', firstName: 'QA', lastName: '2', username: 'qa2', department: 'Quality Assurance' },
    { email: 'hod1@horizonsourcing.net.pk', password: 'hod123', role: 'HOD_PREPRESS', firstName: 'HOD', lastName: '1', username: 'hod1', department: 'Prepress' },

    // Original Seed User
    { email: 'admin@erp.local', password: 'admin123', role: 'ADMIN', firstName: 'System', lastName: 'Admin', username: 'admin_local', department: 'IT' }
];

async function restoreUsers() {
    console.log('🚀 Starting User Restoration...');

    // Initialize database connection
    await dbAdapter.initialize();

    for (const user of users) {
        try {
            const hashedPassword = await bcrypt.hash(user.password, 10);

            const query = `
        INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          username = EXCLUDED.username,
          is_active = true
      `;

            await dbAdapter.query(query, [
                user.username,
                user.email,
                hashedPassword,
                user.firstName,
                user.lastName,
                user.role,
                true
            ]);

            console.log(`✅ Restored: ${user.email} (${user.role})`);
        } catch (error) {
            console.error(`❌ Failed to restore ${user.email}:`, error.message);
        }
    }

    console.log('🎉 Restoration Complete!');
    process.exit(0);
}

restoreUsers();
