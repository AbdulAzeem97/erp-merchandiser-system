import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Wifi, WifiOff, Server, Database, Activity, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { healthAPI } from '@/services/api';

interface BackendStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

const BackendStatusIndicator: React.FC<BackendStatusIndicatorProps> = ({ 
  className = '',
  showDetails = false 
}) => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);

    const checkBackendStatus = async () => {
    const startTime = Date.now();
    setIsChecking(true);

    try {
      const response = await healthAPI.check();
      const endTime = Date.now();
      const responseTimeMs = endTime - startTime;

      setIsOnline(true);
      setResponseTime(responseTimeMs);
    } catch (error) {
      setIsOnline(false);
      setResponseTime(null);
    } finally {
      setIsChecking(false);
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    checkBackendStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(checkBackendStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (isOnline === null || isChecking) return 'bg-gray-500';
    return isOnline ? 'bg-green-500' : 'bg-red-500';
  };

  const getStatusText = () => {
    if (isChecking) return 'Checking...';
    if (isOnline === null) return 'Unknown';
    return isOnline ? 'Backend Online' : 'Backend Offline';
  };

  const getStatusIcon = () => {
    if (isChecking) return <Activity className="w-4 h-4 animate-spin" />;
    if (isOnline) return <CheckCircle className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  const getResponseTimeColor = () => {
    if (!responseTime) return 'text-gray-500';
    if (responseTime < 100) return 'text-green-600';
    if (responseTime < 300) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <div className="flex items-center space-x-2">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-white text-sm font-medium shadow-lg ${getStatusColor()}`}
        >
          <motion.div
            animate={isOnline ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.5, repeat: isOnline ? Infinity : 0, repeatDelay: 2 }}
          >
            {getStatusIcon()}
          </motion.div>
          
          <span className="font-semibold">{getStatusText()}</span>
          
          {isOnline && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-2 h-2 bg-white rounded-full animate-pulse"
            />
          )}
        </motion.div>

        <Button
          variant="ghost"
          size="sm"
          onClick={checkBackendStatus}
          disabled={isChecking}
          className="p-1 h-8 w-8 hover:bg-green-100"
        >
          <motion.div
            animate={isChecking ? { rotate: 360 } : {}}
            transition={{ duration: 1, repeat: isChecking ? Infinity : 0, ease: "linear" }}
          >
            <RefreshCw className="w-4 h-4 text-green-600" />
          </motion.div>
        </Button>
      </div>

      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-lg p-3 space-y-2"
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Server className="w-3 h-3 text-blue-600" />
              <span className="text-gray-600">API Server:</span>
              <span className="font-mono text-gray-800">localhost:5001</span>
            </div>
            <div className="flex items-center space-x-2">
              <Database className="w-3 h-3 text-green-600" />
              <span className="text-gray-600">Database:</span>
              <span className="font-semibold text-green-600">PostgreSQL</span>
            </div>
          </div>
          
          {responseTime && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Response Time:</span>
              <span className={`font-semibold ${getResponseTimeColor()}`}>
                {responseTime}ms
              </span>
            </div>
          )}
          
          {lastCheck && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Last Check:</span>
              <span className="font-semibold text-gray-800">
                {lastCheck.toLocaleTimeString()}
              </span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default BackendStatusIndicator;
