import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AssistantPerformanceTableProps {
  assistants: any[];
  seniorName: string;
}

export const AssistantPerformanceTable: React.FC<AssistantPerformanceTableProps> = ({ assistants, seniorName }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assistant Performance - {seniorName}</CardTitle>
      </CardHeader>
      <CardContent>
        {assistants.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No assistants found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Jobs</TableHead>
                <TableHead>Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assistants.map((assistant) => (
                <TableRow key={assistant.id}>
                  <TableCell>{assistant.name || 'N/A'}</TableCell>
                  <TableCell>{assistant.email || 'N/A'}</TableCell>
                  <TableCell>{assistant.totalJobs || 0}</TableCell>
                  <TableCell>{assistant.completedJobs || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

