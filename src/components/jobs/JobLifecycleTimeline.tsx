import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Factory,
    Package,
    FileText,
    Clock,
    CheckCircle,
    AlertCircle,
    Play,
    RotateCcw,
    User,
    Building,
    Calendar,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { jobsAPI, processSequencesAPI, jobAssignmentHistoryAPI } from '@/services/api';
import { toast } from 'sonner';

interface JobLifecycleTimelineProps {
    jobId: string | number;
    currentDepartment?: string;
}

interface TimelineStage {
    id: string;
    name: string;
    department: string;
    status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'skipped' | 'assigned';
    progress: number;
    startDate?: string;
    endDate?: string;
    assignedTo?: string;
    assignedBy?: string;
    duration?: string;
    notes?: string;
    isCompulsory?: boolean;
    order: number;
}

export const JobLifecycleTimeline: React.FC<JobLifecycleTimelineProps> = ({ jobId, currentDepartment }) => {
    const [stages, setStages] = useState<TimelineStage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedStages, setExpandedStages] = useState<string[]>([]);
    const [overallProgress, setOverallProgress] = useState(0);

    useEffect(() => {
        loadLifecycleData();
    }, [jobId]);

    const loadLifecycleData = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Job Details for context (if needed)
            // 2. Fetch Process Sequence (The PLAN)
            const sequenceResponse = await processSequencesAPI.getForJob(jobId.toString());
            // @ts-ignore
            const allSteps = sequenceResponse.process_sequence?.steps || sequenceResponse.steps || [];

            // Filter steps: Keep if explicitly selected OR if compulsory (fallback)
            const steps = allSteps.filter((step: any) => step.isSelected || step.isCompulsory);

            // 3. Fetch Assignment History (The ACTUAL executions)
            const historyResponse = await jobAssignmentHistoryAPI.getJobHistory(jobId.toString());
            const history = historyResponse.history || [];

            // 4. Merge Data
            // Create a map of department/step to history records
            // This logic infers status based on history
            // Note: We need to match steps to history. History usually has 'assigned_to_role' or 'action_type' or inferred from 'notes'
            // Ideally the backend should return the status of each step, but we will infer it for now.

            const mergedStages: TimelineStage[] = steps.map((step: any) => {
                // Find relevant history for this step
                // Assuming step.name or step.department relates to history records
                // This is heuristic if we don't have direct linkage
                const stepHistory = history.filter((h: any) =>
                    h.notes?.toLowerCase().includes(step.name.toLowerCase()) ||
                    h.job_status?.toLowerCase().includes(step.name.toLowerCase()) ||
                    // Fallback: match by generic department assignment if possible
                    (h.action_type === 'ASSIGNED' && h.notes?.includes(step.name))
                );

                // Find the 'started' record (Assigned)
                const startRecord = stepHistory.find((h: any) => h.action_type === 'ASSIGNED');
                // Find 'completed' record (if any logic exists for it, possibly next step assignment implies completion of this one)
                // For now, let's look for explicit status changes in history if available, else infer

                let status: TimelineStage['status'] = 'pending';
                let progress = 0;
                let startDate = undefined;
                let endDate = undefined;
                let assignedTo = undefined;
                let assignedBy = undefined;

                if (startRecord) {
                    status = 'in_progress';
                    progress = 50;
                    startDate = startRecord.created_at;
                    assignedTo = startRecord.assigned_to_name;
                    assignedBy = startRecord.assigned_by_name;
                }

                // If this step matches current department, it's active
                if (currentDepartment && step.name.toLowerCase().includes(currentDepartment.toLowerCase())) {
                    status = 'in_progress';
                    progress = 50; // Active
                } else if (status === 'in_progress' && currentDepartment && !step.name.toLowerCase().includes(currentDepartment.toLowerCase())) {
                    // If we were in progress but current department is something else later in sequence?
                    // Simple logic: if a later step is active, this one is completed.
                }

                return {
                    id: step.id,
                    name: step.name,
                    department: step.department || 'Production', // Default or from step
                    status: status,
                    progress: progress,
                    startDate: startDate,
                    endDate: endDate,
                    assignedTo: assignedTo,
                    assignedBy: assignedBy,
                    isCompulsory: step.isCompulsory,
                    order: step.order
                };
            });

            // Refine statuses based on order
            let pastActive = false;
            const finalStages = mergedStages.map((stage, index) => {
                // If a later stage is in progress or completed, assume this one is completed
                const laterActive = mergedStages.slice(index + 1).some(s => s.status === 'in_progress' || s.status === 'completed');
                if (laterActive && stage.status !== 'completed') {
                    return { ...stage, status: 'completed', progress: 100 };
                }
                return stage;
            });

            // Calculate overall progress
            const totalSteps = finalStages.length;
            const completedSteps = finalStages.filter(s => s.status === 'completed').length;
            setOverallProgress(totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0);

            setStages(finalStages as TimelineStage[]);

        } catch (error) {
            console.error('Error loading timeline data:', error);
            toast.error('Failed to load timeline');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'in_progress': return <Play className="w-5 h-5 text-blue-600" />;
            case 'pending': return <Clock className="w-5 h-5 text-gray-300" />;
            case 'blocked': return <AlertCircle className="w-5 h-5 text-red-600" />;
            case 'skipped': return <RotateCcw className="w-5 h-5 text-yellow-600" />;
            default: return <Clock className="w-5 h-5 text-gray-300" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-50 border-green-200';
            case 'in_progress': return 'bg-blue-50 border-blue-200 shadow-md ring-1 ring-blue-200';
            case 'pending': return 'bg-gray-50 border-gray-200 opacity-60';
            case 'blocked': return 'bg-red-50 border-red-200';
            case 'skipped': return 'bg-yellow-50 border-yellow-200';
            default: return 'bg-gray-50 border-gray-200';
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const toggleStageExpansion = (stageId: string) => {
        setExpandedStages(prev =>
            prev.includes(stageId)
                ? prev.filter(id => id !== stageId)
                : [...prev, stageId]
        );
    };

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading lifecycle data...</div>;
    }

    if (stages.length === 0) {
        return <div className="p-8 text-center text-gray-500">No process sequence data available for this job.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Production Lifecycle</h3>
                    <p className="text-sm text-gray-500">Track progress across all departments</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{Math.round(overallProgress)}%</div>
                        <div className="text-xs text-gray-500">Overall Completion</div>
                    </div>
                    <Progress value={overallProgress} className="w-24 h-2" />
                </div>
            </div>

            <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {stages.map((stage, index) => (
                    <motion.div
                        key={stage.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                    >
                        {/* Icon */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            {getStatusIcon(stage.status)}
                        </div>

                        {/* Card */}
                        <div
                            className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] rounded-xl border p-4 transition-all duration-200 hover:shadow-lg ${getStatusColor(stage.status)}`}
                            onClick={() => toggleStageExpansion(stage.id)}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-gray-800">{stage.name}</h4>
                                        {stage.status === 'in_progress' && (
                                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Active</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{stage.department || 'Pending Assignment'}</p>
                                </div>
                            </div>

                            {stage.status !== 'pending' && (
                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500 border-t border-gray-200 pt-3">
                                    <div>
                                        <span className="block text-gray-400">Started</span>
                                        <span className="font-medium text-gray-700">{formatDate(stage.startDate)}</span>
                                    </div>
                                    {stage.status === 'completed' && (
                                        <div>
                                            <span className="block text-gray-400">Completed</span>
                                            <span className="font-medium text-green-700">{formatDate(stage.endDate) || 'Completed'}</span>
                                        </div>
                                    )}
                                    {stage.assignedTo && (
                                        <div className="col-span-2">
                                            <span className="block text-gray-400">Handled By</span>
                                            <span className="font-medium text-gray-700 flex items-center gap-1">
                                                <User className="w-3 h-3" /> {stage.assignedTo}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
