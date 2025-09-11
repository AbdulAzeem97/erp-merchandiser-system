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
  Flag,
  Truck,
  Box,
  Wrench,
  Hammer,
  Paintbrush,
  Cut,
  Image as ImageIcon,
  FileImage,
  Monitor,
  Cpu,
  HardDrive,
  Search,
  Filter,
  SortAsc,
  Grid,
  List,
  Plus,
  RefreshCw,
  Home,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import JobDashboard from '../advanced/JobDashboard';
import JobLifecycleTracker from '../advanced/JobLifecycleTracker';
import JobWorkflowVisualizer from '../advanced/JobWorkflowVisualizer';
import JobStageCard from '../advanced/JobStageCard';

interface JobManagementModuleProps {
  onBack?: () => void;
}

const JobManagementModule: React.FC<JobManagementModuleProps> = ({ onBack }) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'lifecycle' | 'workflow' | 'stages'>('dashboard');
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // Mock workflow stages data
  const mockWorkflowStages = [
    {
      id: 'punch',
      name: 'Job Punching',
      department: 'Merchandising',
      icon: FileText,
      status: 'completed' as const,
      progress: 100,
      startDate: '2024-01-15',
      endDate: '2024-01-15',
      assignedTo: 'Abdullah Khan',
      estimatedDuration: '1 day',
      actualDuration: '1 day',
      priority: 'high' as const,
      dependencies: [],
      position: { x: 10, y: 50 },
      connections: ['prepress']
    },
    {
      id: 'prepress',
      name: 'Prepress Design',
      department: 'Prepress',
      icon: Monitor,
      status: 'completed' as const,
      progress: 100,
      startDate: '2024-01-16',
      endDate: '2024-01-17',
      assignedTo: 'Emma Wilson',
      estimatedDuration: '2 days',
      actualDuration: '2 days',
      priority: 'high' as const,
      dependencies: ['punch'],
      position: { x: 25, y: 50 },
      connections: ['die']
    },
    {
      id: 'die',
      name: 'Die Making',
      department: 'Die Department',
      icon: Wrench,
      status: 'completed' as const,
      progress: 100,
      startDate: '2024-01-18',
      endDate: '2024-01-19',
      assignedTo: 'Die Specialist',
      estimatedDuration: '2 days',
      actualDuration: '2 days',
      priority: 'high' as const,
      dependencies: ['prepress'],
      position: { x: 40, y: 50 },
      connections: ['plate']
    },
    {
      id: 'plate',
      name: 'Plate Making',
      department: 'Plate Department',
      icon: Cpu,
      status: 'completed' as const,
      progress: 100,
      startDate: '2024-01-20',
      endDate: '2024-01-20',
      assignedTo: 'Plate Specialist',
      estimatedDuration: '1 day',
      actualDuration: '1 day',
      priority: 'high' as const,
      dependencies: ['die'],
      position: { x: 55, y: 50 },
      connections: ['production']
    },
    {
      id: 'production',
      name: 'Production Start',
      department: 'Production',
      icon: Factory,
      status: 'in_progress' as const,
      progress: 75,
      startDate: '2024-01-21',
      assignedTo: 'Production Manager',
      estimatedDuration: '3 days',
      priority: 'high' as const,
      dependencies: ['plate'],
      position: { x: 70, y: 50 },
      connections: ['cutting']
    },
    {
      id: 'cutting',
      name: 'Cutting',
      department: 'Cutting',
      icon: Scissors,
      status: 'in_progress' as const,
      progress: 60,
      startDate: '2024-01-22',
      assignedTo: 'Cutting Team',
      estimatedDuration: '1 day',
      priority: 'medium' as const,
      dependencies: ['production'],
      position: { x: 85, y: 50 },
      connections: ['printing']
    },
    {
      id: 'printing',
      name: 'Printing',
      department: 'Printing',
      icon: Printer,
      status: 'pending' as const,
      progress: 0,
      estimatedDuration: '2 days',
      priority: 'high' as const,
      dependencies: ['cutting'],
      position: { x: 70, y: 30 },
      connections: ['varnishing']
    },
    {
      id: 'varnishing',
      name: 'Varnishing',
      department: 'Finishing',
      icon: Paintbrush,
      status: 'pending' as const,
      progress: 0,
      estimatedDuration: '1 day',
      priority: 'medium' as const,
      dependencies: ['printing'],
      position: { x: 55, y: 30 },
      connections: ['embossing']
    },
    {
      id: 'embossing',
      name: 'Embossing',
      department: 'Finishing',
      icon: Hammer,
      status: 'pending' as const,
      progress: 0,
      estimatedDuration: '1 day',
      priority: 'medium' as const,
      dependencies: ['varnishing'],
      position: { x: 40, y: 30 },
      connections: ['finishing']
    },
    {
      id: 'finishing',
      name: 'Final Finishing',
      department: 'Finishing',
      icon: Layers,
      status: 'pending' as const,
      progress: 0,
      estimatedDuration: '1 day',
      priority: 'medium' as const,
      dependencies: ['embossing'],
      position: { x: 25, y: 30 },
      connections: ['packaging']
    },
    {
      id: 'packaging',
      name: 'Packaging',
      department: 'Packaging',
      icon: Box,
      status: 'pending' as const,
      progress: 0,
      estimatedDuration: '1 day',
      priority: 'low' as const,
      dependencies: ['finishing'],
      position: { x: 10, y: 30 },
      connections: ['delivery']
    },
    {
      id: 'delivery',
      name: 'Delivery',
      department: 'Logistics',
      icon: Truck,
      status: 'pending' as const,
      progress: 0,
      estimatedDuration: '1 day',
      priority: 'high' as const,
      dependencies: ['packaging'],
      position: { x: 10, y: 10 },
      connections: []
    }
  ];

  const handleStageUpdate = (stageId: string, updates: any) => {
    console.log('Stage update:', stageId, updates);
    // Implement stage update logic
  };

  const handleStageClick = (stageId: string) => {
    console.log('Stage clicked:', stageId);
    // Implement stage click logic
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <JobDashboard />;
      case 'lifecycle':
        return <JobLifecycleTracker />;
      case 'workflow':
        return (
          <JobWorkflowVisualizer
            stages={mockWorkflowStages}
            onStageClick={handleStageClick}
            onStageUpdate={handleStageUpdate}
          />
        );
      case 'stages':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mockWorkflowStages.map((stage) => (
                <JobStageCard
                  key={stage.id}
                  stage={stage}
                  onUpdate={handleStageUpdate}
                  expanded={false}
                />
              ))}
            </div>
          </div>
        );
      default:
        return <JobDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {onBack && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBack}
                  className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:border-blue-300 transition-all duration-200"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              )}
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  Job Management
                </h1>
                <p className="text-gray-600 mt-2 text-sm sm:text-base">
                  Complete job lifecycle management across all departments
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <Button variant="outline" className="bg-white/80 backdrop-blur-sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">New Job</span>
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as any)}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="dashboard" className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </TabsTrigger>
                  <TabsTrigger value="lifecycle" className="flex items-center space-x-2">
                    <Factory className="w-4 h-4" />
                    <span className="hidden sm:inline">Lifecycle</span>
                  </TabsTrigger>
                  <TabsTrigger value="workflow" className="flex items-center space-x-2">
                    <Layers className="w-4 h-4" />
                    <span className="hidden sm:inline">Workflow</span>
                  </TabsTrigger>
                  <TabsTrigger value="stages" className="flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Stages</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {renderCurrentView()}
        </motion.div>
      </div>
    </div>
  );
};

export default JobManagementModule;

