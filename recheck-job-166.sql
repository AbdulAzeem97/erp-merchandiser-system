-- Recheck job JC-1767250497140 after status update
SELECT 
  id,
  "jobNumber",
  current_department,
  current_step,
  workflow_status,
  status,
  "updatedAt"
FROM job_cards
WHERE "jobNumber" = 'JC-1767250497140';

-- Check workflow steps
SELECT 
  id,
  step_name,
  department,
  status,
  sequence_number,
  completed_at
FROM job_workflow_steps
WHERE job_card_id = 166
ORDER BY sequence_number;

-- Check cutting assignment
SELECT 
  id,
  status,
  finished_at,
  started_at,
  updated_at
FROM cutting_assignments
WHERE job_id = 166;



