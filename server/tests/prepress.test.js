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

describe('Prepress API Tests', () => {
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
      role: 'HOD_PREPRESS',
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

  describe('POST /api/prepress/jobs', () => {
    it('should create a new prepress job', async () => {
      const newJob = {
        job_card_id: 'job-123',
        assigned_designer_id: 'designer-123',
        priority: 'HIGH',
        due_date: '2024-12-31T23:59:59Z'
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'prepress-job-123',
          ...newJob,
          status: 'PENDING',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]
      });

      const response = await request(app)
        .post('/api/prepress/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newJob)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('PENDING');
      expect(response.body.priority).toBe('HIGH');
    });

    it('should validate required fields', async () => {
      const invalidJob = {
        priority: 'INVALID'
      };

      const response = await request(app)
        .post('/api/prepress/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidJob)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/prepress/jobs', () => {
    it('should return list of prepress jobs', async () => {
      const mockJobs = [
        {
          id: 'prepress-job-1',
          job_card_id: 'job-1',
          status: 'PENDING',
          priority: 'HIGH',
          created_at: new Date().toISOString()
        },
        {
          id: 'prepress-job-2',
          job_card_id: 'job-2',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          created_at: new Date().toISOString()
        }
      ];

      mockPool.query.mockResolvedValueOnce({
        rows: mockJobs
      });

      const response = await request(app)
        .get('/api/prepress/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('status');
    });

    it('should filter jobs by status', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: []
      });

      await request(app)
        .get('/api/prepress/jobs?status=PENDING')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE pj.status = $1'),
        ['PENDING']
      );
    });
  });

  describe('PATCH /api/prepress/jobs/:id/assign', () => {
    it('should assign a designer to a job', async () => {
      const jobId = 'prepress-job-123';
      const designerId = 'designer-123';

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: jobId }] }) // Check job exists
        .mockResolvedValueOnce({ rows: [{ id: designerId }] }) // Check designer exists
        .mockResolvedValueOnce({ rows: [{ id: jobId, status: 'ASSIGNED' }] }); // Update job

      const response = await request(app)
        .patch(`/api/prepress/jobs/${jobId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ designerId })
        .expect(200);

      expect(response.body.status).toBe('ASSIGNED');
    });

    it('should return 404 for non-existent job', async () => {
      const jobId = 'non-existent';
      const designerId = 'designer-123';

      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await request(app)
        .patch(`/api/prepress/jobs/${jobId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ designerId })
        .expect(404);
    });
  });

  describe('PATCH /api/prepress/jobs/:id/start', () => {
    it('should start a job (DESIGNER role)', async () => {
      const jobId = 'prepress-job-123';
      
      // Mock designer user
      const mockDesigner = {
        id: 'designer-123',
        email: 'designer@example.com',
        role: 'DESIGNER',
        first_name: 'Designer',
        last_name: 'User'
      };

      jest.doMock('../middleware/auth', () => ({
        authenticateToken: (req, res, next) => {
          req.user = mockDesigner;
          next();
        }
      }));

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: jobId, assigned_designer_id: 'designer-123' }] })
        .mockResolvedValueOnce({ rows: [{ id: jobId, status: 'IN_PROGRESS' }] });

      const response = await request(app)
        .patch(`/api/prepress/jobs/${jobId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('IN_PROGRESS');
    });
  });

  describe('POST /api/prepress/jobs/:id/remark', () => {
    it('should add a remark to a job', async () => {
      const jobId = 'prepress-job-123';
      const remark = 'This is a test remark';

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: jobId }] })
        .mockResolvedValueOnce({ rows: [{ id: 'remark-123' }] });

      const response = await request(app)
        .post(`/api/prepress/jobs/${jobId}/remark`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ remark })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/prepress/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/prepress/jobs')
        .expect(401);
    });

    it('should require proper role permissions', async () => {
      // Mock user with insufficient permissions
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'MERCHANDISER', // Not HOD_PREPRESS
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
        .get('/api/prepress/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });
});
