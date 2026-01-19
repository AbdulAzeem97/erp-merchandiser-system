-- Simple check: Find jobs with Offset Printing steps
SELECT 
  jc.id,
  jc."jobNumber",
  jc.current_department,
  jws.step_name,
  jws.department,
  jws.status,
  jws.sequence_number
FROM job_cards jc
JOIN job_workflow_steps jws ON jc.id = jws.job_card_id
WHERE jws.step_name ILIKE '%Offset Printing%' 
   OR jws.step_name = 'Offset Printing'
ORDER BY jc."createdAt" DESC
LIMIT 10;



