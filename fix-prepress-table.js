import Database from 'better-sqlite3';

const db = new Database('erp_merchandiser.db');

console.log('Dropping and recreating prepress_jobs table...');

try {
  // Drop the existing table
  db.exec('DROP TABLE IF EXISTS prepress_jobs');
  
  // Recreate with correct foreign key reference
  db.exec(`
    CREATE TABLE prepress_jobs (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
      job_card_id TEXT NOT NULL REFERENCES job_cards(job_card_id) ON DELETE CASCADE,
      assigned_designer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'PAUSED', 'HOD_REVIEW', 'COMPLETED', 'REJECTED')),
      priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
      due_date DATETIME,
      started_at DATETIME,
      completed_at DATETIME,
      hod_last_remark TEXT,
      created_by TEXT REFERENCES users(id),
      updated_by TEXT REFERENCES users(id),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  console.log('✅ prepress_jobs table recreated with correct foreign key');
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}
