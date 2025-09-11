import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ModernLoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse';
}

export const ModernLoading: React.FC<ModernLoadingProps> = ({ 
  text = 'Loading...', 
  size = 'md',
  variant = 'spinner'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  if (variant === 'dots') {
    return (
      <div className="flex items-center justify-center space-x-2">
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-blue-600 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
        {text && (
          <span className={`${textSizeClasses[size]} text-gray-600 ml-2`}>
            {text}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className="flex items-center justify-center space-x-3">
        <motion.div
          className={`${sizeClasses[size]} bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full`}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
          }}
        />
        {text && (
          <span className={`${textSizeClasses[size]} text-gray-600`}>
            {text}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center space-x-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className={`${sizeClasses[size]} text-blue-600`} />
      </motion.div>
      {text && (
        <span className={`${textSizeClasses[size]} text-gray-600`}>
          {text}
        </span>
      )}
    </div>
  );
};

// Skeleton loading components
export const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

export const SkeletonTable: React.FC = () => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
    <div className="p-4 border-b border-gray-200">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
    </div>
    <div className="p-4 space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex space-x-4">
          <div className="h-3 bg-gray-200 rounded w-1/6"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/5"></div>
        </div>
      ))}
    </div>
  </div>
);

