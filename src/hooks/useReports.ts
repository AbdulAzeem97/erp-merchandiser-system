import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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
import { enhancedApi } from '../services/enhancedApi';
import { socketService } from '../services/socketService';
import { toast } from 'sonner';

// Query keys
export const REPORTS_QUERY_KEYS = {
  all: ['reports'] as const,
  summary: (filters: ReportFilters) => [...REPORTS_QUERY_KEYS.all, 'summary', filters] as const,
  monthly: (year?: number) => [...REPORTS_QUERY_KEYS.all, 'monthly', year] as const,
  merchandisers: (filters: ReportFilters) => [...REPORTS_QUERY_KEYS.all, 'merchandisers', filters] as const,
  designers: (filters: ReportFilters) => [...REPORTS_QUERY_KEYS.all, 'designers', filters] as const,
  companies: (filters: ReportFilters) => [...REPORTS_QUERY_KEYS.all, 'companies', filters] as const,
  productTypes: (filters: ReportFilters) => [...REPORTS_QUERY_KEYS.all, 'product-types', filters] as const,
  slaCompliance: (filters: ReportFilters) => [...REPORTS_QUERY_KEYS.all, 'sla-compliance', filters] as const,
  recentActivity: (limit?: number) => [...REPORTS_QUERY_KEYS.all, 'recent-activity', limit] as const,
  dashboardKPIs: () => [...REPORTS_QUERY_KEYS.all, 'dashboard-kpis'] as const,
  productionKPIs: () => [...REPORTS_QUERY_KEYS.all, 'production-kpis'] as const,
};

// Hook for fetching system summary
export function useSystemSummary(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.summary(filters),
    queryFn: () => enhancedApi.getSystemSummary(filters),
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });
}

// Hook for fetching monthly trends
export function useMonthlyTrends(year?: number) {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.monthly(year),
    queryFn: () => enhancedApi.getMonthlyTrends(year),
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook for fetching merchandiser performance
export function useMerchandiserPerformance(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.merchandisers(filters),
    queryFn: () => enhancedApi.getMerchandiserPerformance(filters),
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook for fetching designer productivity
export function useDesignerProductivity(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.designers(filters),
    queryFn: () => enhancedApi.getDesignerProductivity(filters),
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook for fetching company performance
export function useCompanyPerformance(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.companies(filters),
    queryFn: () => enhancedApi.getCompanyPerformance(filters),
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook for fetching product type performance
export function useProductTypePerformance(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.productTypes(filters),
    queryFn: () => enhancedApi.getProductTypePerformance(filters),
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook for fetching SLA compliance
export function useSLACompliance(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.slaCompliance(filters),
    queryFn: () => enhancedApi.getSLACompliance(filters),
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook for fetching recent activity
export function useRecentActivity(limit?: number) {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.recentActivity(limit),
    queryFn: () => enhancedApi.getRecentActivity(limit),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

// Hook for fetching dashboard KPIs
export function useDashboardKPIs() {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.dashboardKPIs(),
    queryFn: () => enhancedApi.getDashboardKPIs(),
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });
}

// Hook for fetching production KPIs
export function useProductionKPIs() {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.productionKPIs(),
    queryFn: () => enhancedApi.getProductionKPIs(),
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });
}

// Hook for exporting data to CSV
export function useExportToCSV() {
  return useMutation({
    mutationFn: ({ type, filters }: { type: string; filters: ReportFilters }) =>
      enhancedApi.exportToCSV(type, filters),
    onSuccess: (blob, { type }) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report exported successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to export report: ${error.message}`);
    },
  });
}

// Hook for exporting data to PDF
export function useExportToPDF() {
  return useMutation({
    mutationFn: ({ type, filters }: { type: string; filters: ReportFilters }) =>
      enhancedApi.exportToPDF(type, filters),
    onSuccess: (blob, { type }) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report exported successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to export report: ${error.message}`);
    },
  });
}

// Hook for real-time dashboard KPI updates
export function useDashboardKPISocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleDashboardKPIUpdate = () => {
      // Invalidate dashboard KPI queries
      queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEYS.dashboardKPIs() });
      queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEYS.productionKPIs() });
      queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEYS.summary({}) });
    };

    socketService.onDashboardKPIUpdate(handleDashboardKPIUpdate);

    return () => {
      socketService.offDashboardKPIUpdate(handleDashboardKPIUpdate);
    };
  }, [queryClient]);
}

// Hook for real-time production KPI updates
export function useProductionKPISocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleProductionKPIUpdate = () => {
      // Invalidate production KPI queries
      queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEYS.productionKPIs() });
      queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEYS.summary({}) });
    };

    socketService.onDashboardKPIUpdate(handleProductionKPIUpdate);

    return () => {
      socketService.offDashboardKPIUpdate(handleProductionKPIUpdate);
    };
  }, [queryClient]);
}

// Utility hook for refreshing all reports
export function useRefreshReports() {
  const queryClient = useQueryClient();

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEYS.all });
    toast.success('Reports refreshed');
  };

  const refreshSummary = () => {
    queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEYS.summary({}) });
  };

  const refreshKPIs = () => {
    queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEYS.dashboardKPIs() });
    queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEYS.productionKPIs() });
  };

  return {
    refreshAll,
    refreshSummary,
    refreshKPIs,
  };
}

// Hook for managing report filters
export function useReportFilters(initialFilters: ReportFilters = {}) {
  const [filters, setFilters] = useState<ReportFilters>(initialFilters);

  const updateFilters = (newFilters: Partial<ReportFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const setDateRange = (fromDate?: string, toDate?: string) => {
    setFilters(prev => ({ ...prev, fromDate, toDate }));
  };

  const setYear = (year?: number) => {
    setFilters(prev => ({ ...prev, year }));
  };

  return {
    filters,
    updateFilters,
    resetFilters,
    setDateRange,
    setYear,
  };
}

// Hook for report data transformation
export function useReportDataTransformation() {
  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString();
  };

  const formatDuration = (seconds: number | null | undefined): string => {
    if (seconds === null || seconds === undefined) return '0s';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatPercentage = (value: number, total: number): string => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: string | Date): string => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return {
    formatNumber,
    formatDuration,
    formatPercentage,
    formatCurrency,
    formatDate,
    formatDateTime,
  };
}
