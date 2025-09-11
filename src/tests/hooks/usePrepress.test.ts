import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePrepressJobs, useMyPrepressJobs, usePrepressJobActivity } from '@/hooks/usePrepress';
import * as enhancedApi from '@/services/enhancedApi';

// Mock the API service
jest.mock('@/services/enhancedApi');

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('usePrepress Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('usePrepressJobs', () => {
    it('should fetch prepress jobs successfully', async () => {
      const mockJobs = [
        {
          id: 'prepress-job-1',
          job_card_id: 'job-1',
          status: 'PENDING',
          priority: 'HIGH',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 'prepress-job-2',
          job_card_id: 'job-2',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          created_at: '2024-01-15T11:00:00Z',
          updated_at: '2024-01-15T11:00:00Z'
        }
      ];

      (enhancedApi.getPrepressJobs as jest.Mock).mockResolvedValue(mockJobs);

      const { result } = renderHook(() => usePrepressJobs({}), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockJobs);
      expect(enhancedApi.getPrepressJobs).toHaveBeenCalledWith({});
    });

    it('should handle filters correctly', async () => {
      const filters = {
        status: 'PENDING',
        priority: 'HIGH',
        designer: 'designer-1',
        search: 'test'
      };

      const mockJobs = [
        {
          id: 'prepress-job-1',
          job_card_id: 'job-1',
          status: 'PENDING',
          priority: 'HIGH',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        }
      ];

      (enhancedApi.getPrepressJobs as jest.Mock).mockResolvedValue(mockJobs);

      const { result } = renderHook(() => usePrepressJobs(filters), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(enhancedApi.getPrepressJobs).toHaveBeenCalledWith(filters);
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      (enhancedApi.getPrepressJobs as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => usePrepressJobs({}), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });

    it('should show loading state', () => {
      (enhancedApi.getPrepressJobs as jest.Mock).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => usePrepressJobs({}), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('useMyPrepressJobs', () => {
    it('should fetch my prepress jobs successfully', async () => {
      const mockJobs = [
        {
          id: 'prepress-job-1',
          job_card_id: 'job-1',
          status: 'ASSIGNED',
          priority: 'HIGH',
          assigned_designer_id: 'designer-1',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        }
      ];

      (enhancedApi.getMyPrepressJobs as jest.Mock).mockResolvedValue(mockJobs);

      const { result } = renderHook(() => useMyPrepressJobs({}), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockJobs);
      expect(enhancedApi.getMyPrepressJobs).toHaveBeenCalledWith({});
    });

    it('should handle filters for my jobs', async () => {
      const filters = {
        status: 'IN_PROGRESS',
        priority: 'MEDIUM'
      };

      const mockJobs = [
        {
          id: 'prepress-job-2',
          job_card_id: 'job-2',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          assigned_designer_id: 'designer-1',
          created_at: '2024-01-15T11:00:00Z',
          updated_at: '2024-01-15T11:00:00Z'
        }
      ];

      (enhancedApi.getMyPrepressJobs as jest.Mock).mockResolvedValue(mockJobs);

      const { result } = renderHook(() => useMyPrepressJobs(filters), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(enhancedApi.getMyPrepressJobs).toHaveBeenCalledWith(filters);
    });
  });

  describe('usePrepressJobActivity', () => {
    it('should fetch job activity successfully', async () => {
      const jobId = 'prepress-job-1';
      const mockActivity = [
        {
          id: 'activity-1',
          action: 'ASSIGNED',
          from_status: null,
          to_status: 'ASSIGNED',
          remark: 'Assigned to designer',
          created_at: '2024-01-15T10:00:00Z',
          first_name: 'John',
          last_name: 'Doe'
        },
        {
          id: 'activity-2',
          action: 'STARTED',
          from_status: 'ASSIGNED',
          to_status: 'IN_PROGRESS',
          remark: null,
          created_at: '2024-01-15T11:00:00Z',
          first_name: 'Jane',
          last_name: 'Smith'
        }
      ];

      (enhancedApi.getPrepressJobActivity as jest.Mock).mockResolvedValue(mockActivity);

      const { result } = renderHook(() => usePrepressJobActivity(jobId), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockActivity);
      expect(enhancedApi.getPrepressJobActivity).toHaveBeenCalledWith(jobId);
    });

    it('should not fetch when jobId is empty', () => {
      const { result } = renderHook(() => usePrepressJobActivity(''), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(enhancedApi.getPrepressJobActivity).not.toHaveBeenCalled();
    });

    it('should handle API errors for activity', async () => {
      const jobId = 'prepress-job-1';
      const error = new Error('Activity fetch failed');
      (enhancedApi.getPrepressJobActivity as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => usePrepressJobActivity(jobId), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('usePrepressStatistics', () => {
    it('should fetch prepress statistics successfully', async () => {
      const mockStats = {
        total_jobs: 100,
        in_progress_jobs: 25,
        completed_jobs: 70,
        active_designers: 5,
        avg_turnaround_seconds: 172800
      };

      (enhancedApi.getPrepressStatistics as jest.Mock).mockResolvedValue(mockStats);

      const { result } = renderHook(() => usePrepressStatistics(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockStats);
      expect(enhancedApi.getPrepressStatistics).toHaveBeenCalled();
    });
  });

  describe('Mutation Hooks', () => {
    describe('useStartPrepressJob', () => {
      it('should start a prepress job successfully', async () => {
        const jobId = 'prepress-job-1';
        const mockResponse = {
          id: jobId,
          status: 'IN_PROGRESS',
          started_at: '2024-01-15T12:00:00Z'
        };

        (enhancedApi.startPrepressJob as jest.Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useStartPrepressJob(), { wrapper });

        await waitFor(() => {
          result.current.mutate(jobId);
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual(mockResponse);
        expect(enhancedApi.startPrepressJob).toHaveBeenCalledWith(jobId);
      });

      it('should handle start job errors', async () => {
        const jobId = 'prepress-job-1';
        const error = new Error('Start job failed');
        (enhancedApi.startPrepressJob as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useStartPrepressJob(), { wrapper });

        await waitFor(() => {
          result.current.mutate(jobId);
        });

        await waitFor(() => {
          expect(result.current.isError).toBe(true);
        });

        expect(result.current.error).toEqual(error);
      });
    });

    describe('usePausePrepressJob', () => {
      it('should pause a prepress job successfully', async () => {
        const jobId = 'prepress-job-1';
        const remark = 'Work paused by designer';
        const mockResponse = {
          id: jobId,
          status: 'PAUSED',
          updated_at: '2024-01-15T12:00:00Z'
        };

        (enhancedApi.pausePrepressJob as jest.Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => usePausePrepressJob(), { wrapper });

        await waitFor(() => {
          result.current.mutate({ jobId, remark });
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual(mockResponse);
        expect(enhancedApi.pausePrepressJob).toHaveBeenCalledWith(jobId, { remark });
      });
    });

    describe('useResumePrepressJob', () => {
      it('should resume a prepress job successfully', async () => {
        const jobId = 'prepress-job-1';
        const mockResponse = {
          id: jobId,
          status: 'IN_PROGRESS',
          updated_at: '2024-01-15T12:00:00Z'
        };

        (enhancedApi.resumePrepressJob as jest.Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useResumePrepressJob(), { wrapper });

        await waitFor(() => {
          result.current.mutate(jobId);
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual(mockResponse);
        expect(enhancedApi.resumePrepressJob).toHaveBeenCalledWith(jobId);
      });
    });

    describe('useSubmitPrepressJob', () => {
      it('should submit a prepress job successfully', async () => {
        const jobId = 'prepress-job-1';
        const remark = 'Submitted for HOD review';
        const mockResponse = {
          id: jobId,
          status: 'HOD_REVIEW',
          updated_at: '2024-01-15T12:00:00Z'
        };

        (enhancedApi.submitPrepressJob as jest.Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useSubmitPrepressJob(), { wrapper });

        await waitFor(() => {
          result.current.mutate({ jobId, remark });
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual(mockResponse);
        expect(enhancedApi.submitPrepressJob).toHaveBeenCalledWith(jobId, { remark });
      });
    });

    describe('useAddPrepressRemark', () => {
      it('should add a remark successfully', async () => {
        const jobId = 'prepress-job-1';
        const remarkData = {
          remark: 'This is a test remark',
          isHodRemark: false
        };
        const mockResponse = {
          id: 'remark-1',
          remark: remarkData.remark,
          created_at: '2024-01-15T12:00:00Z'
        };

        (enhancedApi.addPrepressRemark as jest.Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useAddPrepressRemark(), { wrapper });

        await waitFor(() => {
          result.current.mutate({ jobId, data: remarkData });
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual(mockResponse);
        expect(enhancedApi.addPrepressRemark).toHaveBeenCalledWith(jobId, remarkData);
      });
    });
  });
});
