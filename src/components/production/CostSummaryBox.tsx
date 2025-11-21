import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import { CostSummary } from '@/types/inventory';

interface CostSummaryBoxProps {
  costSummary: CostSummary;
}

export const CostSummaryBox: React.FC<CostSummaryBoxProps> = ({ costSummary }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Cost Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Field</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-700">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-3 text-gray-600">Required Sheets</td>
                <td className="py-2 px-3 text-right font-medium">{costSummary.baseSheets}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3 text-gray-600">Additional Sheets</td>
                <td className="py-2 px-3 text-right font-medium">{costSummary.additionalSheets}</td>
              </tr>
              <tr className="border-b bg-blue-50">
                <td className="py-2 px-3 font-semibold text-gray-700">Total Production Sheets</td>
                <td className="py-2 px-3 text-right font-bold text-blue-700">
                  {costSummary.totalSheets}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3 text-gray-600">Cost Per Sheet</td>
                <td className="py-2 px-3 text-right font-medium">
                  ${costSummary.costPerSheet.toFixed(2)}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3 text-gray-600">Material Cost</td>
                <td className="py-2 px-3 text-right font-medium">
                  ${costSummary.materialCost.toFixed(2)}
                </td>
              </tr>
              {costSummary.additionalSheets > 0 && (
                <tr className="border-b">
                  <td className="py-2 px-3 text-gray-600">Wastage Cost</td>
                  <td className="py-2 px-3 text-right font-medium text-orange-600">
                    ${costSummary.wastageCost.toFixed(2)}
                  </td>
                </tr>
              )}
              <tr className="bg-green-50">
                <td className="py-3 px-3 font-bold text-gray-900">Final Total Cost</td>
                <td className="py-3 px-3 text-right font-bold text-green-700 text-lg">
                  ${costSummary.totalCost.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CostSummaryBox;

