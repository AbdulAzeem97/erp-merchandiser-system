// Test script for product creation API
const testProductData = {
  product_item_code: "TEST-001",
  brand: "JCP",
  material_id: null,
  gsm: 150,
  product_type: "Offset",
  category_id: null,
  description: "Test product for form submission",
  fsc: "Yes",
  fsc_claim: "Recycled",
  color_specifications: "Blue and White",
  remarks: "Test remarks for product creation"
};

async function testProductCreation() {
  try {
    console.log('🧪 Testing product creation API...');
    console.log('📝 Test data:', JSON.stringify(testProductData, null, 2));

    const response = await fetch('http://localhost:5001/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify(testProductData)
    });

    console.log(`📊 Response status: ${response.status}`);

    const result = await response.json();
    console.log('📋 Response data:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Product creation successful!');
    } else {
      console.log('❌ Product creation failed');
      if (result.details) {
        console.log('🔍 Validation errors:', result.details);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testProductCreation();