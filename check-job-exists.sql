-- Check if job JC-1767250497140 exists in database
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
WHERE "jobNumber" = 'JC-1767250497140';



