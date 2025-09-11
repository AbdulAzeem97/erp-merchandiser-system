import request from 'supertest';
import app from '../index.js';
import { Pool } from 'pg';

// Mock database connection
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  })),
}));

describe('Reports API Tests', () => {
  let mockPool;
  let authToken;

  beforeAll(async () => {
    mockPool = new Pool();
    
    // Mock successful authentication
    authToken = 'mock-jwt-token';
    
    // Mock user data
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'HEAD_OF_MERCHANDISER',
      first_name: 'Test',
      last_name: 'User'
    };

    // Mock JWT verification
    jest.doMock('../middleware/auth', () => ({
      authenticateToken: (req, res, next) => {
        req.user = mockUser;
        next();
      }
    }));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/reports/summary', () => {
    it('should return system summary', async () => {
      const mockSummary = {
        total_jobs: 150,
        jobs_punched_mtd: 45,
        jobs_in_progress: 25,
        jobs_completed: 120,
        avg_turnaround_time: 86400, // 1 day in seconds
        pending_prepress: 15,
        sla_breaches: 3,
        active_designers: 5
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockSummary]
      });

      const response = await request(app)
        .get('/api/reports/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('total_jobs');
      expect(response.body).toHaveProperty('jobs_punched_mtd');
      expect(response.body).toHaveProperty('jobs_in_progress');
      expect(response.body).toHaveProperty('jobs_completed');
    });

    it('should filter by date range', async () => {
      const fromDate = '2024-01-01';
      const toDate = '2024-01-31';

      mockPool.query.mockResolvedValueOnce({
        rows: [{}]
      });

      await request(app)
        .get(`/api/reports/summary?from=${fromDate}&to=${toDate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE punched_at >= $1 AND punched_at <= $2'),
        [fromDate, toDate]
      );
    });
  });

  describe('GET /api/reports/monthly', () => {
    it('should return monthly trends', async () => {
      const mockTrends = [
        {
          month: '2024-01-01',
          jobs_punched: 45,
          jobs_completed: 40,
          prepress_jobs: 30,
          prepress_completed: 25
        },
        {
          month: '2024-02-01',
          jobs_punched: 52,
          jobs_completed: 48,
          prepress_jobs: 35,
          prepress_completed: 30
        }
      ];

      mockPool.query.mockResolvedValueOnce({
        rows: mockTrends
      });

      const response = await request(app)
        .get('/api/reports/monthly?year=2024')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('month');
      expect(response.body[0]).toHaveProperty('jobs_punched');
    });
  });

  describe('GET /api/reports/prepress/kpi', () => {
    it('should return prepress KPIs', async () => {
      const mockKPIs = {
        total_prepress_jobs: 100,
        completed_prepress_jobs: 85,
        avg_turnaround_seconds: 172800, // 2 days
        active_designers: 5,
        jobs_by_status: {
          PENDING: 10,
          ASSIGNED: 15,
          IN_PROGRESS: 20,
          HOD_REVIEW: 5,
          COMPLETED: 85,
          REJECTED: 3
        }
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockKPIs]
      });

      const response = await request(app)
        .get('/api/reports/prepress/kpi')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('total_prepress_jobs');
      expect(response.body).toHaveProperty('completed_prepress_jobs');
      expect(response.body).toHaveProperty('avg_turnaround_seconds');
    });
  });

  describe('GET /api/reports/exports/csv', () => {
    it('should export summary data as CSV', async () => {
      const mockData = [
        { month: '2024-01', jobs_punched: 45, jobs_completed: 40 },
        { month: '2024-02', jobs_punched: 52, jobs_completed: 48 }
      ];

      mockPool.query.mockResolvedValueOnce({
        rows: mockData
      });

      const response = await request(app)
        .get('/api/reports/exports/csv?type=monthly')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('month,jobs_punched,jobs_completed');
    });

    it('should handle invalid export type', async () => {
      await request(app)
        .get('/api/reports/exports/csv?type=invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /api/reports/merchandiser-performance', () => {
    it('should return merchandiser performance data', async () => {
      const mockPerformance = [
        {
          id: 'merchandiser-1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          total_jobs: 25,
          completed_jobs: 20,
          in_progress_jobs: 3,
          avg_turnaround_seconds: 86400
        },
        {
          id: 'merchandiser-2',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          total_jobs: 30,
          completed_jobs: 28,
          in_progress_jobs: 2,
          avg_turnaround_seconds: 72000
        }
      ];

      mockPool.query.mockResolvedValueOnce({
        rows: mockPerformance
      });

      const response = await request(app)
        .get('/api/reports/merchandiser-performance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('first_name');
      expect(response.body[0]).toHaveProperty('total_jobs');
    });
  });

  describe('GET /api/reports/designer-productivity', () => {
    it('should return designer productivity data', async () => {
      const mockProductivity = [
        {
          id: 'designer-1',
          first_name: 'Alice',
          last_name: 'Johnson',
          email: 'alice@example.com',
          total_jobs: 40,
          completed_jobs: 35,
          in_progress_jobs: 3,
          rejected_jobs: 2,
          avg_turnaround_seconds: 129600
        }
      ];

      mockPool.query.mockResolvedValueOnce({
        rows: mockProductivity
      });

      const response = await request(app)
        .get('/api/reports/designer-productivity')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('first_name');
      expect(response.body[0]).toHaveProperty('total_jobs');
      expect(response.body[0]).toHaveProperty('rejected_jobs');
    });
  });

  describe('GET /api/reports/sla-compliance', () => {
    it('should return SLA compliance data', async () => {
      const mockSLA = [
        {
          process_type: 'Job Cards',
          total_items: 100,
          completed_items: 95,
          on_time_items: 90,
          overdue_items: 5
        },
        {
          process_type: 'Prepress',
          total_items: 80,
          completed_items: 75,
          on_time_items: 70,
          overdue_items: 5
        }
      ];

      mockPool.query.mockResolvedValueOnce({
        rows: mockSLA
      });

      const response = await request(app)
        .get('/api/reports/sla-compliance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('process_type');
      expect(response.body[0]).toHaveProperty('on_time_items');
      expect(response.body[0]).toHaveProperty('overdue_items');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/reports/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/reports/summary')
        .expect(401);
    });

    it('should require proper role permissions', async () => {
      // Mock user with insufficient permissions
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'DESIGNER', // Not authorized for reports
        first_name: 'Test',
        last_name: 'User'
      };

      jest.doMock('../middleware/auth', () => ({
        authenticateToken: (req, res, next) => {
          req.user = mockUser;
          next();
        }
      }));

      await request(app)
        .get('/api/reports/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });
});
