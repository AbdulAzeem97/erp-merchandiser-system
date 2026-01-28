
import fetch from 'node-fetch';

const LOGIN_URL = 'http://localhost:5001/api/auth/login';
const JOBS_URL = 'http://localhost:5001/api/jobs/assigned-to/17'; // Assuming user 17 is the designer from logs

async function debugAPI() {
    try {
        // 1. Login
        console.log('Logging in...');
        // We need to find a valid user credential. I'll try the one from the seed or just guess based on common patterns.
        // User 17 was in the logs: "User ID: 17".
        // Let's try to find this user in the DB first to get the username if possible?
        // Actually, let's just use the seed credentials if we can't get the specific user's pass.
        // But wait, the logs showed "User ID: 17" accessing.
        // I'll try to use a known seed user "designer_emma" first to see the structure.

        const loginRes = await fetch(LOGIN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'emma.wilson@horizonsourcing.com',
                password: 'designer123'
            })
        });

        const loginData = await loginRes.json();
        if (!loginData.success) {
            console.error('Login failed:', loginData);
            return;
        }

        const token = loginData.token;
        const userId = loginData.user.id;
        console.log(`Logged in as ID: ${userId}`);

        // 2. Fetch Assigned Jobs
        // Use the ID from the login incase it differs from 17
        const jobsUrl = `http://localhost:5001/api/jobs/assigned-to/${userId}`;
        console.log(`Fetching jobs from: ${jobsUrl}`);

        const jobsRes = await fetch(jobsUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const jobsData = await jobsRes.json();
        // console.log('Jobs Response:', JSON.stringify(jobsData, null, 2));

        if (jobsData.success && jobsData.jobs.length > 0) {
            console.log('--- First Job Sample ---');
            const job = jobsData.jobs[0];
            console.log(`ID: ${job.id}`);
            console.log(`Job Number: ${job.jobNumber}`);
            console.log(`Prepress Job ID: ${job.prepress_job_id}`);
            console.log(`Outsourcing Initiated: ${job.outsourcing_die_making_initiated}`);

            // Log full object keys to check for typos
            console.log('Keys:', Object.keys(job));
        } else {
            console.log('No jobs found or success false');
            console.log(JSON.stringify(jobsData, null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

debugAPI();
