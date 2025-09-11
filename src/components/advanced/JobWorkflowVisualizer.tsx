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
  HardDrive
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WorkflowStage {
  id: string;
  name: string;
  department: string;
  icon: React.ComponentType<any>;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'skipped';
  progress: number;
  startDate?: string;
  endDate?: string;
  assignedTo?: string;
  estimatedDuration?: string;
  actualDuration?: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
  position: { x: number; y: number };
  connections: string[];
}

interface JobWorkflowVisualizerProps {
  stages: WorkflowStage[];
  onStageClick?: (stageId: string) => void;
  onStageUpdate?: (stageId: string, updates: Partial<WorkflowStage>) => void;
}

const JobWorkflowVisualizer: React.FC<JobWorkflowVisualizerProps> = ({
  stages,
  onStageClick,
  onStageUpdate
}) => {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'flow' | 'timeline' | 'kanban'>('flow');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'pending': return 'bg-gray-400';
      case 'blocked': return 'bg-red-500';
      case 'skipped': return 'bg-yellow-500';
      default: return 'bg-gray-400';
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleStageClick = (stageId: string) => {
    setSelectedStage(selectedStage === stageId ? null : stageId);
    onStageClick?.(stageId);
  };

  const renderFlowView = () => (
    <div className="relative min-h-[600px] bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-lg p-8 overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3b82f6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Stage Nodes */}
      {stages.map((stage, index) => (
        <motion.div
          key={stage.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="absolute"
          style={{
            left: `${stage.position.x}%`,
            top: `${stage.position.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <Card 
            className={`w-48 cursor-pointer transition-all duration-300 hover:scale-105 ${
              selectedStage === stage.id ? 'ring-2 ring-blue-500 shadow-xl' : 'hover:shadow-lg'
            }`}
            onClick={() => handleStageClick(stage.id)}
          >
            <CardContent className="p-4">
              <div className="text-center space-y-3">
                <div className="flex justify-center">
                  <div className={`p-3 rounded-full ${getStatusColor(stage.status)} text-white`}>
                    <stage.icon className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{stage.name}</h3>
                  <p className="text-xs text-gray-600">{stage.department}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-center">
                    {getStatusIcon(stage.status)}
                  </div>
                  <Progress value={stage.progress} className="h-2" />
                  <p className="text-xs text-gray-600">{stage.progress}%</p>
                </div>
                {stage.assignedTo && (
                  <p className="text-xs text-gray-500">Assigned to: {stage.assignedTo}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Connections */}
      <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
        {stages.map((stage) =>
          stage.connections.map((connectionId) => {
            const targetStage = stages.find(s => s.id === connectionId);
            if (!targetStage) return null;

            const startX = stage.position.x;
            const startY = stage.position.y;
            const endX = targetStage.position.x;
            const endY = targetStage.position.y;

            return (
              <motion.line
                key={`${stage.id}-${connectionId}`}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                x1={`${startX}%`}
                y1={`${startY}%`}
                x2={`${endX}%`}
                y2={`${endY}%`}
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="5,5"
                className="opacity-60"
              />
            );
          })
        )}
      </svg>
    </div>
  );

  const renderTimelineView = () => (
    <div className="space-y-4">
      {stages.map((stage, index) => (
        <motion.div
          key={stage.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-full ${getStatusColor(stage.status)} text-white`}>
                    <stage.icon className="w-6 h-6" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                      <p className="text-sm text-gray-600">{stage.department}</p>
                      {stage.assignedTo && (
                        <p className="text-xs text-gray-500">Assigned to: {stage.assignedTo}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{stage.progress}%</div>
                        <Progress value={stage.progress} className="w-24 h-2" />
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <Badge className={`${getPriorityColor(stage.priority)} text-xs`}>
                          {stage.priority}
                        </Badge>
                        <Badge className={`${getStatusColor(stage.status)} text-white text-xs`}>
                          {getStatusIcon(stage.status)}
                          <span className="ml-1">{stage.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    {stage.startDate && (
                      <div>
                        <span className="text-gray-600">Start:</span>
                        <span className="ml-2 text-gray-900">{stage.startDate}</span>
                      </div>
                    )}
                    {stage.endDate && (
                      <div>
                        <span className="text-gray-600">End:</span>
                        <span className="ml-2 text-gray-900">{stage.endDate}</span>
                      </div>
                    )}
                    {stage.estimatedDuration && (
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <span className="ml-2 text-gray-900">{stage.estimatedDuration}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );

  const renderKanbanView = () => {
    const statusColumns = [
      { id: 'pending', title: 'Pending', color: 'bg-gray-100' },
      { id: 'in_progress', title: 'In Progress', color: 'bg-blue-100' },
      { id: 'completed', title: 'Completed', color: 'bg-green-100' },
      { id: 'blocked', title: 'Blocked', color: 'bg-red-100' }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusColumns.map((column) => {
          const columnStages = stages.filter(stage => stage.status === column.id);
          
          return (
            <div key={column.id} className="space-y-4">
              <div className={`p-3 rounded-lg ${column.color}`}>
                <h3 className="font-semibold text-gray-900">{column.title}</h3>
                <p className="text-sm text-gray-600">{columnStages.length} stages</p>
              </div>
              <div className="space-y-3">
                {columnStages.map((stage) => (
                  <motion.div
                    key={stage.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card 
                      className="cursor-pointer hover:shadow-lg transition-all duration-200"
                      onClick={() => handleStageClick(stage.id)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <stage.icon className="w-4 h-4 text-gray-600" />
                            <h4 className="font-medium text-gray-900 text-sm">{stage.name}</h4>
                          </div>
                          <p className="text-xs text-gray-600">{stage.department}</p>
                          <Progress value={stage.progress} className="h-2" />
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">{stage.progress}%</span>
                            <Badge className={`${getPriorityColor(stage.priority)} text-xs`}>
                              {stage.priority}
                            </Badge>
                          </div>
                          {stage.assignedTo && (
                            <p className="text-xs text-gray-500">Assigned to: {stage.assignedTo}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex justify-center">
        <div className="flex border border-gray-200 rounded-lg bg-white/80 backdrop-blur-sm">
          <Button
            variant={viewMode === 'flow' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('flow')}
            className="rounded-r-none"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Flow
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('timeline')}
            className="rounded-none"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Timeline
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('kanban')}
            className="rounded-l-none"
          >
            <Layers className="w-4 h-4 mr-2" />
            Kanban
          </Button>
        </div>
      </div>

      {/* Workflow Visualization */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100/50">
          <CardTitle className="flex items-center">
            <Factory className="w-5 h-5 mr-2 text-indigo-600" />
            Job Workflow Visualization
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            {viewMode === 'flow' && (
              <motion.div
                key="flow"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {renderFlowView()}
              </motion.div>
            )}
            {viewMode === 'timeline' && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {renderTimelineView()}
              </motion.div>
            )}
            {viewMode === 'kanban' && (
              <motion.div
                key="kanban"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {renderKanbanView()}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Stage Details Panel */}
      <AnimatePresence>
        {selectedStage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100/50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Factory className="w-5 h-5 mr-2 text-emerald-600" />
                    Stage Details
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedStage(null)}>
                    Close
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {(() => {
                  const stage = stages.find(s => s.id === selectedStage);
                  if (!stage) return null;

                  return (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">{stage.name}</h3>
                            <p className="text-gray-600">{stage.department}</p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Status:</span>
                              <Badge className={`${getStatusColor(stage.status)} text-white`}>
                                {getStatusIcon(stage.status)}
                                <span className="ml-1">{stage.status.replace('_', ' ')}</span>
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Priority:</span>
                              <Badge className={`${getPriorityColor(stage.priority)}`}>
                                {stage.priority}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Progress:</span>
                              <span className="text-gray-900">{stage.progress}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            {stage.startDate && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Start Date:</span>
                                <span className="text-gray-900">{stage.startDate}</span>
                              </div>
                            )}
                            {stage.endDate && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">End Date:</span>
                                <span className="text-gray-900">{stage.endDate}</span>
                              </div>
                            )}
                            {stage.estimatedDuration && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Estimated Duration:</span>
                                <span className="text-gray-900">{stage.estimatedDuration}</span>
                              </div>
                            )}
                            {stage.actualDuration && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Actual Duration:</span>
                                <span className="text-gray-900">{stage.actualDuration}</span>
                              </div>
                            )}
                          </div>
                          {stage.assignedTo && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Assigned To:</span>
                              <span className="text-gray-900">{stage.assignedTo}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Progress value={stage.progress} className="h-3" />
                      {stage.notes && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                          <p className="text-gray-600">{stage.notes}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JobWorkflowVisualizer;

