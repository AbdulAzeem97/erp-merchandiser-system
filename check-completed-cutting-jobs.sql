-- Find jobs that have completed cutting
SELECT 
  jc.id,
  jc."jobNumber",
  jc.current_department,
  jc.current_step,
  jc.workflow_status,
  p.name as product_name,
  -- Get all workflow steps for this job
  (SELECT json_agg(json_build_object(
    'id', id,
    'step_name', step_name,
    'department', department,
    'status', status,
    'sequence_number', sequence_number,
    'is_compulsory', is_compulsory
  ) ORDER BY sequence_number) 
  FROM job_workflow_steps 
  WHERE job_card_id = jc.id) as all_workflow_steps
FROM job_cards jc
LEFT JOIN products p ON jc."productId" = p.id
WHERE EXISTS (
  SELECT 1 FROM job_workflow_steps jws
  WHERE jws.job_card_id = jc.id
  AND jws.department = 'Cutting'
  AND jws.status = 'completed'
)
ORDER BY jc."updatedAt" DESC
LIMIT 5;



