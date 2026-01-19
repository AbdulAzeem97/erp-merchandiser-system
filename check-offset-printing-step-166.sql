-- Check if Offset Printing step exists for job 166
SELECT 
  jws.id,
  jws.step_name,
  jws.department,
  jws.status,
  jws.sequence_number,
  jws.completed_at,
  jws.updated_at
FROM job_workflow_steps jws
WHERE jws.job_card_id = 166
  AND (jws.step_name ILIKE '%Offset Printing%' 
       OR jws.department = 'Offset Printing')
ORDER BY jws.sequence_number;



