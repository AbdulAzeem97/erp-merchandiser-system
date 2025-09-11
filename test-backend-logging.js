#!/usr/bin/env node

import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import sqlite3 from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Testing Backend with Logging');
console.log('='.repeat(50));

// Create a simple test server
const app = express();
app.use(express.json());

// Login validation
const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
];

// Test login route with detailed logging
app.post('/test-login', loginValidation, async (req, res) => {
  console.log('\n📥 Received login request:');
  console.log('   Headers:', req.headers);
  console.log('   Body:', req.body);
  console.log('   Email:', req.body.email);
  console.log('   Password:', req.body.password);
  console.log('   Email length:', req.body.email?.length);
  console.log('   Password length:', req.body.password?.length);
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('   Validation errors:', errors.array());
    return res.status(400).json({
      error: 'Validation error',
      message: 'Please check your input',
      details: errors.array()
    });
  }

  const { email, password } = req.body;

  // Connect to database
  const dbPath = path.join(__dirname, 'erp_merchandiser.db');
  const db = sqlite3(dbPath);
  
  // Find user by email
  const user = db.prepare(
    'SELECT * FROM users WHERE email = ? AND is_active = true'
  ).get(email);

  console.log('   User found:', user ? 'YES' : 'NO');
  if (user) {
    console.log('   User email:', user.email);
    console.log('   User role:', user.role);
  }

  if (!user) {
    console.log('   ❌ User not found');
    db.close();
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid email or password'
    });
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  console.log('   Password valid:', isValidPassword);

  if (!isValidPassword) {
    console.log('   ❌ Invalid password');
    db.close();
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid email or password'
    });
  }

  console.log('   ✅ Login successful');
  db.close();
  
  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at
    },
    token: 'test-token'
  });
});

// Start test server
const PORT = 3002;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🧪 Test server running on port ${PORT}`);
  console.log(`🌐 Test URL: http://192.168.2.56:${PORT}/test-login`);
  
  // Test the endpoint
  setTimeout(async () => {
    console.log('\n🧪 Testing the endpoint...');
    try {
      const response = await fetch(`http://192.168.2.56:${PORT}/test-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: 'admin@horizonsourcing.com', 
          password: 'password123' 
        })
      });
      
      const data = await response.json();
      console.log(`📊 Test result: ${response.status} - ${response.ok ? 'SUCCESS' : 'FAILED'}`);
      console.log('📋 Response:', data);
      
    } catch (error) {
      console.log('❌ Test error:', error.message);
    }
  }, 1000);
});



