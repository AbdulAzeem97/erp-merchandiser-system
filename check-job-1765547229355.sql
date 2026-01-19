-- Check job JC-1765547229355
SELECT 
  id,
  "jobNumber",
  "productId",
  "companyId",
  quantity,
  current_department,
  current_step,
  workflow_status,
  status,
  "createdAt",
  "updatedAt"
FROM job_cards
WHERE "jobNumber" = 'JC-1765547229355';

-- Check workflow steps
SELECT 
  id,
  step_name,
  department,
  status,
  sequence_number,
  completed_at
FROM job_workflow_steps
WHERE job_card_id = (SELECT id FROM job_cards WHERE "jobNumber" = 'JC-1765547229355')
ORDER BY sequence_number;

-- Check cutting assignment
SELECT 
  id,
  status,
  finished_at,
  started_at,
  updated_at
FROM cutting_assignments
WHERE job_id = (SELECT id FROM job_cards WHERE "jobNumber" = 'JC-1765547229355');

-- Check if Offset Printing step exists
SELECT 
  jws.id,
  jws.step_name,
  jws.department,
  jws.status,
  jws.sequence_number,
  jws.completed_at
FROM job_workflow_steps jws
JOIN job_cards jc ON jws.job_card_id = jc.id
WHERE jc."jobNumber" = 'JC-1765547229355'
  AND (jws.step_name ILIKE '%Offset Printing%' 
       OR jws.department = 'Offset Printing')
ORDER BY jws.sequence_number;



