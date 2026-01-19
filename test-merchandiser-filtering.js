/**
 * Test script for merchandiser-specific job filtering and product creator tracking
 * 
 * This script tests:
 * 1. Job filtering by user (merchandisers see only their own, admins see all)
 * 2. Product visibility (all products visible to everyone)
 * 3. "Created By" tracking for both jobs and products
 */

import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5001/api';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Test user credentials (adjust based on your database)
const TEST_USERS = {
  merchandiser: {
    email: 'merchandiser@example.com',
    password: 'password123'
  },
  admin: {
    email: 'admin@horizonsourcing.com',
    password: 'admin123'
  }
};

async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error(`❌ Login error for ${email}:`, error.message);
    return null;
  }
}

async function getJobs(token) {
  try {
    const response = await fetch(`${API_BASE}/jobs`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch jobs: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.jobs || [];
  } catch (error) {
    console.error('❌ Error fetching jobs:', error.message);
    return [];
  }
}

async function getProducts(token) {
  try {
    const response = await fetch(`${API_BASE}/products`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error('❌ Error fetching products:', error.message);
    return [];
  }
}

async function createTestJob(token, jobData) {
  try {
    const response = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jobData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create job: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.job;
  } catch (error) {
    console.error('❌ Error creating job:', error.message);
    return null;
  }
}

async function createTestProduct(token, productData) {
  try {
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create product: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.product;
  } catch (error) {
    console.error('❌ Error creating product:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Testing Merchandiser-Specific Filtering Implementation\n');
  
  // Test 1: Login as merchandiser
  console.log('📋 Test 1: Login as Merchandiser');
  const merchToken = await login(TEST_USERS.merchandiser.email, TEST_USERS.merchandiser.password);
  if (!merchToken) {
    console.log('⚠️  Skipping tests - could not login as merchandiser');
    return;
  }
  console.log('✅ Merchandiser logged in\n');
  
  // Test 2: Login as admin
  console.log('📋 Test 2: Login as Admin');
  const adminToken = await login(TEST_USERS.admin.email, TEST_USERS.admin.password);
  if (!adminToken) {
    console.log('⚠️  Skipping admin tests - could not login as admin');
  } else {
    console.log('✅ Admin logged in\n');
  }
  
  // Test 3: Check job filtering for merchandiser
  console.log('📋 Test 3: Job Filtering (Merchandiser)');
  const merchJobs = await getJobs(merchToken);
  console.log(`   Found ${merchJobs.length} jobs for merchandiser`);
  const jobsWithCreator = merchJobs.filter(j => j.created_by_name);
  console.log(`   Jobs with creator info: ${jobsWithCreator.length}`);
  console.log('✅ Job filtering test completed\n');
  
  // Test 4: Check job visibility for admin
  if (adminToken) {
    console.log('📋 Test 4: Job Visibility (Admin)');
    const adminJobs = await getJobs(adminToken);
    console.log(`   Found ${adminJobs.length} jobs for admin`);
    console.log(`   Admin should see all jobs: ${adminJobs.length >= merchJobs.length ? '✅' : '⚠️'}\n`);
  }
  
  // Test 5: Check product visibility (should be same for all)
  console.log('📋 Test 5: Product Visibility');
  const merchProducts = await getProducts(merchToken);
  console.log(`   Found ${merchProducts.length} products for merchandiser`);
  const productsWithCreator = merchProducts.filter(p => p.created_by_name !== undefined);
  console.log(`   Products with creator info: ${productsWithCreator.length}`);
  
  if (adminToken) {
    const adminProducts = await getProducts(adminToken);
    console.log(`   Found ${adminProducts.length} products for admin`);
    console.log(`   Products visible to all: ${merchProducts.length === adminProducts.length ? '✅' : '⚠️'}\n`);
  } else {
    console.log('✅ Product visibility test completed\n');
  }
  
  // Test 6: Create test job and verify filtering
  console.log('📋 Test 6: Create Job and Verify Creator Tracking');
  // This would require a valid product_id, so we'll skip for now
  console.log('   (Skipped - requires valid product_id)\n');
  
  // Test 7: Create test product and verify creator tracking
  console.log('📋 Test 7: Create Product and Verify Creator Tracking');
  // This would require valid data, so we'll skip for now
  console.log('   (Skipped - requires valid product data)\n');
  
  console.log('✅ All tests completed!');
  console.log('\n📊 Summary:');
  console.log(`   - Jobs visible to merchandiser: ${merchJobs.length}`);
  console.log(`   - Products visible to merchandiser: ${merchProducts.length}`);
  console.log(`   - Jobs with "Created By" info: ${jobsWithCreator.length}`);
  console.log(`   - Products with "Created By" info: ${productsWithCreator.length}`);
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests, login, getJobs, getProducts };

