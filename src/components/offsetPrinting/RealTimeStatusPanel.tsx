import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSocket } from '@/services/socketService.tsx';
import { Radio, Activity, Users, Printer, TrendingUp } from 'lucide-react';
import { getApiUrl } from '@/utils/apiConfig';

interface RealTimeStatusPanelProps {
  assignmentId?: number;
}

export const RealTimeStatusPanel: React.FC<RealTimeStatusPanelProps> = ({ assignmentId }) => {
  const { socket, isConnected } = useSocket();
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const apiUrl = getApiUrl();
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    loadDashboardMetrics();
    const interval = setInterval(loadDashboardMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (socket && isConnected) {
      socket.on('offset_printing:progress_updated', (data) => {
        console.log('🔄 Real-time progress update:', data);
        loadDashboardMetrics();
      });

      socket.on('offset_printing:plate_completed', (data) => {
        console.log('✅ Plate completed:', data);
        loadDashboardMetrics();
      });

      socket.on('offset_printing:metrics_updated', (data) => {
        console.log('📊 Metrics updated:', data);
        loadDashboardMetrics();
      });

      return () => {
        socket.off('offset_printing:progress_updated');
        socket.off('offset_printing:plate_completed');
        socket.off('offset_printing:metrics_updated');
      };
    }
  }, [socket, isConnected]);

  const loadDashboardMetrics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/api/offset-printing/dashboard-metrics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Error loading dashboard metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            Real-Time Status
          </CardTitle>
          <Badge className={isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : dashboardMetrics ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Activity className="h-4 w-4" />
                <span className="text-sm font-medium">Active Jobs</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">{dashboardMetrics.activeAssignments || 0}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <Printer className="h-4 w-4" />
                <span className="text-sm font-medium">Today's Sheets</span>
              </div>
              <div className="text-2xl font-bold text-green-900">{dashboardMetrics.todaySheets || 0}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <Printer className="h-4 w-4" />
                <span className="text-sm font-medium">Today's Plates</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">{dashboardMetrics.todayPlates || 0}</div>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Avg Efficiency</span>
              </div>
              <div className="text-2xl font-bold text-indigo-900">{dashboardMetrics.avgEfficiency?.toFixed(1) || 0}%</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No data available</div>
        )}
      </CardContent>
    </Card>
  );
};

