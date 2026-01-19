import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection configuration
const pool = new Pool({
  user: process.env.DB_USER || process.env.POSTGRES_USER || 'erp_user',
  host: process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
  database: process.env.DB_NAME || process.env.POSTGRES_DB || 'erp_merchandiser',
  password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'DevPassword123!',
  port: parseInt(process.env.DB_PORT || process.env.POSTGRES_PORT || '5432'),
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Create schema_migrations table if it doesn't exist
 */
async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      migration_name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      checksum VARCHAR(64),
      execution_time_ms INTEGER,
      status VARCHAR(20) DEFAULT 'SUCCESS',
      error_message TEXT
    );
  `);
  
  // Create index for faster lookups
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_schema_migrations_name 
    ON schema_migrations(migration_name);
  `);
}

/**
 * Calculate checksum of migration file
 */
function calculateChecksum(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Check if migration has already been applied
 */
async function isMigrationApplied(client, migrationName, checksum) {
  const result = await client.query(
    `SELECT migration_name, checksum, status FROM schema_migrations WHERE migration_name = $1`,
    [migrationName]
  );
  
  if (result.rows.length === 0) {
    return false;
  }
  
  const applied = result.rows[0];
  
  // If checksum changed, migration file was modified
  if (applied.checksum && applied.checksum !== checksum) {
    log(`⚠️  Warning: Migration ${migrationName} was modified (checksum mismatch)`, 'yellow');
    log(`   Previous checksum: ${applied.checksum.substring(0, 8)}...`, 'yellow');
    log(`   Current checksum:  ${checksum.substring(0, 8)}...`, 'yellow');
  }
  
  return applied.status === 'SUCCESS';
}

/**
 * Check if table exists
 */
async function tableExists(client, tableName) {
  const result = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    );
  `, [tableName]);
  return result.rows[0].exists;
}

/**
 * Check if column exists in table
 */
async function columnExists(client, tableName, columnName) {
  const result = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = $1 
      AND column_name = $2
    );
  `, [tableName, columnName]);
  return result.rows[0].exists;
}

/**
 * Parse SQL migration to extract table/column names for checking
 */
function parseSQLMigration(content) {
  const checks = {
    tables: [],
    columns: [],
  };
  
  // Extract CREATE TABLE statements
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["']?(\w+)["']?/gi;
  let match;
  while ((match = createTableRegex.exec(content)) !== null) {
    checks.tables.push(match[1].toLowerCase());
  }
  
  // Extract ALTER TABLE ... ADD COLUMN statements
  const alterTableRegex = /ALTER\s+TABLE\s+["']?(\w+)["']?\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?["']?(\w+)["']?/gi;
  while ((match = alterTableRegex.exec(content)) !== null) {
    checks.columns.push({
      table: match[1].toLowerCase(),
      column: match[2].toLowerCase(),
    });
  }
  
  return checks;
}

/**
 * Check if migration changes already exist in database
 */
async function checkMigrationNeeded(client, migrationName, content) {
  const checks = parseSQLMigration(content);
  const needed = {
    tables: [],
    columns: [],
  };
  
  // Check tables
  for (const tableName of checks.tables) {
    const exists = await tableExists(client, tableName);
    if (!exists) {
      needed.tables.push(tableName);
    }
  }
  
  // Check columns
  for (const { table, column } of checks.columns) {
    const exists = await columnExists(client, table, column);
    if (!exists) {
      needed.columns.push({ table, column });
    }
  }
  
  return needed;
}

/**
 * Record migration in schema_migrations table
 */
async function recordMigration(client, migrationName, checksum, executionTime, status = 'SUCCESS', errorMessage = null) {
  await client.query(`
    INSERT INTO schema_migrations (migration_name, checksum, execution_time_ms, status, error_message)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (migration_name) 
    DO UPDATE SET 
      checksum = EXCLUDED.checksum,
      execution_time_ms = EXCLUDED.execution_time_ms,
      status = EXCLUDED.status,
      error_message = EXCLUDED.error_message,
      applied_at = now();
  `, [migrationName, checksum, executionTime, status, errorMessage]);
}

/**
 * Execute SQL migration file
 */
async function executeSQLMigration(client, migrationPath, migrationName) {
  const content = fs.readFileSync(migrationPath, 'utf8');
  const checksum = calculateChecksum(content);
  
  // Check if already applied
  const isApplied = await isMigrationApplied(client, migrationName, checksum);
  if (isApplied) {
    log(`⏭️  Skipping ${migrationName} (already applied)`, 'yellow');
    return { applied: false, skipped: true };
  }
  
  // Check if changes are needed
  const needed = await checkMigrationNeeded(client, migrationName, content);
  const checks = parseSQLMigration(content);
  
  // If migration has checkable changes and all already exist, mark as applied without executing
  const hasCheckableChanges = checks.tables.length > 0 || checks.columns.length > 0;
  const allChangesExist = needed.tables.length === 0 && needed.columns.length === 0;
  
  if (hasCheckableChanges && allChangesExist) {
    log(`✅ ${migrationName} - All changes already exist, marking as applied`, 'green');
    const startTime = Date.now();
    await recordMigration(client, migrationName, checksum, Date.now() - startTime, 'SUCCESS');
    return { applied: true, skipped: false };
  }
  
  // Execute migration
  log(`🔄 Applying ${migrationName}...`, 'cyan');
  const startTime = Date.now();
  
  try {
    // Split SQL into individual statements
    const statements = content
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        await client.query(statement);
      }
    }
    
    const executionTime = Date.now() - startTime;
    await recordMigration(client, migrationName, checksum, executionTime, 'SUCCESS');
    
    log(`✅ ${migrationName} applied successfully (${executionTime}ms)`, 'green');
    return { applied: true, skipped: false };
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    await recordMigration(client, migrationName, checksum, executionTime, 'FAILED', error.message);
    
    log(`❌ ${migrationName} failed: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Execute JavaScript migration file
 */
async function executeJSMigration(client, migrationPath, migrationName) {
  const checksum = calculateChecksum(fs.readFileSync(migrationPath, 'utf8'));
  
  // Check if already applied
  const isApplied = await isMigrationApplied(client, migrationName, checksum);
  if (isApplied) {
    log(`⏭️  Skipping ${migrationName} (already applied)`, 'yellow');
    return { applied: false, skipped: true };
  }
  
  log(`🔄 Applying ${migrationName}...`, 'cyan');
  const startTime = Date.now();
  
  try {
    // Import and execute JS migration
    const migrationModule = await import(`file://${migrationPath}`);
    const migrationFunction = migrationModule.default || migrationModule.up || migrationModule.migrate;
    
    if (typeof migrationFunction === 'function') {
      await migrationFunction(client);
    } else {
      throw new Error('Migration file must export a default function or up/migrate function');
    }
    
    const executionTime = Date.now() - startTime;
    await recordMigration(client, migrationName, checksum, executionTime, 'SUCCESS');
    
    log(`✅ ${migrationName} applied successfully (${executionTime}ms)`, 'green');
    return { applied: true, skipped: false };
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    await recordMigration(client, migrationName, checksum, executionTime, 'FAILED', error.message);
    
    log(`❌ ${migrationName} failed: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Get all migration files from migrations directory
 */
function getMigrationFiles(migrationsDir) {
  if (!fs.existsSync(migrationsDir)) {
    log(`⚠️  Migrations directory not found: ${migrationsDir}`, 'yellow');
    return [];
  }
  
  const files = fs.readdirSync(migrationsDir)
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return (ext === '.sql' || ext === '.js') && /^\d{3}_/.test(file);
    })
    .map(file => ({
      name: file,
      path: path.join(migrationsDir, file),
      number: parseInt(file.match(/^(\d+)_/)?.[1] || '0'),
    }))
    .sort((a, b) => a.number - b.number);
  
  return files;
}

/**
 * Main migration runner
 */
async function runMigrations() {
  const client = await pool.connect();
  
  try {
    log('\n🚀 Starting Database Migration Runner', 'blue');
    log('=====================================\n', 'blue');
    
    // Ensure migration tracking table exists
    await ensureMigrationTable(client);
    log('✅ Migration tracking table ready\n', 'green');
    
    // Get migrations directory (relative to project root)
    const projectRoot = path.resolve(__dirname, '..');
    const migrationsDir = path.join(projectRoot, 'server', 'database', 'migrations');
    
    // Get all migration files
    const migrationFiles = getMigrationFiles(migrationsDir);
    
    if (migrationFiles.length === 0) {
      log('⚠️  No migration files found', 'yellow');
      return;
    }
    
    log(`📋 Found ${migrationFiles.length} migration file(s)\n`, 'cyan');
    
    let appliedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    
    // Process each migration
    for (const migration of migrationFiles) {
      const ext = path.extname(migration.name).toLowerCase();
      
      try {
        let result;
        
        if (ext === '.sql') {
          result = await executeSQLMigration(client, migration.path, migration.name);
        } else if (ext === '.js') {
          result = await executeJSMigration(client, migration.path, migration.name);
        } else {
          log(`⚠️  Skipping ${migration.name} (unsupported file type)`, 'yellow');
          continue;
        }
        
        if (result.applied) {
          appliedCount++;
        } else if (result.skipped) {
          skippedCount++;
        }
        
      } catch (error) {
        failedCount++;
        log(`\n❌ Migration ${migration.name} failed:`, 'red');
        log(`   ${error.message}`, 'red');
        
        // Continue with other migrations
        continue;
      }
    }
    
    // Summary
    log('\n=====================================', 'blue');
    log('📊 Migration Summary', 'blue');
    log('=====================================', 'blue');
    log(`✅ Applied:   ${appliedCount}`, 'green');
    log(`⏭️  Skipped:   ${skippedCount}`, 'yellow');
    if (failedCount > 0) {
      log(`❌ Failed:    ${failedCount}`, 'red');
    }
    log('=====================================\n', 'blue');
    
    if (failedCount > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations
runMigrations()
  .then(() => {
    log('\n✅ Migration process completed successfully!', 'green');
    process.exit(0);
  })
  .catch((error) => {
    log(`\n❌ Migration process failed: ${error.message}`, 'red');
    process.exit(1);
  });

