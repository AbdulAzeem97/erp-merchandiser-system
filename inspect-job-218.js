
import dbAdapter from './server/database/adapter.js';
import dotenv from 'dotenv';
dotenv.config();

async function inspectColumnType() {
    try {
        await dbAdapter.initialize();
        const res = await dbAdapter.query("SELECT data_type FROM information_schema.columns WHERE table_name = 'prepress_jobs' AND column_name = 'job_card_id'");
        console.log('Column Type:', res.rows[0]);

        // Check for job 218 in prepress_jobs
        // Assuming job_card_id matches either 218 or 'JC-1769084115660'

        // Since we don't know the type for sure (likely text if IDs are strings elsewhere, but let's see),
        // we will try to select * where job_card_id matches.

        // We'll assume it's TEXT or VARCHAR based on previous "uuid" references or INT.
        // Let's just list all prepress jobs to be safe if the list is small, or search with string.

        console.log('Checking for Job 218 (ID or String)...');
        // We need to handle potential type mismatch in query if it's integer vs string

        const jobs = await dbAdapter.query(`SELECT * FROM prepress_jobs WHERE job_card_id::text = '218' OR job_card_id::text = 'JC-1769084115660'`);
        console.log('Matches:', jobs.rows);

        process.exit(0);
    } catch (error) {
        console.error('Inspection failed:', error);
        process.exit(1);
    }
}

inspectColumnType();
