import { 
  PrepressJob, 
  PrepressJobFilters, 
  PrepressStatistics, 
  PrepressJobCreateRequest,
  PrepressJobUpdateRequest,
  PrepressJobAssignRequest,
  PrepressJobReassignRequest,
  PrepressRemarkRequest,
  PrepressActivity
} from '../types/prepress';
import { 
  SystemSummary, 
  MonthlyTrend, 
  MerchandiserPerformance, 
  DesignerProductivity, 
  CompanyPerformance, 
  ProductTypePerformance, 
  SLACompliance, 
  RecentActivity,
  ReportFilters,
  DashboardKPIs,
  ProductionKPIs
} from '../types/reports';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

class EnhancedApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  // Prepress API methods
  async createPrepressJob(data: PrepressJobCreateRequest): Promise<PrepressJob> {
    const response = await fetch(`${API_BASE_URL}/api/prepress/jobs`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await this.handleResponse<{ success: boolean; data: PrepressJob }>(response);
    return result.data;
  }

  async getPrepressJobs(filters: PrepressJobFilters = {}): Promise<PrepressJob[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/enhanced-prepress/jobs?${params}`, {
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<{ success: boolean; data: PrepressJob[] }>(response);
    return result.data;
  }

  async getMyPrepressJobs(filters: PrepressJobFilters = {}): Promise<PrepressJob[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/enhanced-prepress/jobs?${params}`, {
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<{ success: boolean; data: PrepressJob[] }>(response);
    return result.data;
  }

  async getPrepressJobById(id: string): Promise<PrepressJob> {
    const response = await fetch(`${API_BASE_URL}/api/prepress/jobs/${id}`, {
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<{ success: boolean; data: PrepressJob }>(response);
    return result.data;
  }

  async assignDesigner(jobId: string, data: PrepressJobAssignRequest): Promise<PrepressJob> {
    const response = await fetch(`${API_BASE_URL}/api/prepress/jobs/${jobId}/assign`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await this.handleResponse<{ success: boolean; data: PrepressJob }>(response);
    return result.data;
  }

  async reassignDesigner(jobId: string, data: PrepressJobReassignRequest): Promise<PrepressJob> {
    const response = await fetch(`${API_BASE_URL}/api/prepress/jobs/${jobId}/reassign`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await this.handleResponse<{ success: boolean; data: PrepressJob }>(response);
    return result.data;
  }

  async startPrepressJob(jobId: string): Promise<PrepressJob> {
    const response = await fetch(`${API_BASE_URL}/api/enhanced-prepress/jobs/${jobId}/start`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<{ success: boolean; data: PrepressJob }>(response);
    return result.data;
  }

  async pausePrepressJob(jobId: string, remark?: string): Promise<PrepressJob> {
    const response = await fetch(`${API_BASE_URL}/api/enhanced-prepress/jobs/${jobId}/pause`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ remark }),
    });
    const result = await this.handleResponse<{ success: boolean; data: PrepressJob }>(response);
    return result.data;
  }

  async resumePrepressJob(jobId: string): Promise<PrepressJob> {
    const response = await fetch(`${API_BASE_URL}/api/enhanced-prepress/jobs/${jobId}/resume`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<{ success: boolean; data: PrepressJob }>(response);
    return result.data;
  }

  async submitPrepressJob(jobId: string, remark?: string): Promise<PrepressJob> {
    const response = await fetch(`${API_BASE_URL}/api/enhanced-prepress/jobs/${jobId}/submit`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ remark }),
    });
    const result = await this.handleResponse<{ success: boolean; data: PrepressJob }>(response);
    return result.data;
  }

  async approvePrepressJob(jobId: string, remark?: string): Promise<PrepressJob> {
    const response = await fetch(`${API_BASE_URL}/api/prepress/jobs/${jobId}/approve`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ remark }),
    });
    const result = await this.handleResponse<{ success: boolean; data: PrepressJob }>(response);
    return result.data;
  }

  async rejectPrepressJob(jobId: string, remark: string): Promise<PrepressJob> {
    const response = await fetch(`${API_BASE_URL}/api/prepress/jobs/${jobId}/reject`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ remark }),
    });
    const result = await this.handleResponse<{ success: boolean; data: PrepressJob }>(response);
    return result.data;
  }

  async addPrepressRemark(jobId: string, data: PrepressRemarkRequest): Promise<PrepressJob> {
    const response = await fetch(`${API_BASE_URL}/api/enhanced-prepress/jobs/${jobId}/remarks`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await this.handleResponse<{ success: boolean; data: PrepressJob }>(response);
    return result.data;
  }

  async getPrepressJobActivity(jobId: string): Promise<PrepressActivity[]> {
    const response = await fetch(`${API_BASE_URL}/api/enhanced-prepress/jobs/${jobId}/activity`, {
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<{ success: boolean; data: PrepressActivity[] }>(response);
    return result.data;
  }

  async getPrepressStatistics(filters: ReportFilters = {}): Promise<PrepressStatistics> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/enhanced-prepress/statistics?${params}`, {
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<{ success: boolean; data: PrepressStatistics }>(response);
    return result.data;
  }

  // Reports API methods
  async getSystemSummary(filters: ReportFilters = {}): Promise<SystemSummary> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/reports/summary?${params}`, {
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<{ success: boolean; data: SystemSummary }>(response);
    return result.data;
  }

  async getMonthlyTrends(year?: number): Promise<MonthlyTrend[]> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());

    const response = await fetch(`${API_BASE_URL}/api/reports/monthly?${params}`, {
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<{ success: boolean; data: MonthlyTrend[] }>(response);
    return result.data;
  }

  async getMerchandiserPerformance(filters: ReportFilters = {}): Promise<MerchandiserPerformance[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/reports/merchandisers?${params}`, {
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<{ success: boolean; data: MerchandiserPerformance[] }>(response);
    return result.data;
  }

  async getDesignerProductivity(filters: ReportFilters = {}): Promise<DesignerProductivity[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/enhanced-prepress/designers/productivity?${params}`, {
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<{ success: boolean; data: DesignerProductivity[] }>(response);
    return result.data;
  }

  async getCompanyPerformance(filters: ReportFilters = {}): Promise<CompanyPerformance[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/reports/companies?${params}`, {
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<{ success: boolean; data: CompanyPerformance[] }>(response);
    return result.data;
  }

  async getProductTypePerformance(filters: ReportFilters = {}): Promise<ProductTypePerformance[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/reports/product-types?${params}`, {
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<{ success: boolean; data: ProductTypePerformance[] }>(response);
    return result.data;
  }

  async getSLACompliance(filters: ReportFilters = {}): Promise<SLACompliance[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/reports/sla-compliance?${params}`, {
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<{ success: boolean; data: SLACompliance[] }>(response);
    return result.data;
  }

  async getRecentActivity(limit?: number): Promise<RecentActivity[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());

    const response = await fetch(`${API_BASE_URL}/api/reports/recent-activity?${params}`, {
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<{ success: boolean; data: RecentActivity[] }>(response);
    return result.data;
  }

  // Export methods
  async exportToCSV(type: string, filters: ReportFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('type', type);
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/reports/exports/csv?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Export failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.blob();
  }

  async exportToPDF(type: string, filters: ReportFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('type', type);
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/reports/exports/pdf?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Export failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.blob();
  }

  // Dashboard KPI methods
  async getDashboardKPIs(): Promise<DashboardKPIs> {
    const summary = await this.getSystemSummary();
    
    // Transform summary data to KPIs format
    return {
      jobsPunchedMTD: summary.total_jobs,
      jobsInProgress: summary.in_progress_jobs,
      jobsCompleted: summary.completed_jobs,
      avgTurnaroundTime: summary.avg_job_turnaround_seconds || 0,
      pendingPrepress: summary.pending_prepress,
      slaBreaches: 0, // This would need to be calculated based on due dates
      activeMerchandisers: summary.active_merchandisers,
      activeDesigners: summary.active_designers,
    };
  }

  async getProductionKPIs(): Promise<ProductionKPIs> {
    const summary = await this.getSystemSummary();
    
    // Transform summary data to production KPIs format
    return {
      wipByProcess: {
        'Job Cards': summary.in_progress_jobs,
        'Prepress': summary.in_progress_prepress,
        'HOD Review': summary.hod_review_prepress,
      },
      queueLength: summary.pending_jobs + summary.pending_prepress,
      todaysCompletions: summary.completed_jobs,
      agingBuckets: {
        '0-3 days': 0, // This would need to be calculated based on creation dates
        '4-7 days': 0,
        '8-14 days': 0,
        '15+ days': 0,
      },
      processThroughput: [], // This would need to be calculated from historical data
      slaAtRisk: 0, // This would need to be calculated based on due dates
      blockedItems: 0, // This would need to be calculated based on status
    };
  }
}

export const enhancedApi = new EnhancedApiService();
export default enhancedApi;
