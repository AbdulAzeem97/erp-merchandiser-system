import React from 'react';
import { motion } from 'framer-motion';
import { Package, Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
  variant?: 'default' | 'minimal' | 'full';
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Loading...",
  showLogo = true,
  variant = 'default'
}) => {
  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">{message}</span>
        </div>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-white z-50 flex items-center justify-center"
      >
        <div className="text-center">
          {showLogo && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">ERP System</h1>
              <p className="text-gray-600">Merchandiser Management</p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Animated Loading Bars */}
            <div className="flex justify-center gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-8 bg-blue-600 rounded-full"
                  animate={{
                    scaleY: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.1
                  }}
                />
              ))}
            </div>

            <p className="text-gray-600 font-medium">{message}</p>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center h-full bg-gray-50"
    >
      <div className="text-center p-8">
        {showLogo && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-white" />
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {/* Spinner */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-10 h-10 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute top-0 left-0 w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>

          <p className="text-gray-600 font-medium">{message}</p>

          {/* Progress dots */}
          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-600 rounded-full"
                animate={{
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};