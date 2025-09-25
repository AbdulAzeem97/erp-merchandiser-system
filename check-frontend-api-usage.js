#!/usr/bin/env node

console.log('🔍 Checking Frontend API Usage');
console.log('='.repeat(50));

async function checkFrontendAPIUsage() {
  try {
    // Get the frontend HTML
    console.log('📄 Fetching frontend HTML...');
    const response = await fetch('http://localhost:8080');
    const html = await response.text();
    
    console.log('✅ Frontend HTML fetched successfully');
    console.log(`📊 HTML length: ${html.length} characters`);
    
    // Check for API URL references
    console.log('\n🔍 Checking for API URL references...');
    
    if (html.includes('localhost')) {
      console.log('✅ Found network IP (localhost) in HTML');
    } else {
      console.log('❌ No network IP found in HTML');
    }
    
    if (html.includes('localhost:3001')) {
      console.log('❌ Found localhost:3001 in HTML - this is the problem!');
    } else {
      console.log('✅ No localhost:3001 found in HTML');
    }
    
    if (html.includes('VITE_API_BASE_URL')) {
      console.log('✅ Found VITE_API_BASE_URL reference');
    } else {
      console.log('❌ No VITE_API_BASE_URL reference found');
    }
    
    // Check for specific API calls in the HTML
    const apiPatterns = [
      'http://localhost:3001',
      'http://localhost:3001',
      'import.meta.env.VITE_API',
      'API_BASE_URL'
    ];
    
    console.log('\n🔍 Checking for API patterns...');
    apiPatterns.forEach(pattern => {
      if (html.includes(pattern)) {
        console.log(`✅ Found: ${pattern}`);
      } else {
        console.log(`❌ Not found: ${pattern}`);
      }
    });
    
    // Check if there are any script tags with API configuration
    const scriptMatches = html.match(/<script[^>]*>[\s\S]*?<\/script>/g);
    if (scriptMatches) {
      console.log(`\n📜 Found ${scriptMatches.length} script tags`);
      
      scriptMatches.forEach((script, index) => {
        if (script.includes('API') || script.includes('localhost') || script.includes('localhost:3001')) {
          console.log(`\n🔍 Script ${index + 1} contains API references:`);
          console.log(script.substring(0, 200) + '...');
        }
      });
    }
    
  } catch (error) {
    console.log('❌ Error checking frontend:', error.message);
  }
}

checkFrontendAPIUsage();



