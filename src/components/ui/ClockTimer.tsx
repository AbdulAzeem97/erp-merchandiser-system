import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ClockTimerProps {
  startTime: Date | string; // When the stage started
  slaTimeMinutes: number; // Expected SLA time in minutes
  stageName?: string; // Optional: name of current stage
  onDisable?: () => void; // Optional: callback to disable clock
  className?: string;
  size?: 'sm' | 'md' | 'lg'; // Size variants
}

type ClockState = 'green' | 'yellow' | 'red' | 'exceeded';

const ClockTimer: React.FC<ClockTimerProps> = ({
  startTime,
  slaTimeMinutes,
  stageName,
  onDisable,
  className,
  size = 'sm'
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [clockState, setClockState] = useState<ClockState>('green');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Size configurations
  const sizeConfig = {
    sm: { clock: 120, stroke: 2, handLength: { hour: 20, minute: 35, second: 40 } },
    md: { clock: 200, stroke: 3, handLength: { hour: 30, minute: 55, second: 65 } },
    lg: { clock: 300, stroke: 4, handLength: { hour: 45, minute: 80, second: 95 } }
  };

  const config = sizeConfig[size];
  const centerX = config.clock / 2;
  const centerY = config.clock / 2;
  const radius = config.clock / 2 - 10;

  // Calculate elapsed time and remaining SLA
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Validate and parse start time
  let startDate: Date;
  try {
    startDate = new Date(startTime);
    if (isNaN(startDate.getTime())) {
      console.warn('Invalid startTime provided to ClockTimer, using fallback');
      startDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago as fallback
    }
  } catch (error) {
    console.warn('Error parsing startTime in ClockTimer, using fallback', error);
    startDate = new Date(Date.now() - 60 * 60 * 1000);
  }

  const elapsedMs = currentTime.getTime() - startDate.getTime();
  const elapsedMinutes = Math.max(0, elapsedMs / (1000 * 60));
  const remainingMinutes = Math.max(0, slaTimeMinutes - elapsedMinutes);
  const remainingPercentage = slaTimeMinutes > 0 ? (remainingMinutes / slaTimeMinutes) * 100 : 0;
  const isExceeded = elapsedMinutes > slaTimeMinutes;

  // Determine clock state
  useEffect(() => {
    if (isExceeded) {
      setClockState('exceeded');
    } else if (remainingPercentage <= 20) {
      setClockState('red');
    } else if (remainingPercentage <= 50) {
      setClockState('yellow');
    } else {
      setClockState('green');
    }
  }, [remainingPercentage, isExceeded]);

  // Play warning sound in red zone (once)
  useEffect(() => {
    if (clockState === 'red' && soundEnabled && !audioRef.current) {
      try {
        // Create a subtle tick sound using Web Audio API
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
        
        audioRef.current = { play: () => {} } as any; // Mark as played
      } catch (error) {
        console.warn('Audio not supported:', error);
      }
    }
  }, [clockState, soundEnabled]);

  // Calculate hand angles
  const now = isExceeded ? startDate : currentTime;
  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const hourAngle = (hours * 30 + minutes * 0.5 - 90) * (Math.PI / 180);
  const minuteAngle = (minutes * 6 + seconds * 0.1 - 90) * (Math.PI / 180);
  const secondAngle = (seconds * 6 - 90) * (Math.PI / 180);

  // Clock colors based on state
  const clockColors = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-300',
      ring: 'ring-green-200',
      text: 'text-green-700',
      hand: '#10b981',
      tick: '#059669'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-400',
      ring: 'ring-yellow-300',
      text: 'text-yellow-700',
      hand: '#eab308',
      tick: '#ca8a04'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      ring: 'ring-red-400',
      text: 'text-red-700',
      hand: '#ef4444',
      tick: '#dc2626'
    },
    exceeded: {
      bg: 'bg-red-100',
      border: 'border-red-700',
      ring: 'ring-red-600',
      text: 'text-red-900',
      hand: '#991b1b',
      tick: '#7f1d1d'
    }
  };

  const colors = clockColors[clockState];

  // Format time display
  const formatTime = (minutes: number) => {
    if (minutes < 0) {
      const over = Math.abs(minutes);
      return `+${Math.floor(over)}:${Math.floor((over % 1) * 60).toString().padStart(2, '0')}`;
    }
    return `${Math.floor(minutes)}:${Math.floor((minutes % 1) * 60).toString().padStart(2, '0')}`;
  };

  // Generate clock marks
  const generateMarks = () => {
    const marks = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const x1 = centerX + (radius - 8) * Math.cos(angle);
      const y1 = centerY + (radius - 8) * Math.sin(angle);
      const x2 = centerX + radius * Math.cos(angle);
      const y2 = centerY + radius * Math.sin(angle);
      marks.push(
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={colors.tick}
          strokeWidth={2}
        />
      );
    }
    return marks;
  };

  // Pulse animation for yellow/red zones
  const shouldPulse = clockState === 'yellow' || clockState === 'red';
  const shouldShake = clockState === 'red' && !isExceeded;

  // Ensure we have valid values
  if (!slaTimeMinutes || slaTimeMinutes <= 0) {
    console.warn('ClockTimer: Invalid slaTimeMinutes, using default 240 minutes');
  }

  return (
    <div className={cn('flex flex-col items-center gap-2 w-full', className)}>
      {/* Clock Container */}
      <motion.div
        className={cn(
          'relative rounded-full border-4 shadow-lg flex-shrink-0',
          colors.bg,
          colors.border,
          shouldPulse && 'ring-4',
          colors.ring
        )}
        style={{
          width: config.clock,
          height: config.clock,
          minWidth: config.clock,
          minHeight: config.clock
        }}
        animate={{
          scale: shouldPulse && !isExceeded ? [1, 1.05, 1] : 1,
        }}
        transition={{
          duration: 5,
          repeat: shouldPulse && !isExceeded ? Infinity : 0,
          ease: 'easeInOut'
        }}
        whileHover={{ scale: 1.02 }}
      >
        {/* Shake animation for red zone */}
        {shouldShake && (
          <motion.div
            animate={{
              x: [0, -2, 2, -2, 2, 0],
              y: [0, 2, -2, 2, -2, 0]
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatDelay: 9.5
            }}
            className="absolute inset-0"
          >
            <svg
              width={config.clock}
              height={config.clock}
              className="absolute inset-0"
            >
              <circle
                cx={centerX}
                cy={centerY}
                r={radius}
                fill="none"
                stroke={colors.border}
                strokeWidth={config.stroke}
              />
              {generateMarks()}
              
              {/* Hour hand */}
              {!isExceeded && (
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={centerX + config.handLength.hour * Math.cos(hourAngle)}
                  y2={centerY + config.handLength.hour * Math.sin(hourAngle)}
                  stroke={colors.hand}
                  strokeWidth={config.stroke + 1}
                  strokeLinecap="round"
                />
              )}
              
              {/* Minute hand */}
              {!isExceeded && (
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={centerX + config.handLength.minute * Math.cos(minuteAngle)}
                  y2={centerY + config.handLength.minute * Math.sin(minuteAngle)}
                  stroke={colors.hand}
                  strokeWidth={config.stroke}
                  strokeLinecap="round"
                />
              )}
              
              {/* Second hand - updates every second */}
              {!isExceeded && (
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={centerX + config.handLength.second * Math.cos(secondAngle)}
                  y2={centerY + config.handLength.second * Math.sin(secondAngle)}
                  stroke={colors.hand}
                  strokeWidth={1}
                  strokeLinecap="round"
                  style={{
                    transition: 'transform 0.3s ease-out'
                  }}
                />
              )}
              
              {/* Center dot */}
              <circle
                cx={centerX}
                cy={centerY}
                r={4}
                fill={colors.hand}
              />
            </svg>
          </motion.div>
        )}
        
        {/* Normal clock (when not shaking) */}
        {!shouldShake && (
          <svg
            width={config.clock}
            height={config.clock}
            className="absolute inset-0"
          >
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke={colors.border}
              strokeWidth={config.stroke}
            />
            {generateMarks()}
            
            {/* Hour hand */}
            {!isExceeded && (
              <line
                x1={centerX}
                y1={centerY}
                x2={centerX + config.handLength.hour * Math.cos(hourAngle)}
                y2={centerY + config.handLength.hour * Math.sin(hourAngle)}
                stroke={colors.hand}
                strokeWidth={config.stroke + 1}
                strokeLinecap="round"
              />
            )}
            
            {/* Minute hand */}
            {!isExceeded && (
              <line
                x1={centerX}
                y1={centerY}
                x2={centerX + config.handLength.minute * Math.cos(minuteAngle)}
                y2={centerY + config.handLength.minute * Math.sin(minuteAngle)}
                stroke={colors.hand}
                strokeWidth={config.stroke}
                strokeLinecap="round"
              />
            )}
            
            {/* Second hand - updates every second */}
            {!isExceeded && (
              <line
                x1={centerX}
                y1={centerY}
                x2={centerX + config.handLength.second * Math.cos(secondAngle)}
                y2={centerY + config.handLength.second * Math.sin(secondAngle)}
                stroke={colors.hand}
                strokeWidth={1}
                strokeLinecap="round"
                style={{
                  transition: 'transform 0.3s ease-out'
                }}
              />
            )}
            
            {/* Center dot */}
            <circle
              cx={centerX}
              cy={centerY}
              r={4}
              fill={colors.hand}
            />
          </svg>
        )}

        {/* SLA Exceeded Overlay */}
        {isExceeded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={cn('text-lg font-bold', colors.text)}>
                ⚠ SLA EXCEEDED
              </div>
              <div className={cn('text-sm mt-1', colors.text)}>
                {formatTime(elapsedMinutes - slaTimeMinutes)} over
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Time Information */}
      <div className="text-center space-y-1">
        {stageName && (
          <div className="text-xs font-medium text-gray-600">{stageName}</div>
        )}
        <div className={cn('text-xs font-semibold', colors.text)}>
          {isExceeded ? (
            <span>Exceeded by {formatTime(elapsedMinutes - slaTimeMinutes)}</span>
          ) : (
            <span>{formatTime(remainingMinutes)} remaining</span>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {Math.round(remainingPercentage)}% remaining
        </div>
      </div>

      {/* Controls - Only show on hover or when needed */}
      <div className="flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="h-6 w-6 p-0"
          title={soundEnabled ? 'Disable sound' : 'Enable sound'}
        >
          {soundEnabled ? (
            <Volume2 className="h-3 w-3" />
          ) : (
            <VolumeX className="h-3 w-3" />
          )}
        </Button>
        {onDisable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDisable}
            className="h-6 w-6 p-0"
            title="Disable clock"
          >
            <Settings className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Accessibility: Text indicator for colorblind users */}
      <div className="sr-only" aria-live="polite">
        {clockState === 'green' && 'Clock status: On track, more than 50% time remaining'}
        {clockState === 'yellow' && 'Clock status: Warning, less than 50% time remaining'}
        {clockState === 'red' && 'Clock status: Critical, less than 20% time remaining'}
        {clockState === 'exceeded' && 'Clock status: SLA exceeded'}
      </div>
    </div>
  );
};

export default ClockTimer;

