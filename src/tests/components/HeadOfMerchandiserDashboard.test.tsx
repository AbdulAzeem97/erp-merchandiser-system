import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import HeadOfMerchandiserDashboard from '@/components/dashboards/HeadOfMerchandiserDashboard';
import * as useReports from '@/hooks/useReports';

// Mock the hooks
jest.mock('@/hooks/useReports');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('HeadOfMerchandiserDashboard', () => {
  const mockKPIs = {
    jobsPunchedMTD: 45,
    jobsInProgress: 25,
    jobsCompleted: 120,
    avgTurnaroundTime: 86400,
    pendingPrepress: 15,
    slaBreaches: 3,
    activeDesigners: 5
  };

  const mockMonthlyTrends = [
    {
      month: '2024-01-01',
      jobs_punched: 45,
      jobs_completed: 40,
      prepress_jobs: 30,
      prepress_completed: 25
    },
    {
      month: '2024-02-01',
      jobs_punched: 52,
      jobs_completed: 48,
      prepress_jobs: 35,
      prepress_completed: 30
    }
  ];

  const mockMerchandiserPerformance = [
    {
      id: 'merchandiser-1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      total_jobs: 25,
      completed_jobs: 20,
      in_progress_jobs: 3,
      avg_turnaround_seconds: 86400
    },
    {
      id: 'merchandiser-2',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      total_jobs: 30,
      completed_jobs: 28,
      in_progress_jobs: 2,
      avg_turnaround_seconds: 72000
    }
  ];

  const mockRecentActivity = [
    {
      id: 'activity-1',
      activity_type: 'job_card',
      actor_name: 'John Doe',
      item_name: 'Job Card #123',
      company_name: 'Test Company',
      product_type: 'T-Shirt',
      status: 'COMPLETED',
      activity_date: '2024-01-15T10:30:00Z'
    },
    {
      id: 'activity-2',
      activity_type: 'prepress_job',
      actor_name: 'Jane Smith',
      item_name: 'Prepress Job #456',
      company_name: 'Another Company',
      product_type: 'Hoodie',
      status: 'IN_PROGRESS',
      activity_date: '2024-01-15T11:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the hooks
    (useReports.useDashboardKPIs as jest.Mock).mockReturnValue({
      data: mockKPIs,
      isLoading: false,
      refetch: jest.fn(),
    });

    (useReports.useMonthlyTrends as jest.Mock).mockReturnValue({
      data: mockMonthlyTrends,
      isLoading: false,
    });

    (useReports.useMerchandiserPerformance as jest.Mock).mockReturnValue({
      data: mockMerchandiserPerformance,
      isLoading: false,
    });

    (useReports.useRecentActivity as jest.Mock).mockReturnValue({
      data: mockRecentActivity,
      isLoading: false,
    });

    (useReports.useExportToCSV as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
    });

    (useReports.useReportFilters as jest.Mock).mockReturnValue({
      filters: {},
      setDateRange: jest.fn(),
    });
  });

  it('renders dashboard header correctly', () => {
    renderWithProviders(<HeadOfMerchandiserDashboard />);
    
    expect(screen.getByText('Head of Merchandiser Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Real-time merchandising operations overview')).toBeInTheDocument();
  });

  it('displays KPI cards with correct data', () => {
    renderWithProviders(<HeadOfMerchandiserDashboard />);
    
    expect(screen.getByText('Jobs Punched (MTD)')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    
    expect(screen.getByText('Jobs In Progress')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    
    expect(screen.getByText('Jobs Completed')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    
    expect(screen.getByText('Avg Turnaround')).toBeInTheDocument();
    expect(screen.getByText('24h')).toBeInTheDocument();
  });

  it('displays date range filter', () => {
    renderWithProviders(<HeadOfMerchandiserDashboard />);
    
    expect(screen.getByText('Date Range Filter')).toBeInTheDocument();
    expect(screen.getByLabelText('From Date')).toBeInTheDocument();
    expect(screen.getByLabelText('To Date')).toBeInTheDocument();
  });

  it('handles date range changes', async () => {
    const mockSetDateRange = jest.fn();
    (useReports.useReportFilters as jest.Mock).mockReturnValue({
      filters: {},
      setDateRange: mockSetDateRange,
    });

    renderWithProviders(<HeadOfMerchandiserDashboard />);
    
    const fromDateInput = screen.getByLabelText('From Date');
    fireEvent.change(fromDateInput, { target: { value: '2024-01-01' } });
    
    await waitFor(() => {
      expect(mockSetDateRange).toHaveBeenCalled();
    });
  });

  it('displays refresh and export buttons', () => {
    renderWithProviders(<HeadOfMerchandiserDashboard />);
    
    expect(screen.getByText('Refresh')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('handles refresh button click', async () => {
    const mockRefetch = jest.fn();
    (useReports.useDashboardKPIs as jest.Mock).mockReturnValue({
      data: mockKPIs,
      isLoading: false,
      refetch: mockRefetch,
    });

    renderWithProviders(<HeadOfMerchandiserDashboard />);
    
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it('displays tabs for different views', () => {
    renderWithProviders(<HeadOfMerchandiserDashboard />);
    
    expect(screen.getByText('Merchandiser Performance')).toBeInTheDocument();
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('Bottlenecks')).toBeInTheDocument();
  });

  it('displays merchandiser performance data', () => {
    renderWithProviders(<HeadOfMerchandiserDashboard />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('displays recent activity data', () => {
    renderWithProviders(<HeadOfMerchandiserDashboard />);
    
    // Click on Recent Activity tab
    fireEvent.click(screen.getByText('Recent Activity'));
    
    expect(screen.getByText('John Doe created Job Card #123')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith updated Prepress Job #456')).toBeInTheDocument();
  });

  it('displays bottlenecks information', () => {
    renderWithProviders(<HeadOfMerchandiserDashboard />);
    
    // Click on Bottlenecks tab
    fireEvent.click(screen.getByText('Bottlenecks'));
    
    expect(screen.getByText('Prepress Queue')).toBeInTheDocument();
    expect(screen.getByText('SLA Breaches')).toBeInTheDocument();
    expect(screen.getByText('Designer Workload')).toBeInTheDocument();
  });

  it('shows loading state for KPIs', () => {
    (useReports.useDashboardKPIs as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      refetch: jest.fn(),
    });

    renderWithProviders(<HeadOfMerchandiserDashboard />);
    
    expect(screen.getAllByText('...')).toHaveLength(4); // 4 KPI cards
  });

  it('handles export functionality', async () => {
    const mockExport = jest.fn();
    (useReports.useExportToCSV as jest.Mock).mockReturnValue({
      mutate: mockExport,
    });

    renderWithProviders(<HeadOfMerchandiserDashboard />);
    
    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      expect(mockExport).toHaveBeenCalledWith({ type: 'summary', filters: {} });
    });
  });

  it('displays charts correctly', () => {
    renderWithProviders(<HeadOfMerchandiserDashboard />);
    
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    (useReports.useDashboardKPIs as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      refetch: jest.fn(),
    });

    (useReports.useMonthlyTrends as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    (useReports.useMerchandiserPerformance as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    (useReports.useRecentActivity as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    renderWithProviders(<HeadOfMerchandiserDashboard />);
    
    // Should still render the dashboard structure
    expect(screen.getByText('Head of Merchandiser Dashboard')).toBeInTheDocument();
  });
});
