import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import { formatScenarioSummary } from './publicSummaryFormatter';

export default function PublicScenarioSummary({ scenario, onClose }) {
  const [expandedSections, setExpandedSections] = useState({
    assumptions: true,
    outlook: true,
    tradeoffs: false,
  });

  const summary = formatScenarioSummary(scenario);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleDownload = () => {
    const text = generatePlainText(summary);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', `${scenario.name}-summary.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const generatePlainText = (summary) => {
    return `${summary.name}

OVERVIEW
${summary.summary}

KEY ASSUMPTIONS
${summary.keyAssumptions.map(a => `• ${a}`).join('\n')}

FIVE-YEAR OUTLOOK
${summary.fiveYearOutlook}

STRATEGIC TRADEOFFS
${summary.tradeoffs.map(t => `• ${t}`).join('\n')}
`;
  };

  const SectionButton = ({ section, label }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-200 last:border-b-0"
    >
      <h3 className="font-semibold text-slate-900">{label}</h3>
      {expandedSections[section] ? (
        <ChevronUp className="w-5 h-5 text-slate-600" />
      ) : (
        <ChevronDown className="w-5 h-5 text-slate-600" />
      )}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-700 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl text-white">{summary.name}</CardTitle>
              <CardDescription className="text-slate-300 mt-2">{summary.summary}</CardDescription>
            </div>
            <Badge className="bg-white text-slate-900 font-medium whitespace-nowrap">
              Planning Scenario
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Key Assumptions */}
          <div className="border-b border-slate-200">
            <SectionButton section="assumptions" label="Key Assumptions" />
            {expandedSections.assumptions && (
              <div className="p-4 bg-slate-50 space-y-2">
                {summary.keyAssumptions.map((assumption, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-slate-600 font-semibold mt-1">•</span>
                    <p className="text-slate-700">{assumption}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Five-Year Outlook */}
          <div className="border-b border-slate-200">
            <SectionButton section="outlook" label="Five-Year Outlook" />
            {expandedSections.outlook && (
              <div className="p-4 bg-blue-50">
                <p className="text-slate-700 leading-relaxed">{summary.fiveYearOutlook}</p>
              </div>
            )}
          </div>

          {/* Strategic Tradeoffs */}
          <div>
            <SectionButton section="tradeoffs" label="Strategic Tradeoffs" />
            {expandedSections.tradeoffs && (
              <div className="p-4 bg-amber-50 space-y-3">
                {summary.tradeoffs.map((tradeoff, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-amber-600 font-semibold mt-1">⚖</span>
                    <p className="text-slate-700">{tradeoff}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="p-4 border-t border-slate-200 bg-gray-50">
            <p className="text-xs text-slate-600 italic">
              This public summary is intended to explain planning concepts in accessible language. 
              For detailed analysis and financial projections, please contact the Town Manager's office.
            </p>
          </div>
        </CardContent>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-slate-200 bg-slate-50">
          <Button
            onClick={handleDownload}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" /> Download Summary
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="ml-auto"
          >
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}