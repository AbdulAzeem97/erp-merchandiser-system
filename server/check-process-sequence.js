import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'erp_merchandiser',
  user: process.env.DB_USER || 'erp_user',
  password: process.env.DB_PASSWORD || 'DevPassword123!',
});

async function checkProcessSequence() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔍 Checking Process Sequence for Offset\n');
    console.log('='.repeat(80));
    
    // Check process sequences
    const sequencesResult = await client.query(`
      SELECT id, name, description
      FROM process_sequences
      WHERE name ILIKE '%offset%'
    `);
    
    console.log(`\n📋 Found ${sequencesResult.rows.length} Offset sequence(s):`);
    sequencesResult.rows.forEach(seq => {
      console.log(`  - ${seq.name}`);
    });
    
    if (sequencesResult.rows.length === 0) {
      console.log('⚠️ No Offset sequence found');
      await pool.end();
      return;
    }
    
    const sequenceId = sequencesResult.rows[0].id;
    
    // Check process steps
    const stepsResult = await client.query(`
      SELECT 
        id,
        name,
        "stepNumber",
        "isActive",
        "isQualityCheck"
      FROM process_steps
      WHERE "sequenceId" = $1
      ORDER BY "stepNumber"
    `, [sequenceId]);
    
    console.log(`\n📝 Found ${stepsResult.rows.length} process steps:`);
    stepsResult.rows.forEach(step => {
      const cutting = step.name.toLowerCase().includes('cutting') || step.name.toLowerCase().includes('press');
      console.log(`  ${step.stepNumber}. ${step.name} - Active: ${step.isActive}, QA Check: ${step.isQualityCheck}${cutting ? ' ✂️ CUTTING' : ''}`);
    });
    
    // Check for cutting steps
    const cuttingSteps = stepsResult.rows.filter(step => 
      step.name.toLowerCase().includes('cutting') || 
      step.name.toLowerCase().includes('press')
    );
    
    console.log(`\n✂️ Cutting-related steps: ${cuttingSteps.length}`);
    if (cuttingSteps.length === 0) {
      console.log('  ⚠️ No cutting step found in process sequence!');
    } else {
      cuttingSteps.forEach(step => {
        console.log(`  ✅ ${step.name} - Step ${step.stepNumber}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('❌ Error checking process sequence:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkProcessSequence().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

