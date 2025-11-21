import dbAdapter from './server/database/adapter.js';

async function setDefaultOffsetSequence() {
  try {
    console.log('🔄 Setting up default Offset sequence for all products...');
    
    // Initialize database adapter
    await dbAdapter.initialize();
    console.log('✅ Database adapter initialized\n');
    
    // Step 1: Ensure Offset sequence exists with correct steps
    console.log('📋 Step 1: Ensuring Offset sequence exists...');
    
    // Get or create Offset sequence
    let offsetResult = await dbAdapter.query(`
      SELECT id, name FROM process_sequences
      WHERE name = 'Offset' OR name LIKE 'Offset%'
      LIMIT 1
    `);
    
    let offsetSequenceId;
    if (offsetResult.rows.length === 0) {
      // Create Offset sequence
      const createResult = await dbAdapter.query(`
        INSERT INTO process_sequences (name, description, "isActive")
        VALUES ('Offset', 'Standard offset printing process with Prepress (Design, QA, CTP)', true)
        RETURNING id
      `);
      offsetSequenceId = createResult.rows[0].id;
      console.log(`✅ Created Offset sequence (ID: ${offsetSequenceId})`);
    } else {
      offsetSequenceId = offsetResult.rows[0].id;
      console.log(`✅ Found Offset sequence (ID: ${offsetSequenceId})`);
    }
    
    // Step 2: Delete existing steps and recreate with correct order
    console.log('\n📋 Step 2: Setting up Prepress steps (Design, QA, CTP)...');
    
    await dbAdapter.query(`
      DELETE FROM process_steps WHERE "sequenceId" = $1
    `, [offsetSequenceId]);
    
    // Insert Prepress steps (compulsory)
    const prepressSteps = [
      { order: 1, name: 'Design', description: 'Design creation and review', isQA: false },
      { order: 2, name: 'QA Review (Prepress)', description: 'Quality assurance review for prepress design', isQA: true },
      { order: 3, name: 'CTP', description: 'Computer-to-Plate - Plate making', isQA: false },
      { order: 4, name: 'Plate Making', description: 'Physical plate creation', isQA: false }
    ];
    
    for (const step of prepressSteps) {
      await dbAdapter.query(`
        INSERT INTO process_steps ("sequenceId", "stepNumber", name, description, "isQualityCheck", "isActive")
        VALUES ($1, $2, $3, $4, $5, true)
      `, [offsetSequenceId, step.order, step.name, step.description, step.isQA]);
      console.log(`   ✅ Added: ${step.name}${step.isQA ? ' [QA]' : ''}`);
    }
    
    // Insert other production steps (optional)
    console.log('\n📋 Step 3: Adding production steps...');
    const productionSteps = [
      { order: 5, name: 'Printing', description: 'Main printing process', isQA: false },
      { order: 6, name: 'Cutting', description: 'Material cutting', isQA: false },
      { order: 7, name: 'Final QA', description: 'Final quality assurance', isQA: true },
      { order: 8, name: 'Dispatch', description: 'Shipping and dispatch', isQA: false }
    ];
    
    for (const step of productionSteps) {
      await dbAdapter.query(`
        INSERT INTO process_steps ("sequenceId", "stepNumber", name, description, "isQualityCheck", "isActive")
        VALUES ($1, $2, $3, $4, $5, true)
      `, [offsetSequenceId, step.order, step.name, step.description, step.isQA]);
      console.log(`   ✅ Added: ${step.name}${step.isQA ? ' [QA]' : ''}`);
    }
    
    // Step 4: Set Offset as default for all products
    console.log('\n📋 Step 4: Setting Offset as default for all products...');
    
    const productsResult = await dbAdapter.query(`
      SELECT id FROM products
    `);
    
    let updatedCount = 0;
    for (const product of productsResult.rows) {
      // Check if product already has a default sequence
      const existingDefault = await dbAdapter.query(`
        SELECT id FROM product_process_selections
        WHERE "productId" = $1 AND "isDefault" = true
        LIMIT 1
      `, [product.id]);
      
      if (existingDefault.rows.length === 0) {
        // Insert default sequence selection
        await dbAdapter.query(`
          INSERT INTO product_process_selections ("productId", "sequenceId", "isDefault", "createdAt")
          VALUES ($1, $2, true, CURRENT_TIMESTAMP)
          ON CONFLICT ("productId", "sequenceId") DO UPDATE SET "isDefault" = true
        `, [product.id, offsetSequenceId]);
        updatedCount++;
      }
    }
    
    console.log(`✅ Set Offset as default for ${updatedCount} products`);
    
    // Step 5: Verify
    console.log('\n📋 Step 5: Verification...');
    
    const stepsCheck = await dbAdapter.query(`
      SELECT "stepNumber", name, "isQualityCheck" as is_qa
      FROM process_steps
      WHERE "sequenceId" = $1
      ORDER BY "stepNumber" ASC
    `, [offsetSequenceId]);
    
    console.log(`\n✅ Offset sequence has ${stepsCheck.rows.length} steps:`);
    stepsCheck.rows.forEach(step => {
      const qaFlag = step.is_qa ? ' [QA]' : '';
      const compulsoryFlag = step.stepNumber <= 4 ? ' [PREPRESS - COMPULSORY]' : '';
      console.log(`   ${step.stepNumber}. ${step.name}${qaFlag}${compulsoryFlag}`);
    });
    
    const productsWithDefault = await dbAdapter.query(`
      SELECT COUNT(DISTINCT "productId") as count
      FROM product_process_selections
      WHERE "isDefault" = true
    `);
    
    console.log(`\n✅ ${productsWithDefault.rows[0].count} products have default sequence set`);
    
    console.log('\n🎉 Default Offset sequence setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error setting default Offset sequence:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

setDefaultOffsetSequence();

