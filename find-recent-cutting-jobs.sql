-- Find recently updated jobs in Cutting department
SELECT 
  jc.id,
  jc."jobNumber",
  jc.current_department,
  jc.current_step,
  jc.workflow_status,
  jc."updatedAt",
  p.name as product_name,
  -- Check cutting assignment status
  ca.status as cutting_assignment_status,
  ca.finished_at as cutting_finished_at
FROM job_cards jc
LEFT JOIN products p ON jc."productId" = p.id
LEFT JOIN cutting_assignments ca ON jc.id = ca.job_id
WHERE jc.current_department = 'Cutting'
  OR ca.status = 'Completed'
ORDER BY jc."updatedAt" DESC
LIMIT 10;



