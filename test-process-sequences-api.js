// Test the process sequences API
const testAPI = async () => {
  try {
    console.log('🧪 Testing process sequences API...');
    
    // Test 1: Get process sequence for Offset
    console.log('\n1. Testing GET /api/process-sequences/by-product-type?product_type=Offset');
    const response1 = await fetch('http://localhost:5001/api/process-sequences/by-product-type?product_type=Offset');
    console.log('Response status:', response1.status);
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ Success! Found', data1.process_sequence?.steps?.length || 0, 'steps');
      if (data1.process_sequence?.steps) {
        console.log('First 3 steps:');
        data1.process_sequence.steps.slice(0, 3).forEach((step, index) => {
          console.log(`  ${index + 1}. ${step.name} (Compulsory: ${step.isCompulsory})`);
        });
      }
    } else {
      const error1 = await response1.text();
      console.log('❌ Error:', error1);
    }

    // Test 2: Get all process sequences
    console.log('\n2. Testing GET /api/process-sequences');
    const response2 = await fetch('http://localhost:5001/api/process-sequences');
    console.log('Response status:', response2.status);
    
    if (response2.ok) {
      const data2 = await response2.json();
      console.log('✅ Success! Found', data2.process_sequences?.length || 0, 'sequences');
      if (data2.process_sequences) {
        console.log('Available sequences:');
        data2.process_sequences.forEach((seq, index) => {
          console.log(`  ${index + 1}. ${seq.product_type} (${seq.step_count} steps)`);
        });
      }
    } else {
      const error2 = await response2.text();
      console.log('❌ Error:', error2);
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
};

testAPI();

