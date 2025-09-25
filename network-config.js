// Network Configuration for ERP Merchandiser System
// This file contains the configuration to make the app accessible from other devices

export const NETWORK_CONFIG = {
  // Backend Server Configuration
  SERVER: {
    HOST: '0.0.0.0',  // Bind to all network interfaces
    PORT: 5001,
    API_BASE_URL: 'http://0.0.0.0:5001/api'
  },
  
  // Frontend Configuration
  FRONTEND: {
    HOST: '0.0.0.0',  // Allow access from any device
    PORT: 8080,
    URL: 'http://0.0.0.0:8080'
  },
  
  // Database Configuration (if needed for network access)
  DATABASE: {
    HOST: 'localhost',  // Keep as localhost for security
    PORT: 5432,
    NAME: 'erp_merchandiser',
    USER: 'postgres',
    PASSWORD: 'password'
  },
  
  // CORS Configuration
  CORS: {
    // Allow access from common local network IP ranges
    ALLOWED_ORIGINS: [
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://localhost:8083',
      'http://localhost:8084',
      'http://localhost:3000',
      'http://localhost:5173',
      // Local network IP ranges
      /^http:\/\/192\.168\.\d+\.\d+:(8080|8081|8082|8083|8084|3000|5173)$/,
      /^http:\/\/10\.\d+\.\d+\.\d+:(8080|8081|8082|8083|8084|3000|5173)$/,
      /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+:(8080|8081|8082|8083|8084|3000|5173)$/
    ]
  }
};

// Instructions for network access:
console.log(`
🌐 NETWORK ACCESS CONFIGURATION
================================

To make your ERP system accessible from other devices on your network:

1. BACKEND SERVER (Already configured):
   - Server binds to 0.0.0.0:5001
   - Accessible at: http://YOUR_IP:5001
   - Health check: http://YOUR_IP:5001/health

2. FRONTEND (Already configured):
   - Vite dev server binds to 0.0.0.0:8080
   - Accessible at: http://YOUR_IP:8080

3. TO FIND YOUR IP ADDRESS:
   - Windows: ipconfig
   - Mac/Linux: ifconfig
   - Look for your local network IP (usually 192.168.x.x or 10.x.x.x)

4. ACCESS FROM OTHER DEVICES:
   - Replace YOUR_IP with your actual IP address
   - Example: http://192.168.1.100:8080
   - Make sure devices are on the same network

5. FIREWALL SETTINGS:
   - Allow ports 5001 and 8080 through Windows Firewall
   - Or temporarily disable firewall for testing

6. DATABASE:
   - PostgreSQL runs on localhost (secure)
   - No need to expose database to network

Current configuration allows access from:
- Localhost: http://localhost:8080
- Network: http://YOUR_IP:8080
- Backend API: http://YOUR_IP:5001/api
`);
