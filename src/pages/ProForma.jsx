import React, { useMemo } from 'react';
import { runProFormaFromSettings } from '../components/machias/FinancialModelV2';
import { useModel } from '../components/machias/ModelContext';
import ProFormaTable from '../components/machias/ProFormaTable';
import ProFormaChart from '../components/machias/ProFormaChart';
import SectionHeader from '../components/machias/SectionHeader';
import InfoTooltip from '../components/machias/InfoTooltip';
import { Link } from 'react-router-dom';
import { TrendingUp, BookOpen } from 'lucide-react';

export default function ProForma() {
  const { settings } = useModel();
  const data = useMemo(() => runProFormaFromSettings(settings), [settings]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SectionHeader
            title="5-Year Financial Pro Forma"
            subtitle="Base case — all figures from Machias Restructuring Model v3.1"
            icon={TrendingUp}
          />
          <InfoTooltip title="About the Pro Forma model">
            <p>This model projects five fiscal years of financial performance for the Machias administrative restructuring. All figures are driven by the parameters in Model Settings — changing any assumption updates every table, chart, and calculation automatically.</p>
            <p><strong>Value includes:</strong> avoided Comstar fees, EMS collection improvement, regional service contracts, Transfer Station revenue, enterprise overhead, FD/TM capacity recovered, and internal control risk mitigation.</p>
            <p><strong>Costs include:</strong> all new position fully loaded costs (salary + FICA + PERS + WC + health), ERP implementation, and airport stipend.</p>
          </InfoTooltip>
        </div>
        <Link to="/Narrative" className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-400 rounded-lg px-3 py-1.5 transition-all">
          <BookOpen className="h-3.5 w-3.5" />
          Full Narrative
        </Link>
      </div>

      <ProFormaChart data={data} />

      <ProFormaTable data={data} />

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5">
        <h3 className="text-sm font-semibold text-emerald-800 mb-2">General Fund Fiscal Guardrails</h3>
        <ul className="text-xs text-emerald-700 space-y-1.5">
          <li>• <strong>Zero tax increase required.</strong> GF cash offsets (regional contracts, Comstar savings, stipend savings, collection improvement, enterprise transfers) exceed GF-funded costs by Year 1.</li>
          <li>• <strong>No ambulance fund draw.</strong> The Y1 gap is closed through operating cash offsets — no undesignated fund balance draw is required or intended.</li>
          <li>• <strong>Collection improvement modeled at 90%</strong> (vs current 87.4% Comstar rate) — yields ~$27,780 additional cash in Y1 alone.</li>
          <li>• <strong>Billing Specialist funded by Ambulance Fund</strong> — not a General Fund line item; removed from GF levy impact calculation.</li>
          <li>• Enterprise overhead transfers ($121K+) are pre-existing and sustain cost coverage — NOT new restructuring revenue.</li>
          <li>• Growth positions (Revenue Coordinator Y3, Controller Y5) are trigger-based and require Select Board vote before budgeting.</li>
          <li>• All salaries budgeted at worst-case Family health tier ($30,938/yr employer cost per FT employee).</li>
        </ul>
      </div>
      <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-5">
        <h3 className="text-sm font-semibold text-amber-800 mb-2">Year 1 Gap Closure Strategy</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-amber-800">
            <thead><tr className="border-b border-amber-200"><th className="text-left py-1.5">Strategy</th><th className="text-right py-1.5">Amount</th></tr></thead>
            <tbody>
              <tr className="border-b border-amber-100"><td className="py-1.5">Collection rate improvement (87.4% → 90%)</td><td className="text-right font-mono">+$27,780</td></tr>
              <tr className="border-b border-amber-100"><td className="py-1.5">Stipend elimination</td><td className="text-right font-mono">+$26,000</td></tr>
              <tr className="border-b border-amber-100"><td className="py-1.5">Control risk exposure mitigation (50% Y1)</td><td className="text-right font-mono">+$28,000</td></tr>
              <tr className="border-b border-amber-100"><td className="py-1.5">Regional services contracts (partial year)</td><td className="text-right font-mono">+$13,000</td></tr>
              <tr className="border-b border-amber-100"><td className="py-1.5">Airport inspection savings</td><td className="text-right font-mono">+$2,527</td></tr>
              <tr className="font-semibold"><td className="py-1.5">Total immediate cash offsets</td><td className="text-right font-mono">~$97,307</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-amber-600 mt-2">Combined with Comstar fee avoided (~$49,548 Y1) and enterprise overhead transfers ($121K+), the restructuring is designed to be levy-neutral from Day 1 with no undesignated fund draw required.</p>
      </div>
    </div>
  );
}