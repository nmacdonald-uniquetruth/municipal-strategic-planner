import React, { useMemo } from 'react';
import { runProForma } from '../components/machias/FinancialModel';
import ProFormaTable from '../components/machias/ProFormaTable';
import ProFormaChart from '../components/machias/ProFormaChart';
import SectionHeader from '../components/machias/SectionHeader';
import { TrendingUp } from 'lucide-react';

export default function ProForma() {
  const data = useMemo(() => runProForma(), []);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="5-Year Financial Pro Forma"
        subtitle="Base case — all figures from Machias Restructuring Model v3.1"
        icon={TrendingUp}
      />

      <ProFormaChart data={data} />

      <ProFormaTable data={data} />

      <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-5">
        <h3 className="text-sm font-semibold text-amber-800 mb-2">Key Notes</h3>
        <ul className="text-xs text-amber-700 space-y-1.5">
          <li>• Enterprise overhead ($121K+) is pre-existing — it's NOT restructuring revenue, it establishes Year 1 cost-neutrality</li>
          <li>• Comstar fee avoided grows from $49,548 (Y1) to ~$58K by Y5 as transport volume grows 2%/yr</li>
          <li>• Billing Specialist cost funded by Ambulance Fund; not a General Fund expense</li>
          <li>• Year 1 gap of ~$90K covered by Ambulance fund balance draw (recommended) — see Enterprise Funds page</li>
          <li>• Growth positions (Revenue Coordinator Y3, Controller Y5) are trigger-based and require Select Board vote</li>
          <li>• All salaries budgeted at worst-case Family health tier ($30,938/yr employer cost per FT employee)</li>
        </ul>
      </div>
    </div>
  );
}