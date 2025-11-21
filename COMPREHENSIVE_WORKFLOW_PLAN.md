# Comprehensive ERP Workflow System - Implementation Plan

## Current Status Analysis

### ✅ Implemented Departments
1. **Merchandiser** - Job creation, assignment, management
2. **Prepress** - Design, QA Review, CTP (Plate Making)
3. **Cutting Department** - Paper Cutting with labor assignment
4. **Production** - Basic structure (needs expansion)

### 📋 Complete Offset Process Sequence (31 Steps)

| # | Step Name | Department | Status | Priority |
|---|-----------|------------|--------|----------|
| 1 | Prepress | Prepress | ✅ Done | High |
| 2 | Material Procurement | Inventory | ❌ TODO | High |
| 3 | Material Issuance | Inventory | ❌ TODO | High |
| 4 | Paper Cutting | Cutting | ✅ Done | High |
| 5 | Offset Printing | Production | ❌ TODO | **Critical** |
| 6 | Digital Printing | Production | ❌ TODO | Medium |
| 7-9 | Varnish (Matt/Gloss/Soft Touch) | Finishing | ❌ TODO | Medium |
| 10 | Inlay Pasting | Finishing | ❌ TODO | Low |
| 11-13 | Lamination (Matte/Gloss/Soft Touch) | Finishing | ❌ TODO | Medium |
| 14 | UV Coating | Finishing | ❌ TODO | Medium |
| 15-16 | Foil (Matte/Gloss) | Finishing | ❌ TODO | Low |
| 17 | Screen Printing | Production | ❌ TODO | Low |
| 18-19 | Embossing/Debossing | Finishing | ❌ TODO | Low |
| 20-21 | Pasting/Two Way Tape | Finishing | ❌ TODO | Low |
| 22 | Die Cutting | Finishing | ❌ TODO | Medium |
| 23 | Breaking | Finishing | ❌ TODO | Low |
| 24-26 | Piggy Sticker/RFID/Eyelet | Finishing | ❌ TODO | Low |
| 27 | Out Source | External | ❌ TODO | Low |
| 28 | Packing | Logistics | ❌ TODO | **Critical** |
| 29 | Ready (QA) | QA | ❌ TODO | **Critical** |
| 30 | Dispatch | Logistics | ❌ TODO | **Critical** |
| 31 | Excess | Inventory | ❌ TODO | Low |

## Recommended Implementation Strategy

### Phase 1: Core Production Workflow (Priority: HIGH)
**Goal:** Complete the main production flow from Printing to Dispatch

#### 1.1 Production Department Dashboard
- **Route:** `/production/dashboard`
- **Features:**
  - Job list filtered by Production department
  - Machine assignment (Offset Press, Digital Press)
  - Status tracking (Pending, Setup, Printing, Quality Check, Completed)
  - Material consumption tracking
  - Real-time updates

#### 1.2 Finishing Department Dashboard
- **Route:** `/finishing/dashboard`
- **Features:**
  - Combined dashboard for all finishing operations
  - Step-by-step workflow (Varnish, Lamination, UV, Foil, etc.)
  - Optional steps based on product requirements
  - Batch processing support

#### 1.3 Quality Assurance (Final QA)
- **Route:** `/qa/final`
- **Features:**
  - Final quality check before dispatch
  - Inspection checklist
  - Approval/rejection workflow
  - Quality metrics tracking

#### 1.4 Logistics Dashboard
- **Route:** `/logistics/dashboard`
- **Features:**
  - Packing assignment
  - Dispatch scheduling
  - Shipping documentation
  - Delivery tracking

### Phase 2: Supporting Departments (Priority: MEDIUM)

#### 2.1 Inventory Management
- **Route:** `/inventory/dashboard`
- **Features:**
  - Material Procurement workflow
  - Material Issuance tracking
  - Stock level monitoring
  - Material request approval

#### 2.2 External Operations
- **Route:** `/external/dashboard`
- **Features:**
  - Out Source job tracking
  - Vendor management
  - External job status updates

### Phase 3: Advanced Features (Priority: LOW)

#### 3.1 Specialized Finishing
- Individual dashboards for specialized operations
- RFID, Eyelet, Piggy Sticker tracking
- Breaking and excess material handling

## Architecture Design

### ✅ CRITICAL REQUIREMENTS

1. **Workflow Progression Must Follow Process Sequence**
   - All workflow steps are generated from `process_steps` table per product
   - Steps are executed in `sequence_number` order
   - No manual step skipping - must follow sequence

2. **Optional Steps Only Activate If Selected**
   - Optional steps start with status `'inactive'`
   - Only activate when explicitly selected during job creation or progression
   - Compulsory steps always activate in sequence

3. **Every Stage Update Writes to job_lifecycle_history**
   - All status updates must log to `job_lifecycle_history`
   - Includes: job_card_id, department, status, status_message, updated_by, notes, created_at
   - This is CRITICAL for audit trail

4. **All Dashboards Use UnifiedWorkflowService**
   - All department services extend `BaseDepartmentService`
   - BaseDepartmentService uses `UnifiedWorkflowService` for all workflow operations
   - Ensures consistent workflow management across all departments

5. **Department Separation**
   - **Cutting** = Separate department (NOT under Production)
   - **QA** = Separate department (NOT under Production)
   - **Logistics/Dispatch** = Separate department (NOT under Production)
   - **Finishing** = Separate department for finishing operations
   - **Production** = Only for printing operations (Offset, Digital)
   - **Inventory** = Separate department for material management

6. **Labor UI is View-Only**
   - Labor users can only view assigned tasks
   - No editing permissions
   - Optional "Mark as acknowledged" button (no workflow impact)

### Unified Department Service Pattern

```javascript
// Base Department Service (server/services/baseDepartmentService.js)
class BaseDepartmentService {
  constructor(departmentName) {
    this.department = departmentName;
    this.workflowService = new UnifiedWorkflowService();
  }
  
  async getDepartmentJobs(filters) {
    // Get jobs from job_workflow_steps filtered by department
    // Uses UnifiedWorkflowService.getJobWorkflow()
  }
  
  async updateJobStatus(jobId, stepStatus, userId, notes) {
    // 1. Update job_workflow_steps via UnifiedWorkflowService
    // 2. Update job_cards.status via JobStatusService
    // 3. Log to job_lifecycle_history (MANDATORY)
    // 4. Progress to next step if completed
    // 5. Emit notifications
  }
  
  async progressToNextStep(jobId, completedStep, userId) {
    // Only activate next step if:
    // - It's compulsory (is_compulsory = true), OR
    // - It's optional but was selected (status != 'inactive')
    // Skip inactive optional steps automatically
  }
  
  async logToHistory(jobId, stepName, status, userId, notes) {
    // MANDATORY: Write to job_lifecycle_history
    // Handles different schema variations
  }
}
```

### Flexible Step Configuration

Each step in `process_steps` should support:
- **Department mapping** (auto-detect or manual)
- **Optional/Required** flag
- **QA requirement** flag
- **Auto-completion** flag
- **Parallel execution** support (for optional steps)

### Dashboard Component Pattern

```typescript
// Generic Department Dashboard
<DepartmentDashboard
  department="Production"
  route="/production/dashboard"
  statuses={['Pending', 'In Progress', 'Completed']}
  actions={['Assign', 'Start', 'Complete']}
  filters={['status', 'priority', 'date']}
/>
```

## Implementation Priority

### Week 1: Production Core
1. Production Dashboard (`/production/dashboard`)
2. Offset Printing workflow
3. Status management integration

### Week 2: Finishing & QA
1. Finishing Dashboard (`/finishing/dashboard`)
2. Final QA Dashboard (`/qa/final`)
3. Optional step handling

### Week 3: Logistics
1. Packing workflow
2. Dispatch Dashboard (`/logistics/dashboard`)
3. Shipping integration

### Week 4: Inventory & Polish
1. Inventory workflows
2. Material tracking
3. System optimization

## Database Schema Extensions

### Production Assignments Table
```sql
CREATE TABLE production_assignments (
  id UUID PRIMARY KEY,
  job_id INTEGER REFERENCES job_cards(id),
  step_name VARCHAR(255),
  machine_id INTEGER,
  assigned_to INTEGER,
  status VARCHAR(50),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  material_consumed JSONB,
  quality_metrics JSONB
);
```

### Finishing Operations Table
```sql
CREATE TABLE finishing_operations (
  id UUID PRIMARY KEY,
  job_id INTEGER REFERENCES job_cards(id),
  operation_type VARCHAR(100), -- Varnish, Lamination, UV, etc.
  status VARCHAR(50),
  operator_id INTEGER,
  completed_at TIMESTAMP,
  quality_check BOOLEAN
);
```

## Route Structure

```
/production
  /dashboard          - Production jobs overview (Offset, Digital Printing)
  /offset-printing    - Offset printing jobs
  /digital-printing   - Digital printing jobs
  /assignments        - Job assignments
  /labor              - Labor view-only dashboard

/finishing
  /dashboard          - All finishing operations (Varnish, Lamination, UV, Foil, etc.)
  /varnish           - Varnish operations
  /lamination         - Lamination operations
  /uv-coating         - UV coating operations
  /foil               - Foil operations
  /labor              - Labor view-only dashboard

/qa
  /dashboard         - QA jobs overview
  /final             - Final QA before dispatch
  /reports           - QA reports and metrics
  /labor             - QA labor view-only dashboard

/logistics
  /dashboard         - Packing and dispatch overview
  /packing           - Packing operations
  /dispatch          - Dispatch management
  /tracking          - Delivery tracking
  /labor             - Logistics labor view-only dashboard

/inventory
  /dashboard         - Material management
  /procurement       - Material procurement
  /issuance          - Material issuance
  /labor             - Inventory labor view-only dashboard

/cutting
  /dashboard         - Cutting jobs (HOD view)
  /labor             - Cutting labor view-only dashboard (already implemented)
```

## Status Flow Example

```
Job Created (PENDING)
  ↓
Prepress (IN_PROGRESS) → QA (SUBMITTED) → Approved (PENDING)
  ↓
CTP Completed (PENDING)
  ↓
Material Procurement (PENDING) → Issued (PENDING)
  ↓
Paper Cutting (PENDING) → Assigned → In Progress → Completed (PENDING)
  ↓
Offset Printing (PENDING) → Setup → Printing → Quality Check → Completed (PENDING)
  ↓
[Optional Finishing Steps]
  ↓
Final QA (PENDING) → Approved (PENDING)
  ↓
Packing (PENDING) → Completed (PENDING)
  ↓
Ready for Dispatch (PENDING)
  ↓
Dispatched (COMPLETED)
```

## Multi-Product Support

### Product Type Detection
- System automatically detects product type from `products.product_type`
- Loads appropriate process sequence
- Generates workflow dynamically

### Conditional Steps
- Steps marked as optional in `process_steps.is_compulsory = false`
- Only activated if selected during job creation
- Can be skipped or executed in parallel

### Department Flexibility
- Each step can belong to different departments
- Departments can have multiple dashboards
- Same service pattern for all departments

## Next Steps

1. **Create Production Dashboard** - Start with Offset Printing
2. **Implement Finishing Service** - Unified service for all finishing operations
3. **Build Logistics Module** - Packing and Dispatch
4. **Add Inventory Integration** - Material tracking
5. **Final QA Module** - Quality assurance before dispatch
6. **Testing & Optimization** - Ensure all workflows work seamlessly

## Success Criteria

✅ All 31 steps of Offset workflow are trackable
✅ Each department has a dedicated dashboard
✅ Status is consistent across all modules
✅ System supports Woven, PFL, Digital product types
✅ Optional steps can be enabled/disabled per job
✅ Real-time updates via Socket.io
✅ Complete audit trail in job_lifecycle_history
✅ Material consumption tracking
✅ Quality metrics collection
✅ Dispatch documentation generation

