
      -- Create prepress_jobs table
      CREATE TABLE IF NOT EXISTS prepress_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_card_id UUID NOT NULL,
        assigned_designer_id UUID,
        status VARCHAR(50) DEFAULT 'ASSIGNED',
        priority VARCHAR(20) DEFAULT 'MEDIUM',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by UUID,
        updated_by UUID
      );

      -- Create prepress_activity_log table
      CREATE TABLE IF NOT EXISTS prepress_activity_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        prepress_job_id UUID NOT NULL,
        actor_id UUID,
        action VARCHAR(100),
        from_status VARCHAR(50),
        to_status VARCHAR(50),
        remark TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Insert prepress jobs for existing job cards
      INSERT INTO prepress_jobs (job_card_id, status, priority, created_at, updated_at)
      SELECT id, 'ASSIGNED', 'MEDIUM', NOW(), NOW()
      FROM job_cards
      WHERE id NOT IN (SELECT job_card_id FROM prepress_jobs);
    