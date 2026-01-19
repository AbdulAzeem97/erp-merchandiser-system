import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, TrendingUp, Package, Clock } from 'lucide-react';
import { getApiUrl } from '@/utils/apiConfig';

interface DailyProgress {
  date: string;
  total_sheets_completed: number;
  total_plates_completed: number;
  total_plates_in_progress: number;
  total_downtime_minutes: number;
  efficiency_percentage: number;
  operator_name?: string;
}

interface DailyProgressViewProps {
  assignmentId: number;
  startDate?: string;
  endDate?: string;
}

export const DailyProgressView: React.FC<DailyProgressViewProps> = ({
  assignmentId,
  startDate,
  endDate
}) => {
  const [progress, setProgress] = useState<DailyProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: endDate || new Date().toISOString().split('T')[0]
  });

  const apiUrl = getApiUrl();
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    loadProgress();
  }, [assignmentId, dateRange]);

  const loadProgress = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${apiUrl}/api/offset-printing/metrics/${assignmentId}?startDate=${dateRange.start}&endDate=${dateRange.end}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProgress(data.metrics || []);
      }
    } catch (error) {
      console.error('Error loading daily progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalSheets = progress.reduce((sum, p) => sum + (p.total_sheets_completed || 0), 0);
  const totalPlates = progress.reduce((sum, p) => sum + (p.total_plates_completed || 0), 0);
  const avgEfficiency = progress.length > 0
    ? progress.reduce((sum, p) => sum + (p.efficiency_percentage || 0), 0) / progress.length
    : 0;
  const totalDowntime = progress.reduce((sum, p) => sum + (p.total_downtime_minutes || 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Progress Summary
          </CardTitle>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-40"
            />
            <span className="text-gray-500">to</span>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-40"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Package className="h-4 w-4" />
                  <span className="text-sm font-medium">Total Sheets</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">{totalSheets.toLocaleString()}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <Package className="h-4 w-4" />
                  <span className="text-sm font-medium">Plates Completed</span>
                </div>
                <div className="text-2xl font-bold text-green-900">{totalPlates}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-purple-600 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">Avg Efficiency</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">{avgEfficiency.toFixed(1)}%</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-orange-600 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Downtime</span>
                </div>
                <div className="text-2xl font-bold text-orange-900">{Math.round(totalDowntime / 60)}h</div>
              </div>
            </div>

            {/* Daily Timeline */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800">Daily Breakdown</h3>
              {progress.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No progress data for selected period</div>
              ) : (
                progress.map((day) => (
                  <div key={day.date} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{new Date(day.date).toLocaleDateString()}</div>
                      <Badge className={day.efficiency_percentage >= 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {day.efficiency_percentage.toFixed(1)}% Efficiency
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Sheets:</span>
                        <span className="font-medium ml-2">{day.total_sheets_completed}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Plates:</span>
                        <span className="font-medium ml-2">{day.total_plates_completed} completed</span>
                      </div>
                      <div>
                        <span className="text-gray-600">In Progress:</span>
                        <span className="font-medium ml-2">{day.total_plates_in_progress}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Downtime:</span>
                        <span className="font-medium ml-2">{Math.round(day.total_downtime_minutes / 60)}h</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};



