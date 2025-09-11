export type PrepressStatus = 
  | 'PENDING' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'PAUSED' 
  | 'HOD_REVIEW' 
  | 'COMPLETED' 
  | 'REJECTED';

export type PrepressPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type PrepressAction = 
  | 'ASSIGNED' 
  | 'STARTED' 
  | 'PAUSED' 
  | 'RESUMED' 
  | 'COMPLETED' 
  | 'REJECTED' 
  | 'REASSIGNED' 
  | 'REMARK' 
  | 'STATUS_CHANGED';

export interface PrepressJob {
  id: string;
  job_card_id: string;
  assigned_designer_id?: string;
  status: PrepressStatus;
  priority: PrepressPriority;
  due_date?: string;
  started_at?: string;
  completed_at?: string;
  hod_last_remark?: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  job_card_id_display?: string;
  po_number?: string;
  quantity?: number;
  delivery_date?: string;
  job_priority?: string;
  job_status?: string;
  customer_notes?: string;
  special_instructions?: string;
  product_item_code?: string;
  brand?: string;
  product_type?: string;
  color_specifications?: string;
  company_name?: string;
  company_code?: string;
  designer_first_name?: string;
  designer_last_name?: string;
  creator_first_name?: string;
  creator_last_name?: string;
}

export interface PrepressActivity {
  id: string;
  prepress_job_id: string;
  actor_id?: string;
  action: PrepressAction;
  from_status?: string;
  to_status?: string;
  remark?: string;
  metadata?: Record<string, any>;
  created_at: string;
  
  // Joined data
  first_name?: string;
  last_name?: string;
  role?: string;
}

export interface PrepressAttachment {
  id: string;
  prepress_job_id: string;
  file_id: string;
  attachment_type: 'ARTWORK' | 'PREVIEW' | 'REFERENCE' | 'OTHER';
  created_by?: string;
  created_at: string;
}

export interface PrepressJobFilters {
  status?: PrepressStatus;
  assignedDesignerId?: string;
  priority?: PrepressPriority;
  companyId?: string;
  productType?: string;
  search?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  limit?: number;
  offset?: number;
}

export interface PrepressStatistics {
  total_jobs: number;
  pending_jobs: number;
  assigned_jobs: number;
  in_progress_jobs: number;
  paused_jobs: number;
  hod_review_jobs: number;
  completed_jobs: number;
  rejected_jobs: number;
  avg_turnaround_seconds?: number;
  active_designers: number;
}

export interface PrepressJobCreateRequest {
  jobCardId: string;
  assignedDesignerId?: string;
  priority?: PrepressPriority;
  dueDate?: string;
}

export interface PrepressJobUpdateRequest {
  status?: PrepressStatus;
  priority?: PrepressPriority;
  dueDate?: string;
  assignedDesignerId?: string;
  remark?: string;
}

export interface PrepressJobAssignRequest {
  designerId: string;
  remark?: string;
}

export interface PrepressJobReassignRequest {
  designerId: string;
  remark?: string;
}

export interface PrepressRemarkRequest {
  remark: string;
  isHodRemark?: boolean;
}

// Socket.io event types
export interface PrepressJobUpdateEvent {
  jobId: string;
  updateType: 'status_changed' | 'assigned' | 'reassigned' | 'remark_added' | 'attachment_added';
  data: PrepressJob;
  timestamp: string;
}

export interface DesignerQueueUpdateEvent {
  designerId: string;
  updateType: 'job_assigned' | 'job_completed' | 'job_reassigned';
  data: PrepressJob;
  timestamp: string;
}

export interface HODPrepressUpdateEvent {
  updateType: 'job_created' | 'job_assigned' | 'job_reassigned' | 'job_approved' | 'job_rejected';
  data: PrepressJob;
  timestamp: string;
}

export interface NotificationEvent {
  id: string;
  title: string;
  body?: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  link?: string;
  timestamp: string;
}
