import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import dbAdapter from '../database/adapter.js';
import { generateToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Login validation
const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
];

// Register validation
const registerValidation = [
  body('username').isLength({ min: 3, max: 50 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('first_name').isLength({ min: 2, max: 100 }).trim(),
  body('last_name').isLength({ min: 2, max: 100 }).trim()
];

// Login route
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'Please check your input',
      details: errors.array()
    });
  }

  const { email, password } = req.body;

  // Find user by email
  const userResult = await dbAdapter.query(
    'SELECT * FROM users WHERE email = $1 AND "isActive" = true',
    [email]
  );
  const user = userResult.rows?.[0] || null;

  if (!user) {
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid email or password'
    });
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid email or password'
    });
  }

  // Generate token
  const token = generateToken(user.id);

  // Remove password from response
  const { password: userPassword, ...userWithoutPassword } = user;

  res.json({
    message: 'Login successful',
    user: userWithoutPassword,
    token
  });
}));

// Register route
router.post('/register', registerValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'Please check your input',
      details: errors.array()
    });
  }

  const { username, email, password, first_name, last_name, role = 'user' } = req.body;

  // Check if user already exists
  const existingUserResult = await dbAdapter.query(
    'SELECT id FROM users WHERE email = $1 OR username = $2',
    [email, username]
  );
  const existingUser = existingUserResult.rows?.[0] || null;

  if (existingUser) {
    return res.status(409).json({
      error: 'User already exists',
      message: 'A user with this email or username already exists'
    });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const result = await dbAdapter.query(
    `INSERT INTO users (username, email, password, "firstName", "lastName", role)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, email, "firstName", "lastName", role, "createdAt"`,
    [username, email, passwordHash, first_name, last_name, role]
  );
  
  const user = result.rows[0];
  const token = generateToken(user.id);

  res.status(201).json({
    message: 'User registered successfully',
    user,
    token
  });
}));

// Get current user
router.get('/me', asyncHandler(async (req, res) => {
  // This route should be protected by auth middleware
  // For now, we'll return a placeholder
  res.json({
    message: 'Current user endpoint - requires authentication middleware'
  });
}));

// Change password
router.post('/change-password', [
  body('current_password').isLength({ min: 6 }),
  body('new_password').isLength({ min: 6 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'Please check your input',
      details: errors.array()
    });
  }

  const { current_password, new_password } = req.body;
  const userId = req.user?.id; // This should come from auth middleware

  if (!userId) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to change your password'
    });
  }

  // Get current user
  const userResult = await dbAdapter.query(
    'SELECT password FROM users WHERE id = $1',
    [userId]
  );

  if (userResult.rows.length === 0) {
    return res.status(404).json({
      error: 'User not found',
      message: 'User not found'
    });
  }

  const user = userResult.rows[0];

  // Verify current password
  const isValidPassword = await bcrypt.compare(current_password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({
      error: 'Invalid password',
      message: 'Current password is incorrect'
    });
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(new_password, 10);

  // Update password
  await dbAdapter.query(
    'UPDATE users SET password = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2',
    [newPasswordHash, userId]
  );

  res.json({
    message: 'Password changed successfully'
  });
}));

// Get users by role (for designer assignment)
router.get('/users/role/:role', asyncHandler(async (req, res) => {
  const { role } = req.params;
  
  try {
    const query = `
      SELECT id, username, email, "firstName", "lastName", role, "isActive"
      FROM users 
      WHERE role = $1 AND "isActive" = true
      ORDER BY "firstName", "lastName"
    `;
    
    const result = await dbAdapter.query(query, [role.toUpperCase()]);
    const users = result.rows;
    
    res.json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        role: user.role,
        isActive: user.isActive
      }))
    });
  } catch (error) {
    console.error('Error fetching users by role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
}));

// Get all designers (convenience endpoint)
router.get('/designers', asyncHandler(async (req, res) => {
  try {
    const query = `
      SELECT id, username, email, "firstName", "lastName", role, "isActive"
      FROM users 
      WHERE role = 'DESIGNER' AND "isActive" = true
      ORDER BY "firstName", "lastName"
    `;
    
    const result = await dbAdapter.query(query);
    const designers = result.rows;
    
    res.json({
      success: true,
      designers: designers.map(designer => ({
        id: designer.id,
        username: designer.username,
        email: designer.email,
        firstName: designer.firstName,
        lastName: designer.lastName,
        fullName: `${designer.firstName || ''} ${designer.lastName || ''}`.trim(),
        role: designer.role,
        isActive: designer.isActive
      }))
    });
  } catch (error) {
    console.error('Error fetching designers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch designers'
    });
  }
}));

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({
    message: 'Logout successful'
  });
});

export default router;
