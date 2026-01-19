import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Database connection
const getPool = () => {
  const user = process.env.DB_USER || process.env.PG_USER || 'erp_user';
  const host = process.env.DB_HOST || process.env.PG_HOST || 'localhost';
  const database = process.env.DB_NAME || process.env.PG_DATABASE || 'erp_merchandiser';
  const password = process.env.DB_PASSWORD || process.env.PG_PASSWORD || 'secure_password_123';
  const port = process.env.DB_PORT || process.env.PG_PORT || 5432;

  return new Pool({
    user,
    host,
    database,
    password,
    port: parseInt(port),
  });
};

const pool = getPool();
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001/api';

async function testLogin() {
  console.log('\n🔐 Testing Login for Mr Nasir...\n');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'nasir@horizonsourcing.net.pk',
        password: 'Password123'
      })
    });

    const data = await response.json();

    if (response.ok && data.token) {
      console.log('✅ Login successful!');
      console.log(`   User: ${data.user.firstName} ${data.user.lastName || ''}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Role: ${data.user.role}`);
      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Token: ${data.token.substring(0, 20)}...`);
      return data.token;
    } else {
      console.log('❌ Login failed!');
      console.log('   Error:', data.error || data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return null;
  }
}

async function checkOffsetPrintingJobs(token) {
  console.log('\n📋 Checking Offset Printing Jobs...\n');
  
  try {
    const response = await fetch(`${API_BASE_URL}/offset-printing/jobs`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ API Response: ${data.count || 0} jobs found`);
      if (data.jobs && data.jobs.length > 0) {
        console.log('\n📊 Jobs in Offset Printing:');
        data.jobs.forEach((job, index) => {
          console.log(`\n   Job ${index + 1}:`);
          console.log(`   - Job Number: ${job.jobNumber || 'N/A'}`);
          console.log(`   - Product: ${job.product_name || 'N/A'}`);
          console.log(`   - Company: ${job.company_name || 'N/A'}`);
          console.log(`   - Quantity: ${job.quantity || 'N/A'}`);
          console.log(`   - Status: ${job.offset_status || 'Pending'}`);
          console.log(`   - Machines: ${job.machines?.length || 0} designer-selected machines`);
          if (job.machines && job.machines.length > 0) {
            job.machines.forEach(m => {
              console.log(`     • ${m.machine_name} (${m.machine_code}) - ${m.plate_count} plates`);
            });
          }
        });
      } else {
        console.log('   ℹ️  No jobs currently in Offset Printing department');
      }
      return data.jobs || [];
    } else {
      console.log('❌ Failed to fetch jobs');
      console.log('   Error:', data.error || data.message);
      return [];
    }
  } catch (error) {
    console.log('❌ Error fetching jobs:', error.message);
    return [];
  }
}

async function checkDatabaseJobs() {
  console.log('\n🔍 Checking Database for Offset Printing Jobs...\n');
  
  try {
    // Check jobs in Offset Printing department
    const jobsResult = await pool.query(`
      SELECT 
        jc.id,
        jc."jobNumber",
        jc.quantity,
        jc.current_department,
        jc.current_step,
        jc.workflow_status,
        p.name as product_name,
        c.name as company_name,
        opa.status as offset_status,
        opa.assigned_to,
        opa.ctp_machine_id
      FROM job_cards jc
      LEFT JOIN products p ON jc."productId" = p.id
      LEFT JOIN companies c ON jc."companyId" = c.id
      LEFT JOIN offset_printing_assignments opa ON jc.id = opa.job_card_id
      WHERE jc.current_department = 'Offset Printing'
      ORDER BY jc."createdAt" DESC
      LIMIT 10
    `);

    console.log(`📊 Found ${jobsResult.rows.length} jobs in Offset Printing department:`);
    
    if (jobsResult.rows.length > 0) {
      jobsResult.rows.forEach((job, index) => {
        console.log(`\n   Job ${index + 1}:`);
        console.log(`   - ID: ${job.id}`);
        console.log(`   - Job Number: ${job.jobNumber || 'N/A'}`);
        console.log(`   - Product: ${job.product_name || 'N/A'}`);
        console.log(`   - Company: ${job.company_name || 'N/A'}`);
        console.log(`   - Quantity: ${job.quantity || 'N/A'}`);
        console.log(`   - Current Department: ${job.current_department}`);
        console.log(`   - Current Step: ${job.current_step || 'N/A'}`);
        console.log(`   - Workflow Status: ${job.workflow_status || 'N/A'}`);
        console.log(`   - Offset Status: ${job.offset_status || 'Pending'}`);
        console.log(`   - Assigned To: ${job.assigned_to || 'Not assigned'}`);
        console.log(`   - Machine ID: ${job.ctp_machine_id || 'Not assigned'}`);
      });
    } else {
      console.log('   ℹ️  No jobs found in Offset Printing department');
    }

    // Check workflow steps for Offset Printing
    console.log('\n🔍 Checking Workflow Steps for Offset Printing...\n');
    const workflowResult = await pool.query(`
      SELECT 
        jws.id,
        jws.job_card_id,
        jc."jobNumber",
        jws.step_name,
        jws.department,
        jws.status,
        jws.sequence_number
      FROM job_workflow_steps jws
      JOIN job_cards jc ON jws.job_card_id = jc.id
      WHERE jws.department = 'Offset Printing'
        AND jws.status != 'inactive'
        AND jws.status IN ('pending', 'in_progress', 'submitted', 'qa_review')
      ORDER BY jws.created_at DESC
      LIMIT 10
    `);

    console.log(`📊 Found ${workflowResult.rows.length} active Offset Printing workflow steps:`);
    if (workflowResult.rows.length > 0) {
      workflowResult.rows.forEach((step, index) => {
        console.log(`\n   Step ${index + 1}:`);
        console.log(`   - Job: ${step.jobNumber || 'N/A'}`);
        console.log(`   - Step Name: ${step.step_name}`);
        console.log(`   - Department: ${step.department}`);
        console.log(`   - Status: ${step.status}`);
        console.log(`   - Sequence: ${step.sequence_number}`);
      });
    } else {
      console.log('   ℹ️  No active Offset Printing workflow steps found');
    }

    return jobsResult.rows;
  } catch (error) {
    console.log('❌ Error checking database:', error.message);
    return [];
  }
}

async function checkUserExists() {
  console.log('\n👤 Checking Mr Nasir User...\n');
  
  try {
    const result = await pool.query(`
      SELECT id, email, "firstName", "lastName", role, "isActive"
      FROM users
      WHERE email = 'nasir@horizonsourcing.net.pk'
    `);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ User found:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.firstName} ${user.lastName || ''}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);
      return true;
    } else {
      console.log('❌ User not found!');
      return false;
    }
  } catch (error) {
    console.log('❌ Error checking user:', error.message);
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 Testing Offset Printing System\n');
    console.log('='.repeat(60));

    // Check user exists
    await checkUserExists();

    // Test login
    const token = await testLogin();

    if (token) {
      // Check jobs via API
      await checkOffsetPrintingJobs(token);
    }

    // Check database directly
    await checkDatabaseJobs();

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Testing completed!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

main();

