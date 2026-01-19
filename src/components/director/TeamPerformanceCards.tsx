import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface TeamPerformanceCardsProps {
  senior: {
    id: number;
    name: string;
    email: string;
    assistantCount: number;
  };
  members: any[];
  totals: {
    totalJobs: number;
    completedJobs: number;
    pendingJobs: number;
    inProgressJobs: number;
    overdueJobs: number;
    completionRate: number;
  };
}

export const TeamPerformanceCards: React.FC<TeamPerformanceCardsProps> = ({ senior, members, totals }) => {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">{senior.name}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Jobs</p>
            <p className="text-2xl font-bold">{totals.totalJobs}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">{totals.completedJobs}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Completion Rate</p>
            <p className="text-2xl font-bold">{totals.completionRate.toFixed(1)}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

