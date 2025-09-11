export interface SystemSummary {
  total_jobs: number;
  pending_jobs: number;
  in_progress_jobs: number;
  completed_jobs: number;
  delivered_jobs: number;
  total_prepress_jobs: number;
  pending_prepress: number;
  in_progress_prepress: number;
  hod_review_prepress: number;
  completed_prepress: number;
  avg_job_turnaround_seconds?: number;
  avg_prepress_turnaround_seconds?: number;
  active_merchandisers: number;
  active_designers: number;
  active_companies: number;
}

export interface MonthlyTrend {
  month: string;
  jobs_punched: number;
  jobs_completed: number;
  prepress_jobs: number;
  prepress_completed: number;
  avg_turnaround_seconds?: number;
}

export interface MerchandiserPerformance {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  total_jobs: number;
  completed_jobs: number;
  in_progress_jobs: number;
  pending_jobs: number;
  avg_turnaround_seconds?: number;
  unique_companies: number;
  unique_product_types: number;
}

export interface DesignerProductivity {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  total_jobs: number;
  completed_jobs: number;
  in_progress_jobs: number;
  hod_review_jobs: number;
  rejected_jobs: number;
  avg_cycle_time_seconds?: number;
  active_days: number;
  high_priority_jobs: number;
}

export interface CompanyPerformance {
  id: string;
  name: string;
  code: string;
  country: string;
  total_jobs: number;
  completed_jobs: number;
  in_progress_jobs: number;
  pending_jobs: number;
  total_quantity: number;
  avg_quantity_per_job: number;
  avg_turnaround_seconds?: number;
  unique_product_types: number;
}

export interface ProductTypePerformance {
  product_type: string;
  total_jobs: number;
  completed_jobs: number;
  in_progress_jobs: number;
  pending_jobs: number;
  total_quantity: number;
  avg_quantity_per_job: number;
  avg_turnaround_seconds?: number;
  unique_companies: number;
}

export interface SLACompliance {
  process_type: string;
  total_items: number;
  completed_items: number;
  on_time_items: number;
  overdue_items: number;
  avg_processing_time_seconds?: number;
}

export interface RecentActivity {
  activity_type: 'job_card' | 'prepress_job';
  item_id: string;
  item_name: string;
  status: string;
  activity_date: string;
  actor_name: string;
  actor_role: string;
  company_name: string;
  product_type: string;
}

export interface ReportFilters {
  fromDate?: string;
  toDate?: string;
  year?: number;
  limit?: number;
}

export type ReportType = 
  | 'summary' 
  | 'merchandisers' 
  | 'designers' 
  | 'companies' 
  | 'product-types' 
  | 'sla-compliance';

export interface ExportRequest {
  type: ReportType;
  fromDate?: string;
  toDate?: string;
  format: 'csv' | 'pdf';
}

// Dashboard KPI types
export interface DashboardKPIs {
  jobsPunchedMTD: number;
  jobsInProgress: number;
  jobsCompleted: number;
  avgTurnaroundTime: number;
  pendingPrepress: number;
  slaBreaches: number;
  activeMerchandisers: number;
  activeDesigners: number;
}

export interface ProductionKPIs {
  wipByProcess: Record<string, number>;
  queueLength: number;
  todaysCompletions: number;
  agingBuckets: {
    '0-3 days': number;
    '4-7 days': number;
    '8-14 days': number;
    '15+ days': number;
  };
  processThroughput: Array<{
    process: string;
    completed: number;
    date: string;
  }>;
  slaAtRisk: number;
  blockedItems: number;
}

// Socket.io event types for reports
export interface DashboardKPIUpdateEvent {
  updateType: 'kpi_refresh' | 'real_time_update';
  data: DashboardKPIs | ProductionKPIs;
  timestamp: string;
}
