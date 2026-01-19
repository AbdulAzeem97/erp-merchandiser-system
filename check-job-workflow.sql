-- Check jobs that completed cutting and should be in Offset Printing
SELECT 
  jc.id,
  jc."jobNumber",
  jc.current_department,
  jc.current_step,
  jc.workflow_status,
  p.name as product_name,
  -- Check cutting step status
  (SELECT status FROM job_workflow_steps 
   WHERE job_card_id = jc.id AND department = 'Cutting' 
   ORDER BY sequence_number DESC LIMIT 1) as cutting_status,
  (SELECT completed_at FROM job_workflow_steps 
   WHERE job_card_id = jc.id AND department = 'Cutting' 
   ORDER BY sequence_number DESC LIMIT 1) as cutting_completed_at,
  -- Check if Offset Printing step exists
  (SELECT COUNT(*) FROM job_workflow_steps 
   WHERE job_card_id = jc.id 
   AND (step_name ILIKE '%Offset Printing%' OR step_name = 'Offset Printing')) as has_offset_step,
  -- Check Offset Printing step details
  (SELECT step_name FROM job_workflow_steps 
   WHERE job_card_id = jc.id 
   AND (step_name ILIKE '%Offset Printing%' OR step_name = 'Offset Printing')
   LIMIT 1) as offset_step_name,
  (SELECT status FROM job_workflow_steps 
   WHERE job_card_id = jc.id 
   AND (step_name ILIKE '%Offset Printing%' OR step_name = 'Offset Printing')
   LIMIT 1) as offset_step_status,
  (SELECT department FROM job_workflow_steps 
   WHERE job_card_id = jc.id 
   AND (step_name ILIKE '%Offset Printing%' OR step_name = 'Offset Printing')
   LIMIT 1) as offset_step_department,
  (SELECT sequence_number FROM job_workflow_steps 
   WHERE job_card_id = jc.id 
   AND (step_name ILIKE '%Offset Printing%' OR step_name = 'Offset Printing')
   LIMIT 1) as offset_step_sequence,
  -- Check cutting step sequence
  (SELECT sequence_number FROM job_workflow_steps 
   WHERE job_card_id = jc.id AND department = 'Cutting' 
   ORDER BY sequence_number DESC LIMIT 1) as cutting_step_sequence
FROM job_cards jc
LEFT JOIN products p ON jc."productId" = p.id
WHERE jc.current_department IN ('Cutting', 'Offset Printing')
  OR EXISTS (
    SELECT 1 FROM job_workflow_steps jws
    WHERE jws.job_card_id = jc.id
    AND jws.department = 'Cutting'
    AND jws.status = 'completed'
  )
ORDER BY jc."createdAt" DESC
LIMIT 10;



