import dbAdapter from '../database/adapter.js';

/**
 * Director Analytics Service
 * Provides team performance analytics for director dashboard
 */
class DirectorAnalyticsService {
  /**
   * Get team performance metrics for all teams
   * @param {Object} user - Current user (must be DIRECTOR)
   * @param {string} timeframe - Time frame for data (today, week, month, year, all)
   * @returns {Promise<Object>} - Team performance data
   */
  async getTeamPerformance(user, timeframe = 'month') {
    try {
      if (user.role !== 'DIRECTOR') {
        throw new Error('Only DIRECTOR can access team performance data');
      }

      // Get date range based on timeframe
      const dateRange = this.getDateRange(timeframe);
      
      // Get all senior merchandisers (direct reports to director)
      const seniorsQuery = `
        SELECT 
          u.id,
          u."firstName",
          u."lastName",
          u.email,
          u.username,
          COUNT(DISTINCT a.id) as assistant_count
        FROM users u
        LEFT JOIN users a ON a.manager_id = u.id AND a.role = 'ASSISTANT_MERCHANDISER'
        WHERE u.role = 'SENIOR_MERCHANDISER'
        GROUP BY u.id, u."firstName", u."lastName", u.email, u.username
        ORDER BY u."firstName", u."lastName"
      `;
      
      const seniorsResult = await dbAdapter.query(seniorsQuery);
      const seniorMerchandisers = seniorsResult.rows;

      // Get performance metrics for each senior and their team
      const teams = await Promise.all(
        seniorMerchandisers.map(async (senior) => {
          const teamMetrics = await this.getTeamMetrics(senior.id, dateRange);
          return {
            senior: {
              id: senior.id,
              name: `${senior.firstName} ${senior.lastName}`,
              email: senior.email,
              username: senior.username,
              assistantCount: parseInt(senior.assistant_count) || 0
            },
            ...teamMetrics
          };
        })
      );

      // Calculate overall statistics
      const overallStats = this.calculateOverallStats(teams);

      return {
        teams,
        overallStats,
        timeframe,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting team performance:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics for a specific team (senior + assistants)
   * @param {number} seniorId - Senior merchandiser ID
   * @param {Object} dateRange - Date range object
   * @returns {Promise<Object>} - Team metrics
   */
  async getTeamMetrics(seniorId, dateRange) {
    try {
      // Get all team member IDs (senior + assistants)
      const teamMembersQuery = `
        SELECT id, "firstName", "lastName", email, role
        FROM users
        WHERE id = $1 OR (manager_id = $1 AND role = 'ASSISTANT_MERCHANDISER')
        ORDER BY role DESC, "firstName"
      `;
      
      const teamMembersResult = await dbAdapter.query(teamMembersQuery, [seniorId]);
      const teamMemberIds = teamMembersResult.rows.map(m => m.id);

      if (teamMemberIds.length === 0) {
        return this.getEmptyTeamMetrics();
      }

      // Get job statistics for the team
      const jobsQuery = `
        SELECT 
          jc."createdById",
          jc.status,
          COUNT(*) as job_count,
          SUM(CASE WHEN jc.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_count,
          SUM(CASE WHEN jc.status = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
          SUM(CASE WHEN jc.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_count,
          SUM(CASE WHEN jc.dueDate < CURRENT_DATE AND jc.status != 'COMPLETED' THEN 1 ELSE 0 END) as overdue_count,
          AVG(CASE 
            WHEN jc.status = 'COMPLETED' AND jc."completedAt" IS NOT NULL AND jc."createdAt" IS NOT NULL
            THEN EXTRACT(EPOCH FROM (jc."completedAt" - jc."createdAt")) / 86400
            ELSE NULL
          END) as avg_completion_days
        FROM job_cards jc
        WHERE jc."createdById" = ANY($1::int[])
          AND jc."createdAt" >= $2
          AND jc."createdAt" <= $3
        GROUP BY jc."createdById", jc.status
      `;

      const jobsResult = await dbAdapter.query(jobsQuery, [
        teamMemberIds,
        dateRange.start,
        dateRange.end
      ]);

      // Aggregate metrics by team member
      const memberMetrics = {};
      teamMembersResult.rows.forEach(member => {
        memberMetrics[member.id] = {
          id: member.id,
          name: `${member.firstName} ${member.lastName}`,
          email: member.email,
          role: member.role,
          totalJobs: 0,
          completedJobs: 0,
          pendingJobs: 0,
          inProgressJobs: 0,
          overdueJobs: 0,
          completionRate: 0,
          avgCompletionDays: 0
        };
      });

      // Process job statistics
      jobsResult.rows.forEach(row => {
        const memberId = row.createdById;
        if (memberMetrics[memberId]) {
          memberMetrics[memberId].totalJobs += parseInt(row.job_count) || 0;
          memberMetrics[memberId].completedJobs += parseInt(row.completed_count) || 0;
          memberMetrics[memberId].pendingJobs += parseInt(row.pending_count) || 0;
          memberMetrics[memberId].inProgressJobs += parseInt(row.in_progress_count) || 0;
          memberMetrics[memberId].overdueJobs += parseInt(row.overdue_count) || 0;
          
          if (row.avg_completion_days) {
            memberMetrics[memberId].avgCompletionDays = parseFloat(row.avg_completion_days);
          }
        }
      });

      // Calculate completion rates
      Object.values(memberMetrics).forEach(member => {
        if (member.totalJobs > 0) {
          member.completionRate = (member.completedJobs / member.totalJobs) * 100;
        }
      });

      // Calculate team totals
      const teamTotals = Object.values(memberMetrics).reduce((acc, member) => {
        acc.totalJobs += member.totalJobs;
        acc.completedJobs += member.completedJobs;
        acc.pendingJobs += member.pendingJobs;
        acc.inProgressJobs += member.inProgressJobs;
        acc.overdueJobs += member.overdueJobs;
        return acc;
      }, {
        totalJobs: 0,
        completedJobs: 0,
        pendingJobs: 0,
        inProgressJobs: 0,
        overdueJobs: 0
      });

      const teamCompletionRate = teamTotals.totalJobs > 0
        ? (teamTotals.completedJobs / teamTotals.totalJobs) * 100
        : 0;

      return {
        members: Object.values(memberMetrics),
        totals: {
          ...teamTotals,
          completionRate: teamCompletionRate
        }
      };
    } catch (error) {
      console.error('Error getting team metrics:', error);
      return this.getEmptyTeamMetrics();
    }
  }

  /**
   * Get empty team metrics structure
   */
  getEmptyTeamMetrics() {
    return {
      members: [],
      totals: {
        totalJobs: 0,
        completedJobs: 0,
        pendingJobs: 0,
        inProgressJobs: 0,
        overdueJobs: 0,
        completionRate: 0
      }
    };
  }

  /**
   * Get team comparison data
   * @param {Object} user - Current user
   * @param {string} timeframe - Time frame
   * @returns {Promise<Object>} - Comparison data
   */
  async getTeamComparison(user, timeframe = 'month') {
    try {
      const teamPerformance = await this.getTeamPerformance(user, timeframe);
      
      // Format data for comparison charts
      const comparisonData = teamPerformance.teams.map(team => ({
        teamName: team.senior.name,
        seniorId: team.senior.id,
        totalJobs: team.totals.totalJobs,
        completedJobs: team.totals.completedJobs,
        pendingJobs: team.totals.pendingJobs,
        inProgressJobs: team.totals.inProgressJobs,
        overdueJobs: team.totals.overdueJobs,
        completionRate: team.totals.completionRate,
        assistantCount: team.senior.assistantCount,
        memberCount: team.members.length
      }));

      return {
        teams: comparisonData,
        timeframe,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting team comparison:', error);
      throw error;
    }
  }

  /**
   * Get team trends over time
   * @param {Object} user - Current user
   * @param {string} period - Period (week, month, quarter, year)
   * @returns {Promise<Object>} - Trends data
   */
  async getTeamTrends(user, period = 'month') {
    try {
      // Get date range for the period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(endDate.getMonth() - 1);
      }

      // Get all senior merchandisers
      const seniorsQuery = `
        SELECT id, "firstName", "lastName"
        FROM users
        WHERE role = 'SENIOR_MERCHANDISER'
        ORDER BY "firstName", "lastName"
      `;
      
      const seniorsResult = await dbAdapter.query(seniorsQuery);
      const seniors = seniorsResult.rows;

      // Get daily/weekly trends for each team
      const trends = await Promise.all(
        seniors.map(async (senior) => {
          const teamMemberIds = await this.getTeamMemberIds(senior.id);
          
          if (teamMemberIds.length === 0) {
            return {
              seniorId: senior.id,
              seniorName: `${senior.firstName} ${senior.lastName}`,
              data: []
            };
          }

          // Get daily job counts
          const trendsQuery = `
            SELECT 
              DATE(jc."createdAt") as date,
              COUNT(*) as total_jobs,
              SUM(CASE WHEN jc.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_jobs
            FROM job_cards jc
            WHERE jc."createdById" = ANY($1::int[])
              AND jc."createdAt" >= $2
              AND jc."createdAt" <= $3
            GROUP BY DATE(jc."createdAt")
            ORDER BY DATE(jc."createdAt")
          `;

          const trendsResult = await dbAdapter.query(trendsQuery, [
            teamMemberIds,
            startDate.toISOString(),
            endDate.toISOString()
          ]);

          return {
            seniorId: senior.id,
            seniorName: `${senior.firstName} ${senior.lastName}`,
            data: trendsResult.rows.map(row => ({
              date: row.date.toISOString().split('T')[0],
              totalJobs: parseInt(row.total_jobs) || 0,
              completedJobs: parseInt(row.completed_jobs) || 0
            }))
          };
        })
      );

      return {
        trends,
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting team trends:', error);
      throw error;
    }
  }

  /**
   * Get team member IDs for a senior
   */
  async getTeamMemberIds(seniorId) {
    const query = `
      SELECT id
      FROM users
      WHERE id = $1 OR (manager_id = $1 AND role = 'ASSISTANT_MERCHANDISER')
    `;
    const result = await dbAdapter.query(query, [seniorId]);
    return result.rows.map(r => r.id);
  }

  /**
   * Calculate overall statistics from teams
   */
  calculateOverallStats(teams) {
    const totals = teams.reduce((acc, team) => {
      acc.totalJobs += team.totals.totalJobs;
      acc.completedJobs += team.totals.completedJobs;
      acc.pendingJobs += team.totals.pendingJobs;
      acc.inProgressJobs += team.totals.inProgressJobs;
      acc.overdueJobs += team.totals.overdueJobs;
      acc.totalTeams += 1;
      acc.totalMembers += team.members.length;
      return acc;
    }, {
      totalJobs: 0,
      completedJobs: 0,
      pendingJobs: 0,
      inProgressJobs: 0,
      overdueJobs: 0,
      totalTeams: 0,
      totalMembers: 0
    });

    totals.completionRate = totals.totalJobs > 0
      ? (totals.completedJobs / totals.totalJobs) * 100
      : 0;

    return totals;
  }

  /**
   * Get date range based on timeframe
   * Made public for use in routes
   */
  getDateRange(timeframe) {
    const end = new Date();
    const start = new Date();

    switch (timeframe) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(end.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
      case 'all':
        start.setFullYear(2020, 0, 1); // Start from 2020
        break;
      default:
        start.setMonth(end.getMonth() - 1);
    }

    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  }
}

export default new DirectorAnalyticsService();
