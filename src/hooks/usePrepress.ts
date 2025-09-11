import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PrepressJob, 
  PrepressJobFilters, 
  PrepressStatistics,
  PrepressJobCreateRequest,
  PrepressJobAssignRequest,
  PrepressJobReassignRequest,
  PrepressRemarkRequest,
  PrepressActivity
} from '../types/prepress';
import { enhancedApi } from '../services/enhancedApi';
import { socketService } from '../services/socketService';
import { toast } from 'sonner';

// Query keys
export const PREPRESS_QUERY_KEYS = {
  all: ['prepress'] as const,
  jobs: () => [...PREPRESS_QUERY_KEYS.all, 'jobs'] as const,
  jobsList: (filters: PrepressJobFilters) => [...PREPRESS_QUERY_KEYS.jobs(), 'list', filters] as const,
  job: (id: string) => [...PREPRESS_QUERY_KEYS.jobs(), 'detail', id] as const,
  myJobs: (filters: PrepressJobFilters) => [...PREPRESS_QUERY_KEYS.jobs(), 'my', filters] as const,
  statistics: (filters: any) => [...PREPRESS_QUERY_KEYS.all, 'statistics', filters] as const,
  activity: (jobId: string) => [...PREPRESS_QUERY_KEYS.job(jobId), 'activity'] as const,
};

// Hook for fetching prepress jobs
export function usePrepressJobs(filters: PrepressJobFilters = {}) {
  return useQuery({
    queryKey: PREPRESS_QUERY_KEYS.jobsList(filters),
    queryFn: () => enhancedApi.getPrepressJobs(filters),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

// Hook for fetching my prepress jobs (designer queue)
export function useMyPrepressJobs(filters: PrepressJobFilters = {}) {
  return useQuery({
    queryKey: PREPRESS_QUERY_KEYS.myJobs(filters),
    queryFn: () => enhancedApi.getMyPrepressJobs(filters),
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

// Hook for fetching a single prepress job
export function usePrepressJob(id: string) {
  return useQuery({
    queryKey: PREPRESS_QUERY_KEYS.job(id),
    queryFn: () => enhancedApi.getPrepressJobById(id),
    enabled: !!id,
    staleTime: 30000,
  });
}

// Hook for fetching prepress statistics
export function usePrepressStatistics(filters: any = {}) {
  return useQuery({
    queryKey: PREPRESS_QUERY_KEYS.statistics(filters),
    queryFn: () => enhancedApi.getPrepressStatistics(filters),
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });
}

// Hook for fetching prepress job activity
export function usePrepressJobActivity(jobId: string) {
  return useQuery({
    queryKey: PREPRESS_QUERY_KEYS.activity(jobId),
    queryFn: () => enhancedApi.getPrepressJobActivity(jobId),
    enabled: !!jobId,
    staleTime: 30000,
  });
}

// Hook for creating prepress job
export function useCreatePrepressJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PrepressJobCreateRequest) => enhancedApi.createPrepressJob(data),
    onSuccess: (newJob) => {
      // Invalidate and refetch prepress jobs
      queryClient.invalidateQueries({ queryKey: PREPRESS_QUERY_KEYS.jobs() });
      queryClient.invalidateQueries({ queryKey: PREPRESS_QUERY_KEYS.statistics({}) });
      
      toast.success('Prepress job created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create prepress job: ${error.message}`);
    },
  });
}

// Hook for assigning designer
export function useAssignDesigner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: PrepressJobAssignRequest }) =>
      enhancedApi.assignDesigner(jobId, data),
    onSuccess: (updatedJob, { jobId }) => {
      // Update the specific job in cache
      queryClient.setQueryData(PREPRESS_QUERY_KEYS.job(jobId), updatedJob);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: PREPRESS_QUERY_KEYS.jobs() });
      queryClient.invalidateQueries({ queryKey: PREPRESS_QUERY_KEYS.myJobs({}) });
      
      toast.success('Designer assigned successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign designer: ${error.message}`);
    },
  });
}

// Hook for reassigning designer
export function useReassignDesigner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: PrepressJobReassignRequest }) =>
      enhancedApi.reassignDesigner(jobId, data),
    onSuccess: (updatedJob, { jobId }) => {
      queryClient.setQueryData(PREPRESS_QUERY_KEYS.job(jobId), updatedJob);
      queryClient.invalidateQueries({ queryKey: PREPRESS_QUERY_KEYS.jobs() });
      queryClient.invalidateQueries({ queryKey: PREPRESS_QUERY_KEYS.myJobs({}) });
      
      toast.success('Designer reassigned successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reassign designer: ${error.message}`);
    },
  });
}

// Hook for starting prepress job
export function useStartPrepressJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => enhancedApi.startPrepressJob(jobId),
    onSuccess: (updatedJob, jobId) => {
      queryClient.setQueryData(PREPRESS_QUERY_KEYS.job(jobId), updatedJob);
      queryClient.invalidateQueries({ queryKey: PREPRESS_QUERY_KEYS.jobs() });
      queryClient.invalidateQueries({ queryKey: PREPRESS_QUERY_KEYS.myJobs({}) });
      
      toast.success('Work started successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to start work: ${error.message}`);
    },
  });
}

// Hook for pausing prepress job
export function usePausePrepressJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, remark }: { jobId: string; remark?: string }) =>
      enhancedApi.pausePrepressJob(jobId, remark),
    onSuccess: (updatedJob, { jobId }) => {
      queryClient.setQueryData(PREPRESS_QUERY_KEYS.job(jobId), updatedJob);
      queryClient.invalidateQueries({ queryKey: PREPRESS_QUERY_KEYS.jobs() });
      queryClient.invalidateQueries({ queryKey: PREPRESS_QUERY_KEYS.myJobs({}) });
      
      toast.success('Work paused successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to pause work: ${error.message}`);
    },
  });
}

// Hook for resuming prepress job
export function useResumePrepressJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => enhancedApi.resumePrepressJob(jobId),
    onSuccess: (updatedJob, jobId) => {
      queryClient.setQueryData(PREPRESS_QUERY_KEYS.job(jobId), updatedJob);
      queryClient.invalidateQueries({ queryKey: PREPRESS_QUERY_KEYS.jobs() });
      queryClient.invalidateQueries({ queryKey: PREPRESS_QUERY_KEYS.myJobs({}) });
      
      toast.success('Work resumed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to resume work: ${error.message}`);
    },
  });
}

// Hook for submitting prepress job
export function useSubmitPrepressJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, remark }: { jobId: string; remark?: string }) =>
      enhancedApi.submitPrepressJob(jobId, remark),
    onSuccess: (updatedJob, { jobId }) => {
      queryClient.setQueryData(PREPRESS_QUERY_KEYS.job(jobId), updatedJob);
      queryClient.invalidateQueries({ queryKey: PREPRESS_QUERY_KEYS.jobs() });
      queryClient.invalidateQueries({ queryKey: PREPRESS_QUERY_KEYS.myJobs({}) });
      
      toast.success('Job submitted for review successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit job: ${error.message}`);
    },
  });
}

// Hook for approving prepress job
export function useApprovePrepressJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, remark }: { jobId: string; remark?: string }) =>
      enhancedApi.approvePrepressJob(jobId, remark),
    onSuccess: (updatedJob, { jobId }) => {
      queryClient.setQueryData(PREPRESS_QUERY_KEYS.job(jobId), updatedJob);
      queryClient.invalidateQueries({ queryKey: PREPRESS_QUERY_KEYS.jobs() });
      queryClient.invalidateQueries({ queryKey: PREPRESS_QUERY_KEYS.myJobs({}) });
      
      toast.success('Job approved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve job: ${error.message}`);
    },
  });
}

// Hook for rejecting prepress job
export function useRejectPrepressJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, remark }: { jobId: string; remark: string }) =>
      enhancedApi.rejectPrepressJob(jobId, remark),
    onSuccess: (updatedJob, { jobId }) => {
      queryClient.setQueryData(PREPRESS_QUERY_KEYS.job(jobId), updatedJob);
      queryClient.invalidateQueries({ queryKey: PREPRESS_QUERY_KEYS.jobs() });
      queryClient.invalidateQueries({ queryKey: PREPRESS_QUERY_KEYS.myJobs({}) });
      
      toast.success('Job rejected successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reject job: ${error.message}`);
    },
  });
}

// Hook for adding remark
export function useAddPrepressRemark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: PrepressRemarkRequest }) =>
      enhancedApi.addPrepressRemark(jobId, data),
    onSuccess: (updatedJob, { jobId }) => {
      queryClient.setQueryData(PREPRESS_QUERY_KEYS.job(jobId), updatedJob);
      queryClient.invalidateQueries({ queryKey: PREPRESS_QUERY_KEYS.activity(jobId) });
      
      toast.success('Remark added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add remark: ${error.message}`);
    },
  });
}

// Hook for real-time prepress job updates
export function usePrepressJobSocket(jobId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!jobId) return;

    const handlePrepressJobUpdate = (event: any) => {
      if (event.jobId === jobId) {
        // Update the specific job in cache
        queryClient.setQueryData(PREPRESS_QUERY_KEYS.job(jobId), event.data);
        
        // Invalidate related queries to ensure consistency
        queryClient.invalidateQueries({ queryKey: PREPRESS_QUERY_KEYS.jobs() });
        queryClient.invalidateQueries({ queryKey: PREPRESS_QUERY_KEYS.myJobs({}) });
        queryClient.invalidateQueries({ queryKey: PREPRESS_QUERY_KEYS.statistics({}) });
      }
    };

    // Join the job room
    socketService.joinPrepressJob(jobId);
    socketService.onPrepressJobUpdate(handlePrepressJobUpdate);

    return () => {
      socketService.leavePrepressJob(jobId);
      socketService.offPrepressJobUpdate(handlePrepressJobUpdate);
    };
  }, [jobId, queryClient]);
}

// Hook for real-time designer queue updates
export function useDesignerQueueSocket(designerId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!designerId) return;

    const handleDesignerQueueUpdate = (event: any) => {
      if (event.designerId === designerId) {
        // Invalidate designer queue queries
        queryClient.invalidateQueries({ queryKey: PREPRESS_QUERY_KEYS.myJobs({}) });
        queryClient.invalidateQueries({ queryKey: PREPRESS_QUERY_KEYS.jobs() });
      }
    };

    socketService.onDesignerQueueUpdate(handleDesignerQueueUpdate);

    return () => {
      socketService.offDesignerQueueUpdate(handleDesignerQueueUpdate);
    };
  }, [designerId, queryClient]);
}

// Hook for real-time HOD prepress updates
export function useHODPrepressSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleHODPrepressUpdate = () => {
      // Invalidate all prepress queries
      queryClient.invalidateQueries({ queryKey: PREPRESS_QUERY_KEYS.jobs() });
      queryClient.invalidateQueries({ queryKey: PREPRESS_QUERY_KEYS.statistics({}) });
    };

    socketService.onHODPrepressUpdate(handleHODPrepressUpdate);

    return () => {
      socketService.offHODPrepressUpdate(handleHODPrepressUpdate);
    };
  }, [queryClient]);
}
