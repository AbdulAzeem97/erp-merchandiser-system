import dbAdapter from './server/database/adapter.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkTableSchema() {
    try {
        await dbAdapter.initialize();

        console.log('Checking product_process_selections table schema...');
        const result = await dbAdapter.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'product_process_selections'
            ORDER BY ordinal_position;
        `);

        // Also check the actual table schema with DESCRIBE equivalent
        console.log('\n=== Full table info ===');
        const tableInfo = await dbAdapter.query(`
            SELECT
                column_name,
                data_type,
                character_maximum_length,
                column_default,
                is_nullable,
                ordinal_position
            FROM information_schema.columns
            WHERE table_name = 'product_process_selections'
            ORDER BY ordinal_position;
        `);

        if (result.rows.length === 0) {
            console.log('❌ Table product_process_selections does not exist!');
        } else {
            console.log('✅ Table exists with columns:');
            result.rows.forEach(col => {
                console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
            });

            console.log('\n=== Detailed table info ===');
            tableInfo.rows.forEach(col => {
                console.log(`${col.ordinal_position}. ${col.column_name} - ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}${col.column_default ? ` DEFAULT ${col.column_default}` : ''}`);
            });
        }

        // Check if the table exists at all
        const tableCheck = await dbAdapter.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_name LIKE '%process%selection%' OR table_name LIKE '%product%process%';
        `);

        console.log('\nTables matching process/selection pattern:');
        tableCheck.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await dbAdapter.close();
        process.exit();
    }
}

checkTableSchema();