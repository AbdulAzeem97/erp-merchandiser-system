import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { WastageValidation } from '@/types/inventory';

interface AdditionalSheetPanelProps {
  baseRequiredSheets: number;
  additionalSheets: number;
  onAdditionalSheetsChange: (value: number) => void;
  wastageValidation: WastageValidation | null;
  wastageJustification: string;
  onWastageJustificationChange: (value: string) => void;
  ratioReportSheets?: number | null;
}

export const AdditionalSheetPanel: React.FC<AdditionalSheetPanelProps> = ({
  baseRequiredSheets,
  additionalSheets,
  onAdditionalSheetsChange,
  wastageValidation,
  wastageJustification,
  onWastageJustificationChange,
  ratioReportSheets
}) => {
  // Use ratio report sheets as base if available, otherwise use calculated base
  const effectiveBaseSheets = ratioReportSheets || baseRequiredSheets;
  const totalSheets = effectiveBaseSheets + additionalSheets;
  const suggestedMin = Math.ceil(effectiveBaseSheets * 0.03);
  const suggestedMax = Math.ceil(effectiveBaseSheets * 0.10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Additional Production Sheets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-600">
              {ratioReportSheets ? 'Ratio Report Sheets' : 'Base Required Sheets'}
            </Label>
            <Input
              value={effectiveBaseSheets}
              readOnly
              className="mt-1 bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              {ratioReportSheets 
                ? 'From uploaded ratio report (CSV)' 
                : 'Calculated from optimization'}
            </p>
          </div>
          <div>
            <Label htmlFor="additionalSheets" className="text-sm font-medium">
              Additional Sheets *
            </Label>
            <Input
              id="additionalSheets"
              type="number"
              min="0"
              value={additionalSheets || ''}
              onChange={(e) => onAdditionalSheetsChange(parseInt(e.target.value) || 0)}
              className="mt-1"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Suggested: {suggestedMin} - {suggestedMax} sheets (3-10%)
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-600">Total Sheets For Production</Label>
            <Input
              value={totalSheets}
              readOnly
              className="mt-1 bg-blue-50 font-semibold"
            />
            <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
          </div>
        </div>

        {/* Wastage Validation Messages */}
        {wastageValidation && (
          <div className={`p-3 rounded-lg border ${
            wastageValidation.requiresConfirmation
              ? 'bg-red-50 border-red-200'
              : wastageValidation.requiresJustification
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-start gap-2">
              {wastageValidation.requiresConfirmation ? (
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              ) : wastageValidation.requiresJustification ? (
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  wastageValidation.requiresConfirmation
                    ? 'text-red-800'
                    : wastageValidation.requiresJustification
                    ? 'text-yellow-800'
                    : 'text-green-800'
                }`}>
                  {wastageValidation.message}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Wastage: {wastageValidation.wastagePercentage.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Justification Input */}
        {wastageValidation?.requiresJustification && (
          <div>
            <Label htmlFor="wastageJustification" className="text-sm font-medium">
              Wastage Justification *
            </Label>
            <Textarea
              id="wastageJustification"
              value={wastageJustification}
              onChange={(e) => onWastageJustificationChange(e.target.value)}
              placeholder="Please provide a reason for the additional sheets..."
              className="mt-1"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              Required when wastage exceeds 10%
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">Additional Sheets Guidelines:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>3-10%: Normal wastage buffer (recommended)</li>
                <li>10-25%: Requires justification</li>
                <li>Above 25%: Requires confirmation and strong justification</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdditionalSheetPanel;

