import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeName = 'blue' | 'green' | 'purple' | 'orange' | 'teal';

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

const themePalettes: Record<ThemeName, ThemeColors> = {
  blue: {
    primary: '#3B82F6',
    secondary: '#60A5FA',
    background: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  green: {
    primary: '#10B981',
    secondary: '#34D399',
    background: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  purple: {
    primary: '#8B5CF6',
    secondary: '#A78BFA',
    background: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  orange: {
    primary: '#F97316',
    secondary: '#FB923C',
    background: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  teal: {
    primary: '#14B8A6',
    secondary: '#2DD4BF',
    background: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
};

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  availableThemes: ThemeName[];
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('theme') as ThemeName;
    return saved && ['blue', 'green', 'purple', 'orange', 'teal'].includes(saved) 
      ? saved 
      : 'blue';
  });

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const availableThemes: ThemeName[] = ['blue', 'green', 'purple', 'orange', 'teal'];
  const colors = themePalettes[theme];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, availableThemes, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

