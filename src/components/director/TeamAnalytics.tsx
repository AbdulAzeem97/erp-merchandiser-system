import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, TrendingUp, Users, BarChart3 } from 'lucide-react';
import { directorAPI } from '@/services/api';
import { useSocket } from '@/services/socketService.tsx';
import { TeamPerformanceCards } from './TeamPerformanceCards';
import { TeamComparisonChart } from './TeamComparisonChart';
import { AssistantPerformanceTable } from './AssistantPerformanceTable';
import { useTheme } from '@/contexts/ThemeContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TeamData {
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

export const TeamAnalytics: React.FC = () => {
  const { colors } = useTheme();
  const { socket, isConnected } = useSocket();
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month');
  const [teamPerformance, setTeamPerformance] = useState<any>(null);
  const [teamComparison, setTeamComparison] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      const [performanceData, comparisonData] = await Promise.all([
        directorAPI.getTeamPerformance(timeframe),
        directorAPI.getTeamComparison(timeframe)
      ]);

      if (performanceData.success) {
        setTeamPerformance(performanceData.data);
      }
      if (comparisonData.success) {
        setTeamComparison(comparisonData.data);
      }
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamData();
  }, [timeframe]);

  // Real-time updates via Socket.io
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleJobCreated = () => {
      loadTeamData();
    };

    const handleJobCompleted = () => {
      loadTeamData();
    };

    const handleTeamPerformanceUpdated = () => {
      loadTeamData();
    };

    socket.on('job:created', handleJobCreated);
    socket.on('job:completed', handleJobCompleted);
    socket.on('team:performance_updated', handleTeamPerformanceUpdated);

    return () => {
      socket.off('job:created', handleJobCreated);
      socket.off('job:completed', handleJobCompleted);
      socket.off('team:performance_updated', handleTeamPerformanceUpdated);
    };
  }, [socket, isConnected, timeframe]);

  if (loading && !teamPerformance) {
    return (
      <Card style={{ borderColor: colors.border }}>
        <CardContent className="p-6 text-center" style={{ color: colors.textSecondary }}>
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading team analytics...
        </CardContent>
      </Card>
    );
  }

  if (!teamPerformance || !teamComparison) {
    return (
      <Card style={{ borderColor: colors.border }}>
        <CardContent className="p-6 text-center" style={{ color: colors.textSecondary }}>
          No team data available
        </CardContent>
      </Card>
    );
  }

  const selectedTeamData = selectedTeam
    ? teamPerformance.teams.find((t: TeamData) => t.senior.id === selectedTeam)
    : null;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-40" style={{ borderColor: colors.border }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={loadTeamData}
          disabled={loading}
          style={{ backgroundColor: colors.primary, color: '#fff' }}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overall Statistics */}
      {teamPerformance.overallStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card style={{ borderColor: colors.border }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>Total Teams</p>
                  <p className="text-2xl font-bold" style={{ color: colors.primary }}>
                    {teamPerformance.overallStats.totalTeams}
                  </p>
                </div>
                <Users className="w-8 h-8" style={{ color: colors.primary }} />
              </div>
            </CardContent>
          </Card>

          <Card style={{ borderColor: colors.border }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>Total Jobs</p>
                  <p className="text-2xl font-bold" style={{ color: colors.primary }}>
                    {teamPerformance.overallStats.totalJobs}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8" style={{ color: colors.primary }} />
              </div>
            </CardContent>
          </Card>

          <Card style={{ borderColor: colors.border }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>Completed</p>
                  <p className="text-2xl font-bold" style={{ color: colors.success }}>
                    {teamPerformance.overallStats.completedJobs}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8" style={{ color: colors.success }} />
              </div>
            </CardContent>
          </Card>

          <Card style={{ borderColor: colors.border }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>Completion Rate</p>
                  <p className="text-2xl font-bold" style={{ color: colors.primary }}>
                    {teamPerformance.overallStats.completionRate.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8" style={{ color: colors.primary }} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="comparison" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="comparison">Team Comparison</TabsTrigger>
          <TabsTrigger value="teams">Individual Teams</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-6">
          {/* Team Comparison Chart */}
          {teamComparison.teams && teamComparison.teams.length > 0 && (
            <TeamComparisonChart
              data={teamComparison.teams}
              timeframe={timeframe}
            />
          )}
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          {/* Team Selection */}
          <Card style={{ borderColor: colors.border }}>
            <CardContent className="p-4">
              <Select
                value={selectedTeam?.toString() || 'all'}
                onValueChange={(value) => setSelectedTeam(value === 'all' ? null : parseInt(value))}
              >
                <SelectTrigger className="w-full" style={{ borderColor: colors.border }}>
                  <SelectValue placeholder="Select a team to view details" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams Overview</SelectItem>
                  {teamPerformance.teams.map((team: TeamData) => (
                    <SelectItem key={team.senior.id} value={team.senior.id.toString()}>
                      {team.senior.name} ({team.senior.assistantCount} assistants)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Selected Team Details or All Teams */}
          {selectedTeamData ? (
            <div className="space-y-6">
              <TeamPerformanceCards
                senior={selectedTeamData.senior}
                members={selectedTeamData.members}
                totals={selectedTeamData.totals}
              />
              <AssistantPerformanceTable
                assistants={selectedTeamData.members.filter((m: any) => m.role === 'ASSISTANT_MERCHANDISER')}
                seniorName={selectedTeamData.senior.name}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {teamPerformance.teams.map((team: TeamData) => (
                <TeamPerformanceCards
                  key={team.senior.id}
                  senior={team.senior}
                  members={team.members}
                  totals={team.totals}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
