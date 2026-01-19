-- Check job 166 details
SELECT 
  jc.id,
  jc."jobNumber",
  jc."productId",
  jc.current_department,
  jc.current_step,
  jc.workflow_status,
  p.name as product_name,
  p.product_type,
  -- Check cutting assignment
  ca.id as cutting_assignment_id,
  ca.status as cutting_status,
  ca.finished_at,
  -- Check workflow steps count
  (SELECT COUNT(*) FROM job_workflow_steps WHERE job_card_id = jc.id) as workflow_steps_count
FROM job_cards jc
LEFT JOIN products p ON jc."productId" = p.id
LEFT JOIN cutting_assignments ca ON jc.id = ca.job_id
WHERE jc.id = 166;



