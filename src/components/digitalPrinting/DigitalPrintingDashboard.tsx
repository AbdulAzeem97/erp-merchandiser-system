import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Printer,
    Clock,
    CheckCircle,
    Play,
    Pause,
    AlertCircle,
    Hash,
    Layers,
    Search,
    RefreshCw,
    Plus,
    ArrowRight,
    Monitor
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { digitalPrintingAPI } from '@/services/api';

const MACHINE_TYPES = [
    'KONICA',
    'RICOH',
    'XEROX',
    'HP_INDIGO',
    'OTHER'
];

const COLUMNS = [
    { id: 'PENDING', title: 'Pending', icon: Clock, color: 'text-yellow-500' },
    { id: 'IN_PROGRESS', title: 'In Progress', icon: Play, color: 'text-blue-500' },
    { id: 'COMPLETED', title: 'Completed', icon: CheckCircle, color: 'text-green-500' }
];

const DigitalPrintingDashboard = () => {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [updateData, setUpdateData] = useState({
        machineType: '',
        outputSheets: 0,
        rejectSheets: 0,
        notes: ''
    });

    const loadJobs = async () => {
        setLoading(true);
        try {
            const response = await digitalPrintingAPI.getJobs();
            setJobs(response.jobs || []);
        } catch (error) {
            console.error('Error loading jobs:', error);
            toast.error('Failed to load jobs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadJobs();
    }, []);

    const filteredJobs = useMemo(() => {
        return jobs.filter(job =>
            job.jobNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [jobs, searchTerm]);

    const handleStart = async (jobId: string) => {
        try {
            await digitalPrintingAPI.start(jobId);
            toast.success('Job started');
            loadJobs();
        } catch (error) {
            toast.error('Failed to start job');
        }
    };

    const handleUpdateClick = (job: any) => {
        setSelectedJob(job);
        setUpdateData({
            machineType: job.digital_printing?.digitalMachine || '',
            outputSheets: job.digital_printing?.digitalOutputSheets || 0,
            rejectSheets: job.digital_printing?.digitalRejectSheets || 0,
            notes: ''
        });
        setIsUpdateModalOpen(true);
    };

    const handleUpdateSubmit = async (statusOverride?: string) => {
        if (!selectedJob) return;

        try {
            await digitalPrintingAPI.update({
                jobId: selectedJob.id,
                machineType: updateData.machineType,
                outputSheets: Number(updateData.outputSheets),
                rejectSheets: Number(updateData.rejectSheets),
                status: statusOverride || selectedJob.digital_printing?.digitalStatus,
                notes: updateData.notes
            });

            toast.success('Data updated successfully');
            setIsUpdateModalOpen(false);
            loadJobs();
        } catch (error) {
            toast.error('Failed to update data');
        }
    };

    const handleComplete = async () => {
        if (!updateData.machineType || updateData.outputSheets === 0) {
            toast.error('Please select machine and enter output sheets');
            return;
        }
        handleUpdateSubmit('COMPLETED');
    };

    const JobCard = ({ job }: { job: any }) => (
        <motion.div
            layoutId={job.id}
            className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            whileHover={{ scale: 1.01 }}
            onClick={() => handleUpdateClick(job)}
        >
            <div className="flex justify-between items-start mb-3">
                <Badge variant="outline" className="font-mono text-xs uppercase tracking-wider">
                    {job.jobNumber}
                </Badge>
                <Badge className={job.priority === 'HIGH' ? 'bg-red-500' : 'bg-blue-500'}>
                    {job.priority}
                </Badge>
            </div>

            <h4 className="font-semibold text-slate-900 mb-1 line-clamp-1">{job.product_name}</h4>
            <p className="text-xs text-slate-500 mb-4">{job.company_name}</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50 p-2 rounded flex flex-col items-center">
                    <span className="text-[10px] uppercase text-slate-400 font-bold mb-1">Quantity</span>
                    <span className="text-sm font-bold text-slate-700">{job.quantity.toLocaleString()}</span>
                </div>
                <div className="bg-blue-50 p-2 rounded flex flex-col items-center">
                    <span className="text-[10px] uppercase text-blue-400 font-bold mb-1 underline">Incoming Sheets</span>
                    <span className="text-sm font-bold text-blue-700">{job.incoming_sheets.toLocaleString()}</span>
                </div>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1 text-slate-500">
                    <Monitor className="w-3 h-3" />
                    <span className="text-[10px] font-medium">{job.digital_printing?.digitalMachine || 'No Machine'}</span>
                </div>
                {job.digital_printing?.digitalStatus === 'PENDING' && (
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleStart(job.id);
                        }}
                    >
                        <Play className="w-3 h-3 mr-1" />
                        Start
                    </Button>
                )}
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Printer className="text-indigo-600" />
                            Digital Printing Dashboard
                        </h1>
                        <p className="text-slate-500 text-sm">Monitor and manage digital production workflow</p>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                className="pl-9 bg-white"
                                placeholder="Search jobs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="icon" onClick={loadJobs} disabled={loading}>
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                {/* Kanban Board */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {COLUMNS.map(column => (
                        <div key={column.id} className="flex flex-col h-[calc(100vh-200px)]">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className={`p-1.5 rounded-lg bg-white shadow-sm ${column.color}`}>
                                        <column.icon className="w-4 h-4" />
                                    </span>
                                    <h3 className="font-bold text-slate-700">{column.title}</h3>
                                    <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600">
                                        {filteredJobs.filter(j => j.digital_printing?.digitalStatus === column.id).length}
                                    </Badge>
                                </div>
                            </div>

                            <ScrollArea className="flex-1 pr-4 -mr-4">
                                <div className="space-y-4">
                                    {filteredJobs
                                        .filter(j => j.digital_printing?.digitalStatus === column.id)
                                        .map(job => (
                                            <JobCard key={job.id} job={job} />
                                        ))}
                                </div>
                            </ScrollArea>
                        </div>
                    ))}
                </div>

                {/* Update Modal */}
                <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Monitor className="w-5 h-5 text-indigo-600" />
                                Update Printing Production
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Machine Type</Label>
                                    <Select
                                        value={updateData.machineType}
                                        onValueChange={(v) => setUpdateData({ ...updateData, machineType: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Machine" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MACHINE_TYPES.map(m => (
                                                <SelectItem key={m} value={m}>{m.replace('_', ' ')}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1">
                                        Output Sheets
                                        <Badge variant="outline" className="text-[10px] py-0 px-1 border-blue-200 text-blue-600">REQUIRED</Badge>
                                    </Label>
                                    <Input
                                        type="number"
                                        value={updateData.outputSheets}
                                        onChange={(e) => setUpdateData({ ...updateData, outputSheets: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Reject Sheets</Label>
                                    <Input
                                        type="number"
                                        value={updateData.rejectSheets}
                                        onChange={(e) => setUpdateData({ ...updateData, rejectSheets: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-400">Status</Label>
                                    <div className="h-10 flex items-center">
                                        <Badge className={
                                            selectedJob?.digital_printing?.digitalStatus === 'COMPLETED' ? 'bg-green-500' :
                                                selectedJob?.digital_printing?.digitalStatus === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-yellow-500'
                                        }>
                                            {selectedJob?.digital_printing?.digitalStatus}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Notes / Remarks</Label>
                                <Input
                                    placeholder="Any production issues or observations..."
                                    value={updateData.notes}
                                    onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                                />
                            </div>

                            {selectedJob && (
                                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                                    <div className="flex justify-between text-xs mb-1 font-bold text-indigo-700">
                                        <span>INCOMING TARGET</span>
                                        <span>{selectedJob.incoming_sheets.toLocaleString()} SHEETS</span>
                                    </div>
                                    <div className="w-full bg-white rounded-full h-2">
                                        <div
                                            className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(100, (updateData.outputSheets / (selectedJob.incoming_sheets || 1)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setIsUpdateModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => handleUpdateSubmit()}>
                                Update Data
                            </Button>
                            {selectedJob?.digital_printing?.digitalStatus !== 'COMPLETED' && (
                                <Button className="bg-green-600 hover:bg-green-700" onClick={handleComplete}>
                                    Complete Job
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default DigitalPrintingDashboard;
