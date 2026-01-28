
import dbAdapter from './server/database/adapter.js';
import dotenv from 'dotenv';
dotenv.config();

async function fixMissingPrepressJobs() {
    try {
        await dbAdapter.initialize();
        console.log('🔧 Fixing missing prepress_jobs records...');

        // Find assigned jobs that don't have a prepress_jobs record
        // We look for job_cards where assignedToId is not null, but no prepress_jobs entry exists with job_card_id = job_cards.id
        const missingQuery = `
            SELECT jc.id, jc."jobNumber", jc."assignedToId"
            FROM job_cards jc
            LEFT JOIN prepress_jobs pj ON jc.id = pj.job_card_id
            WHERE jc."assignedToId" IS NOT NULL
            AND pj.id IS NULL
        `;

        const missing = await dbAdapter.query(missingQuery);
        console.log(`Found ${missing.rows.length} assigned jobs without prepress records.`);

        for (const job of missing.rows) {
            console.log(`Creating prepress_jobs record for Job ${job.id} (${job.jobNumber})...`);

            // Insert missing record
            // We use 'ASSIGNED' as default status since it has an assignedToId
            await dbAdapter.query(`
                INSERT INTO prepress_jobs (
                    job_card_id, 
                    assigned_designer_id, 
                    status, 
                    priority, 
                    created_at, 
                    updated_at
                ) VALUES ($1, $2, 'ASSIGNED', 'MEDIUM', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `, [job.id, job.assignedToId]);

            console.log(`✅ Created prepress record for Job ${job.id}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Fix failed:', error);
        process.exit(1);
    }
}

fixMissingPrepressJobs();
