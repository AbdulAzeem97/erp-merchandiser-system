-- Check workflow steps for job 166
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

-- Check cutting assignment for job 166
SELECT 
  id,
  status,
  finished_at,
  started_at
FROM cutting_assignments
WHERE job_id = 166;



