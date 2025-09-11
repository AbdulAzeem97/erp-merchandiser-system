-- Migration: Add Prepress Module and Enhanced RBAC (SQLite Version)
-- Version: 001
-- Description: Adds prepress tables, extends job_cards, and enhances user roles

-- 1. Extend job_cards table with merchandiser punching fields
ALTER TABLE job_cards
  ADD COLUMN punched_by TEXT REFERENCES users(id),
  ADD COLUMN punched_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- 2. Create prepress_jobs table
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
);

-- 3. Create prepress_activity table for audit trail
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
);

-- 4. Create prepress_attachments table
CREATE TABLE IF NOT EXISTS prepress_attachments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  prepress_job_id TEXT NOT NULL REFERENCES prepress_jobs(id) ON DELETE CASCADE,
  file_id TEXT NOT NULL REFERENCES job_attachments(id) ON DELETE CASCADE,
  attachment_type TEXT DEFAULT 'ARTWORK' CHECK (attachment_type IN ('ARTWORK', 'PREVIEW', 'REFERENCE', 'OTHER')),
  created_by TEXT REFERENCES users(id),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT DEFAULT 'INFO' CHECK (type IN ('INFO', 'WARNING', 'ERROR', 'SUCCESS')),
  link TEXT,
  read_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prepress_jobs_status ON prepress_jobs(status);
CREATE INDEX IF NOT EXISTS idx_prepress_jobs_assigned ON prepress_jobs(assigned_designer_id);
CREATE INDEX IF NOT EXISTS idx_prepress_jobs_due ON prepress_jobs(due_date);
CREATE INDEX IF NOT EXISTS idx_prepress_jobs_priority ON prepress_jobs(priority);
CREATE INDEX IF NOT EXISTS idx_prepress_jobs_created ON prepress_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_prepress_activity_job ON prepress_activity(prepress_job_id);
CREATE INDEX IF NOT EXISTS idx_prepress_activity_actor ON prepress_activity(actor_id);
CREATE INDEX IF NOT EXISTS idx_prepress_activity_created ON prepress_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_prepress_attachments_job ON prepress_attachments(prepress_job_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_job_cards_punched_by ON job_cards(punched_by);
CREATE INDEX IF NOT EXISTS idx_job_cards_punched_at ON job_cards(punched_at);

-- 7. Create triggers for updated_at
CREATE TRIGGER IF NOT EXISTS update_prepress_jobs_updated_at 
  AFTER UPDATE ON prepress_jobs 
  FOR EACH ROW
  BEGIN
    UPDATE prepress_jobs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;
