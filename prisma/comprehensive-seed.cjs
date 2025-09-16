const { PrismaClient } = require('../generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed with exact data structure...');

  // Create Categories (Exactly as before)
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Hang Tags' },
      update: {},
      create: { name: 'Hang Tags', description: 'Product identification tags' }
    }),
    prisma.category.upsert({
      where: { name: 'Price Tags' },
      update: {},
      create: { name: 'Price Tags', description: 'Pricing information tags' }
    }),
    prisma.category.upsert({
      where: { name: 'Care Labels' },
      update: {},
      create: { name: 'Care Labels', description: 'Care instruction labels' }
    }),
    prisma.category.upsert({
      where: { name: 'Size Labels' },
      update: {},
      create: { name: 'Size Labels', description: 'Size specification labels' }
    }),
    prisma.category.upsert({
      where: { name: 'Brand Labels' },
      update: {},
      create: { name: 'Brand Labels', description: 'Brand identification labels' }
    }),
    prisma.category.upsert({
      where: { name: 'Woven Labels' },
      update: {},
      create: { name: 'Woven Labels', description: 'Woven fabric labels' }
    }),
    prisma.category.upsert({
      where: { name: 'Heat Transfer Labels' },
      update: {},
      create: { name: 'Heat Transfer Labels', description: 'Heat transfer vinyl labels' }
    }),
    prisma.category.upsert({
      where: { name: 'Leather Patches' },
      update: {},
      create: { name: 'Leather Patches', description: 'Leather patch labels' }
    })
  ]);
  console.log('✅ Categories created');

  // Create ALL Materials (Including Art Paper, CS1, CS2, etc.)
  const materials = await Promise.all([
    // Paper Materials
    prisma.material.upsert({
      where: { name: 'Art Paper' },
      update: {},
      create: { name: 'Art Paper', unit: 'sheets', costPerUnit: 0.25 }
    }),
    prisma.material.upsert({
      where: { name: 'Art Card' },
      update: {},
      create: { name: 'Art Card', unit: 'sheets', costPerUnit: 0.30 }
    }),
    prisma.material.upsert({
      where: { name: 'Craft Card' },
      update: {},
      create: { name: 'Craft Card', unit: 'sheets', costPerUnit: 0.20 }
    }),
    prisma.material.upsert({
      where: { name: 'CS1 (Coated Paper 1-side)' },
      update: {},
      create: { name: 'CS1 (Coated Paper 1-side)', unit: 'sheets', costPerUnit: 0.18 }
    }),
    prisma.material.upsert({
      where: { name: 'CS2 (Coated Paper 2-side)' },
      update: {},
      create: { name: 'CS2 (Coated Paper 2-side)', unit: 'sheets', costPerUnit: 0.22 }
    }),
    prisma.material.upsert({
      where: { name: 'Maplitho Paper' },
      update: {},
      create: { name: 'Maplitho Paper', unit: 'sheets', costPerUnit: 0.15 }
    }),
    prisma.material.upsert({
      where: { name: 'Bond Paper' },
      update: {},
      create: { name: 'Bond Paper', unit: 'sheets', costPerUnit: 0.12 }
    }),
    prisma.material.upsert({
      where: { name: 'Newsprint Paper' },
      update: {},
      create: { name: 'Newsprint Paper', unit: 'sheets', costPerUnit: 0.08 }
    }),
    prisma.material.upsert({
      where: { name: 'Kraft Paper' },
      update: {},
      create: { name: 'Kraft Paper', unit: 'sheets', costPerUnit: 0.14 }
    }),

    // Synthetic Materials
    prisma.material.upsert({
      where: { name: 'Tyvek' },
      update: {},
      create: { name: 'Tyvek', unit: 'sheets', costPerUnit: 0.45 }
    }),
    prisma.material.upsert({
      where: { name: 'Yupo Paper' },
      update: {},
      create: { name: 'Yupo Paper', unit: 'sheets', costPerUnit: 0.35 }
    }),
    prisma.material.upsert({
      where: { name: 'PVC Sheet' },
      update: {},
      create: { name: 'PVC Sheet', unit: 'sheets', costPerUnit: 0.50 }
    }),
    prisma.material.upsert({
      where: { name: 'Vinyl Sticker' },
      update: {},
      create: { name: 'Vinyl Sticker', unit: 'sqm', costPerUnit: 2.50 }
    }),

    // Fabric Materials
    prisma.material.upsert({
      where: { name: 'Cotton Fabric' },
      update: {},
      create: { name: 'Cotton Fabric', unit: 'meters', costPerUnit: 1.25 }
    }),
    prisma.material.upsert({
      where: { name: 'Polyester Fabric' },
      update: {},
      create: { name: 'Polyester Fabric', unit: 'meters', costPerUnit: 0.85 }
    }),
    prisma.material.upsert({
      where: { name: 'Satin Fabric' },
      update: {},
      create: { name: 'Satin Fabric', unit: 'meters', costPerUnit: 1.80 }
    }),
    prisma.material.upsert({
      where: { name: 'Woven Cotton' },
      update: {},
      create: { name: 'Woven Cotton', unit: 'meters', costPerUnit: 1.50 }
    }),

    // Leather Materials
    prisma.material.upsert({
      where: { name: 'Genuine Leather' },
      update: {},
      create: { name: 'Genuine Leather', unit: 'sqft', costPerUnit: 5.00 }
    }),
    prisma.material.upsert({
      where: { name: 'PU Leather' },
      update: {},
      create: { name: 'PU Leather', unit: 'sqft', costPerUnit: 2.50 }
    }),
    prisma.material.upsert({
      where: { name: 'Suede Leather' },
      update: {},
      create: { name: 'Suede Leather', unit: 'sqft', costPerUnit: 6.00 }
    }),

    // Printing Materials
    prisma.material.upsert({
      where: { name: 'Ink CMYK' },
      update: {},
      create: { name: 'Ink CMYK', unit: 'ml', costPerUnit: 0.02 }
    }),
    prisma.material.upsert({
      where: { name: 'Spot Color Ink' },
      update: {},
      create: { name: 'Spot Color Ink', unit: 'ml', costPerUnit: 0.03 }
    }),
    prisma.material.upsert({
      where: { name: 'Metallic Ink' },
      update: {},
      create: { name: 'Metallic Ink', unit: 'ml', costPerUnit: 0.05 }
    }),
    prisma.material.upsert({
      where: { name: 'Varnish Matt' },
      update: {},
      create: { name: 'Varnish Matt', unit: 'ml', costPerUnit: 0.04 }
    }),
    prisma.material.upsert({
      where: { name: 'Varnish Gloss' },
      update: {},
      create: { name: 'Varnish Gloss', unit: 'ml', costPerUnit: 0.04 }
    }),
    prisma.material.upsert({
      where: { name: 'Lamination Film' },
      update: {},
      create: { name: 'Lamination Film', unit: 'meters', costPerUnit: 0.75 }
    }),

    // Accessories
    prisma.material.upsert({
      where: { name: 'Eyelets' },
      update: {},
      create: { name: 'Eyelets', unit: 'pcs', costPerUnit: 0.02 }
    }),
    prisma.material.upsert({
      where: { name: 'Two Way Tape' },
      update: {},
      create: { name: 'Two Way Tape', unit: 'meters', costPerUnit: 0.15 }
    }),
    prisma.material.upsert({
      where: { name: 'RFID Tags' },
      update: {},
      create: { name: 'RFID Tags', unit: 'pcs', costPerUnit: 0.50 }
    }),
    prisma.material.upsert({
      where: { name: 'String/Thread' },
      update: {},
      create: { name: 'String/Thread', unit: 'meters', costPerUnit: 0.01 }
    }),
    prisma.material.upsert({
      where: { name: 'Safety Pin' },
      update: {},
      create: { name: 'Safety Pin', unit: 'pcs', costPerUnit: 0.03 }
    })
  ]);
  console.log('✅ Materials created (including Art Paper, CS1, CS2, etc.)');

  // Create Users
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@erp.local' },
      update: {},
      create: {
        username: 'admin',
        email: 'admin@erp.local',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'ADMIN',
        phone: '+1234567890'
      }
    }),
    prisma.user.upsert({
      where: { email: 'director@erp.local' },
      update: {},
      create: {
        username: 'director',
        email: 'director@erp.local',
        password: hashedPassword,
        firstName: 'Production',
        lastName: 'Director',
        role: 'ADMIN',
        phone: '+1234567891'
      }
    }),
    prisma.user.upsert({
      where: { email: 'manager@erp.local' },
      update: {},
      create: {
        username: 'manager',
        email: 'manager@erp.local',
        password: hashedPassword,
        firstName: 'Production',
        lastName: 'Manager',
        role: 'MANAGER',
        phone: '+1234567892'
      }
    }),
    prisma.user.upsert({
      where: { email: 'productionhead@erp.local' },
      update: {},
      create: {
        username: 'productionhead',
        email: 'productionhead@erp.local',
        password: hashedPassword,
        firstName: 'Production',
        lastName: 'Head',
        role: 'PRODUCTION_HEAD',
        phone: '+1234567893'
      }
    }),
    prisma.user.upsert({
      where: { email: 'operator1@erp.local' },
      update: {},
      create: {
        username: 'operator1',
        email: 'operator1@erp.local',
        password: hashedPassword,
        firstName: 'Machine',
        lastName: 'Operator',
        role: 'OPERATOR',
        phone: '+1234567894'
      }
    })
  ]);
  console.log('✅ Users created');

  // Create Companies
  const companies = await Promise.all([
    prisma.company.upsert({
      where: { name: 'Nike Inc.' },
      update: {},
      create: {
        name: 'Nike Inc.',
        address: '123 Nike St, Oregon, USA',
        phone: '+1-555-0123',
        email: 'orders@nike.com',
        website: 'https://nike.com'
      }
    }),
    prisma.company.upsert({
      where: { name: 'Adidas AG' },
      update: {},
      create: {
        name: 'Adidas AG',
        address: '456 Adidas Ave, Germany',
        phone: '+49-555-0456',
        email: 'procurement@adidas.com',
        website: 'https://adidas.com'
      }
    }),
    prisma.company.upsert({
      where: { name: 'Puma SE' },
      update: {},
      create: {
        name: 'Puma SE',
        address: '789 Puma Rd, Germany',
        phone: '+49-555-0789',
        email: 'orders@puma.com',
        website: 'https://puma.com'
      }
    }),
    prisma.company.upsert({
      where: { name: 'Under Armour Inc.' },
      update: {},
      create: {
        name: 'Under Armour Inc.',
        address: '321 UA Blvd, Maryland, USA',
        phone: '+1-555-0321',
        email: 'procurement@underarmour.com',
        website: 'https://underarmour.com'
      }
    }),
    prisma.company.upsert({
      where: { name: 'H&M Hennes & Mauritz' },
      update: {},
      create: {
        name: 'H&M Hennes & Mauritz',
        address: '654 Fashion St, Stockholm, Sweden',
        phone: '+46-555-0654',
        email: 'orders@hm.com',
        website: 'https://hm.com'
      }
    })
  ]);
  console.log('✅ Companies created');

  // Create Products
  const products = await Promise.all([
    // Hang Tags
    prisma.product.upsert({
      where: { sku: 'HT-001-NIKE' },
      update: {},
      create: {
        name: 'Nike Hang Tag - Premium',
        description: 'Premium hang tag for Nike products',
        sku: 'HT-001-NIKE',
        categoryId: categories[0].id,
        brand: 'Nike',
        gsm: 300,
        fscCertified: true,
        basePrice: 0.35
      }
    }),
    prisma.product.upsert({
      where: { sku: 'HT-002-ADIDAS' },
      update: {},
      create: {
        name: 'Adidas Hang Tag - Standard',
        description: 'Standard hang tag for Adidas products',
        sku: 'HT-002-ADIDAS',
        categoryId: categories[0].id,
        brand: 'Adidas',
        gsm: 250,
        fscCertified: true,
        basePrice: 0.30
      }
    }),

    // Price Tags
    prisma.product.upsert({
      where: { sku: 'PT-001-PUMA' },
      update: {},
      create: {
        name: 'Puma Price Tag',
        description: 'Price tag for Puma products',
        sku: 'PT-001-PUMA',
        categoryId: categories[1].id,
        brand: 'Puma',
        gsm: 200,
        basePrice: 0.20
      }
    }),

    // Care Labels
    prisma.product.upsert({
      where: { sku: 'CL-001-UA' },
      update: {},
      create: {
        name: 'Under Armour Care Label',
        description: 'Care instruction label for Under Armour',
        sku: 'CL-001-UA',
        categoryId: categories[2].id,
        brand: 'Under Armour',
        gsm: 150,
        basePrice: 0.15
      }
    }),

    // Woven Labels
    prisma.product.upsert({
      where: { sku: 'WL-001-HM' },
      update: {},
      create: {
        name: 'H&M Woven Brand Label',
        description: 'Woven brand label for H&M garments',
        sku: 'WL-001-HM',
        categoryId: categories[5].id,
        brand: 'H&M',
        basePrice: 0.45
      }
    })
  ]);
  console.log('✅ Products created');

  // Create EXACT Process Sequences with ALL departments (Compulsory and Optional)
  const sequences = await Promise.all([
    // 1. Offset Printing Process (COMPLETE)
    prisma.processSequence.upsert({
      where: { name: 'Offset Printing Production' },
      update: {},
      create: {
        name: 'Offset Printing Production',
        description: 'Complete offset printing production workflow with all departments'
      }
    }),
    // 2. Heat Transfer Label Process
    prisma.processSequence.upsert({
      where: { name: 'Heat Transfer Label Production' },
      update: {},
      create: {
        name: 'Heat Transfer Label Production',
        description: 'Heat transfer label production workflow'
      }
    }),
    // 3. PFL (Printed Fabric Label) Process
    prisma.processSequence.upsert({
      where: { name: 'PFL Production' },
      update: {},
      create: {
        name: 'PFL Production',
        description: 'Printed fabric label production workflow'
      }
    }),
    // 4. Woven Label Process
    prisma.processSequence.upsert({
      where: { name: 'Woven Label Production' },
      update: {},
      create: {
        name: 'Woven Label Production',
        description: 'Woven label production workflow'
      }
    }),
    // 5. Leather Patch Process
    prisma.processSequence.upsert({
      where: { name: 'Leather Patch Production' },
      update: {},
      create: {
        name: 'Leather Patch Production',
        description: 'Leather patch production workflow'
      }
    }),
    // 6. Digital Printing Process
    prisma.processSequence.upsert({
      where: { name: 'Digital Printing Production' },
      update: {},
      create: {
        name: 'Digital Printing Production',
        description: 'Digital printing production workflow'
      }
    })
  ]);
  console.log('✅ Process sequences created');

  // Create COMPLETE Process Steps for Offset Printing (ALL 31 processes)
  const offsetSteps = [
    { name: 'Prepress', description: 'File preparation and proofing', duration: 2.0 },
    { name: 'Material Procurement', description: 'Source and procure printing materials', duration: 1.0 },
    { name: 'Material Issuance', description: 'Issue materials to production floor', duration: 0.5 },
    { name: 'Paper Cutting', description: 'Cut paper to required dimensions', duration: 1.0 },
    { name: 'Offset Printing', description: 'Main offset printing process', duration: 4.0 },
    { name: 'Digital Printing', description: 'Digital printing for small runs or details', duration: 2.0 },
    { name: 'Varnish Matt', description: 'Apply matt varnish coating', duration: 1.5 },
    { name: 'Varnish Gloss', description: 'Apply gloss varnish coating', duration: 1.5 },
    { name: 'Varnish Soft Touch', description: 'Apply soft touch varnish', duration: 2.0 },
    { name: 'Inlay Pasting', description: 'Paste inlay materials', duration: 1.0 },
    { name: 'Lamination Matte', description: 'Apply matte lamination', duration: 1.5 },
    { name: 'Lamination Gloss', description: 'Apply gloss lamination', duration: 1.5 },
    { name: 'Lamination Soft Touch', description: 'Apply soft touch lamination', duration: 2.0 },
    { name: 'UV Coating', description: 'Apply UV protective coating', duration: 1.0 },
    { name: 'Foil Matte', description: 'Apply matte foil stamping', duration: 2.0 },
    { name: 'Foil Gloss', description: 'Apply gloss foil stamping', duration: 2.0 },
    { name: 'Screen Printing', description: 'Screen printing overlay process', duration: 3.0 },
    { name: 'Embossing', description: 'Embossing process for raised effect', duration: 2.0 },
    { name: 'Debossing', description: 'Debossing process for depressed effect', duration: 2.0 },
    { name: 'Pasting', description: 'General pasting operations', duration: 1.0 },
    { name: 'Two Way Tape', description: 'Apply two-way adhesive tape', duration: 0.5 },
    { name: 'Die Cutting', description: 'Die cutting to final shape', duration: 2.0 },
    { name: 'Breaking', description: 'Breaking/separation process', duration: 1.0 },
    { name: 'Piggy Sticker', description: 'Apply piggy back stickers', duration: 0.5 },
    { name: 'RFID', description: 'RFID tag application', duration: 1.0 },
    { name: 'Eyelet', description: 'Eyelet insertion', duration: 0.5 },
    { name: 'Out Source', description: 'External outsourced processes', duration: 8.0 },
    { name: 'Packing', description: 'Final packaging process', duration: 1.0 },
    { name: 'Ready', description: 'Quality check and ready status', duration: 0.5 },
    { name: 'Dispatch', description: 'Dispatch to customer', duration: 0.5 },
    { name: 'Excess', description: 'Handle excess materials/wastage', duration: 0.5 }
  ];

  for (let i = 0; i < offsetSteps.length; i++) {
    const step = offsetSteps[i];
    await prisma.processStep.create({
      data: {
        sequenceId: sequences[0].id, // Offset Printing
        stepNumber: i + 1,
        name: step.name,
        description: step.description,
        estimatedDuration: step.duration,
        isQualityCheck: ['Prepress', 'Ready'].includes(step.name),
        isActive: true
      }
    });
  }

  // Create Heat Transfer Steps
  const heatTransferSteps = [
    { name: 'Prepress', description: 'Heat transfer design preparation', duration: 1.5 },
    { name: 'Material Procurement', description: 'Source heat transfer materials', duration: 1.0 },
    { name: 'Material Issuance', description: 'Issue heat transfer materials', duration: 0.5 },
    { name: 'Exposing', description: 'Expose heat transfer film', duration: 2.0 },
    { name: 'Printing', description: 'Print heat transfer design', duration: 3.0 },
    { name: 'Die Cutting', description: 'Die cut heat transfer labels', duration: 1.5 },
    { name: 'Breaking', description: 'Break/separate labels', duration: 1.0 },
    { name: 'Packing', description: 'Pack heat transfer labels', duration: 1.0 },
    { name: 'Ready', description: 'Ready for dispatch', duration: 0.5 },
    { name: 'Dispatch', description: 'Dispatch heat transfer labels', duration: 0.5 },
    { name: 'Excess', description: 'Handle excess materials', duration: 0.5 }
  ];

  for (let i = 0; i < heatTransferSteps.length; i++) {
    const step = heatTransferSteps[i];
    await prisma.processStep.create({
      data: {
        sequenceId: sequences[1].id, // Heat Transfer
        stepNumber: i + 1,
        name: step.name,
        description: step.description,
        estimatedDuration: step.duration,
        isQualityCheck: ['Prepress', 'Ready'].includes(step.name),
        isActive: true
      }
    });
  }

  // Create PFL Steps
  const pflSteps = [
    { name: 'Prepress', description: 'PFL design preparation', duration: 1.5 },
    { name: 'Material Procurement', description: 'Source PFL materials', duration: 1.0 },
    { name: 'Material Issuance', description: 'Issue PFL materials', duration: 0.5 },
    { name: 'Block Making', description: 'Create printing blocks', duration: 3.0 },
    { name: 'Printing', description: 'Print film labels', duration: 4.0 },
    { name: 'RFID', description: 'Apply RFID to PFL', duration: 1.0 },
    { name: 'Cut & Fold', description: 'Cut and fold PFL', duration: 2.0 },
    { name: 'Curing', description: 'Cure printed labels', duration: 4.0 },
    { name: 'Packing', description: 'Pack PFL products', duration: 1.0 },
    { name: 'Ready', description: 'Ready for dispatch', duration: 0.5 },
    { name: 'Dispatch', description: 'Dispatch PFL products', duration: 0.5 },
    { name: 'Excess', description: 'Handle excess materials', duration: 0.5 }
  ];

  for (let i = 0; i < pflSteps.length; i++) {
    const step = pflSteps[i];
    await prisma.processStep.create({
      data: {
        sequenceId: sequences[2].id, // PFL
        stepNumber: i + 1,
        name: step.name,
        description: step.description,
        estimatedDuration: step.duration,
        isQualityCheck: ['Prepress', 'Ready'].includes(step.name),
        isActive: true
      }
    });
  }

  // Create Woven Label Steps
  const wovenSteps = [
    { name: 'Prepress', description: 'Woven label design preparation', duration: 2.0 },
    { name: 'Material Procurement', description: 'Source woven materials', duration: 1.0 },
    { name: 'Material Issuance', description: 'Issue woven materials', duration: 0.5 },
    { name: 'Dyeing', description: 'Dye woven materials', duration: 6.0 },
    { name: 'Printing', description: 'Print on fabric before weaving', duration: 3.0 },
    { name: 'Weaving', description: 'Weave label fabric', duration: 8.0 },
    { name: 'Screen Printing', description: 'Screen print on woven labels', duration: 3.0 },
    { name: 'Slitting', description: 'Slit woven labels', duration: 2.0 },
    { name: 'RFID', description: 'Apply RFID to woven labels', duration: 1.0 },
    { name: 'Cut & Fold', description: 'Cut and fold woven labels', duration: 2.0 },
    { name: 'Packing', description: 'Pack woven labels', duration: 1.0 },
    { name: 'Ready', description: 'Ready for dispatch', duration: 0.5 },
    { name: 'Dispatch', description: 'Dispatch woven labels', duration: 0.5 },
    { name: 'Excess', description: 'Handle excess materials', duration: 0.5 }
  ];

  for (let i = 0; i < wovenSteps.length; i++) {
    const step = wovenSteps[i];
    await prisma.processStep.create({
      data: {
        sequenceId: sequences[3].id, // Woven
        stepNumber: i + 1,
        name: step.name,
        description: step.description,
        estimatedDuration: step.duration,
        isQualityCheck: ['Prepress', 'Ready'].includes(step.name),
        isActive: true
      }
    });
  }

  // Create Leather Patch Steps
  const leatherSteps = [
    { name: 'Prepress', description: 'Leather patch design preparation', duration: 1.5 },
    { name: 'Material Procurement', description: 'Source leather materials', duration: 1.0 },
    { name: 'Material Issuance', description: 'Issue leather materials', duration: 0.5 },
    { name: 'Printing', description: 'Print on leather patches', duration: 3.0 },
    { name: 'RFID', description: 'Apply RFID to leather patches', duration: 1.0 },
    { name: 'Ready', description: 'Ready leather patches', duration: 0.5 },
    { name: 'Dispatch', description: 'Dispatch leather patches', duration: 0.5 },
    { name: 'Excess', description: 'Handle excess materials', duration: 0.5 }
  ];

  for (let i = 0; i < leatherSteps.length; i++) {
    const step = leatherSteps[i];
    await prisma.processStep.create({
      data: {
        sequenceId: sequences[4].id, // Leather
        stepNumber: i + 1,
        name: step.name,
        description: step.description,
        estimatedDuration: step.duration,
        isQualityCheck: ['Prepress', 'Ready'].includes(step.name),
        isActive: true
      }
    });
  }

  // Create Digital Printing Steps
  const digitalSteps = [
    { name: 'Prepress', description: 'Digital printing file preparation', duration: 1.0 },
    { name: 'Material Procurement', description: 'Source digital printing materials', duration: 1.0 },
    { name: 'Material Issuance', description: 'Issue digital printing materials', duration: 0.5 },
    { name: 'Block Making', description: 'Create digital blocks if needed', duration: 2.0 },
    { name: 'Printing', description: 'Digital printing process', duration: 2.0 },
    { name: 'Offset Printing', description: 'Hybrid offset printing', duration: 3.0 },
    { name: 'Die Cutting', description: 'Die cut digital products', duration: 1.5 },
    { name: 'Breaking', description: 'Break/separate products', duration: 1.0 },
    { name: 'Packing', description: 'Pack digital products', duration: 1.0 },
    { name: 'Ready', description: 'Ready for dispatch', duration: 0.5 },
    { name: 'Dispatch', description: 'Dispatch digital products', duration: 0.5 },
    { name: 'Excess', description: 'Handle excess materials', duration: 0.5 }
  ];

  for (let i = 0; i < digitalSteps.length; i++) {
    const step = digitalSteps[i];
    await prisma.processStep.create({
      data: {
        sequenceId: sequences[5].id, // Digital
        stepNumber: i + 1,
        name: step.name,
        description: step.description,
        estimatedDuration: step.duration,
        isQualityCheck: ['Prepress', 'Ready'].includes(step.name),
        isActive: true
      }
    });
  }

  console.log('✅ Process steps created with complete workflows');

  // Create Inventory Items for ALL materials
  console.log('📦 Creating inventory items...');
  for (const material of materials) {
    await prisma.inventoryItem.create({
      data: {
        materialId: material.id,
        quantity: Math.floor(Math.random() * 5000) + 1000, // Random stock 1000-6000
        minStock: 100,
        maxStock: 10000,
        location: `Warehouse-${material.name.substring(0, 3).toUpperCase()}`
      }
    });
  }

  // Create Product Process Selections (Default sequences for products)
  await Promise.all([
    prisma.productProcessSelection.create({
      data: {
        productId: products[0].id, // Nike Hang Tag
        sequenceId: sequences[0].id, // Offset Printing
        isDefault: true
      }
    }),
    prisma.productProcessSelection.create({
      data: {
        productId: products[1].id, // Adidas Hang Tag
        sequenceId: sequences[0].id, // Offset Printing
        isDefault: true
      }
    }),
    prisma.productProcessSelection.create({
      data: {
        productId: products[4].id, // H&M Woven Label
        sequenceId: sequences[3].id, // Woven Production
        isDefault: true
      }
    })
  ]);

  // Create System Configuration
  await Promise.all([
    prisma.systemConfig.upsert({
      where: { key: 'system_name' },
      update: {},
      create: {
        key: 'system_name',
        value: 'ERP Merchandiser System - Production Ready',
        description: 'System display name'
      }
    }),
    prisma.systemConfig.upsert({
      where: { key: 'default_currency' },
      update: {},
      create: {
        key: 'default_currency',
        value: 'USD',
        description: 'Default system currency'
      }
    }),
    prisma.systemConfig.upsert({
      where: { key: 'max_concurrent_jobs' },
      update: {},
      create: {
        key: 'max_concurrent_jobs',
        value: '200',
        description: 'Maximum concurrent job cards for 200+ users'
      }
    }),
    prisma.systemConfig.upsert({
      where: { key: 'production_departments' },
      update: {},
      create: {
        key: 'production_departments',
        value: 'Offset,Heat Transfer,PFL,Woven,Leather,Digital',
        description: 'Available production departments'
      }
    })
  ]);

  console.log('✅ System configuration completed');

  console.log('🎉 Comprehensive database seeding completed successfully!');
  console.log('\n📋 COMPLETE Summary:');
  console.log(`   - Categories: ${categories.length} (including all label types)`);
  console.log(`   - Materials: ${materials.length} (Art Paper, CS1, CS2, all types)`);
  console.log(`   - Users: ${users.length} (Admin, Director, Manager, Production Head, Operators)`);
  console.log(`   - Companies: ${companies.length} (Nike, Adidas, Puma, Under Armour, H&M)`);
  console.log(`   - Products: ${products.length} (Brand-specific products)`);
  console.log(`   - Process Sequences: ${sequences.length} (All production departments)`);
  console.log(`   - Offset Steps: ${offsetSteps.length} (Complete 31-step process)`);
  console.log(`   - Heat Transfer Steps: ${heatTransferSteps.length}`);
  console.log(`   - PFL Steps: ${pflSteps.length}`);
  console.log(`   - Woven Steps: ${wovenSteps.length}`);
  console.log(`   - Leather Steps: ${leatherSteps.length}`);
  console.log(`   - Digital Steps: ${digitalSteps.length}`);
  console.log(`   - Inventory Items: ${materials.length} (Full stock management)`);
  console.log('\n🏭 Production Departments:');
  console.log('   ✅ Offset Printing (31 processes) - COMPULSORY & OPTIONAL');
  console.log('   ✅ Heat Transfer Label (11 processes)');
  console.log('   ✅ PFL - Printed Fabric Label (12 processes)');
  console.log('   ✅ Woven Label (14 processes)');
  console.log('   ✅ Leather Patch (8 processes)');
  console.log('   ✅ Digital Printing (12 processes)');
  console.log('\n🎯 Your exact data structure is now recreated!');
}

main()
  .catch((e) => {
    console.error('❌ Error during comprehensive seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });