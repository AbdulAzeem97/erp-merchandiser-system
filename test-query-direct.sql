-- Test the improved query logic directly
SELECT DISTINCT
  jc.id,
  jc."jobNumber",
  jc.current_department,
  -- Check if Offset Printing is selected
  (SELECT COUNT(*) FROM job_process_selections jps
   JOIN process_steps pst ON jps."processStepId" = pst.id
   WHERE jps."jobId" = jc.id
     AND jps.is_selected = true
     AND (pst.name ILIKE '%Offset Printing%' OR pst.name = 'Offset Printing')) as has_offset_selected,
  -- Check cutting completion
  (SELECT COUNT(*) FROM job_workflow_steps jws3
   WHERE jws3.job_card_id = jc.id
     AND jws3.department = 'Cutting'
     AND jws3.status = 'completed') as cutting_completed_workflow,
  (SELECT COUNT(*) FROM cutting_assignments ca
   WHERE ca.job_id = jc.id
     AND ca.status = 'Completed') as cutting_completed_assignment,
  (SELECT planning_status FROM job_production_planning jpp2
   WHERE jpp2.job_card_id = jc.id LIMIT 1) as planning_status
FROM job_cards jc
WHERE jc."jobNumber" IN ('JC-1767607103136', 'JC-1767250497140', 'JC-1765547229355');



