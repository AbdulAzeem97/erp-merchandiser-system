import Database from 'better-sqlite3';

const db = new Database('erp_merchandiser.db');

console.log('Creating prepress tables...');

try {
  // Create prepress_jobs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS prepress_jobs (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
      job_card_id TEXT NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
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

  // Create prepress_activity table
  db.exec(`
    CREATE TABLE IF NOT EXISTS prepress_activity (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
      prepress_job_id TEXT NOT NULL REFERENCES prepress_jobs(id) ON DELETE CASCADE,
      actor_id TEXT REFERENCES users(id),
      action TEXT NOT NULL CHECK (action IN ('ASSIGNED', 'STARTED', 'PAUSED', 'RESUMED', 'COMPLETED', 'REJECTED', 'REASSIGNED', 'REMARK', 'STATUS_CHANGED')),
      from_status TEXT,
      to_status TEXT,
      remark TEXT,
      metadata TEXT DEFAULT '{}',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create prepress_attachments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS prepress_attachments (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
      prepress_job_id TEXT NOT NULL REFERENCES prepress_jobs(id) ON DELETE CASCADE,
      file_id TEXT NOT NULL REFERENCES job_attachments(id) ON DELETE CASCADE,
      attachment_type TEXT DEFAULT 'ARTWORK' CHECK (attachment_type IN ('ARTWORK', 'PREVIEW', 'REFERENCE', 'OTHER')),
      created_by TEXT REFERENCES users(id),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create notifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      body TEXT,
      type TEXT DEFAULT 'INFO' CHECK (type IN ('INFO', 'WARNING', 'ERROR', 'SUCCESS')),
      link TEXT,
      read_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ All prepress tables created successfully!');
} catch (error) {
  console.error('❌ Error creating tables:', error.message);
} finally {
  db.close();
}
