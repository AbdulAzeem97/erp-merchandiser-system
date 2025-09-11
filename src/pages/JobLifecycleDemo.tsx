import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Factory, BarChart3, Layers, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import JobDashboard from '@/components/advanced/JobDashboard';
import JobLifecycleTracker from '@/components/advanced/JobLifecycleTracker';
import JobWorkflowVisualizer from '@/components/advanced/JobWorkflowVisualizer';
import JobStageCard from '@/components/advanced/JobStageCard';

const JobLifecycleDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock workflow stages data for demo
  const mockWorkflowStages = [
    {
      id: 'punch',
      name: 'Job Punching',
      department: 'Merchandising',
      icon: Factory,
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
      icon: Factory,
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
      dependencies: ['prepress'],
      position: { x: 70, y: 50 },
      connections: ['cutting']
    }
  ];

  const mockStageData = {
    id: 'production',
    name: 'Production Start',
    department: 'Production',
    status: 'in_progress' as const,
    progress: 75,
    startDate: '2024-01-21',
    assignedTo: 'Production Manager',
    estimatedDuration: '3 days',
    priority: 'high' as const,
    dependencies: ['prepress'],
    milestones: [
      { id: '1', name: 'Setup Equipment', completed: true, completedAt: '2024-01-21' },
      { id: '2', name: 'Load Materials', completed: true, completedAt: '2024-01-21' },
      { id: '3', name: 'Start Production', completed: false }
    ],
    metrics: {
      efficiency: 85,
      quality: 92,
      onTimeDelivery: true
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
          <div className="flex items-center space-x-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
              className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:border-blue-300 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Job Lifecycle System Demo
              </h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                Complete job management system with modern UI patterns
              </p>
            </div>
          </div>

          {/* Quick Access Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <CardContent className="p-6 text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-3 text-blue-600 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-gray-900">Job Dashboard</h3>
                <p className="text-sm text-gray-600 mt-1">Multi-job overview with filtering</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm cursor-pointer" onClick={() => setActiveTab('lifecycle')}>
              <CardContent className="p-6 text-center">
                <Factory className="w-8 h-8 mx-auto mb-3 text-emerald-600 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-gray-900">Job Lifecycle</h3>
                <p className="text-sm text-gray-600 mt-1">Detailed job tracking</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm cursor-pointer" onClick={() => setActiveTab('workflow')}>
              <CardContent className="p-6 text-center">
                <Layers className="w-8 h-8 mx-auto mb-3 text-purple-600 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-gray-900">Workflow Visualizer</h3>
                <p className="text-sm text-gray-600 mt-1">Interactive flow diagrams</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm cursor-pointer" onClick={() => setActiveTab('stages')}>
              <CardContent className="p-6 text-center">
                <Settings className="w-8 h-8 mx-auto mb-3 text-orange-600 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-gray-900">Stage Management</h3>
                <p className="text-sm text-gray-600 mt-1">Individual stage details</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Main Content */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="overview" className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Overview</span>
                </TabsTrigger>
                <TabsTrigger value="dashboard" className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Dashboard</span>
                </TabsTrigger>
                <TabsTrigger value="lifecycle" className="flex items-center space-x-2">
                  <Factory className="w-4 h-4" />
                  <span>Lifecycle</span>
                </TabsTrigger>
                <TabsTrigger value="workflow" className="flex items-center space-x-2">
                  <Layers className="w-4 h-4" />
                  <span>Workflow</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="text-center py-12">
                  <Factory className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Lifecycle Management System</h2>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    A comprehensive job management system that tracks the complete lifecycle of production jobs 
                    from initial punching through final delivery across all departments.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    <div className="p-6 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-2">12 Production Stages</h3>
                      <p className="text-sm text-blue-700">Complete tracking from punching to delivery</p>
                    </div>
                    <div className="p-6 bg-emerald-50 rounded-lg">
                      <h3 className="font-semibold text-emerald-900 mb-2">Real-time Progress</h3>
                      <p className="text-sm text-emerald-700">Live updates and status tracking</p>
                    </div>
                    <div className="p-6 bg-purple-50 rounded-lg">
                      <h3 className="font-semibold text-purple-900 mb-2">Modern UI</h3>
                      <p className="text-sm text-purple-700">Professional and responsive design</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="dashboard">
                <JobDashboard />
              </TabsContent>

              <TabsContent value="lifecycle">
                <JobLifecycleTracker />
              </TabsContent>

              <TabsContent value="workflow">
                <JobWorkflowVisualizer
                  stages={mockWorkflowStages}
                  onStageClick={(stageId) => console.log('Stage clicked:', stageId)}
                  onStageUpdate={(stageId, updates) => console.log('Stage update:', stageId, updates)}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JobLifecycleDemo;

