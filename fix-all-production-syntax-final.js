import fs from 'fs';

console.log('🔧 Fixing all remaining syntax errors in production.js...');

const filePath = 'server/routes/production.js';
let content = fs.readFileSync(filePath, 'utf8');

// Fix all array syntax issues
content = content.replace(/\[([^]]+)\], ([^)]+)\);/g, '[$1, $2]);');

// Fix all missing closing brackets
content = content.replace(/defectsFound\]/g, 'defectsFound');

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

// Fix SQLite-specific functions to PostgreSQL
content = content.replace(/datetime\('now'\)/g, 'CURRENT_TIMESTAMP');
content = content.replace(/date\('now'\)/g, 'CURRENT_DATE');

fs.writeFileSync(filePath, content);
console.log('✅ Fixed all remaining syntax errors in production.js');
