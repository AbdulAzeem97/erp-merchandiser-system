-- Check workflow steps for jobs in Cutting
SELECT 
  jc.id,
  jc."jobNumber",
  jws.step_name,
  jws.department,
  jws.status,
  jws.sequence_number
FROM job_cards jc
JOIN job_workflow_steps jws ON jc.id = jws.job_card_id
WHERE jc.current_department = 'Cutting'
ORDER BY jc.id, jws.sequence_number
LIMIT 50;



