import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { getApiUrl } from '@/utils/apiConfig';

interface ProductionMetricsProps {
  assignmentId: number;
}

export const ProductionMetrics: React.FC<ProductionMetricsProps> = ({ assignmentId }) => {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const apiUrl = getApiUrl();
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    loadMetrics();
  }, [assignmentId, dateRange]);

  const loadMetrics = async () => {
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
        setMetrics(data.metrics || []);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = metrics.map(m => ({
    date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sheets: m.total_sheets_completed || 0,
    efficiency: parseFloat(m.efficiency_percentage || 0),
    downtime: Math.round((m.total_downtime_minutes || 0) / 60)
  }));

  const avgEfficiency = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + parseFloat(m.efficiency_percentage || 0), 0) / metrics.length
    : 0;

  const trend = metrics.length >= 2
    ? metrics[metrics.length - 1].efficiency_percentage - metrics[0].efficiency_percentage
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Production Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading metrics...</div>
        ) : metrics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No metrics data available</div>
        ) : (
          <div className="space-y-6">
            {/* Efficiency Summary */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-600">Average Efficiency</div>
                <div className="text-3xl font-bold text-gray-900">{avgEfficiency.toFixed(1)}%</div>
              </div>
              <div className="flex items-center gap-2">
                {trend >= 0 ? (
                  <>
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-medium">+{trend.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    <span className="text-red-600 font-medium">{trend.toFixed(1)}%</span>
                  </>
                )}
              </div>
            </div>

            {/* Charts */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Sheets Completed Over Time</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sheets" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Efficiency Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="efficiency" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Downtime Analysis</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="downtime" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};



