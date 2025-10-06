import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function checkQAApprovedJobs() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking QA approved jobs in prepress_jobs table...\n');
    
    // Check all statuses
    const statusResult = await client.query(`
      SELECT status, COUNT(*) as count
      FROM prepress_jobs
      GROUP BY status
      ORDER BY count DESC
    `);
    
    console.log('📊 Job Status Distribution:');
    statusResult.rows.forEach(row => {
      console.log(`  ${row.status.padEnd(20)} : ${row.count} jobs`);
    });
    
    // Check QA approved jobs specifically
    const qaApprovedResult = await client.query(`
      SELECT 
        pj.id,
        pj.status,
        pj.qa_approved_at,
        pj.qa_approved_by,
        pj.plate_generated,
        jc.jobNumber,
        p.name as product_name
      FROM prepress_jobs pj
      LEFT JOIN job_cards jc ON pj.job_card_id = jc.id
      LEFT JOIN products p ON jc.product_id = p.id
      WHERE pj.status = 'QA_APPROVED' OR pj.qa_approved_at IS NOT NULL
      ORDER BY pj.qa_approved_at DESC NULLS LAST
    `);
    
    console.log(`\n✅ QA Approved Jobs: ${qaApprovedResult.rows.length}`);
    if (qaApprovedResult.rows.length > 0) {
      console.log('\nDetails:');
      qaApprovedResult.rows.forEach((job, index) => {
        console.log(`\n${index + 1}. Job: ${job.jobnumber}`);
        console.log(`   Product: ${job.product_name}`);
        console.log(`   Status: ${job.status}`);
        console.log(`   QA Approved: ${job.qa_approved_at ? new Date(job.qa_approved_at).toLocaleString() : 'Not yet'}`);
        console.log(`   Plate Generated: ${job.plate_generated ? 'Yes' : 'No'}`);
      });
    }
    
    // Check plate generated jobs
    const plateGeneratedResult = await client.query(`
      SELECT COUNT(*) as count
      FROM prepress_jobs
      WHERE plate_generated = true
    `);
    
    console.log(`\n🖨️ Plates Generated: ${plateGeneratedResult.rows[0].count} jobs`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkQAApprovedJobs();

