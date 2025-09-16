const { PrismaClient } = require('../generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Labels' },
      update: {},
      create: { name: 'Labels', description: 'Product labels and stickers' }
    }),
    prisma.category.upsert({
      where: { name: 'Packaging' },
      update: {},
      create: { name: 'Packaging', description: 'Packaging materials and boxes' }
    }),
    prisma.category.upsert({
      where: { name: 'Printing' },
      update: {},
      create: { name: 'Printing', description: 'Printed materials and documents' }
    }),
    prisma.category.upsert({
      where: { name: 'Books' },
      update: {},
      create: { name: 'Books', description: 'Books and publications' }
    })
  ]);
  console.log('✅ Categories created');

  // Create Materials
  const materials = await Promise.all([
    prisma.material.upsert({
      where: { name: 'Paper 80gsm' },
      update: {},
      create: { name: 'Paper 80gsm', unit: 'sheets', costPerUnit: 0.05 }
    }),
    prisma.material.upsert({
      where: { name: 'Cardboard 350gsm' },
      update: {},
      create: { name: 'Cardboard 350gsm', unit: 'sheets', costPerUnit: 0.15 }
    }),
    prisma.material.upsert({
      where: { name: 'Vinyl Sticker' },
      update: {},
      create: { name: 'Vinyl Sticker', unit: 'sqm', costPerUnit: 2.50 }
    }),
    prisma.material.upsert({
      where: { name: 'Ink CMYK' },
      update: {},
      create: { name: 'Ink CMYK', unit: 'ml', costPerUnit: 0.02 }
    })
  ]);
  console.log('✅ Materials created');

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
      where: { email: 'manager@erp.local' },
      update: {},
      create: {
        username: 'manager',
        email: 'manager@erp.local',
        password: hashedPassword,
        firstName: 'Production',
        lastName: 'Manager',
        role: 'MANAGER',
        phone: '+1234567891'
      }
    }),
    prisma.user.upsert({
      where: { email: 'operator@erp.local' },
      update: {},
      create: {
        username: 'operator',
        email: 'operator@erp.local',
        password: hashedPassword,
        firstName: 'Machine',
        lastName: 'Operator',
        role: 'OPERATOR',
        phone: '+1234567892'
      }
    })
  ]);
  console.log('✅ Users created');

  // Create Companies
  const companies = await Promise.all([
    prisma.company.upsert({
      where: { name: 'ABC Manufacturing Ltd' },
      update: {},
      create: {
        name: 'ABC Manufacturing Ltd',
        address: '123 Industrial St, City, State 12345',
        phone: '+1234567000',
        email: 'orders@abc-mfg.com',
        website: 'https://abc-mfg.com'
      }
    }),
    prisma.company.upsert({
      where: { name: 'XYZ Retail Corp' },
      update: {},
      create: {
        name: 'XYZ Retail Corp',
        address: '456 Business Ave, City, State 67890',
        phone: '+1234567001',
        email: 'procurement@xyz-retail.com',
        website: 'https://xyz-retail.com'
      }
    })
  ]);
  console.log('✅ Companies created');

  // Create Products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'LBL-001' },
      update: {},
      create: {
        name: 'Product Label - Standard',
        description: 'Standard product label for retail items',
        sku: 'LBL-001',
        categoryId: categories[0].id,
        brand: 'ERP Labels',
        gsm: 80,
        fscCertified: true,
        basePrice: 0.25
      }
    }),
    prisma.product.upsert({
      where: { sku: 'PKG-001' },
      update: {},
      create: {
        name: 'Cardboard Box - Medium',
        description: 'Medium size cardboard packaging box',
        sku: 'PKG-001',
        categoryId: categories[1].id,
        brand: 'ERP Packaging',
        gsm: 350,
        fscCertified: true,
        basePrice: 1.50
      }
    }),
    prisma.product.upsert({
      where: { sku: 'PRT-001' },
      update: {},
      create: {
        name: 'Business Cards',
        description: 'Professional business cards',
        sku: 'PRT-001',
        categoryId: categories[2].id,
        brand: 'ERP Print',
        gsm: 300,
        basePrice: 0.10
      }
    })
  ]);
  console.log('✅ Products created');

  // Create Process Sequences
  const sequences = await Promise.all([
    prisma.processSequence.upsert({
      where: { name: 'Label Production' },
      update: {},
      create: {
        name: 'Label Production',
        description: 'Standard label production sequence'
      }
    }),
    prisma.processSequence.upsert({
      where: { name: 'Box Manufacturing' },
      update: {},
      create: {
        name: 'Box Manufacturing',
        description: 'Cardboard box production sequence'
      }
    }),
    prisma.processSequence.upsert({
      where: { name: 'Business Card Printing' },
      update: {},
      create: {
        name: 'Business Card Printing',
        description: 'Business card production sequence'
      }
    })
  ]);
  console.log('✅ Process sequences created');

  // Create Process Steps for Label Production
  const labelSteps = await Promise.all([
    prisma.processStep.create({
      data: {
        sequenceId: sequences[0].id,
        stepNumber: 1,
        name: 'Design Review',
        description: 'Review and approve label design',
        estimatedDuration: 30,
        isQualityCheck: true
      }
    }),
    prisma.processStep.create({
      data: {
        sequenceId: sequences[0].id,
        stepNumber: 2,
        name: 'Material Preparation',
        description: 'Prepare label material and setup',
        estimatedDuration: 15
      }
    }),
    prisma.processStep.create({
      data: {
        sequenceId: sequences[0].id,
        stepNumber: 3,
        name: 'Printing',
        description: 'Print labels on material',
        estimatedDuration: 45
      }
    }),
    prisma.processStep.create({
      data: {
        sequenceId: sequences[0].id,
        stepNumber: 4,
        name: 'Die Cutting',
        description: 'Cut labels to final shape',
        estimatedDuration: 20
      }
    }),
    prisma.processStep.create({
      data: {
        sequenceId: sequences[0].id,
        stepNumber: 5,
        name: 'Quality Check',
        description: 'Final quality inspection',
        estimatedDuration: 10,
        isQualityCheck: true
      }
    }),
    prisma.processStep.create({
      data: {
        sequenceId: sequences[0].id,
        stepNumber: 6,
        name: 'Packaging',
        description: 'Package finished labels',
        estimatedDuration: 15
      }
    })
  ]);
  console.log('✅ Process steps created');

  // Create Inventory Items
  const inventoryItems = await Promise.all([
    prisma.inventoryItem.create({
      data: {
        productId: products[0].id,
        quantity: 500,
        minStock: 100,
        maxStock: 2000,
        location: 'Warehouse A-1'
      }
    }),
    prisma.inventoryItem.create({
      data: {
        materialId: materials[0].id,
        quantity: 10000,
        minStock: 1000,
        maxStock: 50000,
        location: 'Material Storage B-2'
      }
    }),
    prisma.inventoryItem.create({
      data: {
        materialId: materials[1].id,
        quantity: 5000,
        minStock: 500,
        maxStock: 25000,
        location: 'Material Storage B-3'
      }
    })
  ]);
  console.log('✅ Inventory items created');

  // Create System Configuration
  await Promise.all([
    prisma.systemConfig.upsert({
      where: { key: 'system_name' },
      update: {},
      create: {
        key: 'system_name',
        value: 'ERP Merchandiser System',
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
        value: '50',
        description: 'Maximum concurrent job cards allowed'
      }
    })
  ]);
  console.log('✅ System configuration created');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`- Categories: ${categories.length}`);
  console.log(`- Materials: ${materials.length}`);
  console.log(`- Users: ${users.length}`);
  console.log(`- Companies: ${companies.length}`);
  console.log(`- Products: ${products.length}`);
  console.log(`- Process Sequences: ${sequences.length}`);
  console.log(`- Inventory Items: ${inventoryItems.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });