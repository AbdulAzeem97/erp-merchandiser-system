import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface KPICard {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  gradient: string;
  iconColor: string;
  delay?: number;
}

interface AnimatedKPICardsProps {
  cards: KPICard[];
}

const AnimatedKPICards: React.FC<AnimatedKPICardsProps> = ({ cards }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 0.5, 
            delay: card.delay || index * 0.1,
            ease: [0.4, 0.0, 0.2, 1]
          }}
          whileHover={{ 
            scale: 1.02,
            y: -2,
            transition: { duration: 0.2 }
          }}
          className="group"
        >
          <Card className={`relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${card.gradient}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <motion.p 
                    className="text-white/90 text-sm font-medium tracking-wide"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 + (card.delay || index * 0.1) }}
                  >
                    {card.title}
                  </motion.p>
                  <motion.p 
                    className="text-3xl font-bold text-white"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      delay: 0.3 + (card.delay || index * 0.1),
                      type: "spring",
                      stiffness: 300,
                      damping: 20
                    }}
                  >
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  </motion.p>
                  {card.change && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + (card.delay || index * 0.1) }}
                      className={`flex items-center text-sm font-medium ${
                        card.changeType === 'positive' ? 'text-white/90' :
                        card.changeType === 'negative' ? 'text-red-200' :
                        'text-white/80'
                      }`}
                    >
                      <span>{card.change}</span>
                    </motion.div>
                  )}
                </div>
                
                <motion.div
                  initial={{ opacity: 0, rotate: -45, scale: 0 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  transition={{ 
                    delay: 0.2 + (card.delay || index * 0.1),
                    type: "spring",
                    stiffness: 200,
                    damping: 15
                  }}
                  whileHover={{ 
                    rotate: 10,
                    scale: 1.1,
                    transition: { duration: 0.2 }
                  }}
                  className={`p-3 rounded-full bg-white/20 backdrop-blur-sm ${card.iconColor} group-hover:bg-white/30 transition-all duration-300`}
                >
                  <card.icon className="h-6 w-6" />
                </motion.div>
              </div>
              
              {/* Animated background decoration */}
              <motion.div
                className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.2, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/5 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.1, 0.2],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              />
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default AnimatedKPICards;