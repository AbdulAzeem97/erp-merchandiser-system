// API Service for ERP Merchandiser System
const API_BASE_URL = 'http://localhost:5001/api';

// Helper function for API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('authToken');
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', errorData);
      
      // Create a custom error object that preserves the error details
      const apiError = new Error(errorData.error || `HTTP error! status: ${response.status}`);
      apiError.response = errorData;
      apiError.status = response.status;
      throw apiError;
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Authentication API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  },

  register: async (userData: any) => {
    return await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  }
};

// Products API
export const productsAPI = {
  // Get all products with pagination and filtering
  getAll: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    brand?: string;
    product_type?: string;
    category_id?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return await apiCall(`/products?${queryParams.toString()}`);
  },

  // Get product by ID
  getById: async (id: string) => {
    return await apiCall(`/products/${id}`);
  },

  // Create new product
  create: async (productData: any) => {
    return await apiCall('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  // Update product
  update: async (id: string, productData: any) => {
    return await apiCall(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  // Delete product
  delete: async (id: string) => {
    return await apiCall(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  // Get product statistics
  getStats: async () => {
    return await apiCall('/products/stats');
  },

  // Get brands
  getBrands: async () => {
    return await apiCall('/products/brands');
  },

  // Get product types
  getProductTypes: async () => {
    return await apiCall('/products/types');
  },

  // Save process selections for a product
  saveProcessSelections: async (productId: string, selectedSteps: any[]) => {
    return await apiCall(`/products/${productId}/process-selections`, {
      method: 'POST',
      body: JSON.stringify({ selectedSteps }),
    });
  },

  // Get process selections for a product
  getProcessSelections: async (productId: string) => {
    return await apiCall(`/products/${productId}/process-selections`);
  },

  // Get complete product info with process selections
  getCompleteProductInfo: async (productId: string) => {
    return await apiCall(`/products/${productId}/complete-process-info`);
  }
};

// Materials API
export const materialsAPI = {
  // Get all materials
  getAll: async () => {
    return await apiCall('/materials');
  },

  // Get material by ID
  getById: async (id: string) => {
    return await apiCall(`/materials/${id}`);
  }
};

// Categories API
export const categoriesAPI = {
  // Get all product categories
  getAll: async () => {
    return await apiCall('/product-categories');
  },

  // Get category by ID
  getById: async (id: string) => {
    return await apiCall(`/product-categories/${id}`);
  }
};

// Jobs API
export const jobsAPI = {
  // Get all jobs with pagination and filtering
  getAll: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    priority?: string;
    company_id?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return await apiCall(`/jobs?${queryParams.toString()}`);
  },

  // Get job by ID
  getById: async (id: string) => {
    return await apiCall(`/jobs/${id}`);
  },

  // Create new job
  create: async (jobData: any) => {
    return await apiCall('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  },

  // Update job
  update: async (id: string, jobData: any) => {
    return await apiCall(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
  },

  // Delete job
  delete: async (id: string) => {
    return await apiCall(`/jobs/${id}`, {
      method: 'DELETE',
    });
  },

  // Update job status
  updateStatus: async (id: string, status: string, progress?: number) => {
    return await apiCall(`/jobs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, progress }),
    });
  },

  // Get job statistics
  getStats: async () => {
    return await apiCall('/jobs/stats');
  }
};

// Companies API
export const companiesAPI = {
  // Get all companies with pagination and filtering
  getAll: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    country?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return await apiCall(`/companies?${queryParams.toString()}`);
  },

  // Get company by ID
  getById: async (id: string) => {
    return await apiCall(`/companies/${id}`);
  },

  // Create new company
  create: async (companyData: any) => {
    return await apiCall('/companies', {
      method: 'POST',
      body: JSON.stringify(companyData),
    });
  },

  // Update company
  update: async (id: string, companyData: any) => {
    return await apiCall(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(companyData),
    });
  },

  // Delete company
  delete: async (id: string) => {
    return await apiCall(`/companies/${id}`, {
      method: 'DELETE',
    });
  },

  // Get company statistics
  getStats: async () => {
    return await apiCall('/companies/stats');
  }
};

// Dashboard API
export const dashboardAPI = {
  // Get overall statistics
  getOverallStats: async () => {
    return await apiCall('/dashboard/overall-stats');
  },

  // Get job status distribution
  getJobStatusStats: async () => {
    return await apiCall('/dashboard/job-status');
  },

  // Get recent activity
  getRecentActivity: async () => {
    return await apiCall('/dashboard/recent-activity');
  },

  // Get monthly trends
  getMonthlyTrends: async () => {
    return await apiCall('/dashboard/monthly-trends');
  },

  // Get production metrics
  getProductionMetrics: async () => {
    return await apiCall('/dashboard/production-metrics');
  },

  // Get quality metrics
  getQualityMetrics: async () => {
    return await apiCall('/dashboard/quality-metrics');
  },

  // Get cost analysis
  getCostAnalysis: async () => {
    return await apiCall('/dashboard/cost-analysis');
  }
};

// File Upload API
export const uploadAPI = {
  // Upload file
  uploadFile: async (file: File, jobCardId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('jobCardId', jobCardId);

    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Upload failed! status: ${response.status}`);
    }

    return await response.json();
  },

  // Get files for job card
  getJobFiles: async (jobCardId: string) => {
    return await apiCall(`/upload/job/${jobCardId}`);
  },

  // Download file
  downloadFile: async (fileId: string) => {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_BASE_URL}/upload/download/${fileId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed! status: ${response.status}`);
    }

    return response.blob();
  },

  // Delete file
  deleteFile: async (fileId: string) => {
    return await apiCall(`/upload/${fileId}`, {
      method: 'DELETE',
    });
  }
};

// Health check API
export const healthAPI = {
  check: async () => {
    try {
      const response = await fetch('http://localhost:5001/health');
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Health check failed');
    } catch (error) {
      throw new Error('Backend server is not responding');
    }
  }
};

// Process Sequences API
export const processSequencesAPI = {
  // Get process sequence by product type (with optional product filtering)
  getByProductType: async (productType: string, productId?: string): Promise<ProcessSequence> => {
    let url = `/process-sequences/by-product-type?product_type=${encodeURIComponent(productType)}`;
    if (productId) {
      url += `&product_id=${encodeURIComponent(productId)}`;
    }
    return apiCall(url);
  },

  // Get process steps for a specific product (filtered by saved selections)
  getForProduct: async (productId: string): Promise<ProcessSequence> => {
    return apiCall(`/process-sequences/for-product/${encodeURIComponent(productId)}`);
  },

  // Get all process sequences
  getAll: async (): Promise<ProcessSequence[]> => {
    const response = await apiCall('/process-sequences');
    return response.process_sequences;
  }
};

export default {
  auth: authAPI,
  products: productsAPI,
  jobs: jobsAPI,
  companies: companiesAPI,
  dashboard: dashboardAPI,
  upload: uploadAPI,
  health: healthAPI,
};
