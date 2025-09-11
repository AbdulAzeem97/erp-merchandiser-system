import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Palette, Crown, Users, Zap, Activity, BarChart3, Layers, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ModernHODPrepressDashboard from '@/components/prepress/ModernHODPrepressDashboard';
import ModernDesignerWorkbench from '@/components/prepress/ModernDesignerWorkbench';

const PrepressDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/50">
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
              className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:border-purple-300 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-pink-900 bg-clip-text text-transparent">
                Modern Prepress System Demo
              </h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                Complete prepress management with real-time updates and modern UI patterns
              </p>
            </div>
          </div>

          {/* Quick Access Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm cursor-pointer" onClick={() => setActiveTab('hod')}>
              <CardContent className="p-6 text-center">
                <Crown className="w-8 h-8 mx-auto mb-3 text-purple-600 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-gray-900">HOD Dashboard</h3>
                <p className="text-sm text-gray-600 mt-1">Complete management overview</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm cursor-pointer" onClick={() => setActiveTab('designer')}>
              <CardContent className="p-6 text-center">
                <Palette className="w-8 h-8 mx-auto mb-3 text-blue-600 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-gray-900">Designer Workbench</h3>
                <p className="text-sm text-gray-600 mt-1">Creative workspace</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm cursor-pointer" onClick={() => setActiveTab('features')}>
              <CardContent className="p-6 text-center">
                <Zap className="w-8 h-8 mx-auto mb-3 text-yellow-600 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-gray-900">Features</h3>
                <p className="text-sm text-gray-600 mt-1">Real-time capabilities</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm cursor-pointer" onClick={() => setActiveTab('workflow')}>
              <CardContent className="p-6 text-center">
                <Activity className="w-8 h-8 mx-auto mb-3 text-green-600 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-gray-900">Workflow</h3>
                <p className="text-sm text-gray-600 mt-1">Job lifecycle management</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Main Content */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="overview" className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Overview</span>
                </TabsTrigger>
                <TabsTrigger value="hod" className="flex items-center space-x-2">
                  <Crown className="w-4 h-4" />
                  <span>HOD Dashboard</span>
                </TabsTrigger>
                <TabsTrigger value="designer" className="flex items-center space-x-2">
                  <Palette className="w-4 h-4" />
                  <span>Designer</span>
                </TabsTrigger>
                <TabsTrigger value="features" className="flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Features</span>
                </TabsTrigger>
                <TabsTrigger value="workflow" className="flex items-center space-x-2">
                  <Activity className="w-4 h-4" />
                  <span>Workflow</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="text-center py-12">
                  <div className="h-20 w-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                    <Palette className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Modern Prepress Management System</h2>
                  <p className="text-gray-600 mb-8 max-w-3xl mx-auto text-lg">
                    A comprehensive prepress management system that provides real-time job tracking, 
                    designer coordination, and modern UI patterns for efficient workflow management.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                      <Crown className="h-8 w-8 text-purple-600 mb-3" />
                      <h3 className="font-semibold text-purple-900 mb-2">HOD Management</h3>
                      <p className="text-sm text-purple-700">Complete oversight with analytics, team management, and job assignment</p>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                      <Palette className="h-8 w-8 text-blue-600 mb-3" />
                      <h3 className="font-semibold text-blue-900 mb-2">Designer Workbench</h3>
                      <p className="text-sm text-blue-700">Creative workspace with real-time updates and task management</p>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                      <Activity className="h-8 w-8 text-green-600 mb-3" />
                      <h3 className="font-semibold text-green-900 mb-2">Real-time Updates</h3>
                      <p className="text-sm text-green-700">Live status updates, notifications, and collaborative features</p>
                    </div>
                  </div>

                  <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <h3 className="font-semibold text-gray-900 mb-3">Key Features</h3>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          Real-time job status updates
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          Modern glass morphism UI
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                          Interactive Kanban boards
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                          Designer productivity tracking
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                          Comprehensive analytics
                        </li>
                      </ul>
                    </div>
                    <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <h3 className="font-semibold text-gray-900 mb-3">Workflow Stages</h3>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                          Job Assignment
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          Work Started
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                          In Progress
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                          HOD Review
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          Completed
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="hod">
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <h3 className="font-semibold text-purple-900 mb-2">HOD Prepress Dashboard</h3>
                    <p className="text-sm text-purple-700">
                      Complete management interface with analytics, team oversight, and job coordination
                    </p>
                  </div>
                  <ModernHODPrepressDashboard />
                </div>
              </TabsContent>

              <TabsContent value="designer">
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2">Designer Workbench</h3>
                    <p className="text-sm text-blue-700">
                      Creative workspace with real-time job updates and task management
                    </p>
                  </div>
                  <ModernDesignerWorkbench />
                </div>
              </TabsContent>

              <TabsContent value="features" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-900">
                        <Zap className="h-5 w-5" />
                        Real-time Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                          <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                          <div>
                            <h4 className="font-medium text-gray-900">Live Status Updates</h4>
                            <p className="text-sm text-gray-600">Instant notifications when job status changes</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                          <div>
                            <h4 className="font-medium text-gray-900">Socket.io Integration</h4>
                            <p className="text-sm text-gray-600">Real-time communication between all users</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="h-2 w-2 bg-purple-500 rounded-full mt-2"></div>
                          <div>
                            <h4 className="font-medium text-gray-900">Auto-refresh</h4>
                            <p className="text-sm text-gray-600">Automatic data updates without page refresh</p>
                          </div>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-purple-900">
                        <Layers className="h-5 w-5" />
                        Modern UI Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                          <div className="h-2 w-2 bg-purple-500 rounded-full mt-2"></div>
                          <div>
                            <h4 className="font-medium text-gray-900">Glass Morphism</h4>
                            <p className="text-sm text-gray-600">Modern backdrop blur effects</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="h-2 w-2 bg-pink-500 rounded-full mt-2"></div>
                          <div>
                            <h4 className="font-medium text-gray-900">Smooth Animations</h4>
                            <p className="text-sm text-gray-600">Framer Motion powered transitions</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="h-2 w-2 bg-indigo-500 rounded-full mt-2"></div>
                          <div>
                            <h4 className="font-medium text-gray-900">Responsive Design</h4>
                            <p className="text-sm text-gray-600">Works perfectly on all devices</p>
                          </div>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-900">
                        <Activity className="h-5 w-5" />
                        Job Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                          <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                          <div>
                            <h4 className="font-medium text-gray-900">Kanban Boards</h4>
                            <p className="text-sm text-gray-600">Visual job status tracking</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="h-2 w-2 bg-emerald-500 rounded-full mt-2"></div>
                          <div>
                            <h4 className="font-medium text-gray-900">Priority Management</h4>
                            <p className="text-sm text-gray-600">Color-coded priority system</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="h-2 w-2 bg-teal-500 rounded-full mt-2"></div>
                          <div>
                            <h4 className="font-medium text-gray-900">Activity History</h4>
                            <p className="text-sm text-gray-600">Complete audit trail</p>
                          </div>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-br from-yellow-50 to-yellow-100">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-yellow-900">
                        <BarChart3 className="h-5 w-5" />
                        Analytics & Reports
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                          <div className="h-2 w-2 bg-yellow-500 rounded-full mt-2"></div>
                          <div>
                            <h4 className="font-medium text-gray-900">Productivity Charts</h4>
                            <p className="text-sm text-gray-600">Visual performance metrics</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="h-2 w-2 bg-orange-500 rounded-full mt-2"></div>
                          <div>
                            <h4 className="font-medium text-gray-900">Team Performance</h4>
                            <p className="text-sm text-gray-600">Designer productivity tracking</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="h-2 w-2 bg-red-500 rounded-full mt-2"></div>
                          <div>
                            <h4 className="font-medium text-gray-900">Status Distribution</h4>
                            <p className="text-sm text-gray-600">Job status analytics</p>
                          </div>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="workflow" className="space-y-6">
                <div className="text-center py-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Prepress Job Workflow</h3>
                  <p className="text-gray-600 mb-8">Complete job lifecycle from assignment to completion</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                      <div className="h-8 w-8 bg-gray-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <span className="text-white text-sm font-bold">1</span>
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm">Job Created</h4>
                      <p className="text-xs text-gray-600 mt-1">Merchandiser creates job</p>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                      <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <span className="text-white text-sm font-bold">2</span>
                      </div>
                      <h4 className="font-semibold text-blue-900 text-sm">HOD Assignment</h4>
                      <p className="text-xs text-blue-700 mt-1">HOD assigns to designer</p>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
                      <div className="h-8 w-8 bg-yellow-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <span className="text-white text-sm font-bold">3</span>
                      </div>
                      <h4 className="font-semibold text-yellow-900 text-sm">Work Started</h4>
                      <p className="text-xs text-yellow-700 mt-1">Designer begins work</p>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                      <div className="h-8 w-8 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <span className="text-white text-sm font-bold">4</span>
                      </div>
                      <h4 className="font-semibold text-purple-900 text-sm">HOD Review</h4>
                      <p className="text-xs text-purple-700 mt-1">Submitted for review</p>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                      <div className="h-8 w-8 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <span className="text-white text-sm font-bold">5</span>
                      </div>
                      <h4 className="font-semibold text-green-900 text-sm">Completed</h4>
                      <p className="text-xs text-green-700 mt-1">Job finished</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrepressDemo;

