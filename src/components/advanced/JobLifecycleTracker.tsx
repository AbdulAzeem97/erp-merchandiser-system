import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Factory,
  Package,
  FileText,
  Scissors,
  Printer,
  Palette,
  Layers,
  CheckCircle,
  Clock,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Download,
  Share,
  Calendar,
  User,
  Building,
  Target,
  TrendingUp,
  BarChart3,
  Settings,
  ArrowRight,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Info,
  Zap,
  Star,
  Flag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface JobStage {
  id: string;
  name: string;
  department: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'skipped';
  progress: number;
  startDate?: string;
  endDate?: string;
  assignedTo?: string;
  estimatedDuration?: string;
  actualDuration?: string;
  notes?: string;
  files?: string[];
  qualityCheck?: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface JobDetails {
  id: string;
  jobCardId: string;
  productCode: string;
  customer: string;
  quantity: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  progress: number;
  startDate: string;
  dueDate: string;
  createdBy: string;
  stages: JobStage[];
  specifications: {
    material: string;
    size: string;
    color: string;
    finish: string;
    specialInstructions: string;
  };
  timeline: {
    punched: string;
    prepress: string;
    die: string;
    plate: string;
    production: string;
    cutting: string;
    printing: string;
    varnishing: string;
    embossing: string;
    finishing: string;
    packaging: string;
    delivery: string;
  };
}

const JobLifecycleTracker: React.FC = () => {
  const [selectedJob, setSelectedJob] = useState<JobDetails | null>(null);
  const [expandedStages, setExpandedStages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - replace with actual API data
  const mockJob: JobDetails = {
    id: 'job-001',
    jobCardId: 'JC-2024-001',
    productCode: 'BR-00-139-A',
    customer: 'JCP Brand Solutions',
    quantity: 10000,
    priority: 'high',
    status: 'in_progress',
    progress: 65,
    startDate: '2024-01-15',
    dueDate: '2024-01-25',
    createdBy: 'Abdullah Khan',
    stages: [
      {
        id: 'punch',
        name: 'Job Punching',
        department: 'Merchandising',
        status: 'completed',
        progress: 100,
        startDate: '2024-01-15',
        endDate: '2024-01-15',
        assignedTo: 'Abdullah Khan',
        estimatedDuration: '1 day',
        actualDuration: '1 day',
        priority: 'high',
        qualityCheck: true
      },
      {
        id: 'prepress',
        name: 'Prepress Design',
        department: 'Prepress',
        status: 'completed',
        progress: 100,
        startDate: '2024-01-16',
        endDate: '2024-01-17',
        assignedTo: 'Emma Wilson',
        estimatedDuration: '2 days',
        actualDuration: '2 days',
        priority: 'high',
        qualityCheck: true
      },
      {
        id: 'die',
        name: 'Die Making',
        department: 'Die Department',
        status: 'completed',
        progress: 100,
        startDate: '2024-01-18',
        endDate: '2024-01-19',
        assignedTo: 'Die Specialist',
        estimatedDuration: '2 days',
        actualDuration: '2 days',
        priority: 'high',
        qualityCheck: true
      },
      {
        id: 'plate',
        name: 'Plate Making',
        department: 'Plate Department',
        status: 'completed',
        progress: 100,
        startDate: '2024-01-20',
        endDate: '2024-01-20',
        assignedTo: 'Plate Specialist',
        estimatedDuration: '1 day',
        actualDuration: '1 day',
        priority: 'high',
        qualityCheck: true
      },
      {
        id: 'production',
        name: 'Production Start',
        department: 'Production',
        status: 'in_progress',
        progress: 75,
        startDate: '2024-01-21',
        assignedTo: 'Production Manager',
        estimatedDuration: '3 days',
        priority: 'high',
        qualityCheck: false
      },
      {
        id: 'cutting',
        name: 'Cutting',
        department: 'Cutting',
        status: 'in_progress',
        progress: 60,
        startDate: '2024-01-22',
        assignedTo: 'Cutting Team',
        estimatedDuration: '1 day',
        priority: 'medium',
        qualityCheck: false
      },
      {
        id: 'printing',
        name: 'Printing',
        department: 'Printing',
        status: 'pending',
        progress: 0,
        estimatedDuration: '2 days',
        priority: 'high',
        qualityCheck: false
      },
      {
        id: 'varnishing',
        name: 'Varnishing',
        department: 'Finishing',
        status: 'pending',
        progress: 0,
        estimatedDuration: '1 day',
        priority: 'medium',
        qualityCheck: false
      },
      {
        id: 'embossing',
        name: 'Embossing',
        department: 'Finishing',
        status: 'pending',
        progress: 0,
        estimatedDuration: '1 day',
        priority: 'medium',
        qualityCheck: false
      },
      {
        id: 'finishing',
        name: 'Final Finishing',
        department: 'Finishing',
        status: 'pending',
        progress: 0,
        estimatedDuration: '1 day',
        priority: 'medium',
        qualityCheck: false
      },
      {
        id: 'packaging',
        name: 'Packaging',
        department: 'Packaging',
        status: 'pending',
        progress: 0,
        estimatedDuration: '1 day',
        priority: 'low',
        qualityCheck: false
      },
      {
        id: 'delivery',
        name: 'Delivery',
        department: 'Logistics',
        status: 'pending',
        progress: 0,
        estimatedDuration: '1 day',
        priority: 'high',
        qualityCheck: false
      }
    ],
    specifications: {
      material: 'C1S 250 GSM',
      size: 'A4 (210 x 297 mm)',
      color: '4 Color Process',
      finish: 'Matte Lamination',
      specialInstructions: 'High quality finish required for premium client'
    },
    timeline: {
      punched: '2024-01-15',
      prepress: '2024-01-17',
      die: '2024-01-19',
      plate: '2024-01-20',
      production: '2024-01-21',
      cutting: '2024-01-22',
      printing: '2024-01-24',
      varnishing: '2024-01-25',
      embossing: '2024-01-26',
      finishing: '2024-01-27',
      packaging: '2024-01-28',
      delivery: '2024-01-29'
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'blocked': return 'bg-red-100 text-red-800 border-red-200';
      case 'skipped': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Play className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'blocked': return <AlertCircle className="w-4 h-4" />;
      case 'skipped': return <RotateCcw className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const toggleStageExpansion = (stageId: string) => {
    setExpandedStages(prev => 
      prev.includes(stageId) 
        ? prev.filter(id => id !== stageId)
        : [...prev, stageId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Job Lifecycle Tracker
              </h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                Complete visibility into job progress across all departments
              </p>
            </div>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <Button variant="outline" className="bg-white/80 backdrop-blur-sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" className="bg-white/80 backdrop-blur-sm">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Job Summary Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {mockJob.jobCardId} - {mockJob.productCode}
                  </CardTitle>
                  <p className="text-gray-600 mt-1">
                    {mockJob.customer} • Qty: {mockJob.quantity.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                  <Badge className={`${getPriorityColor(mockJob.priority)} text-sm px-3 py-1`}>
                    <Flag className="w-3 h-3 mr-1" />
                    {mockJob.priority.toUpperCase()}
                  </Badge>
                  <Badge className={`${getStatusColor(mockJob.status)} text-sm px-3 py-1`}>
                    {getStatusIcon(mockJob.status)}
                    <span className="ml-1">{mockJob.status.replace('_', ' ').toUpperCase()}</span>
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{mockJob.progress}%</div>
                  <div className="text-sm text-gray-600">Overall Progress</div>
                  <Progress value={mockJob.progress} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {mockJob.stages.filter(s => s.status === 'completed').length}
                  </div>
                  <div className="text-sm text-gray-600">Stages Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {mockJob.stages.filter(s => s.status === 'in_progress').length}
                  </div>
                  <div className="text-sm text-gray-600">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-600">
                    {mockJob.stages.filter(s => s.status === 'pending').length}
                  </div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Job Stages Timeline */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100/50">
                <CardTitle className="flex items-center">
                  <Factory className="w-5 h-5 mr-2 text-emerald-600" />
                  Job Stages Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {mockJob.stages.map((stage, index) => (
                    <motion.div
                      key={stage.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <div 
                            className="flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer hover:shadow-md transition-all duration-200"
                            style={{
                              borderColor: stage.status === 'completed' ? '#10b981' : 
                                           stage.status === 'in_progress' ? '#3b82f6' : 
                                           stage.status === 'blocked' ? '#ef4444' : '#e5e7eb',
                              backgroundColor: stage.status === 'completed' ? '#f0fdf4' : 
                                             stage.status === 'in_progress' ? '#eff6ff' : 
                                             stage.status === 'blocked' ? '#fef2f2' : '#f9fafb'
                            }}
                            onClick={() => toggleStageExpansion(stage.id)}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                {getStatusIcon(stage.status)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                                  <Badge className={`${getPriorityColor(stage.priority)} text-xs`}>
                                    {stage.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">{stage.department}</p>
                                {stage.assignedTo && (
                                  <p className="text-xs text-gray-500">Assigned to: {stage.assignedTo}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">{stage.progress}%</div>
                                <Progress value={stage.progress} className="w-20 h-2" />
                              </div>
                              {expandedStages.includes(stage.id) ? 
                                <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              }
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-4 bg-white rounded-lg border border-gray-200 mt-2"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Timeline</h4>
                                <div className="space-y-1 text-sm">
                                  {stage.startDate && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Start:</span>
                                      <span className="text-gray-900">{stage.startDate}</span>
                                    </div>
                                  )}
                                  {stage.endDate && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">End:</span>
                                      <span className="text-gray-900">{stage.endDate}</span>
                                    </div>
                                  )}
                                  {stage.estimatedDuration && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Estimated:</span>
                                      <span className="text-gray-900">{stage.estimatedDuration}</span>
                                    </div>
                                  )}
                                  {stage.actualDuration && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Actual:</span>
                                      <span className="text-gray-900">{stage.actualDuration}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Quality & Files</h4>
                                <div className="space-y-1 text-sm">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-gray-600">Quality Check:</span>
                                    {stage.qualityCheck ? (
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <Clock className="w-4 h-4 text-gray-400" />
                                    )}
                                  </div>
                                  {stage.files && stage.files.length > 0 && (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-gray-600">Files:</span>
                                      <span className="text-gray-900">{stage.files.length}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            {stage.notes && (
                              <div className="mt-4">
                                <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                  {stage.notes}
                                </p>
                              </div>
                            )}
                          </motion.div>
                        </CollapsibleContent>
                      </Collapsible>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Job Details Sidebar */}
          <div className="space-y-6">
            {/* Job Specifications */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100/50">
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2 text-purple-600" />
                  Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Material</label>
                    <p className="text-gray-900">{mockJob.specifications.material}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Size</label>
                    <p className="text-gray-900">{mockJob.specifications.size}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Color</label>
                    <p className="text-gray-900">{mockJob.specifications.color}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Finish</label>
                    <p className="text-gray-900">{mockJob.specifications.finish}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Special Instructions</label>
                    <p className="text-gray-900 text-sm bg-gray-50 p-3 rounded-lg">
                      {mockJob.specifications.specialInstructions}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Department Progress */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100/50">
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-orange-600" />
                  Department Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {['Merchandising', 'Prepress', 'Die Department', 'Plate Department', 'Production', 'Cutting', 'Printing', 'Finishing', 'Packaging', 'Logistics'].map((dept, index) => {
                    const deptStages = mockJob.stages.filter(s => s.department === dept);
                    const completed = deptStages.filter(s => s.status === 'completed').length;
                    const total = deptStages.length;
                    const progress = total > 0 ? (completed / total) * 100 : 0;
                    
                    return (
                      <div key={dept} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">{dept}</span>
                          <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100/50">
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-indigo-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    View Job Details
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Update Progress
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Share className="w-4 h-4 mr-2" />
                    Share Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobLifecycleTracker;

