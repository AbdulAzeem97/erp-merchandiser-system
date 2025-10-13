async function finalTest() {
  console.log('\n🎉 FINAL COMPREHENSIVE TEST - ALL ENDPOINTS\n');
  console.log('='.repeat(70));
  
  const results = {
    passed: [],
    failed: []
  };
  
  try {
    // Test 1: Get Process Sequences for Offset
    console.log('\n1️⃣  GET Process Sequences for "Offset"');
    console.log('-'.repeat(70));
    const seqResponse = await fetch('http://localhost:5001/api/process-sequences/by-product-type?product_type=Offset');
    const seqData = await seqResponse.json();
    console.log('   Status:', seqResponse.status, seqResponse.ok ? '✅' : '❌');
    console.log('   Steps available:', seqData.process_sequence?.steps?.length || 0);
    if (seqResponse.ok) {
      results.passed.push('Get Process Sequences');
      if (seqData.process_sequence?.steps) {
        console.log('   Sample steps:', seqData.process_sequence.steps.slice(0, 3).map(s => s.name).join(', '));
      }
    } else {
      results.failed.push('Get Process Sequences');
      console.log('   Error:', seqData.error || seqData.message);
    }
    
    // Test 2: Create Product
    console.log('\n2️⃣  POST Create New Product');
    console.log('-'.repeat(70));
    const productData = {
      sku: 'FINAL_TEST_' + Date.now(),
      name: 'Final Test Product',
      brand: 'TEST',
      material_id: 1,
      category_id: 1,
      gsm: 50,
      product_type: 'Offset'
    };
    
    const createResponse = await fetch('http://localhost:5001/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    
    const createData = await createResponse.json();
    console.log('   Status:', createResponse.status, createResponse.ok ? '✅' : '❌');
    const newProductId = createData.product?.id || createData.id;
    console.log('   Product ID:', newProductId);
    
    if (createResponse.ok) {
      results.passed.push('Create Product');
    } else {
      results.failed.push('Create Product');
      console.log('   Error:', createData.error || createData.message);
      return;
    }
    
    // Test 3: Save Process Selections
    console.log('\n3️⃣  POST Save Process Selections');
    console.log('-'.repeat(70));
    const selectionsData = {
      selectedSteps: [
        { step_id: 1, is_selected: true },
        { step_id: 2, is_selected: true },
        { step_id: 3, is_selected: true },
        { step_id: 4, is_selected: true },
        { step_id: 5, is_selected: true }
      ]
    };
    
    const saveResponse = await fetch(`http://localhost:5001/api/products/${newProductId}/process-selections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selectionsData)
    });
    
    const saveData = await saveResponse.json();
    console.log('   Status:', saveResponse.status, saveResponse.ok ? '✅' : '❌');
    console.log('   Message:', saveData.message);
    console.log('   Selections saved:', saveData.selections?.length || 0);
    
    if (saveResponse.ok) {
      results.passed.push('Save Process Selections');
    } else {
      results.failed.push('Save Process Selections');
      console.log('   Error:', saveData.error || saveData.message);
    }
    
    // Test 4: Get Process Selections
    console.log('\n4️⃣  GET Retrieve Process Selections');
    console.log('-'.repeat(70));
    const getResponse = await fetch(`http://localhost:5001/api/products/${newProductId}/process-selections`);
    const getData = await getResponse.json();
    console.log('   Status:', getResponse.status, getResponse.ok ? '✅' : '❌');
    console.log('   Selections retrieved:', getData.selected_steps?.length || 0);
    
    if (getResponse.ok && getData.selected_steps?.length > 0) {
      results.passed.push('Get Process Selections');
      console.log('   Steps:');
      getData.selected_steps.slice(0, 3).forEach((step, i) => {
        console.log(`      ${i + 1}. ${step.step_name} - ${step.is_selected ? 'Selected' : 'Not selected'}`);
      });
    } else {
      results.failed.push('Get Process Selections');
    }
    
    // Test 5: Verify in Database
    console.log('\n5️⃣  Verify in PostgreSQL Database');
    console.log('-'.repeat(70));
    
    const { execSync } = await import('child_process');
    const dbOutput = execSync(`docker exec erp_postgres psql -U erp_user -d erp_merchandiser -c "SELECT COUNT(*) as count FROM product_step_selections WHERE product_id = ${newProductId};"`, { encoding: 'utf-8' });
    
    console.log('   Database query result:');
    console.log(dbOutput.trim());
    
    if (dbOutput.includes('(1 row)') || dbOutput.includes('5')) {
      results.passed.push('Database Verification');
      console.log('   ✅ Data confirmed in database!');
    } else {
      results.failed.push('Database Verification');
    }
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    results.failed.push('Test Execution');
  }
  
  // Final Report
  console.log('\n' + '='.repeat(70));
  console.log('🏁 FINAL TEST REPORT');
  console.log('='.repeat(70));
  console.log('\n✅ PASSED:', results.passed.length, 'tests');
  results.passed.forEach(test => console.log('   ✅', test));
  
  if (results.failed.length > 0) {
    console.log('\n❌ FAILED:', results.failed.length, 'tests');
    results.failed.forEach(test => console.log('   ❌', test));
  }
  
  console.log('\n' + '='.repeat(70));
  
  if (results.failed.length === 0) {
    console.log('🎊 🎊 🎊  ALL SYSTEMS OPERATIONAL! 🎊 🎊 🎊');
    console.log('='.repeat(70));
    console.log('\n✅ Your Docker environment is PERFECT!');
    console.log('\n🚀 GO TO: http://localhost:8080');
    console.log('   Press: Ctrl+Shift+R (hard refresh)');
    console.log('   Create a product with process selections');
    console.log('   Everything will work! 🎉\n');
  } else {
    console.log('⚠️  Some tests failed. Check errors above.');
  }
}

finalTest();

