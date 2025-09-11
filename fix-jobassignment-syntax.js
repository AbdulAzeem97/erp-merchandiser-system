import fs from 'fs';

console.log('🔧 Fixing syntax errors in jobAssignment.js...');

const filePath = 'server/routes/jobAssignment.js';
let content = fs.readFileSync(filePath, 'utf8');

// Fix array syntax issues
content = content.replace(/\[\.\.\.([^,]+), parseInt\(([^)]+)\)\], parseInt\(([^)]+)\)\);/g, '[$1, parseInt($2), parseInt($3)]);');

// Fix all pool.prepare calls to dbAdapter.query
content = content.replace(/pool\.prepare\(/g, 'await dbAdapter.query(');

// Fix .get() calls
content = content.replace(/\)\.get\(([^)]+)\)/g, ', [$1])');

// Fix .all() calls  
content = content.replace(/\)\.all\(([^)]+)\)/g, ', [$1])');

// Fix .run() calls
content = content.replace(/\)\.run\(([^)]+)\)/g, ', [$1])');

// Fix SQLite-specific functions to PostgreSQL
content = content.replace(/datetime\('now'\)/g, 'CURRENT_TIMESTAMP');
content = content.replace(/date\('now'\)/g, 'CURRENT_DATE');

fs.writeFileSync(filePath, content);
console.log('✅ Fixed syntax errors in jobAssignment.js');
