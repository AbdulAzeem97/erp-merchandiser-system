const DEFAULT_API_PORT = import.meta.env.VITE_API_PORT || '5001';

// Helper function to detect if we're accessing from LAN (not localhost)
const isAccessingFromLAN = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const { hostname } = window.location;
  
  // If hostname is an IP address (not localhost or 127.0.0.1), we're on LAN
  const ipRegex = /^\d+\.\d+\.\d+\.\d+$/;
  if (ipRegex.test(hostname)) {
    return hostname !== '127.0.0.1';
  }
  
  // If hostname is not localhost, localhost.localdomain, or 127.0.0.1, we're likely on LAN
  return hostname !== 'localhost' && 
         hostname !== '127.0.0.1' && 
         !hostname.includes('localhost');
};

// Helper function to check if URL contains localhost
const containsLocalhost = (url: string): boolean => {
  return url.includes('localhost') || url.includes('127.0.0.1');
};

export const getApiBaseUrl = (): string => {
  // Check if we're accessing from LAN
  const isLAN = typeof window !== 'undefined' ? isAccessingFromLAN() : false;
  
  // If VITE_API_BASE_URL is set, check if we should use it
  if (import.meta.env.VITE_API_BASE_URL) {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    
    // If accessing from LAN and env URL contains localhost, ignore it and use dynamic detection
    if (isLAN && containsLocalhost(envUrl)) {
      console.log('🌐 VITE_API_BASE_URL is set to localhost, but accessing from LAN - using dynamic detection instead');
      console.log('🌐 Ignored env URL:', envUrl);
    } else {
      // Use env URL if:
      // 1. Not accessing from LAN, OR
      // 2. Env URL doesn't contain localhost
      console.log('🌐 Using VITE_API_BASE_URL from env:', envUrl);
      return envUrl;
    }
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    
    // Debug logging
    console.log('🌐 Detected hostname:', hostname);
    console.log('🌐 Detected protocol:', protocol);
    console.log('🌐 Detected port:', port);
    console.log('🌐 Accessing from LAN:', isLAN);
    
    // If hostname is localhost or 127.0.0.1, but we're accessing from a different port
    // or if the URL contains an IP address, use that IP instead
    const currentUrl = window.location.href;
    const urlMatch = currentUrl.match(/https?:\/\/(\d+\.\d+\.\d+\.\d+)/);
    
    if (urlMatch && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      const detectedIp = urlMatch[1];
      console.log('🌐 Detected IP in URL:', detectedIp, '- using it instead of', hostname);
      return `${protocol}//${detectedIp}:${DEFAULT_API_PORT}/api`;
    }
    
    const apiUrl = `${protocol}//${hostname}:${DEFAULT_API_PORT}/api`;
    console.log('🌐 Final API URL (dynamic detection):', apiUrl);
    return apiUrl;
  }

  console.log('🌐 No window object, using default localhost');
  return `http://localhost:${DEFAULT_API_PORT}/api`;
};

export const getApiRootUrl = (): string => {
  const baseUrl = getApiBaseUrl();
  const rootUrl = baseUrl.endsWith('/api') ? baseUrl.slice(0, -4) : baseUrl;
  console.log('🌐 API Root URL:', rootUrl);
  return rootUrl;
};

export const getSocketUrl = (): string => {
  // Check if we're accessing from LAN
  const isLAN = typeof window !== 'undefined' ? isAccessingFromLAN() : false;
  
  // If VITE_SOCKET_URL is set, check if we should use it
  if (import.meta.env.VITE_SOCKET_URL) {
    const envUrl = import.meta.env.VITE_SOCKET_URL;
    
    // If accessing from LAN and env URL contains localhost, ignore it
    if (isLAN && containsLocalhost(envUrl)) {
      console.log('🌐 VITE_SOCKET_URL is set to localhost, but accessing from LAN - using dynamic detection instead');
      console.log('🌐 Ignored env URL:', envUrl);
    } else {
      console.log('🌐 Using VITE_SOCKET_URL from env:', envUrl);
      return envUrl;
    }
  }

  // If VITE_API_URL is set, check if we should use it
  if (import.meta.env.VITE_API_URL) {
    const envUrl = import.meta.env.VITE_API_URL;
    
    // If accessing from LAN and env URL contains localhost, ignore it
    if (isLAN && containsLocalhost(envUrl)) {
      console.log('🌐 VITE_API_URL is set to localhost, but accessing from LAN - using dynamic detection instead');
      console.log('🌐 Ignored env URL:', envUrl);
    } else {
      console.log('🌐 Using VITE_API_URL from env:', envUrl);
      return envUrl;
    }
  }

  const socketUrl = getApiRootUrl();
  console.log('🌐 Socket URL (dynamic detection):', socketUrl);
  return socketUrl;
};

// Helper function to get API URL (without /api suffix) - for components that need it
export const getApiUrl = (): string => {
  return getApiRootUrl();
};

// Helper function to get full API URL with endpoint - convenience function for components
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

