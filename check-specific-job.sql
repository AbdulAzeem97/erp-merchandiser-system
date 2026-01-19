-- Check a specific job's workflow steps
-- Replace JOB_ID with the actual job ID

-- First, let's see all jobs that might have completed cutting recently
SELECT 
  jc.id,
  jc."jobNumber",
  jc.current_department,
  jc.current_step,
  ca.status as cutting_status,
  ca.finished_at,
  -- Get all workflow steps
  (SELECT json_agg(json_build_object(
    'step_name', step_name,
    'department', department,
    'status', status,
    'sequence_number', sequence_number
  ) ORDER BY sequence_number) 
  FROM job_workflow_steps 
  WHERE job_card_id = jc.id) as all_steps
FROM job_cards jc
LEFT JOIN cutting_assignments ca ON jc.id = ca.job_id
WHERE ca.status = 'Completed'
   OR jc.current_department = 'Cutting'
ORDER BY jc."updatedAt" DESC
LIMIT 5;



