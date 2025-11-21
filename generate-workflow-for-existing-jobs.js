import dbAdapter from './server/database/adapter.js';
import UnifiedWorkflowService from './server/services/unifiedWorkflowService.js';

async function generateWorkflowForExistingJobs() {
  try {
    console.log('🔄 Generating workflow for existing jobs...');
    
    // Initialize database adapter
    await dbAdapter.initialize();
    console.log('✅ Database adapter initialized\n');
    
    // Initialize workflow service
    const workflowService = new UnifiedWorkflowService();
    
    // Get all jobs that don't have workflow steps
    const jobsWithoutWorkflow = await dbAdapter.query(`
      SELECT jc.id, jc."productId", jc."jobNumber"
      FROM job_cards jc
      WHERE NOT EXISTS (
        SELECT 1 FROM job_workflow_steps jws WHERE jws.job_card_id = jc.id::text
      )
      ORDER BY jc."createdAt" DESC
      LIMIT 100
    `);
    
    console.log(`📋 Found ${jobsWithoutWorkflow.rows.length} jobs without workflow\n`);
    
    if (jobsWithoutWorkflow.rows.length === 0) {
      console.log('✅ All jobs already have workflow!');
      process.exit(0);
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const job of jobsWithoutWorkflow.rows) {
      try {
        console.log(`🔄 Processing job ${job.jobNumber} (ID: ${job.id})...`);
        
        // Generate workflow for this job
        await workflowService.generateWorkflowFromProduct(job.id.toString(), job.productId.toString());
        
        successCount++;
        console.log(`✅ Generated workflow for job ${job.jobNumber}\n`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error generating workflow for job ${job.jobNumber}:`, error.message);
        console.error('   Continuing with next job...\n');
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Successfully generated: ${successCount} jobs`);
    console.log(`   ❌ Failed: ${errorCount} jobs`);
    console.log(`   📋 Total processed: ${jobsWithoutWorkflow.rows.length} jobs`);
    
    // Verify results
    console.log('\n🔍 Verifying results...');
    const jobsWithWorkflow = await dbAdapter.query(`
      SELECT COUNT(DISTINCT job_card_id) as count
      FROM job_workflow_steps
    `);
    
    console.log(`✅ Jobs with workflow: ${jobsWithWorkflow.rows[0].count}`);
    
    // Show sample workflow
    const sampleWorkflow = await dbAdapter.query(`
      SELECT jws.*, jc."jobNumber"
      FROM job_workflow_steps jws
      JOIN job_cards jc ON jws.job_card_id = jc.id::text
      ORDER BY jc."createdAt" DESC, jws.sequence_number ASC
      LIMIT 5
    `);
    
    if (sampleWorkflow.rows.length > 0) {
      console.log('\n📋 Sample workflow steps:');
      const groupedByJob = {};
      sampleWorkflow.rows.forEach(row => {
        if (!groupedByJob[row.jobNumber]) {
          groupedByJob[row.jobNumber] = [];
        }
        groupedByJob[row.jobNumber].push(row);
      });
      
      Object.entries(groupedByJob).slice(0, 2).forEach(([jobNumber, steps]) => {
        console.log(`\n   Job: ${jobNumber}`);
        steps.forEach(step => {
          console.log(`     ${step.sequence_number}. ${step.step_name} (${step.department}) - ${step.status}`);
        });
      });
    }
    
    console.log('\n🎉 Workflow generation completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating workflow for existing jobs:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

generateWorkflowForExistingJobs();

