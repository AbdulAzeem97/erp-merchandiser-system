-- Check cutting status for job 181
SELECT 
  jc.id,
  jc."jobNumber",
  jc.current_department,
  -- Check cutting assignment
  ca.id as cutting_assignment_id,
  ca.status as cutting_assignment_status,
  ca.finished_at as cutting_finished_at,
  -- Check cutting workflow step
  (SELECT status FROM job_workflow_steps 
   WHERE job_card_id = jc.id AND department = 'Cutting' 
   LIMIT 1) as cutting_workflow_status,
  -- Check if Offset Printing is selected
  (SELECT COUNT(*) FROM job_process_selections jps
   JOIN process_steps pst ON jps."processStepId" = pst.id
   WHERE jps."jobId" = jc.id
     AND jps.is_selected = true
     AND (pst.name ILIKE '%Offset Printing%' OR pst.name = 'Offset Printing')) as has_offset_selected
FROM job_cards jc
LEFT JOIN cutting_assignments ca ON jc.id = ca.job_id
WHERE jc.id = 181;



