-- Check specific job JC-1767250497140
SELECT 
  jc.id,
  jc."jobNumber",
  jc.current_department,
  jc.current_step,
  jc.workflow_status,
  ca.status as cutting_assignment_status,
  ca.finished_at as cutting_finished_at
FROM job_cards jc
LEFT JOIN cutting_assignments ca ON jc.id = ca.job_id
WHERE jc."jobNumber" = 'JC-1767250497140';

-- Get all workflow steps for this job
SELECT 
  jws.id,
  jws.step_name,
  jws.department,
  jws.status,
  jws.sequence_number,
  jws.completed_at
FROM job_workflow_steps jws
JOIN job_cards jc ON jws.job_card_id = jc.id
WHERE jc."jobNumber" = 'JC-1767250497140'
ORDER BY jws.sequence_number;



