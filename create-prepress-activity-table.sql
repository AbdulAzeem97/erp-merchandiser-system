-- Create missing prepress_activity table

CREATE TABLE IF NOT EXISTS prepress_activity (
    id SERIAL PRIMARY KEY,
    prepress_job_id INTEGER REFERENCES prepress_jobs(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    description TEXT,
    performed_by INTEGER REFERENCES users(id),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_prepress_activity_job ON prepress_activity(prepress_job_id);
CREATE INDEX IF NOT EXISTS idx_prepress_activity_type ON prepress_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_prepress_activity_performed_by ON prepress_activity(performed_by);
CREATE INDEX IF NOT EXISTS idx_prepress_activity_date ON prepress_activity(performed_at);

SELECT 'prepress_activity table created successfully!' as status;



