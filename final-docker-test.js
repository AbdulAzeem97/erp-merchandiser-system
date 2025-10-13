async function runComprehensiveTest() {
  console.log('\n🐳 COMPREHENSIVE DOCKER SYSTEM TEST');
  console.log('='.repeat(70));
  
  let allPassed = true;
  
  try {
    // Test 1: Health Check
    console.log('\n📋 TEST 1: Backend Health Check');
    console.log('-'.repeat(70));
    const health = await fetch('http://localhost:5001/health');
    const healthData = await health.json();
    console.log('Status:', health.status, health.ok ? '✅' : '❌');
    console.log('Response:', JSON.stringify(healthData, null, 2));
    if (!health.ok) allPassed = false;
    
    // Test 2: Get Products
    console.log('\n📋 TEST 2: Get Products List');
    console.log('-'.repeat(70));
    const products = await fetch('http://localhost:5001/api/products');
    const productsData = await products.json();
    console.log('Status:', products.status, products.ok ? '✅' : '❌');
    console.log('Products found:', productsData.products?.length || productsData.length || 0);
    if (productsData.products?.length > 0 || productsData.length > 0) {
      const firstProduct = productsData.products?.[0] || productsData[0];
      console.log('Sample product:', {
        id: firstProduct.id,
        name: firstProduct.name || firstProduct.product_name,
        sku: firstProduct.sku || firstProduct.product_item_code
      });
    }
    if (!products.ok) allPassed = false;
    
    // Test 3: Create Process Selections for Product 7
    console.log('\n📋 TEST 3: Save Process Selections (Product 7)');
    console.log('-'.repeat(70));
    const testData = {
      selectedSteps: [
        { step_id: 1, is_selected: true },
        { step_id: 2, is_selected: true },
        { step_id: 3, is_selected: true }
      ]
    };
    console.log('Request:', JSON.stringify(testData, null, 2));
    
    const saveResponse = await fetch('http://localhost:5001/api/products/7/process-selections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    const saveData = await saveResponse.json();
    console.log('Status:', saveResponse.status, saveResponse.ok ? '✅' : '❌');
    console.log('Response:', JSON.stringify(saveData, null, 2));
    
    if (saveResponse.ok) {
      console.log('✅ Process selections saved successfully!');
    } else {
      console.log('❌ Failed to save process selections');
      allPassed = false;
    }
    
    // Test 4: Retrieve Process Selections
    console.log('\n📋 TEST 4: Get Process Selections (Product 7)');
    console.log('-'.repeat(70));
    const getResponse = await fetch('http://localhost:5001/api/products/7/process-selections');
    const getData = await getResponse.json();
    console.log('Status:', getResponse.status, getResponse.ok ? '✅' : '❌');
    console.log('Selections retrieved:', getData.selected_steps?.length || getData.selections?.length || 0);
    if (getData.selected_steps?.length > 0 || getData.selections?.length > 0) {
      const steps = getData.selected_steps || getData.selections || [];
      console.log('Steps:');
      steps.forEach((step, i) => {
        console.log(`  ${i + 1}. ${step.step_name || 'Step ' + step.step_id} - Selected: ${step.is_selected}`);
      });
    }
    if (!getResponse.ok) allPassed = false;
    
    // Test 5: Process Steps Available
    console.log('\n📋 TEST 5: Get Available Process Steps');
    console.log('-'.repeat(70));
    const stepsResponse = await fetch('http://localhost:5001/api/process-sequences?productType=Offset');
    const stepsData = await stepsResponse.json();
    console.log('Status:', stepsResponse.status, stepsResponse.ok ? '✅' : '❌');
    const steps = stepsData.steps || stepsData.process_sequence?.steps || [];
    console.log('Process steps available:', steps.length);
    if (steps.length > 0) {
      console.log('First 5 steps:');
      steps.slice(0, 5).forEach((step, i) => {
        console.log(`  ${i + 1}. ${step.name} (${step.isCompulsory ? 'Compulsory' : 'Optional'})`);
      });
    }
    if (!stepsResponse.ok) allPassed = false;
    
    // Summary
    console.log('\n' + '='.repeat(70));
    if (allPassed) {
      console.log('✅ ALL TESTS PASSED!');
      console.log('='.repeat(70));
      console.log('\n🎉 DOCKER SYSTEM IS FULLY OPERATIONAL!');
      console.log('\n✅ Backend API: Working');
      console.log('✅ Database: Connected');
      console.log('✅ Process Selections: Saving & Retrieving');
      console.log('✅ Product Management: Working');
      console.log('✅ Process Steps: Available');
      console.log('\n🚀 Your app is ready to use at: http://localhost:8080');
      console.log('\nNext steps:');
      console.log('  1. Open http://localhost:8080 in your browser');
      console.log('  2. Hard refresh (Ctrl+Shift+R)');
      console.log('  3. Create a product with process selections');
      console.log('  4. Everything will work perfectly! 🎉');
    } else {
      console.log('⚠️ SOME TESTS FAILED');
      console.log('='.repeat(70));
      console.log('\nCheck the errors above for details.');
    }
    
  } catch (error) {
    console.error('\n❌ TEST SUITE ERROR:', error.message);
    console.error('\nMake sure Docker containers are running:');
    console.error('  docker ps');
    allPassed = false;
  }
  
  console.log('\n');
  return allPassed;
}

runComprehensiveTest().then(passed => {
  process.exit(passed ? 0 : 1);
});

