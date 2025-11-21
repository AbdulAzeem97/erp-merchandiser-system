# Cutting Department Workflow Module - Implementation Summary

## ✅ Completed Implementation

### 1. Database Schema
- **Migration File**: `server/database/migrations/005_add_cutting_workflow.sql`
  - Added `cutting_status`, `cutting_assigned_to`, `cutting_started_at`, `cutting_completed_at` columns to `job_lifecycle` table
  - Created `cutting_assignments` table with full assignment tracking
  - Added indexes for performance
  - Added triggers for automatic timestamp updates

### 2. Backend Services
- **CuttingWorkflowService** (`server/services/cuttingWorkflowService.js`)
  - `getCuttingJobs()` - Fetch jobs with filters
  - `assignJob()` - Assign job to cutting labor
  - `updateStatus()` - Update cutting status with workflow integration
  - `addComment()` - Add comments to assignments
  - `handleCuttingCompleted()` - Auto-advance to next workflow step
  - `handleCuttingRejected()` - Return to previous step on rejection
  - Full integration with `UnifiedWorkflowService`

### 3. API Routes
- **Cutting Routes** (`server/routes/cutting.js`)
  - `GET /api/cutting/jobs` - Get all cutting jobs (HOD_CUTTING, SUPER_ADMIN)
  - `GET /api/cutting/jobs/:jobId` - Get specific job (with role-based access)
  - `POST /api/cutting/assign` - Assign job to labor (HOD_CUTTING, SUPER_ADMIN)
  - `PATCH /api/cutting/update-status` - Update cutting status (HOD_CUTTING, SUPER_ADMIN)
  - `POST /api/cutting/comments` - Add comment (HOD_CUTTING, SUPER_ADMIN)
  - `GET /api/cutting/live` - Live updates feed (all cutting roles)
  - `GET /api/cutting/assignment/:jobId` - Get assignment details

### 4. Workflow Integration
- **UnifiedWorkflowService Updates** (`server/services/unifiedWorkflowService.js`)
  - Auto-activates Cutting department when QA approves and next step is Cutting
  - Creates initial `cutting_assignments` record with "Pending" status
  - Updates `job_cards` with Cutting department and status message
  - Emits socket notifications for HOD Cutting

- **Workflow Mapping** (`server/config/workflowMapping.js`)
  - Updated to map Cutting steps to "Cutting" department (separate from Production)
  - Added fallback logic to recognize cutting-related step names

### 5. Role-Based Access Control
- **RBAC Updates** (`server/middleware/rbac.js`)
  - Added `HOD_CUTTING` and `CUTTING_LABOR` roles to hierarchy
  - Updated `requirePermission` middleware to accept role arrays
  - HOD_CUTTING has full control
  - CUTTING_LABOR has view-only access to assigned jobs

### 6. Frontend Components

#### HOD Cutting Dashboard (`src/components/cutting/CuttingDashboard.tsx`)
- **Features**:
  - Job list with filters (status, priority, assigned labor, date range)
  - Real-time updates via Socket.io
  - Statistics cards (Total, Pending, In Progress, Completed)
  - Job assignment dialog
  - Status update dialog
  - Comment management
  - Visual status indicators with color-coded badges
  - Plate information display
  - Workflow step tracker

#### Labor View (`src/components/cutting/CuttingLaborView.tsx`)
- **Features**:
  - Full-screen kiosk mode layout
  - Shows only assigned tasks
  - Read-only view (no editing permissions)
  - "Mark as Acknowledged" button (local state only)
  - Auto-refresh every 30 seconds
  - Real-time updates via Socket.io
  - Job details dialog

### 7. Notifications
- Socket.io events:
  - `cutting:job_ready` - When job moves to Cutting department
  - `cutting:job_assigned` - When job is assigned to labor
  - `cutting:status_updated` - When cutting status changes
  - `notification` - General notifications to specific users/roles

## 🔄 Workflow Flow

1. **QA Approval** → Job approved by QA
2. **Auto-Activation** → UnifiedWorkflowService detects next step is Cutting
3. **Cutting Assignment Created** → Initial `cutting_assignments` record with "Pending" status
4. **HOD Notification** → HOD Cutting receives notification
5. **Assignment** → HOD assigns job to cutting labor
6. **Status Updates** → Labor/HOD updates status (In Progress, On Hold, etc.)
7. **Completion** → When marked "Completed", workflow auto-advances to next step
8. **Rejection** → If rejected, returns to previous completed step

## 📋 Status Flow

| Status | Description | Next Actions |
|--------|-------------|--------------|
| Pending | Awaiting assignment | HOD assigns to labor |
| Assigned | Assigned to labor | Labor can acknowledge |
| In Progress | Cutting started | Can pause or complete |
| On Hold | Paused (material delay, etc.) | Can resume |
| Completed | Cutting finished | Auto-advances workflow |
| Rejected | Cutting rejected | Returns to previous step |

## 🚀 Setup Instructions

### 1. Run Database Migration
```bash
node run-cutting-migration.js
```

### 2. Create HOD Cutting User
Create a user with role `HOD_CUTTING` in the database.

### 3. Create Cutting Labor Users
Create users with role `CUTTING_LABOR` for cutting operators.

### 4. Access Dashboards
- **HOD Dashboard**: Route to `/cutting/dashboard` (or integrate into main app routing)
- **Labor View**: Route to `/cutting/labor` (or integrate into main app routing)

## 🔐 Role Permissions

| Role | Permissions |
|------|-------------|
| HOD_CUTTING | Full control: assign, update status, add comments, view all jobs |
| CUTTING_LABOR | View-only: see assigned tasks, acknowledge (local only) |
| SUPER_ADMIN | Full control (all modules) |

## 📝 API Usage Examples

### Get Cutting Jobs
```javascript
GET /api/cutting/jobs?status=Pending&priority=HIGH
```

### Assign Job
```javascript
POST /api/cutting/assign
{
  "jobId": "uuid",
  "assignedTo": "user-uuid",
  "comments": "Optional assignment notes"
}
```

### Update Status
```javascript
PATCH /api/cutting/update-status
{
  "jobId": "uuid",
  "status": "In Progress",
  "comments": "Started cutting operation"
}
```

## 🎯 Integration Points

1. **Workflow System**: Fully integrated with `UnifiedWorkflowService`
2. **Job Lifecycle**: Logs all transitions to `job_lifecycle_history`
3. **Socket.io**: Real-time updates and notifications
4. **RBAC**: Role-based access control enforced
5. **Notifications**: Socket-based notifications for key events

## ✅ Testing Checklist

- [ ] Run migration successfully
- [ ] Create HOD_CUTTING and CUTTING_LABOR users
- [ ] Test QA approval → Cutting activation
- [ ] Test job assignment
- [ ] Test status updates
- [ ] Test completion → next step activation
- [ ] Test rejection → return to previous step
- [ ] Test notifications
- [ ] Test role-based access
- [ ] Test labor view (read-only)

## 📌 Notes

- Cutting is a **separate department** from Production
- All status updates are logged to `job_lifecycle_history`
- Workflow automatically advances on completion
- Rejection returns to the last completed step (usually CTP or QA)
- Labor view is read-only and auto-refreshes every 30 seconds

