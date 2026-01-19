-- Check all jobs and their Offset Printing workflow steps
SELECT 
  jc.id,
  jc."jobNumber",
  jc.current_department,
  jc.current_step,
  -- Get all workflow steps for this job
  (SELECT json_agg(json_build_object(
    'id', id,
    'step_name', step_name,
    'department', department,
    'status', status,
    'sequence_number', sequence_number
  ) ORDER BY sequence_number) 
  FROM job_workflow_steps 
  WHERE job_card_id = jc.id) as workflow_steps,
  -- Specifically check for Offset Printing step
  (SELECT json_build_object(
    'id', id,
    'step_name', step_name,
    'department', department,
    'status', status,
    'sequence_number', sequence_number
  )
  FROM job_workflow_steps 
  WHERE job_card_id = jc.id 
  AND (step_name ILIKE '%Offset Printing%' OR step_name = 'Offset Printing')
  LIMIT 1) as offset_printing_step
FROM job_cards jc
WHERE EXISTS (
  SELECT 1 FROM job_workflow_steps jws
  WHERE jws.job_card_id = jc.id
  AND (jws.step_name ILIKE '%Offset Printing%' OR jws.step_name = 'Offset Printing')
)
ORDER BY jc."createdAt" DESC
LIMIT 10;



