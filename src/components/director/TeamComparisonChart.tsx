import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TeamComparisonChartProps {
  data: any[];
  timeframe: string;
}

export const TeamComparisonChart: React.FC<TeamComparisonChartProps> = ({ data, timeframe }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          Team comparison chart will be displayed here
        </div>
      </CardContent>
    </Card>
  );
};

