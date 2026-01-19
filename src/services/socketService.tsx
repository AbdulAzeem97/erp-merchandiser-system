import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../utils/apiConfig';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Get token from localStorage
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    // Use dynamic hostname detection for LAN support
    const serverUrl = getSocketUrl();
    
    console.log('🔌 Socket.io: Initializing connection...');
    console.log('🔌 Socket.io: Token present:', !!token);
    console.log('🔌 Socket.io: User present:', !!user);
    console.log('🔌 Socket.io: API URL:', serverUrl);
    
    if (!token) {
      console.log('❌ Socket.io: No auth token found, skipping socket connection');
      return;
    }

    // Initialize socket connection
    const newSocket = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket.io: Connected successfully with ID:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket.io: Disconnected. Reason:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket.io: Connection error:', error);
      console.error('❌ Socket.io: Error message:', error.message);
      console.error('❌ Socket.io: Error type:', error.type);
      setIsConnected(false);
      
      // If it's an auth error, clear the token and try to reconnect
      if (error.message.includes('Invalid token') || error.message.includes('Unauthorized')) {
        console.log('🔐 Socket.io: Authentication failed, clearing token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        newSocket.disconnect();
      }
    });

    newSocket.on('reconnect', () => {
      console.log('Socket reconnected');
      setIsConnected(true);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// Hook for prepress-specific socket events
export const usePrepressSocket = (jobId?: string) => {
  const { socket, isConnected } = useSocket();
  const [jobUpdates, setJobUpdates] = useState<any>(null);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleJobUpdate = (data: any) => {
      setJobUpdates(data);
    };

    if (jobId) {
      socket.on(`prepress:job:${jobId}`, handleJobUpdate);
    }

    return () => {
      if (jobId) {
        socket.off(`prepress:job:${jobId}`, handleJobUpdate);
      }
    };
  }, [socket, isConnected, jobId]);

  return { jobUpdates, isConnected };
};

// Hook for designer-specific socket events
export const useDesignerSocket = (designerId?: string) => {
  const { socket, isConnected } = useSocket();
  const [queueUpdates, setQueueUpdates] = useState<any>(null);

  useEffect(() => {
    if (!socket || !isConnected || !designerId) return;

    const handleQueueUpdate = (data: any) => {
      setQueueUpdates(data);
    };

    socket.on(`prepress:designer:${designerId}`, handleQueueUpdate);

    return () => {
      socket.off(`prepress:designer:${designerId}`, handleQueueUpdate);
    };
  }, [socket, isConnected, designerId]);

  return { queueUpdates, isConnected };
};

// Hook for HOD-specific socket events
export const useHODSocket = () => {
  const { socket, isConnected } = useSocket();
  const [hodUpdates, setHodUpdates] = useState<any>(null);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleHODUpdate = (data: any) => {
      setHodUpdates(data);
    };

    socket.on('prepress:hod', handleHODUpdate);

    return () => {
      socket.off('prepress:hod', handleHODUpdate);
    };
  }, [socket, isConnected]);

  return { hodUpdates, isConnected };
};

// Hook for KPI updates
export const useKpiSocket = () => {
  const { socket, isConnected } = useSocket();
  const [kpiUpdates, setKpiUpdates] = useState<any>(null);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleKpiUpdate = (data: any) => {
      setKpiUpdates(data);
    };

    socket.on('dashboard:kpis', handleKpiUpdate);

    return () => {
      socket.off('dashboard:kpis', handleKpiUpdate);
    };
  }, [socket, isConnected]);

  return { kpiUpdates, isConnected };
};
