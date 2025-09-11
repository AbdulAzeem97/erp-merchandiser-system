import Database from 'better-sqlite3';
import { Pool } from 'pg';

console.log('🧪 TESTING POSTGRESQL MIGRATION');
console.log('================================');

// Test PostgreSQL connection
async function testPostgreSQL() {
    console.log('\n📋 Testing PostgreSQL Connection...');
    
    const pgConfig = {
        user: process.env.PG_USER || 'erp_user',
        host: process.env.PG_HOST || 'localhost',
        database: process.env.PG_DATABASE || 'erp_merchandiser',
        password: process.env.PG_PASSWORD || 'secure_password_123',
        port: process.env.PG_PORT || 5432,
    };

    try {
        const pool = new Pool(pgConfig);
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time, version() as version');
        
        console.log('✅ PostgreSQL Connection Successful!');
        console.log(`   Time: ${result.rows[0].current_time}`);
        console.log(`   Version: ${result.rows[0].version}`);
        
        client.release();
        await pool.end();
        return true;
    } catch (error) {
        console.log('❌ PostgreSQL Connection Failed:', error.message);
        return false;
    }
}

// Test SQLite data
function testSQLiteData() {
    console.log('\n📋 Testing SQLite Data...');
    
    try {
        const db = new Database('erp_merchandiser.db');
        
        // Test key tables
        const tables = ['users', 'companies', 'products', 'job_cards', 'job_lifecycle'];
        let totalRows = 0;
        
        for (const table of tables) {
            const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
            console.log(`   ${table}: ${count} rows`);
            totalRows += count;
        }
        
        console.log(`✅ SQLite Data Ready: ${totalRows} total rows`);
        db.close();
        return true;
    } catch (error) {
        console.log('❌ SQLite Data Error:', error.message);
        return false;
    }
}

// Test migration readiness
async function testMigrationReadiness() {
    console.log('\n📋 Testing Migration Readiness...');
    
    const checks = [
        { name: 'PostgreSQL Driver', test: () => {
            try {
                require('pg');
                return true;
            } catch (e) {
                return false;
            }
        }},
        { name: 'Migration Script', test: () => {
            try {
                require('fs').accessSync('migrate-to-postgresql.js');
                return true;
            } catch (e) {
                return false;
            }
        }},
        { name: 'PostgreSQL Schema', test: () => {
            try {
                require('fs').accessSync('postgresql-schema.sql');
                return true;
            } catch (e) {
                return false;
            }
        }},
        { name: 'Database Adapter', test: () => {
            try {
                require('fs').accessSync('server/database/adapter.js');
                return true;
            } catch (e) {
                return false;
            }
        }}
    ];
    
    let allReady = true;
    for (const check of checks) {
        const result = check.test();
        console.log(`   ${check.name}: ${result ? '✅' : '❌'}`);
        if (!result) allReady = false;
    }
    
    return allReady;
}

// Main test function
async function runTests() {
    console.log('🚀 Starting Migration Tests...\n');
    
    const results = {
        postgresql: await testPostgreSQL(),
        sqlite: testSQLiteData(),
        readiness: await testMigrationReadiness()
    };
    
    console.log('\n📊 Test Results:');
    console.log('================');
    console.log(`PostgreSQL Connection: ${results.postgresql ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`SQLite Data: ${results.sqlite ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Migration Readiness: ${results.readiness ? '✅ PASS' : '❌ FAIL'}`);
    
    if (results.postgresql && results.sqlite && results.readiness) {
        console.log('\n🎉 ALL TESTS PASSED!');
        console.log('✅ Ready to run migration: node migrate-to-postgresql.js');
    } else {
        console.log('\n⚠️  SOME TESTS FAILED');
        console.log('📋 Next Steps:');
        
        if (!results.postgresql) {
            console.log('   1. Install PostgreSQL or start Docker container');
            console.log('   2. Create database and user');
            console.log('   3. Set environment variables');
        }
        
        if (!results.sqlite) {
            console.log('   4. Ensure SQLite database exists');
        }
        
        if (!results.readiness) {
            console.log('   5. Install missing dependencies: npm install pg');
        }
    }
    
    console.log('\n📚 For detailed instructions, see: POSTGRESQL_MIGRATION_GUIDE.md');
}

// Run tests
runTests().catch(console.error);

