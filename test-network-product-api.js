#!/usr/bin/env node

import { networkInterfaces } from 'os';

console.log('🌐 Testing Product Creation API over Network');
console.log('='.repeat(50));

const interfaces = networkInterfaces();
let primaryIP = 'localhost';

for (const [name, ifaces] of Object.entries(interfaces)) {
  for (const iface of ifaces) {
    if (iface.family === 'IPv4' && !iface.internal) {
      primaryIP = iface.address;
      break;
    }
  }
  if (primaryIP !== 'localhost') break;
}

const apiUrl = `http://${primaryIP}:3001/api`;

console.log(`📍 Testing with IP: ${primaryIP}`);
console.log(`🔌 API URL: ${apiUrl}`);
console.log('');

async function testProductCreation() {
  try {
    // First login to get token
    console.log('🔐 Logging in...');
    const loginResponse = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@horizonsourcing.com',
        password: 'password123'
      })
    });
    
    if (!loginResponse.ok) {
      const errorData = await loginResponse.json().catch(() => ({}));
      console.log('❌ Login failed:');
      console.log(`   Status: ${loginResponse.status}`);
      console.log(`   Error: ${errorData.error || 'Unknown error'}`);
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');
    console.log(`   User: ${loginData.user.first_name} ${loginData.user.last_name}`);
    console.log('');
    
    // Get available materials and categories
    console.log('📦 Getting available materials...');
    const materialsResponse = await fetch(`${apiUrl}/materials`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (materialsResponse.ok) {
      const materialsData = await materialsResponse.json();
      console.log(`✅ Found ${materialsData.length} materials`);
      if (materialsData.length > 0) {
        console.log(`   Using: ${materialsData[0].name} (ID: ${materialsData[0].id})`);
      }
    } else {
      console.log('❌ Failed to get materials');
    }
    
    console.log('');
    console.log('📂 Getting available categories...');
    const categoriesResponse = await fetch(`${apiUrl}/product-categories`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json();
      console.log(`✅ Found ${categoriesData.length} categories`);
      if (categoriesData.length > 0) {
        console.log(`   Using: ${categoriesData[0].name} (ID: ${categoriesData[0].id})`);
      }
    } else {
      console.log('❌ Failed to get categories');
    }
    
    console.log('');
    console.log('🧪 Testing product creation...');
    
    // Test product creation
    const timestamp = Date.now();
    const testProduct = {
      product_item_code: `NET-TEST-${timestamp}`,
      brand: 'Network Test Brand',
      material_id: '4d4c1fb7-5e20-46d1-9c6e-2db71fdfc9ba', // Craft Card
      gsm: 200,
      product_type: 'Offset',
      category_id: 'bfbcfcd8-46ec-4abb-b4b6-74c755db7fed', // Hang Tags
      fsc: 'Yes',
      fsc_claim: 'Mixed',
      color_specifications: 'Black',
      remarks: 'Network test product'
    };
    
    const productResponse = await fetch(`${apiUrl}/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testProduct)
    });
    
    if (productResponse.ok) {
      const productData = await productResponse.json();
      console.log('✅ Product creation successful!');
      console.log(`   Product Code: ${productData.product.product_item_code}`);
      console.log(`   Brand: ${productData.product.brand}`);
      console.log(`   Material ID: ${productData.product.material_id}`);
      console.log(`   Category ID: ${productData.product.category_id}`);
      console.log('');
      console.log('🎉 Network product creation is working perfectly!');
    } else {
      const errorData = await productResponse.json().catch(() => ({}));
      console.log('❌ Product creation failed:');
      console.log(`   Status: ${productResponse.status}`);
      console.log(`   Error: ${errorData.error || 'Unknown error'}`);
      console.log(`   Message: ${errorData.message || 'No message'}`);
    }
    
  } catch (error) {
    console.log('❌ Test failed:');
    console.log(`   Error: ${error.message}`);
  }
}

testProductCreation();
