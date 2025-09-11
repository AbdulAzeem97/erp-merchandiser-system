import fs from 'fs';

console.log('🔧 Fixing PostgreSQL parameter syntax in all route files...');

const files = [
  'server/routes/products.js',
  'server/routes/jobs.js',
  'server/routes/companies.js',
  'server/routes/jobAssignment.js'
];

for (const filePath of files) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ File not found: ${filePath}`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix LIMIT ? OFFSET ? syntax
  const limitOffsetRegex = /LIMIT \? OFFSET \?/g;
  if (limitOffsetRegex.test(content)) {
    content = content.replace(limitOffsetRegex, 'LIMIT $${params.length + 1} OFFSET $${params.length + 2}');
    modified = true;
    console.log(`✅ Fixed LIMIT/OFFSET in ${filePath}`);
  }
  
  // Fix single ? parameters
  const singleParamRegex = /WHERE.*\?/g;
  if (singleParamRegex.test(content)) {
    // This is more complex, need to handle case by case
    console.log(`⚠️ Found single ? parameters in ${filePath} - may need manual review`);
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${filePath}`);
  }
}

console.log('🎉 PostgreSQL parameter fixes completed!');
