
import dbAdapter from './server/database/adapter.js';
import dotenv from 'dotenv';
dotenv.config();

async function inspectJobsQuery() {
    try {
        await dbAdapter.initialize();
        const userId = 17; // The designer ID from logs

        console.log(`🔍 Inspecting jobs for User ID: ${userId}`);

        // 1. Check who this user is
        const userRes = await dbAdapter.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) {
            console.log('❌ User 17 not found');
        } else {
            console.log('👤 User found:', userRes.rows[0].username, userRes.rows[0].email);
        }

        // 2. Run the query from jobs.js (mimicking the logic)
        // Note: I need to copy the query logic from jobs.js routing.
        // Looking at previous view_file of jobs.js, the route '/assigned-to/:id' was around line 1550 (implied, I saw it in grep search earlier but need to confirm exact query).
        // I'll use the query I *think* is there or just a broad query joining prepress_jobs.

        console.log('🔄 Running simulated jobs query...');
        const query = `
            SELECT 
                jc.id, 
                jc."jobNumber", 
                pj.id as prepress_job_id, 
                pj.outsourcing_die_making_initiated, 
                pj.fil_initiated_request, 
                pj.blocks_initiated
            FROM job_cards jc
            LEFT JOIN prepress_jobs pj ON jc.id = pj.job_card_id
            WHERE jc."assignedToId" = $1
            ORDER BY jc."createdAt" DESC
        `;

        const res = await dbAdapter.query(query, [userId]);

        console.log(`found ${res.rows.length} jobs`);
        if (res.rows.length > 0) {
            console.log('--- First Job Result ---');
            console.log(res.rows[0]);
        }

        process.exit(0);
    } catch (error) {
        console.error('Inspection failed:', error);
        process.exit(1);
    }
}

inspectJobsQuery();
