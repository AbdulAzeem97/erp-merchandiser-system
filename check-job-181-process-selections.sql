-- Check process sequence selections for job 181 (JC-1767607103136)
SELECT 
  jps."jobId",
  jps."processStepId",
  jps.is_selected,
  pst.id as step_id,
  pst.name as step_name,
  pst."stepNumber" as step_order,
  pst.department
FROM job_process_selections jps
JOIN process_steps pst ON jps."processStepId" = pst.id
WHERE jps."jobId" = 181
  AND jps.is_selected = true
ORDER BY pst."stepNumber";

-- Check if Offset Printing is selected
SELECT 
  jps."jobId",
  jps."processStepId",
  jps.is_selected,
  pst.name as step_name,
  pst.department
FROM job_process_selections jps
JOIN process_steps pst ON jps."processStepId" = pst.id
WHERE jps."jobId" = 181
  AND jps.is_selected = true
  AND (pst.name ILIKE '%Offset Printing%' OR pst.department = 'Offset Printing');



