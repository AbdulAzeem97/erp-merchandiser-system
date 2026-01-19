-- Check workflow steps for jobs in Cutting department
SELECT 
  jc.id as job_id,
  jc."jobNumber",
  jc.current_department,
  jws.id as step_id,
  jws.step_name,
  jws.department,
  jws.status,
  jws.sequence_number,
  jws.is_compulsory
FROM job_cards jc
JOIN job_workflow_steps jws ON jc.id = jws.job_card_id
WHERE jc.current_department = 'Cutting'
  OR EXISTS (
    SELECT 1 FROM job_workflow_steps jws2
    WHERE jws2.job_card_id = jc.id
    AND jws2.department = 'Cutting'
    AND jws2.status IN ('in_progress', 'completed')
  )
ORDER BY jc.id, jws.sequence_number
LIMIT 50;



