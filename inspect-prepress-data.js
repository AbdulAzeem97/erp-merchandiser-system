
import dbAdapter from './server/database/adapter.js';
import dotenv from 'dotenv';
dotenv.config();

async function inspectPrepressData() {
    try {
        await dbAdapter.initialize();
        console.log('🔍 Inspecting prepress_jobs table...');

        const res = await dbAdapter.query('SELECT id, job_card_id, assigned_designer_id FROM prepress_jobs LIMIT 5');
        console.log(res.rows);

        const jcRes = await dbAdapter.query('SELECT id, "jobNumber" FROM job_cards LIMIT 5');
        console.log('--- Job Cards ---');
        console.log(jcRes.rows);

        process.exit(0);
    } catch (error) {
        console.error('Inspection failed:', error);
        process.exit(1);
    }
}

inspectPrepressData();
