-- Migration: Add Prepress Module and Enhanced RBAC
-- Version: 001
-- Description: Adds prepress tables, extends job_cards, and enhances user roles

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Extend job_cards table with merchandiser punching fields
ALTER TABLE job_cards
  ADD COLUMN IF NOT EXISTS punched_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS punched_at TIMESTAMPTZ DEFAULT now();

-- 2. Create prepress_jobs table
CREATE TABLE IF NOT EXISTS prepress_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_card_id UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  assigned_designer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'PAUSED', 'HOD_REVIEW', 'COMPLETED', 'REJECTED')),
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  due_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  hod_last_remark TEXT,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create prepress_activity table for audit trail
CREATE TABLE IF NOT EXISTS prepress_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prepress_job_id UUID NOT NULL REFERENCES prepress_jobs(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id),
  action TEXT NOT NULL CHECK (action IN ('ASSIGNED', 'STARTED', 'PAUSED', 'RESUMED', 'COMPLETED', 'REJECTED', 'REASSIGNED', 'REMARK', 'STATUS_CHANGED')),
  from_status TEXT,
  to_status TEXT,
  remark TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create prepress_attachments table
CREATE TABLE IF NOT EXISTS prepress_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prepress_job_id UUID NOT NULL REFERENCES prepress_jobs(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES job_attachments(id) ON DELETE CASCADE,
  attachment_type TEXT DEFAULT 'ARTWORK' CHECK (attachment_type IN ('ARTWORK', 'PREVIEW', 'REFERENCE', 'OTHER')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  type TEXT DEFAULT 'INFO' CHECK (type IN ('INFO', 'WARNING', 'ERROR', 'SUCCESS')),
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
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

-- 7. Create materialized views for reporting
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_job_monthly AS
SELECT 
  date_trunc('month', punched_at) AS month,
  COUNT(*) AS jobs_punched,
  SUM((status = 'COMPLETED')::int) AS jobs_completed,
  SUM((status = 'IN_PROGRESS')::int) AS jobs_in_progress,
  SUM((status = 'PENDING')::int) AS jobs_pending,
  AVG(EXTRACT(EPOCH FROM (updated_at - punched_at))) AS avg_processing_time_seconds
FROM job_cards
WHERE punched_at IS NOT NULL
GROUP BY 1;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_prepress_kpis AS
SELECT 
  date_trunc('month', pj.created_at) AS month,
  COUNT(*) AS prepress_jobs,
  SUM((pj.status = 'COMPLETED')::int) AS completed_jobs,
  SUM((pj.status = 'IN_PROGRESS')::int) AS in_progress_jobs,
  AVG(CASE 
    WHEN pj.started_at IS NOT NULL AND pj.completed_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (pj.completed_at - pj.started_at)) 
  END) AS avg_turnaround_seconds,
  COUNT(DISTINCT pj.assigned_designer_id) AS active_designers
FROM prepress_jobs pj
GROUP BY 1;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_designer_productivity AS
SELECT 
  pj.assigned_designer_id,
  u.first_name || ' ' || u.last_name AS designer_name,
  COUNT(*) AS total_jobs,
  SUM((pj.status = 'COMPLETED')::int) AS completed_jobs,
  AVG(CASE 
    WHEN pj.started_at IS NOT NULL AND pj.completed_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (pj.completed_at - pj.started_at)) 
  END) AS avg_cycle_time_seconds,
  COUNT(DISTINCT DATE(pj.created_at)) AS active_days
FROM prepress_jobs pj
JOIN users u ON pj.assigned_designer_id = u.id
WHERE pj.assigned_designer_id IS NOT NULL
GROUP BY pj.assigned_designer_id, u.first_name, u.last_name;

-- 8. Create triggers for updated_at
CREATE TRIGGER update_prepress_jobs_updated_at 
  BEFORE UPDATE ON prepress_jobs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Create function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_reporting_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_job_monthly;
  REFRESH MATERIALIZED VIEW mv_prepress_kpis;
  REFRESH MATERIALIZED VIEW mv_designer_productivity;
END;
$$ LANGUAGE plpgsql;

-- 10. Create function to log prepress activity
CREATE OR REPLACE FUNCTION log_prepress_activity(
  p_prepress_job_id UUID,
  p_actor_id UUID,
  p_action TEXT,
  p_from_status TEXT DEFAULT NULL,
  p_to_status TEXT DEFAULT NULL,
  p_remark TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO prepress_activity (
    prepress_job_id, actor_id, action, from_status, to_status, remark, metadata
  ) VALUES (
    p_prepress_job_id, p_actor_id, p_action, p_from_status, p_to_status, p_remark, p_metadata
  );
END;
$$ LANGUAGE plpgsql;

-- 11. Create function to validate prepress status transitions
CREATE OR REPLACE FUNCTION validate_prepress_status_transition(
  p_from_status TEXT,
  p_to_status TEXT,
  p_user_role TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- HOD_PREPRESS can do any transition
  IF p_user_role = 'HOD_PREPRESS' OR p_user_role = 'ADMIN' THEN
    RETURN TRUE;
  END IF;
  
  -- DESIGNER can only do specific transitions
  IF p_user_role = 'DESIGNER' THEN
    RETURN (p_from_status = 'ASSIGNED' AND p_to_status = 'IN_PROGRESS') OR
           (p_from_status = 'IN_PROGRESS' AND p_to_status = 'PAUSED') OR
           (p_from_status = 'PAUSED' AND p_to_status = 'IN_PROGRESS') OR
           (p_from_status = 'IN_PROGRESS' AND p_to_status = 'HOD_REVIEW');
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE prepress_jobs IS 'Prepress jobs linked to job cards with designer assignments and status tracking';
COMMENT ON TABLE prepress_activity IS 'Audit trail for all prepress job activities and status changes';
COMMENT ON TABLE prepress_attachments IS 'Links prepress jobs to file attachments';
COMMENT ON TABLE notifications IS 'In-app notifications for users';
COMMENT ON FUNCTION log_prepress_activity IS 'Helper function to log prepress activities';
COMMENT ON FUNCTION validate_prepress_status_transition IS 'Validates status transitions based on user role';
COMMENT ON FUNCTION refresh_reporting_views IS 'Refreshes all materialized views for reporting';
