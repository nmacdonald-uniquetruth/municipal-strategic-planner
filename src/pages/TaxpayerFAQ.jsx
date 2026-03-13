import React, { useMemo } from 'react';
import { useModel } from '../components/machias/ModelContext';
import { runProFormaFromSettings } from '../components/machias/FinancialModelV2';
import { Download, FileText, Users, DollarSign, TrendingUp, ShieldCheck, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const fmt  = (n) => n == null ? '—' : `$${Math.abs(Math.round(n)).toLocaleString()}`;
const pct  = (n) => `${(n * 100).toFixed(1)}%`;
const fmtK = (n) => {
  const v = Math.abs(n);
  if (v >= 1000000) return `$${(v / 1000000).toFixed(2)}M`;
  return `$${Math.round(v / 1000)}K`;
};

function FAQBlock({ q, a, icon }) {
  const Icon = icon || HelpCircle;
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-start gap-3">
        <div className="flex-shrink-0 h-6 w-6 rounded-lg bg-slate-900 flex items-center justify-center mt-0.5">
          <Icon className="h-3 w-3 text-white" />
        </div>
        <p className="text-sm font-bold text-slate-900 leading-snug">{q}</p>
      </div>
      <div className="px-5 py-4 text-sm text-slate-700 leading-relaxed space-y-2">
        {a}
      </div>
    </div>
  );
}

export default function TaxpayerFAQ() {
  const { settings } = useModel();
  const data = useMemo(() => runProFormaFromSettings(settings), [settings]);

  const s = settings;
  const d1 = data[0];
  const healthAnnual = s.health_tier === 'individual' ? s.health_individual_annual : s.health_family_annual;
  const saFL = Math.round(s.sa_base_salary * (1 + s.fica_rate + s.pers_rate + s.wc_rate) + healthAnnual);
  const bsFL = Math.round(s.bs_base_salary * (1 + s.fica_rate + s.pers_rate + s.wc_rate) + healthAnnual);
  const usePartTime = s.y1_staffing_model === 'parttime_stipend';

  const cashOnly5yr = data.reduce((sum, d) => {
    const cash = d.value.comstarAvoided + d.value.collectionImprovement +
      d.value.stipendSavings + d.value.airportSavings +
      d.value.regionalServices + d.value.emsExternal + d.value.transferStation;
    return sum + cash - d.costs.total;
  }, 0);

  const handleDownload = () => {
    const content = document.getElementById('faq-content');
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Town of Machias — Administrative Restructuring: Taxpayer FAQ</title>
  <style>
    body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; color: #222; line-height: 1.6; padding: 0 20px; }
    h1 { font-size: 22px; border-bottom: 2px solid #222; padding-bottom: 8px; }
    h2 { font-size: 13px; color: #555; font-weight: normal; margin-top: -8px; }
    .block { margin: 24px 0; page-break-inside: avoid; }
    .q { font-size: 15px; font-weight: bold; margin-bottom: 8px; }
    .a { font-size: 14px; color: #333; }
    .footer { margin-top: 40px; font-size: 12px; color: #888; border-top: 1px solid #ddd; padding-top: 12px; }
  </style>
</head>
<body>
  <h1>Town of Machias — Administrative Restructuring</h1>
  <h2>Taxpayer FAQ — Plain Language Guide</h2>
  ${content?.innerHTML || ''}
  <div class="footer">All figures reflect current model settings. For full details, see the Town's Strategic Planning Model.</div>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Machias-Taxpayer-FAQ.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-7 text-white">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-slate-400" />
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Town of Machias — Plain Language</span>
        </div>
        <h1 className="text-xl font-bold leading-tight mb-1">Your Questions, Answered</h1>
        <p className="text-sm text-slate-400 max-w-xl">What the Town's administrative restructuring plan means for residents — in plain language. No jargon.</p>
        <div className="flex gap-4 mt-5">
          <div><p className="text-lg font-bold text-emerald-400">No tax increase</p><p className="text-[10px] text-slate-400">Planned from Year 1</p></div>
          <div><p className="text-lg font-bold text-slate-300">{fmtK(cashOnly5yr)}</p><p className="text-[10px] text-slate-400">Conservative 5-yr cash return</p></div>
          <div><p className="text-lg font-bold text-blue-300">{s.ems_transports.toLocaleString()} calls/yr</p><p className="text-[10px] text-slate-400">Ambulance service volume</p></div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleDownload}>
          <Download className="h-3.5 w-3.5" /> Download FAQ (HTML)
        </Button>
      </div>

      <div id="faq-content" className="space-y-4">
        <FAQBlock
          icon={DollarSign}
          q="Will this raise my property taxes?"
          a={<>
            <p><strong>No.</strong> The plan is designed so that new revenue and savings pay for all new positions — without increasing the property tax levy.</p>
            <p>Here's how: the Town is currently paying a company called Comstar {fmt(d1?.value?.comstarAvoided)} per year to bill for ambulance services. By bringing that in-house, we eliminate that fee. Neighboring towns have asked to pay Machias for financial services. Eliminating some existing stipend arrangements saves money too. Together, these more than cover the cost of the new staff.</p>
            {d1?.gf?.gfNetLevyImpact <= 0
              ? <p className="text-emerald-700 font-semibold">Under the current plan, Year 1 actually produces a small surplus of {fmt(Math.abs(d1?.gf?.gfNetLevyImpact))} in the General Fund.</p>
              : <p className="text-amber-700 font-semibold">There is a small Year 1 gap of {fmt(d1?.gf?.gfNetLevyImpact)} — the Town can cover this from reserves while revenue ramps up.</p>}
          </>}
        />

        <FAQBlock
          icon={Users}
          q="Why is the Town hiring more people? Don't we already have enough staff?"
          a={<>
            <p>This is the right question. The Town isn't hiring more people to do more work — it's hiring the <em>right people</em> to do work that's currently being done by the wrong people, at the wrong cost.</p>
            <p>Right now, the Finance Director (who earns {fmt(s.fd_loaded_cost)}/year in total compensation) spends nearly half their time on routine bookkeeping tasks — processing invoices, managing payroll, overseeing ambulance billing — work that a Staff Accountant earning {fmt(saFL)}/year (all-in) can do just as well.</p>
            <p>The Finance Director's time should be spent on financial strategy, budget planning, and managing the Town's growing regional role. Hiring a Staff Accountant <em>frees</em> that capacity — it doesn't add to the total cost, it right-sizes who is doing what.</p>
          </>}
        />

        <FAQBlock
          icon={ShieldCheck}
          q="What is 'separation of duties' and why does it matter?"
          a={<>
            <p>Separation of duties means that the person who authorizes a payment should not be the same person who records it, and neither should be the person who reconciles the accounts. It's a basic financial control that exists in every well-run organization — public or private.</p>
            <p>Right now, the Town has too few finance staff to achieve this separation. Annual auditors have flagged this. It doesn't mean anyone has done anything wrong — it means the system itself has a gap that creates risk. If an error were made, there would be no independent check to catch it before it became a problem.</p>
            <p>Adding a Staff Accountant restores proper separation of duties and protects taxpayers.</p>
          </>}
        />

        <FAQBlock
          icon={DollarSign}
          q="What's Comstar and why are we paying them so much?"
          a={<>
            <p>Comstar is a private company that bills insurance companies and patients on behalf of Machias's ambulance service. They charge {pct(s.comstar_fee_rate)} of everything they collect — which works out to about {fmt(d1?.value?.comstarAvoided)} per year based on the Town's current ambulance call volume of {s.ems_transports.toLocaleString()} calls.</p>
            <p>The Town is proposing to bring this billing in-house by hiring a Billing Specialist. That position costs {fmt(bsFL)}/year in total (including all benefits). The Comstar fee avoided ({fmt(d1?.value?.comstarAvoided)}/yr) covers a significant portion of that cost, and improved collection rates — from better denial management and direct follow-up — cover the remainder. Together they more than pay for the position.</p>
            <p>The Billing Specialist will also handle other Town billing — airport tie-downs, fire department billing, rental properties, and other accounts receivable — making the position even more valuable.</p>
          </>}
        />

        <FAQBlock
          icon={TrendingUp}
          q="I heard we're going to provide financial services to other towns. Doesn't that put Machias taxpayers at risk?"
          a={<>
            <p>No — and here's why. The Town already provides informal help to neighboring towns at no charge. Neighboring towns want to pay Machias for these services. This plan formalizes that into contracts where those towns pay Machias for the work.</p>
            <p>Every contract is priced to cover the actual cost of providing the service, plus overhead. Machias taxpayers won't subsidize other towns. In fact, the contracts bring in new revenue that helps offset the cost of staff the Town needs anyway.</p>
            <p>Roque Bluffs and Machiasport have already expressed strong interest. Active conversations are underway about starting in FY2027. These relationships are managed by the Finance Director.</p>
          </>}
        />

        <FAQBlock
          icon={FileText}
          q="What is an ERP and why does the Town need one?"
          a={<>
            <p>ERP stands for Enterprise Resource Planning — it's the software the Town uses to manage its finances: track the budget, process payroll, manage accounts, and produce reports for auditors and the public.</p>
            <p>The Town currently uses older software called Trio. It works, but it has limitations: reporting is cumbersome, it doesn't connect well with payroll, and it makes the annual audit more time-consuming and expensive than it should be.</p>
            <p>Modern municipal finance software would automate many manual processes, reduce errors, improve audit quality, and enable the Town to serve neighboring communities more efficiently. The estimated implementation cost is {fmt(s.erp_y1_cost)}, with {fmt(s.erp_designated_fund_offset)} available from a prior designated fund — leaving a net cost of {fmt(s.erp_y1_cost - s.erp_designated_fund_offset)} to appropriate at Town Meeting.</p>
          </>}
        />

        <FAQBlock
          icon={HelpCircle}
          q="What happens if the plans don't work out as projected?"
          a={<>
            <p>The plan is designed with conservative assumptions and multiple layers of protection:</p>
            <ul className="list-disc pl-4 space-y-1 text-sm">
              <li><strong>The ambulance billing savings are substantial even in a worst case.</strong> The Comstar fee avoided ({fmt(d1?.value?.comstarAvoided)}/yr) plus the collection improvement from better denial management combine to cover the Billing Specialist's all-in cost ({fmt(bsFL)}/yr). The position does not need to hit its full collection rate target to justify itself.</li>
              <li><strong>New positions are phased, not all at once.</strong> The Revenue Coordinator and Year 5 senior hire only happen when the revenue is already in hand to pay for them.</li>
              <li><strong>The regional service contracts are supplemental, not structural.</strong> If no neighboring town signs a contract, the plan still works financially — the contracts are upside, not the foundation.</li>
              <li><strong>The Town has reserves.</strong> With {fmt(s.gf_undesignated_balance)} in undesignated General Fund balance, the Town has a financial cushion if Year 1 results come in below projections.</li>
            </ul>
          </>}
        />

        <FAQBlock
          icon={Users}
          q="What decisions does the Select Board need to make, and when?"
          a={<>
            <p>The most immediate action — the one everything else depends on — is for the Select Board to authorize recruiting a Staff Accountant. From there:</p>
            <ul className="list-disc pl-4 space-y-1 text-sm">
              <li><strong>Month 1–3:</strong> Begin drafting service agreements with Roque Bluffs and Machiasport</li>
              <li><strong>Month 7:</strong> Authorize the Billing Specialist position and begin transitioning from Comstar</li>
              <li><strong>Town Meeting:</strong> Vote on ERP budget appropriation ({fmt(s.erp_y1_cost)}, with {fmt(s.erp_designated_fund_offset)} offset available)</li>
              <li><strong>Year 3:</strong> Evaluate Revenue Coordinator hire — only if regional revenue covers the position cost</li>
            </ul>
            <p>Each step will come before the Board with full information before any vote is taken.</p>
          </>}
        />
      </div>

      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700">About This Document</p>
        <p>All dollar figures in this FAQ reflect the Town's current financial model settings and will update if assumptions change. For the full technical analysis, see the Strategic Narrative section of the planning model. For questions, contact the Town Manager's office.</p>
      </div>
    </div>
  );
}