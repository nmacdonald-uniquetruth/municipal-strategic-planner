import React from 'react';
import { Download, FileText, Calendar, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DepartmentProposalDisplay({ proposal }) {
  if (!proposal) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <FileText className="h-12 w-12 mx-auto text-slate-200 mb-3" />
        <p className="text-slate-500">Select a department to generate proposal</p>
      </div>
    );
  }

  const { department, sections, metadata, deptMetadata } = proposal;

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const html = document.getElementById('proposal-content').innerHTML;
    const printWindow = window.open('', '', 'width=900,height=1200');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${deptMetadata.label} Regional Service Proposal</title>
          <style>
            body { font-family: 'Raleway', Arial; color: #2f2f30; line-height: 1.6; margin: 0; }
            .page { max-width: 8.5in; margin: 0 auto; padding: 1in; page-break-after: always; }
            h1 { font-size: 28px; color: #344A60; margin-top: 0; }
            h2 { font-size: 18px; color: #344A60; margin-top: 24px; border-bottom: 2px solid #344A60; padding-bottom: 8px; }
            h3 { font-size: 14px; color: #2f2f30; margin-top: 16px; }
            table { width: 100%; border-collapse: collapse; margin: 12px 0; }
            td, th { padding: 8px; border: 1px solid #ddd; text-align: left; }
            th { background: #f3ead6; }
            ul { margin: 8px 0; padding-left: 20px; }
            li { margin: 4px 0; }
            .section { margin: 24px 0; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="page">
            ${html}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <Button onClick={handlePrint} variant="outline" className="gap-2" size="sm">
          <Download className="h-4 w-4" />
          Print PDF
        </Button>
        <Button onClick={handleExport} variant="outline" className="gap-2" size="sm">
          <FileText className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Metadata bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Participating Towns</p>
          <p className="text-lg font-bold text-slate-900">{metadata.participatingTownsCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Active Towns</p>
          <p className="text-lg font-bold text-slate-900">{metadata.activeTownsCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Annual Revenue</p>
          <p className="text-lg font-bold text-emerald-700">${(metadata.annualRevenue / 1000).toFixed(0)}K</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Planning Horizon</p>
          <p className="text-lg font-bold text-blue-700">{metadata.planningHorizon} years</p>
        </div>
      </div>

      {/* Proposal content */}
      <div id="proposal-content" className="rounded-xl border border-slate-200 bg-white p-8 space-y-8 print:border-0 print:p-0">
        {/* Header */}
        <div className="border-b-2 border-slate-900 pb-6">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Regional Service Proposal</p>
          <h1 className="text-3xl font-bold text-slate-900 mt-1">{deptMetadata.label}</h1>
          <p className="text-sm text-slate-600 mt-2">{sections.executiveSummary.overview}</p>
        </div>

        {/* Executive Summary */}
        <Section title={sections.executiveSummary.title}>
          <p className="text-sm text-slate-700 mb-3">{sections.executiveSummary.overview}</p>
          <ul className="text-xs text-slate-600 space-y-1">
            {sections.executiveSummary.keyMetrics.map((m, i) => (
              <li key={i}>• {m}</li>
            ))}
          </ul>
        </Section>

        {/* Service Description */}
        <Section title={sections.serviceDescription.title}>
          <p className="text-sm text-slate-700 mb-3"><strong>Scope:</strong> {sections.serviceDescription.overview}</p>
          <div>
            <p className="text-xs font-bold text-slate-900 mb-2">Key Outcomes:</p>
            <ul className="text-xs text-slate-600 space-y-1">
              {sections.serviceDescription.scope.map((s, i) => (
                <li key={i}>• {s}</li>
              ))}
            </ul>
          </div>
        </Section>

        {/* Participating Towns */}
        <Section title={sections.participatingTowns.title}>
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Host Town</p>
              <p className="text-slate-900 font-semibold">{sections.participatingTowns.host}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Total Participating</p>
              <p className="text-slate-900 font-semibold">{sections.participatingTowns.participating} towns</p>
            </div>
          </div>
          <table className="text-xs">
            <thead>
              <tr>
                <th>Town</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sections.participatingTowns.towns.map((t, i) => (
                <tr key={i}>
                  <td>{t.name}</td>
                  <td>{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* Staffing Model */}
        <Section title={sections.staffingModel.title}>
          <p className="text-xs text-slate-600 mb-3">{sections.staffingModel.description}</p>
          <table className="text-xs mb-3">
            <thead>
              <tr>
                <th>Position</th>
                <th>Base Salary</th>
                <th>Fully Loaded</th>
              </tr>
            </thead>
            <tbody>
              {sections.staffingModel.positions.map((p, i) => (
                <tr key={i}>
                  <td>{p.title}</td>
                  <td>${p.baseSalary.toLocaleString()}</td>
                  <td>${p.fullyLoaded.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs font-bold text-slate-900">Total Annual Cost: ${sections.staffingModel.totalAnnualCost.toLocaleString()}</p>
        </Section>

        {/* Service Delivery Model */}
        <Section title={sections.serviceDeliveryModel.title}>
          <div className="space-y-2 text-xs text-slate-700">
            <p><strong>Host:</strong> {sections.serviceDeliveryModel.host}</p>
            <p><strong>Structure:</strong> {sections.serviceDeliveryModel.structure}</p>
            <p><strong>Coverage:</strong> {sections.serviceDeliveryModel.coverage}</p>
            <p><strong>Accountability:</strong> {sections.serviceDeliveryModel.accountability}</p>
          </div>
        </Section>

        {/* Financial Model */}
        <Section title={sections.financialModel.title}>
          <table className="text-xs mb-3">
            <tbody>
              <tr>
                <td><strong>Annual Revenue</strong></td>
                <td className="text-right">${sections.financialModel.annualRevenue.toLocaleString()}</td>
              </tr>
              <tr>
                <td><strong>Annual Operating Cost</strong></td>
                <td className="text-right">${sections.financialModel.annualOperatingCost.toLocaleString()}</td>
              </tr>
              <tr className="bg-slate-50">
                <td><strong>Annual Net Cashflow</strong></td>
                <td className={`text-right font-bold ${sections.financialModel.annualNetCashflow > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  ${sections.financialModel.annualNetCashflow.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td><strong>{sections.financialModel.projectedPeriod} Value</strong></td>
                <td className={`text-right font-bold ${sections.financialModel.horizonTotalValue > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  ${sections.financialModel.horizonTotalValue.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* Cost Allocation */}
        <Section title={sections.costAllocationMethod.title}>
          <p className="text-xs text-slate-700 mb-2"><strong>Primary Method:</strong> {sections.costAllocationMethod.primary}</p>
          <p className="text-xs text-slate-600 mb-3">{sections.costAllocationMethod.description}</p>
          <ul className="text-xs text-slate-600 space-y-1">
            {sections.costAllocationMethod.methodology.map((m, i) => (
              <li key={i}>• {m}</li>
            ))}
          </ul>
        </Section>

        {/* Revenue Opportunities */}
        <Section title={sections.revenueOpportunities.title}>
          <ul className="text-xs text-slate-600 space-y-1">
            {sections.revenueOpportunities.opportunities.map((opp, i) => (
              <li key={i}>• {opp}</li>
            ))}
          </ul>
        </Section>

        {/* Cost Savings */}
        <Section title={sections.costSavingsPotential.title}>
          <ul className="text-xs text-slate-600 space-y-1">
            {sections.costSavingsPotential.savingsCategory.map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </Section>

        {/* Risk Factors */}
        <Section title={sections.riskFactors.title}>
          <div className="space-y-2">
            {sections.riskFactors.risks.map((r, i) => (
              <div key={i} className="text-xs">
                <p className="font-bold text-slate-900">{r.risk}</p>
                <p className="text-slate-600 ml-3"><em>Mitigation: {r.mitigation}</em></p>
              </div>
            ))}
          </div>
        </Section>

        {/* Implementation Timeline */}
        <Section title={sections.implementationTimeline.title}>
          <div className="space-y-3">
            {sections.implementationTimeline.phases.map((p, i) => (
              <div key={i} className="text-xs">
                <p className="font-bold text-slate-900">{p.phase}</p>
                <p className="text-slate-600 mb-1">{p.duration}</p>
                <ul className="text-slate-600 space-y-0.5 ml-3">
                  {p.tasks.map((t, j) => (
                    <li key={j}>• {t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        {/* Governance */}
        <Section title={sections.governanceModel.title}>
          <div className="text-xs text-slate-700 space-y-2">
            <p><strong>Structure:</strong> {sections.governanceModel.structure}</p>
            <div>
              <p className="font-bold mb-1">Responsibilities:</p>
              <ul className="text-slate-600 space-y-0.5 ml-3">
                {sections.governanceModel.responsibilities.map((r, i) => (
                  <li key={i}>• {r}</li>
                ))}
              </ul>
            </div>
            <p><strong>Staffing:</strong> {sections.governanceModel.staffing}</p>
          </div>
        </Section>

        {/* Contract */}
        <Section title={sections.contractStructure.title}>
          <div className="text-xs text-slate-700 space-y-2">
            <p><strong>Agreement Type:</strong> {sections.contractStructure.agreement}</p>
            <div>
              <p className="font-bold mb-1">Key Terms:</p>
              <ul className="text-slate-600 space-y-0.5 ml-3">
                {sections.contractStructure.terms.map((t, i) => (
                  <li key={i}>• {t}</li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* Next Steps */}
        <Section title={sections.nextSteps.title}>
          <ol className="text-xs text-slate-600 space-y-1">
            {sections.nextSteps.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </Section>

        {/* Footer */}
        <div className="border-t border-slate-200 pt-4 text-[10px] text-slate-500">
          <p>Generated {new Date(metadata.generatedDate).toLocaleDateString()} | {metadata.planningHorizon}-Year Planning Horizon</p>
          <p>All financial figures are dynamically calculated from the Machias Strategic Plan financial model.</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900 mb-3">{title}</h2>
      {children}
    </div>
  );
}