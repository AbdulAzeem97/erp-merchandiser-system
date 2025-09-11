import dbAdapter from './adapter.js';
import { v4 as uuidv4 } from 'uuid';

// Complete Production Departments and Processes Structure
const PRODUCTION_STRUCTURE = {
  // Director Level (Hierarchy Level 0)
  director: {
    name: 'Director of Production',
    code: 'DIRECTOR',
    description: 'Top custodian with complete visibility and control over all production operations',
    hierarchyLevel: 0,
    departmentType: 'MANAGEMENT',
    colorCode: '#1a365d'
  },
  
  // Department Level (Hierarchy Level 1) - HODs
  departments: [
    {
      name: 'Offset Printing',
      code: 'OFFSET',
      description: 'Offset printing department handling large volume printing',
      hierarchyLevel: 1,
      departmentType: 'PRODUCTION',
      colorCode: '#2d3748',
      location: 'Floor 1 - Production Wing A',
      capacityPerDay: 50000,
      processes: [
        'Prepress', 'Material Procurement', 'Material Issuance', 'Paper Cutting',
        'Offset Printing', 'Digital Printing', 'Varnish Matt', 'Varnish Gloss',
        'Varnish Soft Touch', 'Inlay Pasting', 'Lamination Matte', 'Foil Gloss',
        'Screen Printing', 'Embossing', 'Debossing', 'Pasting', 'Two way tape',
        'Die Cutting', 'Breaking', 'Piggy Sticker', 'RFID', 'Eyelet',
        'Out Source', 'Packing', 'Ready', 'Dispatch', 'Excess'
      ]
    },
    {
      name: 'Heat Transfer Label',
      code: 'HTL',
      description: 'Heat transfer label manufacturing department',
      hierarchyLevel: 1,
      departmentType: 'PRODUCTION',
      colorCode: '#744210',
      location: 'Floor 2 - Production Wing B',
      capacityPerDay: 30000,
      processes: [
        'Prepress', 'Material Procurement', 'Material Issuance', 'Exposing',
        'Printing', 'Die Cutting', 'Breaking', 'Packing', 'Ready', 
        'Dispatch', 'Excess'
      ]
    },
    {
      name: 'PFL (Printed Fabric Label)',
      code: 'PFL',
      description: 'Printed fabric label manufacturing department',
      hierarchyLevel: 1,
      departmentType: 'PRODUCTION',
      colorCode: '#553c9a',
      location: 'Floor 2 - Production Wing C',
      capacityPerDay: 25000,
      processes: [
        'Prepress', 'Material Procurement', 'Material Issuance', 'Block Making',
        'Printing', 'RFID', 'Cut & Fold', 'Curring', 'Packing', 'Ready',
        'Dispatch', 'Excess'
      ]
    },
    {
      name: 'Woven Label',
      code: 'WOVEN',
      description: 'Woven label manufacturing department',
      hierarchyLevel: 1,
      departmentType: 'PRODUCTION',
      colorCode: '#065f46',
      location: 'Floor 3 - Textile Wing',
      capacityPerDay: 20000,
      processes: [
        'Prepress', 'Material Procurement', 'Material Issuance', 'Dying',
        'Printing', 'Weaving', 'Screen Printing', 'Sliting', 'RFID',
        'Cut & Fold', 'Packing', 'Ready', 'Dispatch', 'Excess'
      ]
    },
    {
      name: 'Leather Patch',
      code: 'LEATHER',
      description: 'Leather patch manufacturing department',
      hierarchyLevel: 1,
      departmentType: 'PRODUCTION',
      colorCode: '#7c2d12',
      location: 'Floor 1 - Specialty Wing',
      capacityPerDay: 15000,
      processes: [
        'Prepress', 'Material Procurement', 'Material Issuance', 'Printing',
        'RFID', 'Ready', 'Dispatch'
      ]
    },
    {
      name: 'Digital Printing',
      code: 'DIGITAL',
      description: 'Digital printing department for small to medium runs',
      hierarchyLevel: 1,
      departmentType: 'PRODUCTION',
      colorCode: '#1e40af',
      location: 'Floor 1 - Digital Wing',
      capacityPerDay: 35000,
      processes: [
        'Prepress', 'Material Procurement', 'Material Issuance', 'Block Making',
        'Printing', 'Offset Printing', 'Die Cutting', 'Breaking', 'Packing',
        'Ready', 'Dispatch', 'Excess'
      ]
    }
  ],
  
  // Production roles and permissions
  roles: [
    {
      type: 'DIRECTOR',
      name: 'Director of Production',
      permissions: [
        'VIEW_ALL_DEPARTMENTS',
        'MANAGE_ALL_DEPARTMENTS',
        'VIEW_ALL_JOBS',
        'ASSIGN_JOBS',
        'REASSIGN_JOBS',
        'VIEW_REPORTS',
        'GENERATE_REPORTS',
        'MANAGE_USERS',
        'MANAGE_EQUIPMENT',
        'VIEW_ANALYTICS',
        'APPROVE_QUALITY',
        'MANAGE_WORKFLOWS'
      ]
    },
    {
      type: 'HOD',
      name: 'Head of Department',
      permissions: [
        'VIEW_DEPARTMENT_JOBS',
        'MANAGE_DEPARTMENT_JOBS',
        'ASSIGN_DEPARTMENT_JOBS',
        'VIEW_DEPARTMENT_REPORTS',
        'GENERATE_DEPARTMENT_REPORTS',
        'MANAGE_DEPARTMENT_USERS',
        'MANAGE_DEPARTMENT_EQUIPMENT',
        'APPROVE_DEPARTMENT_QUALITY',
        'VIEW_DEPARTMENT_ANALYTICS'
      ]
    },
    {
      type: 'SUPERVISOR',
      name: 'Production Supervisor',
      permissions: [
        'VIEW_ASSIGNED_JOBS',
        'UPDATE_JOB_STATUS',
        'ADD_JOB_REMARKS',
        'VIEW_TEAM_JOBS',
        'ASSIGN_TEAM_JOBS',
        'RECORD_MATERIAL_CONSUMPTION',
        'RECORD_EQUIPMENT_USAGE'
      ]
    },
    {
      type: 'OPERATOR',
      name: 'Production Operator',
      permissions: [
        'VIEW_ASSIGNED_JOBS',
        'UPDATE_JOB_STATUS',
        'ADD_JOB_REMARKS',
        'RECORD_MATERIAL_CONSUMPTION',
        'RECORD_EQUIPMENT_USAGE'
      ]
    },
    {
      type: 'QUALITY_INSPECTOR',
      name: 'Quality Inspector',
      permissions: [
        'VIEW_QUALITY_JOBS',
        'CONDUCT_QUALITY_CHECK',
        'APPROVE_QUALITY',
        'REJECT_QUALITY',
        'REQUEST_REWORK',
        'ADD_QUALITY_REMARKS'
      ]
    }
  ]
};

export async function seedProductionData() {
  console.log('🌱 Starting production module seeding...');
  
  try {
    // Create Director level department first
    console.log('👑 Creating Director of Production...');
    const directorDeptId = uuidv4();
    const directorDept = PRODUCTION_STRUCTURE.director;
    
    pool.prepare(`
      INSERT OR REPLACE INTO production_departments 
      (id, name, code, description, hierarchy_level, department_type, color_code, 
       is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
    `).run(
      directorDeptId, 
      directorDept.name, 
      directorDept.code, 
      directorDept.description,
      directorDept.hierarchyLevel,
      directorDept.departmentType,
      directorDept.colorCode
    );
    
    console.log(`  ✅ Created Director level: ${directorDept.name}`);
    
    // Insert departments
    console.log('📁 Creating production departments...');
    const departmentIds = {};
    departmentIds[directorDept.code] = directorDeptId;
    
    for (const dept of PRODUCTION_STRUCTURE.departments) {
      const deptId = uuidv4();
      departmentIds[dept.code] = deptId;
      
      pool.prepare(`
        INSERT OR REPLACE INTO production_departments 
        (id, name, code, description, parent_department_id, hierarchy_level, 
         department_type, color_code, location, capacity_per_day, 
         is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
      `).run(
        deptId, 
        dept.name, 
        dept.code, 
        dept.description, 
        directorDeptId, // Parent is director
        dept.hierarchyLevel,
        dept.departmentType,
        dept.colorCode,
        dept.location,
        dept.capacityPerDay
      );
      
      console.log(`  ✅ Created department: ${dept.name} (${dept.code})`);
      
      // Insert processes for this department
      console.log(`  🔄 Adding processes for ${dept.name}...`);
      dept.processes.forEach((processName, index) => {
        const processId = uuidv4();
        const processCode = `${dept.code}_${processName.replace(/\s+/g, '_').toUpperCase()}`;
        
        pool.prepare(`
          INSERT OR REPLACE INTO production_processes 
          (id, department_id, name, code, sequence_order, estimated_duration_hours, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
        `).run(processId, deptId, processName, processCode, index + 1, getEstimatedHours(processName));
      });
      
      console.log(`    ✅ Added ${dept.processes.length} processes`);
    }
    
    // Create default production workflows
    console.log('🔄 Creating default production workflows...');
    
    const productTypes = ['Offset', 'Heat Transfer Label', 'PFL', 'Woven', 'Leather Patch', 'Digital'];
    
    productTypes.forEach(productType => {
      const workflowId = uuidv4();
      const matchingDept = PRODUCTION_STRUCTURE.departments.find(d => 
        d.name.toLowerCase().includes(productType.toLowerCase()) || 
        productType.toLowerCase().includes(d.name.toLowerCase())
      );
      
      if (matchingDept) {
        const workflowSteps = matchingDept.processes.map((process, index) => ({
          department: matchingDept.code,
          process: process,
          order: index + 1,
          estimated_hours: getEstimatedHours(process)
        }));
        
        // First get or create a system user
        let systemUserId = pool.prepare('SELECT id FROM users WHERE username = ?').get('system');
        if (!systemUserId) {
          systemUserId = uuidv4();
          pool.prepare(`
            INSERT OR REPLACE INTO users 
            (id, username, email, password_hash, first_name, last_name, role, created_at, updated_at)
            VALUES (?, 'system', 'system@company.com', 'system', 'System', 'User', 'admin', datetime('now'), datetime('now'))
          `).run(systemUserId);
        } else {
          systemUserId = systemUserId.id;
        }

        pool.prepare(`
          INSERT OR REPLACE INTO production_workflows 
          (id, name, product_type, workflow_steps, is_default, is_active, created_by, created_at, updated_at)
          VALUES (?, ?, ?, ?, 1, 1, ?, datetime('now'), datetime('now'))
        `).run(
          workflowId, 
          `Default ${productType} Workflow`, 
          productType, 
          JSON.stringify(workflowSteps),
          systemUserId
        );
        
        console.log(`  ✅ Created workflow for ${productType}`);
      }
    });
    
    // Create default equipment for each department
    console.log('🏭 Creating default equipment...');
    
    const equipmentTypes = {
      'OFFSET': [
        { name: 'Offset Press Machine 1', type: 'PRINTING_PRESS', model: 'Heidelberg SM 74' },
        { name: 'Offset Press Machine 2', type: 'PRINTING_PRESS', model: 'KBA Rapida 105' },
        { name: 'Digital Press', type: 'DIGITAL_PRESS', model: 'HP Indigo 12000' },
        { name: 'Die Cutting Machine', type: 'DIE_CUTTING', model: 'Bobst SP 102-E' },
        { name: 'Laminating Machine', type: 'LAMINATION', model: 'Autobond 76' }
      ],
      'HTL': [
        { name: 'Heat Transfer Press', type: 'HEAT_TRANSFER', model: 'Schulze HT-2000' },
        { name: 'Digital Printer HTL', type: 'DIGITAL_PRESS', model: 'Epson SureColor F9470H' }
      ],
      'PFL': [
        { name: 'Fabric Printing Machine', type: 'FABRIC_PRESS', model: 'M&R Challenger III' },
        { name: 'Block Making Station', type: 'BLOCK_MAKING', model: 'Manual Station' }
      ],
      'WOVEN': [
        { name: 'Weaving Loom 1', type: 'WEAVING_LOOM', model: 'Picanol OMNIplus 800' },
        { name: 'Weaving Loom 2', type: 'WEAVING_LOOM', model: 'Tsudakoma ZAX-e' },
        { name: 'Dying Machine', type: 'DYING', model: 'Thies Jet Dyeing' }
      ],
      'LEATHER': [
        { name: 'Leather Cutting Machine', type: 'CUTTING', model: 'Atom Eco H Series' },
        { name: 'Leather Stamping Press', type: 'STAMPING', model: 'Hydraulic Press 50T' }
      ],
      'DIGITAL': [
        { name: 'Digital Press 1', type: 'DIGITAL_PRESS', model: 'Xerox Iridesse' },
        { name: 'Digital Press 2', type: 'DIGITAL_PRESS', model: 'Canon imagePRESS C10010VP' },
        { name: 'Finishing Station', type: 'FINISHING', model: 'Duplo DC-618' }
      ]
    };
    
    Object.entries(equipmentTypes).forEach(([deptCode, equipment]) => {
      const deptId = departmentIds[deptCode];
      if (deptId) {
        equipment.forEach(eq => {
          const equipmentId = uuidv4();
          const equipmentCode = `${deptCode}_${eq.name.replace(/\s+/g, '_').toUpperCase()}`;
          
          pool.prepare(`
            INSERT OR REPLACE INTO production_equipment 
            (id, name, code, department_id, type, model, status, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'AVAILABLE', 1, datetime('now'), datetime('now'))
          `).run(equipmentId, eq.name, equipmentCode, deptId, eq.type, eq.model);
        });
        
        console.log(`  ✅ Created ${equipment.length} equipment for ${deptCode}`);
      }
    });
    
    console.log('✅ Production module seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - ${PRODUCTION_STRUCTURE.departments.length} departments created`);
    console.log(`   - ${PRODUCTION_STRUCTURE.departments.reduce((sum, d) => sum + d.processes.length, 0)} processes created`);
    console.log(`   - ${productTypes.length} default workflows created`);
    console.log(`   - ${Object.values(equipmentTypes).reduce((sum, eq) => sum + eq.length, 0)} equipment created`);
    
  } catch (error) {
    console.error('❌ Error seeding production data:', error);
    throw error;
  }
}

function getEstimatedHours(processName) {
  const estimatedHours = {
    'Prepress': 2,
    'Material Procurement': 1,
    'Material Issuance': 0.5,
    'Paper Cutting': 1,
    'Offset Printing': 4,
    'Digital Printing': 2,
    'Varnish Matt': 2,
    'Varnish Gloss': 2,
    'Varnish Soft Touch': 2,
    'Inlay Pasting': 1,
    'Lamination Matte': 1.5,
    'Lamination Gloss': 1.5,
    'Lamination Soft Touch': 1.5,
    'UV': 1,
    'Foil Matte': 2,
    'Foil Gloss': 2,
    'Screen Printing': 3,
    'Embossing': 2,
    'Debossing': 2,
    'Pasting': 1,
    'Two way tape': 0.5,
    'Die Cutting': 2,
    'Breaking': 1,
    'Piggy Sticker': 0.5,
    'RFID': 1,
    'Eyelet': 0.5,
    'Out Source': 24,
    'Packing': 2,
    'Ready': 0.5,
    'Dispatch': 1,
    'Excess': 0.5,
    'Exposing': 1,
    'Block Making': 3,
    'Dying': 4,
    'Weaving': 6,
    'Sliting': 1,
    'Cut & Fold': 1.5,
    'Curring': 2,
    'Crushing': 1
  };
  
  return estimatedHours[processName] || 2;
}

// Export the structure for use in other modules
export { PRODUCTION_STRUCTURE };

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedProductionData();
}