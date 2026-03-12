import React, { useMemo } from 'react';
import { runProFormaFromSettings } from '../components/machias/FinancialModelV2';
import { useModel } from '../components/machias/ModelContext';
import ProFormaTable from '../components/machias/ProFormaTable';
import ProFormaChart from '../components/machias/ProFormaChart';
import SectionHeader from '../components/machias/SectionHeader';
import InfoTooltip from '../components/machias/InfoTooltip';
import { Link } from 'react-router-dom';
import { TrendingUp, BookOpen } from 'lucide-react';

const fmt = (n) => n == null ? '—' : `$${Math.abs(Math.round(n)).toLocaleString()}`;

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
          <li>• <strong>{data[0]?.gf?.gfNetLevyImpact <= 0 ? 'Zero tax increase required.' : 'Levy pressure in Year 1 — review assumptions.'}</strong> GF cash offsets (regional contracts, Comstar savings, stipend savings, collection improvement, enterprise transfers) {data[0]?.gf?.gfNetLevyImpact <= 0 ? 'exceed' : 'do not yet cover'} GF-funded costs in Year 1.</li>
          <li>• <strong>Undesignated fund draw Year 1: {data[0]?.gf?.undesignatedDraw === 0 ? 'None required.' : fmt(data[0]?.gf?.undesignatedDraw) + ' required.'}</strong> {data[0]?.gf?.undesignatedDraw === 0 ? 'Operating cash offsets fully cover GF costs.' : `Current undesignated balance is ${fmt(settings.gf_undesignated_balance)}.`}</li>
          <li>• <strong>Year 1 staffing model: {settings.y1_staffing_model === 'parttime_stipend' ? 'Part-time stipend approach.' : 'Full-time Staff Accountant hired Year 1.'}</strong> {settings.y1_staffing_model === 'parttime_stipend' ? `GA duties covered by part-time person funded by GA stipend (${fmt(settings.ga_stipend)}) + clerk stipend reallocation (${fmt(settings.clerk_stipend_realloc)}). Full-time SA hired in Year 2.` : 'Staff Accountant hired at start; GA Coordinator added by Month 4.'}</li>
          <li>• <strong>Collection improvement modeled at {(settings.inhouse_y1_rate * 100).toFixed(1)}% (Y1)</strong> vs current {(settings.comstar_collection_rate * 100).toFixed(1)}% Comstar rate — yields {fmt(data[0]?.value?.collectionImprovement)} additional cash in Y1.</li>
          <li>• <strong>Billing Specialist funded by Ambulance Fund</strong> — not a General Fund line item; removed from GF levy impact calculation.</li>
          <li>• Enterprise overhead transfers ({fmt(data[0]?.value?.enterpriseOverhead)}/yr) are pre-existing and sustain cost coverage — NOT new restructuring revenue.</li>
          <li>• Growth positions (Revenue Coordinator Y3 trigger, {settings.y5_senior_hire === 'controller' ? 'Controller' : '2nd Staff Accountant'} Y5) are trigger-based and require Select Board vote before budgeting.</li>
          <li>• All salaries budgeted at {settings.health_tier} health tier ({fmt(settings.health_tier === 'individual' ? settings.health_individual_annual : settings.health_family_annual)}/yr employer cost per FT employee).</li>
        </ul>
      </div>
      <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-5">
        <h3 className="text-sm font-semibold text-amber-800 mb-2">Year 1 Gap Closure Strategy</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-amber-800">
            <thead><tr className="border-b border-amber-200"><th className="text-left py-1.5">Strategy</th><th className="text-right py-1.5">Amount</th></tr></thead>
            <tbody>
              <tr className="border-b border-amber-100"><td className="py-1.5">Collection rate improvement ({(settings.comstar_collection_rate*100).toFixed(1)}% → {(settings.inhouse_y1_rate*100).toFixed(1)}%)</td><td className="text-right font-mono">+{fmt(data[0]?.value?.collectionImprovement)}</td></tr>
              <tr className="border-b border-amber-100"><td className="py-1.5">Stipend elimination</td><td className="text-right font-mono">+{fmt(settings.stipend_elimination)}</td></tr>
              <tr className="border-b border-amber-100"><td className="py-1.5">Control risk exposure mitigation (50% Y1)</td><td className="text-right font-mono">+{fmt(data[0]?.value?.controlRisk)}</td></tr>
              <tr className="border-b border-amber-100"><td className="py-1.5">Regional services contracts (partial year)</td><td className="text-right font-mono">+{fmt(data[0]?.value?.regionalServices)}</td></tr>
              <tr className="border-b border-amber-100"><td className="py-1.5">Airport inspection savings</td><td className="text-right font-mono">+{fmt(settings.airport_savings)}</td></tr>
              <tr className="font-semibold border-t border-amber-300"><td className="py-1.5">Total immediate cash offsets</td><td className="text-right font-mono">~{fmt((data[0]?.value?.collectionImprovement||0) + (settings.stipend_elimination||0) + (data[0]?.value?.controlRisk||0) + (data[0]?.value?.regionalServices||0) + (settings.airport_savings||0))}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-amber-600 mt-2">Combined with Comstar fee avoided ({fmt(data[0]?.value?.comstarAvoided)} Y1) and enterprise overhead transfers ({fmt(data[0]?.value?.enterpriseOverhead)}), the restructuring is designed to be levy-neutral from Day 1 with {data[0]?.gf?.undesignatedDraw === 0 ? 'no undesignated fund draw required.' : `a ${fmt(data[0]?.gf?.undesignatedDraw)} undesignated draw.`}</p>
      </div>
    </div>
  );
}