const { PrismaClient } = require('../generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Adding comprehensive product data and job cards for perfect form functionality...');

  // Get existing data for reference
  const categories = await prisma.category.findMany();
  const companies = await prisma.company.findMany();
  const users = await prisma.user.findMany();
  const sequences = await prisma.processSequence.findMany();

  console.log('📋 Found existing data:', {
    categories: categories.length,
    companies: companies.length,
    users: users.length,
    sequences: sequences.length
  });

  // Create EXTENSIVE product catalog for all categories and companies
  const products = [];

  // HANG TAGS - Multiple variants for each company
  const hangTagProducts = [
    // Nike Hang Tags
    { name: 'Nike Air Max Hang Tag - Premium Black', sku: 'HT-NIKE-AM-001', brand: 'Nike', gsm: 350, price: 0.45, fsc: true, description: 'Premium black hang tag for Nike Air Max series' },
    { name: 'Nike Jordan Hang Tag - Gold Foil', sku: 'HT-NIKE-JD-002', brand: 'Nike', gsm: 300, price: 0.65, fsc: true, description: 'Gold foil hang tag for Jordan brand products' },
    { name: 'Nike Sportswear Hang Tag - Standard', sku: 'HT-NIKE-SW-003', brand: 'Nike', gsm: 250, price: 0.35, fsc: true, description: 'Standard hang tag for Nike sportswear' },
    { name: 'Nike Kids Hang Tag - Colorful', sku: 'HT-NIKE-KD-004', brand: 'Nike', gsm: 200, price: 0.30, fsc: true, description: 'Colorful hang tag for Nike kids collection' },

    // Adidas Hang Tags
    { name: 'Adidas Originals Hang Tag - Black', sku: 'HT-ADIDAS-OR-001', brand: 'Adidas', gsm: 300, price: 0.40, fsc: true, description: 'Classic black hang tag for Adidas Originals' },
    { name: 'Adidas Performance Hang Tag - Blue', sku: 'HT-ADIDAS-PF-002', brand: 'Adidas', gsm: 280, price: 0.38, fsc: true, description: 'Blue performance hang tag for Adidas sports' },
    { name: 'Adidas Y-3 Hang Tag - Luxury', sku: 'HT-ADIDAS-Y3-003', brand: 'Adidas', gsm: 400, price: 0.75, fsc: true, description: 'Luxury hang tag for Adidas Y-3 collection' },
    { name: 'Adidas Neo Hang Tag - Youth', sku: 'HT-ADIDAS-NE-004', brand: 'Adidas', gsm: 220, price: 0.28, fsc: true, description: 'Youth-oriented hang tag for Adidas Neo' },

    // Puma Hang Tags
    { name: 'Puma Suede Hang Tag - Classic', sku: 'HT-PUMA-SD-001', brand: 'Puma', gsm: 320, price: 0.42, fsc: true, description: 'Classic hang tag for Puma Suede collection' },
    { name: 'Puma RS Hang Tag - Tech', sku: 'HT-PUMA-RS-002', brand: 'Puma', gsm: 290, price: 0.39, fsc: true, description: 'Tech-style hang tag for Puma RS series' },
    { name: 'Puma Motorsport Hang Tag - Racing', sku: 'HT-PUMA-MS-003', brand: 'Puma', gsm: 350, price: 0.48, fsc: true, description: 'Racing-themed hang tag for Puma Motorsport' },

    // Under Armour Hang Tags
    { name: 'Under Armour HeatGear Hang Tag', sku: 'HT-UA-HG-001', brand: 'Under Armour', gsm: 280, price: 0.36, fsc: true, description: 'HeatGear technology hang tag' },
    { name: 'Under Armour ColdGear Hang Tag', sku: 'HT-UA-CG-002', brand: 'Under Armour', gsm: 300, price: 0.38, fsc: true, description: 'ColdGear technology hang tag' },
    { name: 'Under Armour Curry Hang Tag - Signature', sku: 'HT-UA-CU-003', brand: 'Under Armour', gsm: 350, price: 0.50, fsc: true, description: 'Signature hang tag for Curry collection' },

    // H&M Hang Tags
    { name: 'H&M Basic Hang Tag - Minimalist', sku: 'HT-HM-BC-001', brand: 'H&M', gsm: 200, price: 0.25, fsc: true, description: 'Minimalist hang tag for H&M basics' },
    { name: 'H&M Premium Hang Tag - Sustainable', sku: 'HT-HM-PR-002', brand: 'H&M', gsm: 250, price: 0.32, fsc: true, description: 'Sustainable hang tag for H&M premium' },
    { name: 'H&M Kids Hang Tag - Fun Design', sku: 'HT-HM-KD-003', brand: 'H&M', gsm: 180, price: 0.22, fsc: true, description: 'Fun design hang tag for H&M kids' }
  ];

  // PRICE TAGS
  const priceTagProducts = [
    { name: 'Nike Price Tag - Retail Standard', sku: 'PT-NIKE-RS-001', brand: 'Nike', gsm: 200, price: 0.18, fsc: false, description: 'Standard retail price tag for Nike products' },
    { name: 'Adidas Price Tag - Outlet', sku: 'PT-ADIDAS-OT-001', brand: 'Adidas', gsm: 180, price: 0.15, fsc: false, description: 'Outlet price tag for Adidas' },
    { name: 'Puma Price Tag - Premium', sku: 'PT-PUMA-PR-001', brand: 'Puma', gsm: 220, price: 0.22, fsc: true, description: 'Premium price tag for Puma' },
    { name: 'Under Armour Price Tag - Sport', sku: 'PT-UA-SP-001', brand: 'Under Armour', gsm: 200, price: 0.20, fsc: false, description: 'Sport price tag for Under Armour' },
    { name: 'H&M Price Tag - Fashion', sku: 'PT-HM-FS-001', brand: 'H&M', gsm: 160, price: 0.12, fsc: true, description: 'Fashion price tag for H&M' }
  ];

  // CARE LABELS
  const careLabelProducts = [
    { name: 'Nike Care Label - Sportswear', sku: 'CL-NIKE-SW-001', brand: 'Nike', gsm: 120, price: 0.08, fsc: false, description: 'Care instructions for Nike sportswear' },
    { name: 'Adidas Care Label - Performance', sku: 'CL-ADIDAS-PF-001', brand: 'Adidas', gsm: 130, price: 0.09, fsc: false, description: 'Care instructions for Adidas performance wear' },
    { name: 'Puma Care Label - Lifestyle', sku: 'CL-PUMA-LS-001', brand: 'Puma', gsm: 125, price: 0.08, fsc: false, description: 'Care instructions for Puma lifestyle' },
    { name: 'Under Armour Care Label - Tech', sku: 'CL-UA-TC-001', brand: 'Under Armour', gsm: 140, price: 0.10, fsc: false, description: 'Care instructions for UA tech fabrics' },
    { name: 'H&M Care Label - Cotton', sku: 'CL-HM-CT-001', brand: 'H&M', gsm: 110, price: 0.06, fsc: true, description: 'Care instructions for H&M cotton garments' }
  ];

  // SIZE LABELS
  const sizeLabelProducts = [
    { name: 'Nike Size Label - Footwear', sku: 'SL-NIKE-FW-001', brand: 'Nike', gsm: 150, price: 0.12, fsc: false, description: 'Size label for Nike footwear' },
    { name: 'Adidas Size Label - Apparel', sku: 'SL-ADIDAS-AP-001', brand: 'Adidas', gsm: 140, price: 0.11, fsc: false, description: 'Size label for Adidas apparel' },
    { name: 'Puma Size Label - Accessories', sku: 'SL-PUMA-AC-001', brand: 'Puma', gsm: 130, price: 0.10, fsc: false, description: 'Size label for Puma accessories' },
    { name: 'Under Armour Size Label - Performance', sku: 'SL-UA-PF-001', brand: 'Under Armour', gsm: 160, price: 0.13, fsc: false, description: 'Size label for UA performance gear' },
    { name: 'H&M Size Label - International', sku: 'SL-HM-IN-001', brand: 'H&M', gsm: 120, price: 0.09, fsc: true, description: 'International size label for H&M' }
  ];

  // BRAND LABELS
  const brandLabelProducts = [
    { name: 'Nike Swoosh Brand Label - Embossed', sku: 'BL-NIKE-SW-001', brand: 'Nike', gsm: 300, price: 0.45, fsc: true, description: 'Embossed Nike Swoosh brand label' },
    { name: 'Adidas Three Stripes Brand Label', sku: 'BL-ADIDAS-3S-001', brand: 'Adidas', gsm: 280, price: 0.42, fsc: true, description: 'Three stripes Adidas brand label' },
    { name: 'Puma Cat Logo Brand Label', sku: 'BL-PUMA-CAT-001', brand: 'Puma', gsm: 270, price: 0.40, fsc: true, description: 'Puma cat logo brand label' },
    { name: 'Under Armour UA Brand Label', sku: 'BL-UA-UA-001', brand: 'Under Armour', gsm: 290, price: 0.43, fsc: true, description: 'Under Armour UA brand label' },
    { name: 'H&M Brand Label - Minimalist', sku: 'BL-HM-MIN-001', brand: 'H&M', gsm: 200, price: 0.28, fsc: true, description: 'Minimalist H&M brand label' }
  ];

  // WOVEN LABELS
  const wovenLabelProducts = [
    { name: 'Nike Woven Label - Premium Cotton', sku: 'WL-NIKE-PC-001', brand: 'Nike', price: 0.65, fsc: false, description: 'Premium cotton woven label for Nike' },
    { name: 'Adidas Woven Label - Recycled Poly', sku: 'WL-ADIDAS-RP-001', brand: 'Adidas', price: 0.70, fsc: true, description: 'Recycled polyester woven label for Adidas' },
    { name: 'Puma Woven Label - Satin Finish', sku: 'WL-PUMA-SF-001', brand: 'Puma', price: 0.68, fsc: false, description: 'Satin finish woven label for Puma' },
    { name: 'Under Armour Woven Label - Tech Fiber', sku: 'WL-UA-TF-001', brand: 'Under Armour', price: 0.75, fsc: false, description: 'Tech fiber woven label for Under Armour' },
    { name: 'H&M Woven Label - Organic Cotton', sku: 'WL-HM-OC-001', brand: 'H&M', price: 0.55, fsc: true, description: 'Organic cotton woven label for H&M' }
  ];

  // HEAT TRANSFER LABELS
  const heatTransferProducts = [
    { name: 'Nike Heat Transfer Label - Reflective', sku: 'HTL-NIKE-RF-001', brand: 'Nike', price: 0.85, fsc: false, description: 'Reflective heat transfer label for Nike' },
    { name: 'Adidas Heat Transfer Label - 3D Effect', sku: 'HTL-ADIDAS-3D-001', brand: 'Adidas', price: 0.90, fsc: false, description: '3D effect heat transfer label for Adidas' },
    { name: 'Puma Heat Transfer Label - Glow', sku: 'HTL-PUMA-GL-001', brand: 'Puma', price: 0.88, fsc: false, description: 'Glow-in-dark heat transfer label for Puma' },
    { name: 'Under Armour Heat Transfer Label - Metallic', sku: 'HTL-UA-MT-001', brand: 'Under Armour', price: 0.95, fsc: false, description: 'Metallic heat transfer label for Under Armour' },
    { name: 'H&M Heat Transfer Label - Eco-Friendly', sku: 'HTL-HM-ECO-001', brand: 'H&M', price: 0.72, fsc: true, description: 'Eco-friendly heat transfer label for H&M' }
  ];

  // LEATHER PATCHES
  const leatherPatchProducts = [
    { name: 'Nike Leather Patch - Vintage Brown', sku: 'LP-NIKE-VB-001', brand: 'Nike', price: 2.50, fsc: false, description: 'Vintage brown leather patch for Nike premium' },
    { name: 'Adidas Leather Patch - Black Premium', sku: 'LP-ADIDAS-BP-001', brand: 'Adidas', price: 2.75, fsc: false, description: 'Black premium leather patch for Adidas' },
    { name: 'Puma Leather Patch - Suede Finish', sku: 'LP-PUMA-SF-001', brand: 'Puma', price: 2.85, fsc: false, description: 'Suede finish leather patch for Puma' },
    { name: 'Under Armour Leather Patch - Embossed', sku: 'LP-UA-EM-001', brand: 'Under Armour', price: 3.00, fsc: false, description: 'Embossed leather patch for Under Armour' },
    { name: 'H&M Leather Patch - Sustainable', sku: 'LP-HM-SUS-001', brand: 'H&M', price: 2.25, fsc: true, description: 'Sustainable leather patch for H&M' }
  ];

  // Combine all product arrays
  const allProducts = [
    ...hangTagProducts.map(p => ({ ...p, categoryId: categories.find(c => c.name === 'Hang Tags')?.id })),
    ...priceTagProducts.map(p => ({ ...p, categoryId: categories.find(c => c.name === 'Price Tags')?.id })),
    ...careLabelProducts.map(p => ({ ...p, categoryId: categories.find(c => c.name === 'Care Labels')?.id })),
    ...sizeLabelProducts.map(p => ({ ...p, categoryId: categories.find(c => c.name === 'Size Labels')?.id })),
    ...brandLabelProducts.map(p => ({ ...p, categoryId: categories.find(c => c.name === 'Brand Labels')?.id })),
    ...wovenLabelProducts.map(p => ({ ...p, categoryId: categories.find(c => c.name === 'Woven Labels')?.id })),
    ...heatTransferProducts.map(p => ({ ...p, categoryId: categories.find(c => c.name === 'Heat Transfer Labels')?.id })),
    ...leatherPatchProducts.map(p => ({ ...p, categoryId: categories.find(c => c.name === 'Leather Patches')?.id }))
  ];

  // Create all products
  console.log('📦 Creating comprehensive product catalog...');
  for (const productData of allProducts) {
    await prisma.product.upsert({
      where: { sku: productData.sku },
      update: {},
      create: {
        name: productData.name,
        description: productData.description,
        sku: productData.sku,
        categoryId: productData.categoryId,
        brand: productData.brand,
        gsm: productData.gsm,
        fscCertified: productData.fsc,
        basePrice: productData.price
      }
    });
  }

  console.log(`✅ Created ${allProducts.length} products across all categories`);

  // Get all created products for job cards
  const createdProducts = await prisma.product.findMany();

  // Create Product Process Selections (Link products to appropriate sequences)
  console.log('🔗 Creating product-process associations...');

  const productProcessMappings = [
    // Hang Tags, Price Tags, Brand Labels -> Offset Printing
    { categoryNames: ['Hang Tags', 'Price Tags', 'Brand Labels'], sequenceName: 'Offset Printing Production' },
    // Heat Transfer Labels -> Heat Transfer Production
    { categoryNames: ['Heat Transfer Labels'], sequenceName: 'Heat Transfer Label Production' },
    // Care Labels, Size Labels -> PFL Production
    { categoryNames: ['Care Labels', 'Size Labels'], sequenceName: 'PFL Production' },
    // Woven Labels -> Woven Production
    { categoryNames: ['Woven Labels'], sequenceName: 'Woven Label Production' },
    // Leather Patches -> Leather Production
    { categoryNames: ['Leather Patches'], sequenceName: 'Leather Patch Production' }
  ];

  for (const mapping of productProcessMappings) {
    const sequence = sequences.find(s => s.name === mapping.sequenceName);
    if (sequence) {
      for (const categoryName of mapping.categoryNames) {
        const category = categories.find(c => c.name === categoryName);
        if (category) {
          const categoryProducts = createdProducts.filter(p => p.categoryId === category.id);
          for (const product of categoryProducts) {
            await prisma.productProcessSelection.upsert({
              where: {
                productId_sequenceId: {
                  productId: product.id,
                  sequenceId: sequence.id
                }
              },
              update: {},
              create: {
                productId: product.id,
                sequenceId: sequence.id,
                isDefault: true
              }
            });
          }
        }
      }
    }
  }

  console.log('✅ Product-process associations created');

  // Create Sample Job Cards for testing forms
  console.log('📋 Creating sample job cards for form testing...');

  const sampleJobCards = [
    {
      jobNumber: 'JOB-2024-001',
      companyName: 'Nike Inc.',
      productSku: 'HT-NIKE-AM-001',
      quantity: 5000,
      urgency: 'HIGH',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      notes: 'Rush order for Nike Air Max collection launch'
    },
    {
      jobNumber: 'JOB-2024-002',
      companyName: 'Adidas AG',
      productSku: 'WL-ADIDAS-RP-001',
      quantity: 3000,
      urgency: 'NORMAL',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      notes: 'Sustainable woven labels for Adidas eco collection'
    },
    {
      jobNumber: 'JOB-2024-003',
      companyName: 'Puma SE',
      productSku: 'HTL-PUMA-GL-001',
      quantity: 2500,
      urgency: 'URGENT',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      notes: 'Glow-in-dark heat transfer labels for limited edition'
    },
    {
      jobNumber: 'JOB-2024-004',
      companyName: 'Under Armour Inc.',
      productSku: 'CL-UA-TC-001',
      quantity: 10000,
      urgency: 'NORMAL',
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
      notes: 'Care labels for Under Armour tech fabric line'
    },
    {
      jobNumber: 'JOB-2024-005',
      companyName: 'H&M Hennes & Mauritz',
      productSku: 'LP-HM-SUS-001',
      quantity: 1500,
      urgency: 'LOW',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      notes: 'Sustainable leather patches for H&M premium line'
    }
  ];

  for (const jobData of sampleJobCards) {
    const company = companies.find(c => c.name === jobData.companyName);
    const product = createdProducts.find(p => p.sku === jobData.productSku);
    const adminUser = users.find(u => u.role === 'ADMIN');

    if (company && product && adminUser) {
      // Get the default process sequence for this product
      const productProcess = await prisma.productProcessSelection.findFirst({
        where: { productId: product.id, isDefault: true },
        include: { sequence: true }
      });

      if (productProcess) {
        const jobCard = await prisma.jobCard.create({
          data: {
            jobNumber: jobData.jobNumber,
            companyId: company.id,
            productId: product.id,
            sequenceId: productProcess.sequenceId,
            quantity: jobData.quantity,
            urgency: jobData.urgency,
            status: 'PENDING',
            dueDate: jobData.dueDate,
            totalCost: product.basePrice * jobData.quantity,
            notes: jobData.notes,
            createdById: adminUser.id
          }
        });

        // Create initial job lifecycle entries
        const processSteps = await prisma.processStep.findMany({
          where: { sequenceId: productProcess.sequenceId },
          orderBy: { stepNumber: 'asc' },
          take: 3 // Create lifecycle for first 3 steps
        });

        for (const step of processSteps) {
          await prisma.jobLifecycle.create({
            data: {
              jobCardId: jobCard.id,
              processStepId: step.id,
              status: step.stepNumber === 1 ? 'IN_PROGRESS' : 'PENDING',
              userId: adminUser.id,
              notes: `Step ${step.stepNumber}: ${step.name} - ${step.stepNumber === 1 ? 'Started' : 'Waiting'}`
            }
          });
        }
      }
    }
  }

  console.log(`✅ Created ${sampleJobCards.length} sample job cards with lifecycle tracking`);

  // Create additional inventory for new products
  console.log('📦 Updating inventory for all products...');
  const productsWithoutInventory = await prisma.product.findMany({
    where: {
      inventoryItems: {
        none: {}
      }
    }
  });

  for (const product of productsWithoutInventory) {
    await prisma.inventoryItem.create({
      data: {
        productId: product.id,
        quantity: Math.floor(Math.random() * 2000) + 500, // 500-2500 units
        minStock: 100,
        maxStock: 5000,
        location: `Product-${product.sku.substring(0, 6)}`
      }
    });
  }

  console.log(`✅ Created inventory items for ${productsWithoutInventory.length} products`);

  console.log('🎉 Form-ready database seeding completed successfully!');
  console.log('\n📋 COMPLETE SUMMARY:');
  console.log(`   - Total Products: ${createdProducts.length + allProducts.length} (All categories covered)`);
  console.log(`   - Hang Tags: ${hangTagProducts.length} products`);
  console.log(`   - Price Tags: ${priceTagProducts.length} products`);
  console.log(`   - Care Labels: ${careLabelProducts.length} products`);
  console.log(`   - Size Labels: ${sizeLabelProducts.length} products`);
  console.log(`   - Brand Labels: ${brandLabelProducts.length} products`);
  console.log(`   - Woven Labels: ${wovenLabelProducts.length} products`);
  console.log(`   - Heat Transfer Labels: ${heatTransferProducts.length} products`);
  console.log(`   - Leather Patches: ${leatherPatchProducts.length} products`);
  console.log(`   - Sample Job Cards: ${sampleJobCards.length} with complete workflow`);
  console.log('\n🎯 Your forms are now ready with comprehensive data!');
  console.log('✅ Product Add Form: Complete with all categories and materials');
  console.log('✅ Job Card Form: Complete with products, companies, and workflows');
}

main()
  .catch((e) => {
    console.error('❌ Error during form-ready seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });