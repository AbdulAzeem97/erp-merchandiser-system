import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check, X, RefreshCw, Droplets, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ModernColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  label?: string;
  placeholder?: string;
  showPreview?: boolean;
  presetColors?: string[];
  className?: string;
}

const DEFAULT_PRESET_COLORS = [
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#FFA500', '#800080', '#008000', '#FFC0CB', '#A52A2A', '#808080',
  '#000000', '#FFFFFF', '#C0C0C0', '#808080', '#800000', '#008080',
  '#000080', '#800080', '#FFD700', '#FF6347', '#32CD32', '#FF1493'
];

const ModernColorPicker: React.FC<ModernColorPickerProps> = ({
  value = '',
  onChange,
  label = 'Color',
  placeholder = 'Select or enter a color',
  showPreview = true,
  presetColors = DEFAULT_PRESET_COLORS,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value);
  const [selectedColor, setSelectedColor] = useState(value);
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCustomColor(value);
    setSelectedColor(value);
  }, [value]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setCustomColor(color);
    onChange(color);
    setIsOpen(false);
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    setSelectedColor(color);
    onChange(color);
  };

  const handleRandomColor = () => {
    const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    handleColorSelect(randomColor);
  };

  const formatColorName = (color: string) => {
    const colorMap: { [key: string]: string } = {
      '#FF0000': 'Red',
      '#00FF00': 'Green', 
      '#0000FF': 'Blue',
      '#FFFF00': 'Yellow',
      '#FF00FF': 'Magenta',
      '#00FFFF': 'Cyan',
      '#FFA500': 'Orange',
      '#800080': 'Purple',
      '#008000': 'Dark Green',
      '#FFC0CB': 'Pink',
      '#A52A2A': 'Brown',
      '#808080': 'Gray',
      '#000000': 'Black',
      '#FFFFFF': 'White',
      '#C0C0C0': 'Silver',
      '#800000': 'Maroon',
      '#008080': 'Teal',
      '#000080': 'Navy',
      '#FFD700': 'Gold',
      '#FF6347': 'Tomato',
      '#32CD32': 'Lime Green',
      '#FF1493': 'Deep Pink'
    };
    return colorMap[color.toUpperCase()] || color;
  };

  const getContrastColor = (hexColor: string) => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  };

  return (
    <div className={`relative ${className}`}>
      <Label className="text-sm font-medium text-gray-700 mb-2 block">{label}</Label>
      
      {/* Color Input Display */}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-start h-10 px-3 bg-white border border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <div className="flex items-center space-x-3 w-full">
            {selectedColor && (
              <div
                className="w-6 h-6 rounded-full border-2 border-gray-200 shadow-sm"
                style={{ backgroundColor: selectedColor }}
              />
            )}
            <span className="text-gray-700 flex-1 text-left">
              {selectedColor ? formatColorName(selectedColor) : placeholder}
            </span>
            <Palette className="w-4 h-4 text-gray-400" />
          </div>
        </Button>

        {/* Color Preview Badge */}
        {showPreview && selectedColor && (
          <div className="absolute -top-2 -right-2">
            <Badge 
              className="text-xs px-2 py-1 shadow-md"
              style={{ 
                backgroundColor: selectedColor,
                color: getContrastColor(selectedColor)
              }}
            >
              {selectedColor.toUpperCase()}
            </Badge>
          </div>
        )}
      </div>

      {/* Color Picker Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <Card className="shadow-xl border-0 bg-white">
              <CardContent className="p-4">
                {/* Tab Navigation */}
                <div className="flex space-x-1 mb-4 bg-gray-100 rounded-lg p-1">
                  <Button
                    type="button"
                    variant={activeTab === 'presets' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('presets')}
                    className="flex-1 text-xs"
                  >
                    <Palette className="w-3 h-3 mr-1" />
                    Presets
                  </Button>
                  <Button
                    type="button"
                    variant={activeTab === 'custom' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('custom')}
                    className="flex-1 text-xs"
                  >
                    <Droplets className="w-3 h-3 mr-1" />
                    Custom
                  </Button>
                </div>

                {/* Preset Colors */}
                {activeTab === 'presets' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-6 gap-2">
                      {presetColors.map((color) => (
                        <motion.button
                          key={color}
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleColorSelect(color)}
                          className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                            selectedColor === color ? 'border-gray-800 shadow-lg' : 'border-gray-200 hover:border-gray-400'
                          }`}
                          style={{ backgroundColor: color }}
                          title={formatColorName(color)}
                        >
                          {selectedColor === color && (
                            <Check 
                              className="w-4 h-4 mx-auto" 
                              style={{ color: getContrastColor(color) }}
                            />
                          )}
                        </motion.button>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRandomColor}
                        className="text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Random
                      </Button>
                      <span className="text-xs text-gray-500">
                        {selectedColor && formatColorName(selectedColor)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Custom Color Input */}
                {activeTab === 'custom' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-600">
                        Hex Color Code
                      </Label>
                      <div className="flex space-x-2">
                        <Input
                          ref={colorInputRef}
                          type="text"
                          value={customColor}
                          onChange={(e) => handleCustomColorChange(e.target.value)}
                          placeholder="#FF0000"
                          className="flex-1 text-sm font-mono"
                        />
                        <input
                          type="color"
                          value={customColor}
                          onChange={(e) => handleCustomColorChange(e.target.value)}
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                      </div>
                    </div>
                    
                    {/* Color Preview */}
                    {customColor && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-600">
                          Preview
                        </Label>
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div
                            className="w-12 h-12 rounded-lg border border-gray-200 shadow-sm"
                            style={{ backgroundColor: customColor }}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {formatColorName(customColor)}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {customColor.toUpperCase()}
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleColorSelect(customColor)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Apply
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Actions */}
                <div className="flex justify-between items-center pt-3 border-t mt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                  {selectedColor && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="text-xs bg-blue-600 hover:bg-blue-700"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Done
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModernColorPicker;
