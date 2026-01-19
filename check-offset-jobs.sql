-- Check for jobs that should be in Offset Printing
-- Jobs where Cutting is completed and Offset Printing step is selected

SELECT 
  jc.id,
  jc."jobNumber",
  jc.quantity,
  jc.current_department,
  jc.current_step,
  jc.workflow_status,
  p.name as product_name,
  c.name as company_name,
  -- Check if Cutting is completed
  (SELECT status FROM job_workflow_steps 
   WHERE job_card_id = jc.id AND department = 'Cutting' 
   ORDER BY sequence_number DESC LIMIT 1) as cutting_status,
  -- Check if Offset Printing step exists and is selected
  (SELECT COUNT(*) FROM job_workflow_steps 
   WHERE job_card_id = jc.id 
   AND (step_name ILIKE '%Offset Printing%' OR step_name = 'Offset Printing')
   AND status != 'inactive') as has_offset_step,
  -- Check Offset Printing step status
  (SELECT status FROM job_workflow_steps 
   WHERE job_card_id = jc.id 
   AND (step_name ILIKE '%Offset Printing%' OR step_name = 'Offset Printing')
   AND status != 'inactive'
   LIMIT 1) as offset_step_status
FROM job_cards jc
LEFT JOIN products p ON jc."productId" = p.id
LEFT JOIN companies c ON jc."companyId" = c.id
WHERE jc.current_department IN ('Cutting', 'Offset Printing')
  OR EXISTS (
    SELECT 1 FROM job_workflow_steps jws
    WHERE jws.job_card_id = jc.id
    AND jws.department = 'Cutting'
    AND jws.status = 'completed'
  )
ORDER BY jc."createdAt" DESC
LIMIT 20;



