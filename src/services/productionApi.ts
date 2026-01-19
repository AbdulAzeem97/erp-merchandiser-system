import { getApiRootUrl } from '../utils/apiConfig';

const API_BASE_URL = getApiRootUrl();

// Helper function for API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/';
      throw new Error('Authentication error');
    }
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return response.json();
}

export interface ProductionDepartment {
  id: string;
  name: string;
  code: string;
  description?: string;
  head_user_id?: string;
  head_name?: string;
  head_email?: string;
  process_count: number;
  equipment_count: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface ProductionProcess {
  id: string;
  department_id: string;
  name: string;
  code: string;
  description?: string;
  sequence_order: number;
  estimated_duration_hours: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface ProductionJobAssignment {
  id: string;
  job_card_id: string;
  job_card: string; // job_card_id from job_cards table
  po_number?: string;
  company_name: string;
  product_item_code: string;
  brand?: string;
  department_id: string;
  department_name: string;
  department_code: string;
  process_id: string;
  process_name: string;
  assigned_by: string;
  assigned_to_user_id?: string;
  assigned_to_name?: string;
  assigned_to_email?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED' | 'REWORK';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigned_date: string;
  start_date?: string;
  estimated_completion_date?: string;
  actual_completion_date?: string;
  notes?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface ProductionJobStatusHistory {
  id: string;
  production_assignment_id: string;
  status_from?: string;
  status_to: string;
  remarks?: string;
  attachments?: string[];
  changed_by: string;
  changed_by_name: string;
  changed_at: string;
}

export interface ProductionQualityCheck {
  id: string;
  production_assignment_id: string;
  checked_by: string;
  checked_by_name: string;
  quality_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REWORK';
  quality_score?: number;
  defects_found?: any[];
  remarks?: string;
  checked_at: string;
}

export interface ProductionUser {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: number;
  production_roles?: string; // comma-separated roles like "OFFSET:HOD,DIGITAL:SUPERVISOR"
}

export interface ProductionDashboardData {
  jobStats: {
    total_jobs: number;
    pending_jobs: number;
    in_progress_jobs: number;
    completed_jobs: number;
    on_hold_jobs: number;
    rework_jobs: number;
  };
  recentActivities: (ProductionJobStatusHistory & {
    job_card_id: string;
    department_name: string;
    process_name: string;
  })[];
  departmentPerformance: {
    department_name: string;
    department_code: string;
    total_assignments: number;
    completed_assignments: number;
    completion_rate: number;
  }[];
  userAccess: {
    hasDirectorAccess: boolean;
    permissions: string[];
    departmentAccess: {
      departmentId: string;
      departmentName: string;
      departmentCode: string;
      roleType: string;
    }[];
  };
}

export interface ProductionJobFilters {
  departmentId?: string;
  status?: string;
  assignedToUserId?: string;
  priority?: string;
  limit?: number;
}

// API Service Class
export class ProductionApiService {
  // ============ DEPARTMENTS ============
  
  async getDepartments(): Promise<ProductionDepartment[]> {
    return await apiCall('/production/departments');
  }

  async getDepartmentDetails(id: string): Promise<ProductionDepartment & {
    processes: ProductionProcess[];
    equipment: any[];
    activeJobsCount: number;
  }> {
    return await apiCall(`/production/departments/${id}`);
  }

  async createDepartment(department: Partial<ProductionDepartment>): Promise<ProductionDepartment> {
    return await apiCall('/production/departments', {
      method: 'POST',
      body: JSON.stringify(department)
    });
  }

  // ============ PROCESSES ============
  
  async getDepartmentProcesses(departmentId: string): Promise<ProductionProcess[]> {
    return await apiCall(`/production/departments/${departmentId}/processes`);
  }

  // ============ JOB ASSIGNMENTS ============
  
  async getJobAssignments(filters?: ProductionJobFilters): Promise<ProductionJobAssignment[]> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    return await apiCall(`/production/job-assignments?${params.toString()}`);
  }

  async getJobAssignmentDetails(id: string): Promise<ProductionJobAssignment & {
    statusHistory: ProductionJobStatusHistory[];
    qualityChecks: ProductionQualityCheck[];
  }> {
    return await apiCall(`/production/job-assignments/${id}`);
  }

  async createJobAssignment(assignment: {
    jobCardId: string;
    departmentId: string;
    processId: string;
    assignedToUserId?: string;
    priority?: string;
    estimatedCompletionDate?: string;
    notes?: string;
  }): Promise<ProductionJobAssignment> {
    return await apiCall('/production/job-assignments', {
      method: 'POST',
      body: JSON.stringify(assignment)
    });
  }

  async updateJobAssignmentStatus(id: string, data: {
    status: string;
    remarks?: string;
    attachments?: string[];
  }): Promise<ProductionJobAssignment> {
    return await apiCall(`/production/job-assignments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // ============ QUALITY CONTROL ============
  
  async createQualityCheck(assignmentId: string, qualityCheck: {
    qualityStatus: string;
    qualityScore?: number;
    defectsFound?: any[];
    remarks?: string;
  }): Promise<ProductionQualityCheck> {
    return await apiCall(`/production/job-assignments/${assignmentId}/quality-check`, {
      method: 'POST',
      body: JSON.stringify(qualityCheck)
    });
  }

  // ============ USERS AND ROLES ============
  
  async getProductionUsers(departmentId?: string): Promise<ProductionUser[]> {
    const params = departmentId ? `?departmentId=${departmentId}` : '';
    return await apiCall(`/production/users${params}`);
  }

  async assignUserRole(userId: string, role: {
    departmentId?: string;
    roleType: string;
    permissions?: string[];
  }): Promise<{ success: boolean; message: string }> {
    return await apiCall(`/production/users/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify(role)
    });
  }

  // ============ DASHBOARD ============
  
  async getDashboardData(departmentId?: string): Promise<ProductionDashboardData> {
    const params = departmentId ? `?departmentId=${departmentId}` : '';
    return await apiCall(`/production/dashboard${params}`);
  }
}

// Export singleton instance
export const productionApi = new ProductionApiService();
