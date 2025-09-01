import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runSeed() {
  try {
    console.log('🌱 Running process sequences seed...');
    const { stdout, stderr } = await execAsync('cd server && node database/seedProcessSequences.js');
    console.log(stdout);
    if (stderr) console.error(stderr);
    console.log('✅ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Error running seed:', error);
  }
}

runSeed();
