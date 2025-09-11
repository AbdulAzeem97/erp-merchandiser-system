import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Updating all routes to use PostgreSQL adapter...');

const routesDir = path.join(__dirname, 'server', 'routes');
const files = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));

let updatedFiles = 0;

for (const file of files) {
    const filePath = path.join(routesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace import statements
    if (content.includes("import pool from '../database/sqlite-config.js';")) {
        content = content.replace(
            "import pool from '../database/sqlite-config.js';",
            "import dbAdapter from '../database/adapter.js';"
        );
        modified = true;
    }
    
    // Replace pool.query with dbAdapter.query
    if (content.includes('pool.query(')) {
        content = content.replace(/pool\.query\(/g, 'dbAdapter.query(');
        modified = true;
    }
    
    // Replace pool.prepare().get() with dbAdapter.query()
    if (content.includes('pool.prepare(')) {
        // This is more complex, so we'll handle it case by case
        content = content.replace(
            /pool\.prepare\(([^)]+)\)\.get\(([^)]+)\)/g,
            'await dbAdapter.query($1, [$2])'
        );
        modified = true;
    }
    
    // Replace pool.prepare().all() with dbAdapter.query()
    if (content.includes('pool.prepare(')) {
        content = content.replace(
            /pool\.prepare\(([^)]+)\)\.all\(([^)]+)\)/g,
            'await dbAdapter.query($1, [$2])'
        );
        modified = true;
    }
    
    // Replace pool.prepare().run() with dbAdapter.query()
    if (content.includes('pool.prepare(')) {
        content = content.replace(
            /pool\.prepare\(([^)]+)\)\.run\(([^)]+)\)/g,
            'await dbAdapter.query($1, [$2])'
        );
        modified = true;
    }
    
    if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Updated: ${file}`);
        updatedFiles++;
    }
}

console.log(`\n🎉 Updated ${updatedFiles} route files to use PostgreSQL adapter!`);
console.log('📋 Next steps:');
console.log('   1. Start PostgreSQL: docker-compose up -d postgres');
console.log('   2. Start backend: $env:PG_HOST="localhost"; node server/index.js');
console.log('   3. Test the system with PostgreSQL');
