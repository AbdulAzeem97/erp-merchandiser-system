import React from 'react';
import { Palette, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme, ThemeName } from '@/contexts/ThemeContext';

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme, availableThemes } = useTheme();

  const themeLabels: Record<ThemeName, string> = {
    blue: 'Blue',
    green: 'Green',
    purple: 'Purple',
    orange: 'Orange',
    teal: 'Teal'
  };

  const themeColors: Record<ThemeName, string> = {
    blue: '#3B82F6',
    green: '#10B981',
    purple: '#8B5CF6',
    orange: '#F97316',
    teal: '#14B8A6'
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          title="Change Theme"
        >
          <Palette className="w-4 h-4" />
          <span>Theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {availableThemes.map((themeName) => (
          <DropdownMenuItem
            key={themeName}
            onClick={() => setTheme(themeName)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border-2 border-gray-300"
                style={{ backgroundColor: themeColors[themeName] }}
              />
              <span>{themeLabels[themeName]}</span>
            </div>
            {theme === themeName && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
