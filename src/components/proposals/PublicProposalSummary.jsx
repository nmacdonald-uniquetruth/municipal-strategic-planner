import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { formatProposalSummary } from './publicSummaryFormatter';

export default function PublicProposalSummary({ proposal, onClose }) {
  const [expandedSections, setExpandedSections] = useState({
    whatIsChanging: true,
    whyProposed: true,
    benefits: true,
    costs: true,
    nextSteps: false,
  });

  const summary = formatProposalSummary(proposal);

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
    element.setAttribute('download', `${proposal.title}-summary.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const generatePlainText = (summary) => {
    return `${summary.title}

EXECUTIVE SUMMARY
${summary.summary}

WHAT IS CHANGING
${summary.whatIsChanging.map(item => `• ${item}`).join('\n')}

WHY THIS IS BEING PROPOSED
${summary.whyProposed.join('\n')}

EXPECTED BENEFITS
${summary.benefits.map(item => (item.startsWith('•') ? item : `• ${item}`)).join('\n')}

COST AND TAX IMPACT
${summary.costs.map(item => `• ${item}`).join('\n')}

WHAT HAPPENS NEXT
${summary.nextSteps.map(item => `• ${item}`).join('\n')}

TIMELINE
${summary.timeline || 'Details to be determined'}
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
              <CardTitle className="text-2xl text-white">{summary.title}</CardTitle>
              <CardDescription className="text-slate-300 mt-2">{summary.summary}</CardDescription>
            </div>
            <Badge className="bg-white text-slate-900 font-medium whitespace-nowrap">
              Public Summary
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* What is Changing */}
          <div className="border-b border-slate-200">
            <SectionButton section="whatIsChanging" label="What is Changing" />
            {expandedSections.whatIsChanging && (
              <div className="p-4 bg-slate-50 space-y-2">
                {summary.whatIsChanging.map((item, idx) => (
                  <p key={idx} className="text-slate-700 leading-relaxed">
                    • {item}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Why Proposed */}
          <div className="border-b border-slate-200">
            <SectionButton section="whyProposed" label="Why This is Being Proposed" />
            {expandedSections.whyProposed && (
              <div className="p-4 bg-slate-50 space-y-3">
                {summary.whyProposed.map((item, idx) => (
                  <p key={idx} className="text-slate-700 leading-relaxed">
                    {item.startsWith('•') ? item : `• ${item}`}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Benefits */}
          <div className="border-b border-slate-200">
            <SectionButton section="benefits" label="Expected Benefits" />
            {expandedSections.benefits && (
              <div className="p-4 bg-emerald-50 space-y-2">
                {summary.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-emerald-600 font-bold mt-1">✓</span>
                    <p className="text-slate-700">{benefit.replace('• ', '')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Costs & Tax Impact */}
          <div className="border-b border-slate-200">
            <SectionButton section="costs" label="Cost and Tax Impact" />
            {expandedSections.costs && (
              <div className="p-4 bg-amber-50 space-y-3">
                {summary.costs.map((cost, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-slate-700">{cost}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Next Steps */}
          <div>
            <SectionButton section="nextSteps" label="What Happens Next" />
            {expandedSections.nextSteps && (
              <div className="p-4 bg-blue-50 space-y-2">
                {summary.nextSteps.map((step, idx) => (
                  <p key={idx} className="text-slate-700 leading-relaxed">
                    • {step}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Timeline */}
          {summary.timeline && (
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <p className="text-sm text-slate-600">
                <strong>Implementation Timeline:</strong> {summary.timeline}
              </p>
            </div>
          )}
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