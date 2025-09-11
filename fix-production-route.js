import fs from 'fs';

console.log('🔧 Fixing production.js route...');

const filePath = 'server/routes/production.js';
let content = fs.readFileSync(filePath, 'utf8');

// Fix the specific syntax error first
content = content.replace(
    'await dbAdapter.query(updateQuery, [...Object.values(updateData]), req.params.id);',
    'await dbAdapter.query(updateQuery, [...Object.values(updateData), req.params.id]);'
);

// Fix all remaining pool.prepare calls
content = content.replace(/pool\.prepare\(/g, 'await dbAdapter.query(');

// Fix .get() calls
content = content.replace(/\)\.get\(([^)]+)\)/g, ', [$1])');

// Fix .all() calls  
content = content.replace(/\)\.all\(([^)]+)\)/g, ', [$1])');

// Fix .run() calls
content = content.replace(/\)\.run\(([^)]+)\)/g, ', [$1])');

// Fix result access patterns
content = content.replace(/\.rows\[0\]/g, '.rows[0]');

fs.writeFileSync(filePath, content);
console.log('✅ Fixed production.js route');
