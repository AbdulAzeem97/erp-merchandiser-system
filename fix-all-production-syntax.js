import fs from 'fs';

console.log('🔧 Fixing all syntax errors in production.js...');

const filePath = 'server/routes/production.js';
let content = fs.readFileSync(filePath, 'utf8');

// Fix all uuidv4() syntax errors
content = content.replace(/uuidv4\(\)\]/g, 'uuidv4()');

// Fix all array syntax issues
content = content.replace(/\[uuidv4\(\)\]/g, '[uuidv4()]');

// Fix all parameter array issues
content = content.replace(/\[\.\.\.([^,]+), ([^)]+)\]/g, '[$1, $2]');

// Fix all query parameter issues
content = content.replace(/`, \[([^]]+)\], ([^)]+)\);/g, '`, [$1, $2]);');

// Fix all remaining pool.prepare calls
content = content.replace(/pool\.prepare\(/g, 'await dbAdapter.query(');

// Fix .get() calls
content = content.replace(/\)\.get\(([^)]+)\)/g, ', [$1])');

// Fix .all() calls  
content = content.replace(/\)\.all\(([^)]+)\)/g, ', [$1])');

// Fix .run() calls
content = content.replace(/\)\.run\(([^)]+)\)/g, ', [$1])');

fs.writeFileSync(filePath, content);
console.log('✅ Fixed all syntax errors in production.js');
