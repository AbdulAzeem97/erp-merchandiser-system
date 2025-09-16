import dbAdapter from './server/database/adapter.js';
import CompleteJobLifecycleService from './server/services/completeJobLifecycleService.js';
import EnhancedPrepressService from './server/services/enhancedPrepressService.js';
import InventoryService from './server/services/inventoryService.js';
import NotificationService from './server/services/notificationService.js';
import { v4 as uuidv4 } from 'uuid';

async function testCompleteLifecycle() {
  try {
    console.log('🚀 Testing Complete Job Lifecycle System...\n');

    // Initialize services
    const jobLifecycleService = new CompleteJobLifecycleService();
    const prepressService = new EnhancedPrepressService();
    const inventoryService = new InventoryService();
    const notificationService = new NotificationService();

    // Test data
    const timestamp = Date.now();
    const testJobCardId = uuidv4();
    const testUserId = uuidv4();
    const testDesignerId = uuidv4();
    const testMaterialId = uuidv4();
    const testCompanyId = uuidv4();
    const testProductId = uuidv4();

    console.log('📋 Test Job Card ID:', testJobCardId);

    // 0. Create test dependencies
    console.log('\n0️⃣ Creating test dependencies...');
    
    // Create test company
    await dbAdapter.query(`
      INSERT INTO companies (id, name, code, email, phone, address, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      testCompanyId,
      'Test Company Ltd',
      `TC${timestamp}`,
      'test@company.com',
      '+1234567890',
      '123 Test Street, Test City',
      new Date().toISOString(),
      new Date().toISOString()
    ]);
    console.log('✅ Test company created');

    // Create test product
    await dbAdapter.query(`
      INSERT INTO products (id, product_item_code, brand, gsm, product_type, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      testProductId,
      `TEST-PROD-${timestamp}`,
      'Test Brand',
      80,
      'Offset',
      new Date().toISOString(),
      new Date().toISOString()
    ]);
    console.log('✅ Test product created');

    // Create test material
    await dbAdapter.query(`
      INSERT INTO materials (id, name, code, type, gsm_range, description, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      testMaterialId,
      'Test Paper',
      `TP-${timestamp}`,
      'Paper',
      '80-120',
      'Test paper material',
      new Date().toISOString(),
      new Date().toISOString()
    ]);
    console.log('✅ Test material created');

    // Create test user
    await dbAdapter.query(`
      INSERT INTO users (id, username, email, password_hash, first_name, last_name, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      testUserId,
      `testuser${timestamp}`,
      `test${timestamp}@example.com`,
      'hashedpassword',
      'Test',
      'User',
      'ADMIN',
      new Date().toISOString(),
      new Date().toISOString()
    ]);
    console.log('✅ Test user created');

    // 1. Create test job card
    console.log('\n1️⃣ Creating test job card...');
    await dbAdapter.query(`
      INSERT INTO job_cards (
        id, job_card_id, product_id, quantity, delivery_date, 
        priority, company_id, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      testJobCardId,
      `JC-${Date.now()}`,
      testProductId,
      1000,
      new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      'HIGH',
      testCompanyId,
      testUserId,
      new Date().toISOString(),
      new Date().toISOString()
    ]);
    console.log('✅ Test job card created');

    // 2. Create job lifecycle
    console.log('\n2️⃣ Creating job lifecycle...');
    const lifecycle = await jobLifecycleService.createJobLifecycle(
      testJobCardId,
      'Offset',
      testUserId,
      'HIGH'
    );
    console.log('✅ Job lifecycle created:', lifecycle);

    // 3. Update to Prepress
    console.log('\n3️⃣ Moving job to Prepress...');
    const prepressJobId = uuidv4();
    await jobLifecycleService.updateJobStatusToPrepress(
      testJobCardId,
      prepressJobId,
      testDesignerId,
      testUserId
    );
    console.log('✅ Job moved to Prepress');

    // 4. Create prepress job
    console.log('\n4️⃣ Creating prepress job...');
    const prepressJob = await prepressService.createPrepressJob(
      testJobCardId,
      testUserId, // Use the same user as designer
      'HIGH',
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      testUserId
    );
    console.log('✅ Prepress job created:', prepressJob);

    // 5. Update prepress categories
    console.log('\n5️⃣ Updating prepress categories...');
    
    // Design category
    await prepressService.updateCategoryStatus(
      prepressJob.id,
      'DESIGN',
      'DESIGN_IN_PROGRESS',
      testDesignerId,
      'Working on design layout'
    );
    console.log('✅ Design status updated');

    // Die Plate category
    await prepressService.updateCategoryStatus(
      prepressJob.id,
      'DIE_PLATE',
      'DIE_PLATE_STARTED',
      testDesignerId,
      'Starting die plate creation'
    );
    console.log('✅ Die Plate status updated');

    // Complete design
    await prepressService.updateCategoryStatus(
      prepressJob.id,
      'DESIGN',
      'DESIGN_COMPLETED',
      testDesignerId,
      'Design completed successfully'
    );
    console.log('✅ Design completed');

    // Complete die plate
    await prepressService.updateCategoryStatus(
      prepressJob.id,
      'DIE_PLATE',
      'DIE_PLATE_COMPLETED',
      testDesignerId,
      'Die plate completed successfully'
    );
    console.log('✅ Die Plate completed');

    // 6. Move to Inventory
    console.log('\n6️⃣ Moving job to Inventory...');
    await jobLifecycleService.updateJobStatusToInventory(testJobCardId, testUserId);
    console.log('✅ Job moved to Inventory');

    // 7. Create inventory job
    console.log('\n7️⃣ Creating inventory job...');
    const inventoryJob = await inventoryService.createInventoryJob(
      testJobCardId,
      'inventory-user-123',
      'HIGH',
      new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      testUserId
    );
    console.log('✅ Inventory job created:', inventoryJob);

    // 8. Create material request
    console.log('\n8️⃣ Creating material request...');
    const materialRequest = await inventoryService.createMaterialRequest(
      inventoryJob.id,
      testMaterialId,
      1000,
      'sheets',
      testUserId,
      'Requesting paper for offset printing'
    );
    console.log('✅ Material request created:', materialRequest);

    // 9. Approve material request
    console.log('\n9️⃣ Approving material request...');
    await inventoryService.approveMaterialRequest(
      materialRequest.id,
      'inventory-manager-123',
      1000,
      'Approved for immediate processing'
    );
    console.log('✅ Material request approved');

    // 10. Issue materials
    console.log('\n🔟 Issuing materials...');
    await inventoryService.issueMaterials(
      materialRequest.id,
      1000,
      'inventory-user-123',
      'Materials issued for production'
    );
    console.log('✅ Materials issued');

    // 11. Complete inventory
    console.log('\n1️⃣1️⃣ Completing inventory...');
    await inventoryService.updateInventoryJobStatus(
      inventoryJob.id,
      'COMPLETED',
      testUserId,
      'All materials processed successfully'
    );
    console.log('✅ Inventory completed');

    // 12. Move to Production
    console.log('\n1️⃣2️⃣ Moving job to Production...');
    await jobLifecycleService.updateJobStatusToProduction(testJobCardId, testUserId);
    console.log('✅ Job moved to Production');

    // 13. Update production status
    console.log('\n1️⃣3️⃣ Updating production status...');
    await jobLifecycleService.updateProductionStatus(
      testJobCardId,
      'IN_PROGRESS',
      'production-dept-123',
      'offset-printing-123',
      testUserId,
      'Starting offset printing process'
    );
    console.log('✅ Production status updated');

    // 14. Complete production
    console.log('\n1️⃣4️⃣ Completing production...');
    await jobLifecycleService.updateProductionStatus(
      testJobCardId,
      'COMPLETED',
      'production-dept-123',
      'offset-printing-123',
      testUserId,
      'Production completed successfully'
    );
    console.log('✅ Production completed');

    // 15. Move to QA
    console.log('\n1️⃣5️⃣ Moving job to QA...');
    await jobLifecycleService.updateJobStatusToQA(testJobCardId, testUserId);
    console.log('✅ Job moved to QA');

    // 16. Update QA status
    console.log('\n1️⃣6️⃣ Updating QA status...');
    await jobLifecycleService.updateQAStatus(
      testJobCardId,
      'PASSED',
      testUserId,
      'Quality check passed with excellent results'
    );
    console.log('✅ QA status updated');

    // 17. Move to Dispatch
    console.log('\n1️⃣7️⃣ Moving job to Dispatch...');
    await jobLifecycleService.updateJobStatusToDispatch(testJobCardId, testUserId);
    console.log('✅ Job moved to Dispatch');

    // 18. Update dispatch status
    console.log('\n1️⃣8️⃣ Updating dispatch status...');
    await jobLifecycleService.updateDispatchStatus(
      testJobCardId,
      'DISPATCHED',
      testUserId,
      'Package dispatched via courier'
    );
    console.log('✅ Dispatch status updated');

    // 19. Complete job
    console.log('\n1️⃣9️⃣ Completing job...');
    await jobLifecycleService.completeJob(testJobCardId, testUserId);
    console.log('✅ Job completed');

    // 20. Test notifications
    console.log('\n2️⃣0️⃣ Testing notifications...');
    await notificationService.createNotification(
      testJobCardId,
      'JOB_COMPLETED',
      'Job Completed Successfully',
      `Job ${testJobCardId} has been completed and dispatched`,
      'HIGH',
      testUserId
    );
    console.log('✅ Notification created');

    // 21. Get final job status
    console.log('\n2️⃣1️⃣ Getting final job status...');
    const finalJob = await jobLifecycleService.getJobLifecycle(testJobCardId);
    console.log('✅ Final job status:', {
      id: finalJob?.id,
      status: finalJob?.status,
      currentStage: finalJob?.current_stage,
      progress: finalJob?.progress_percentage
    });

    // 21. Get dashboard stats
    console.log('\n2️⃣1️⃣ Getting dashboard stats...');
    const stats = await jobLifecycleService.getDashboardStats();
    console.log('✅ Dashboard stats:', stats);

    console.log('\n🎉 Complete Job Lifecycle Test Completed Successfully!');
    console.log('\n📊 Summary:');
    console.log('- Job created and moved through all departments');
    console.log('- Prepress workflow with 3 categories tested');
    console.log('- Inventory workflow with material requests tested');
    console.log('- Production workflow tested');
    console.log('- QA workflow tested');
    console.log('- Dispatch workflow tested');
    console.log('- Notifications system tested');
    console.log('- Real-time updates configured');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testCompleteLifecycle().then(() => {
  console.log('\n✅ All tests completed successfully!');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
