// API Service for ERP Merchandiser System
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

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
    console.log(`🌐 Making API call to: ${API_BASE_URL}${endpoint}`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    console.log(`📊 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ API Error Response:', errorData);
      
      // Handle authentication errors
      if (response.status === 401 || (errorData.error === 'Invalid token' && errorData.message === 'User not found')) {
        console.log('🔐 Invalid token detected, clearing authentication...');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/';
        return;
      }
      
      // Create a custom error object that preserves the error details
      const apiError = new Error(errorData.error || `HTTP error! status: ${response.status}`);
      apiError.response = errorData;
      apiError.status = response.status;
      throw apiError;
    }
    
    const data = await response.json();
    console.log('✅ API call successful');
    return data;
  } catch (error) {
    console.error('❌ API call failed:', error);
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to server. Please check your connection and try again.');
    }
    
    throw error;
  }
}

// Authentication API
export const authAPI = {
  login: async (email: string, password: string) => {
    try {
      console.log('🔐 Starting login process for:', email);
      
      // Special login API call that handles 401 as normal response
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      console.log(`📊 Login response status: ${response.status}`);
      
      const data = await response.json();
      console.log('📋 Login response received:', data);
      
      if (!response.ok) {
        // Handle login failure
        if (response.status === 401) {
          throw new Error('Invalid email or password. Please try again.');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(data.error || data.message || 'Login failed. Please try again.');
        }
      }
      
      // Handle successful login
      const token = data.token || data.tokens?.access_token || data.tokens?.token;
      
      if (token) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('✅ Login successful, token stored');
        return data;
      } else {
        console.error('❌ No token found in response:', data);
        throw new Error('No authentication token received from server');
      }
      
    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check your connection.');
      } else {
        throw new Error(error.message || 'Login failed. Please try again.');
      }
    }
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

  // Get materials
  getMaterials: async () => {
    return await apiCall('/products/materials');
  },

  // Get categories
  getCategories: async () => {
    return await apiCall('/products/categories');
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
  updateStatus: async (id: string, statusData: any) => {
    return await apiCall(`/jobs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    });
  },

  // Get jobs by designer
  getByDesigner: async (designerId: string) => {
    return await apiCall(`/jobs/designer/${designerId}`);
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

// Users API
export const usersAPI = {
  // Get all users with pagination and filtering
  getAll: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return await apiCall(`/users?${queryParams.toString()}`);
  },

  // Get user by ID
  getById: async (id: string) => {
    return await apiCall(`/users/${id}`);
  },

  // Create new user
  create: async (userData: any) => {
    return await apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Update user
  update: async (id: string, userData: any) => {
    return await apiCall(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  // Delete user
  delete: async (id: string) => {
    return await apiCall(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Get users by role
  getByRole: async (role: string) => {
    return await apiCall(`/users/role/${role}`);
  },

  // Get user statistics
  getStats: async () => {
    return await apiCall('/users/stats');
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
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
      const healthUrl = baseUrl.replace('/api', '/health');
      const response = await fetch(healthUrl);
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

// Inventory API
export const inventoryAPI = {
  // Dashboard
  getDashboard: async () => {
    return await apiCall('/inventory/dashboard');
  },

  // Materials
  getMaterials: async (params: {
    page?: number;
    limit?: number;
    category_id?: string;
    low_stock?: boolean;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return await apiCall(`/inventory/materials?${queryParams.toString()}`);
  },

  // Stock Management
  receiveStock: async (data: {
    inventory_material_id: string;
    quantity: number;
    unit_cost: number;
    reference_id: string;
  }) => {
    return await apiCall('/inventory/stock/receive', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  adjustStock: async (data: {
    inventory_material_id: string;
    adjustment_quantity: number;
    reason: string;
  }) => {
    return await apiCall('/inventory/stock/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Job Management
  getPendingJobs: async () => {
    return await apiCall('/inventory/jobs/pending');
  },

  analyzeJob: async (jobId: string, materialsRequired: any[]) => {
    return await apiCall(`/inventory/jobs/${jobId}/analyze`, {
      method: 'POST',
      body: JSON.stringify({ materials_required: materialsRequired }),
    });
  },

  approveJob: async (jobId: string, data: {
    status: string;
    approval_percentage?: number;
    special_approval_reason?: string;
    remarks?: string;
  }) => {
    return await apiCall(`/inventory/jobs/${jobId}/approve`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Purchase Requests
  getPurchaseRequests: async (params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return await apiCall(`/inventory/purchase-requests?${queryParams.toString()}`);
  },

  createPurchaseRequest: async (data: {
    materials: any[];
    reason: string;
  }) => {
    return await apiCall('/inventory/purchase-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Alerts
  getAlerts: async (params: {
    status?: string;
    alert_type?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return await apiCall(`/inventory/alerts?${queryParams.toString()}`);
  }
};

export default {
  auth: authAPI,
  products: productsAPI,
  jobs: jobsAPI,
  companies: companiesAPI,
  users: usersAPI,
  dashboard: dashboardAPI,
  upload: uploadAPI,
  health: healthAPI,
  inventory: inventoryAPI,
};
