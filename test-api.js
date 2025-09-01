const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('Testing API connection...');
    
    // Test basic products endpoint
    const response = await fetch('http://localhost:5001/api/products');
    const data = await response.json();
    
    console.log('Products API Response:', JSON.stringify(data, null, 2));
    
    // Find the specific product
    const products = data.products || data;
    const product = products.find(p => p.product_item_code === 'BR-00-127-E');
    
    if (product) {
      console.log('\nFound product:', product.id);
      
      // Test the complete process info endpoint
      const processResponse = await fetch(`http://localhost:5001/api/products/${product.id}/complete-process-info`);
      const processData = await processResponse.json();
      
      console.log('\nComplete Process Info:', JSON.stringify(processData, null, 2));
    } else {
      console.log('\nProduct BR-00-127-E not found');
    }
    
  } catch (error) {
    console.error('API Test Error:', error);
  }
}

testAPI();
