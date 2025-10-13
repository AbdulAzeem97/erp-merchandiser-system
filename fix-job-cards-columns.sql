-- Add missing camelCase columns to job_cards for backend compatibility

-- Step 1: Add all missing columns with proper data types
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS "assignedToId" INTEGER;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS assigned_to_id INTEGER;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS "createdById" INTEGER;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS created_by_id INTEGER;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS "updatedById" INTEGER;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS updated_by_id INTEGER;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS "jobNumber" VARCHAR(50);
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS job_number VARCHAR(50);
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS "jobStatus" VARCHAR(50) DEFAULT 'PENDING';
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS job_status VARCHAR(50) DEFAULT 'PENDING';
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'NORMAL';
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS start_date TIMESTAMP;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS "completionDate" TIMESTAMP;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS completion_date TIMESTAMP;

-- Step 2: Copy values from snake_case to camelCase if they exist
UPDATE job_cards SET "assignedToId" = "assignedTo" WHERE "assignedToId" IS NULL AND "assignedTo" IS NOT NULL;
UPDATE job_cards SET "assignedToId" = assigned_to WHERE "assignedToId" IS NULL AND assigned_to IS NOT NULL;
UPDATE job_cards SET assigned_to_id = "assignedToId" WHERE assigned_to_id IS NULL AND "assignedToId" IS NOT NULL;

UPDATE job_cards SET "createdById" = "createdBy" WHERE "createdById" IS NULL AND "createdBy" IS NOT NULL;
UPDATE job_cards SET "createdById" = created_by WHERE "createdById" IS NULL AND created_by IS NOT NULL;
UPDATE job_cards SET created_by_id = "createdById" WHERE created_by_id IS NULL AND "createdById" IS NOT NULL;

UPDATE job_cards SET "jobStatus" = status WHERE "jobStatus" IS NULL AND status IS NOT NULL;
UPDATE job_cards SET job_status = "jobStatus" WHERE job_status IS NULL AND "jobStatus" IS NOT NULL;

-- Step 3: Add foreign key constraints
ALTER TABLE job_cards DROP CONSTRAINT IF EXISTS job_cards_assigned_to_id_fk;
ALTER TABLE job_cards ADD CONSTRAINT job_cards_assigned_to_id_fk 
FOREIGN KEY ("assignedToId") REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE job_cards DROP CONSTRAINT IF EXISTS job_cards_created_by_id_fk;
ALTER TABLE job_cards ADD CONSTRAINT job_cards_created_by_id_fk 
FOREIGN KEY ("createdById") REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE job_cards DROP CONSTRAINT IF EXISTS job_cards_updated_by_id_fk;
ALTER TABLE job_cards ADD CONSTRAINT job_cards_updated_by_id_fk 
FOREIGN KEY ("updatedById") REFERENCES users(id) ON DELETE SET NULL;

-- Step 4: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_job_cards_assigned_to ON job_cards("assignedToId");
CREATE INDEX IF NOT EXISTS idx_job_cards_created_by ON job_cards("createdById");
CREATE INDEX IF NOT EXISTS idx_job_cards_job_number ON job_cards("jobNumber");
CREATE INDEX IF NOT EXISTS idx_job_cards_job_status ON job_cards("jobStatus");
CREATE INDEX IF NOT EXISTS idx_job_cards_priority ON job_cards(priority);
CREATE INDEX IF NOT EXISTS idx_job_cards_start_date ON job_cards("startDate");
CREATE INDEX IF NOT EXISTS idx_job_cards_completion_date ON job_cards("completionDate");

-- Step 5: Add check constraints for data validation
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_cards_priority_check') THEN
        ALTER TABLE job_cards 
        ADD CONSTRAINT job_cards_priority_check 
        CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT'));
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_cards_status_check') THEN
        ALTER TABLE job_cards 
        ADD CONSTRAINT job_cards_status_check 
        CHECK ("jobStatus" IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'));
    END IF;
END $$;

-- Step 6: Add trigger to sync camelCase and snake_case columns
CREATE OR REPLACE FUNCTION sync_job_cards_columns()
RETURNS TRIGGER AS $$
BEGIN
    NEW.assigned_to_id := NEW."assignedToId";
    NEW.created_by_id := NEW."createdById";
    NEW.updated_by_id := NEW."updatedById";
    NEW.job_number := NEW."jobNumber";
    NEW.job_status := NEW."jobStatus";
    NEW.start_date := NEW."startDate";
    NEW.completion_date := NEW."completionDate";
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_job_cards_trigger ON job_cards;
CREATE TRIGGER sync_job_cards_trigger
BEFORE INSERT OR UPDATE ON job_cards
FOR EACH ROW
EXECUTE FUNCTION sync_job_cards_columns();

-- Step 7: Verify the changes
DO $$
DECLARE
    column_count INTEGER;
    index_count INTEGER;
    fk_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'job_cards';
    
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename = 'job_cards';
    
    SELECT COUNT(*) INTO fk_count
    FROM pg_constraint
    WHERE conrelid = 'job_cards'::regclass
    AND contype = 'f';
    
    RAISE NOTICE 'Columns in job_cards: %', column_count;
    RAISE NOTICE 'Indexes on job_cards: %', index_count;
    RAISE NOTICE 'Foreign keys on job_cards: %', fk_count;
END $$;

SELECT 'Job cards columns fixed and enhanced successfully!' AS status;

