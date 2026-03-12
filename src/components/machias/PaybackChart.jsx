import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useModel } from './ModelContext';
import { runProFormaFromSettings } from './FinancialModelV2';

// Cash-only items: regional contracts, EMS external, transfer station,
// comstar fee avoided, collection improvement, stipend savings, airport savings.
// Excludes: FD/TM capacity value, control risk mitigation, ERP value, enterprise overhead.
function buildQuarterlyData(settings) {
  const yr = runProFormaFromSettings(settings);

  // Y1 costs are already partial-year from the model. We'll split each annual figure into quarters.
  // For cash revenues, we phase them in as they actually come online:
  //   Q1 (M1-3): stipend savings, airport savings (immediate), partial comstar avoided
  //   Q2 (M4-6): + collection improvement begins, regional contracts partial
  //   Q3 (M7-9): + BS hired, parallel run — no EMS external yet
  //   Q4 (M10-12): + Comstar cutover complete, full collection improvement, first EMS external
  // Y2 onward: annualized / 2 per half-year

  const y1 = yr[0];
  const y2 = yr[1];

  // Y1 cash revenues (true dollars only):
  const y1CashRev = y1.value.comstarAvoided + y1.value.collectionImprovement +
    y1.value.stipendSavings + y1.value.airportSavings +
    y1.value.regionalServices + y1.value.emsExternal + y1.value.transferStation;

  // Y1 costs split across quarters (rough phasing)
  // Q1: SA only (2 months loaded ~$18K), ERP partial (~$5K)
  // Q2: SA full quarter + ERP remaining (~$42K)
  // Q3: SA + BS starts (~$40K)
  // Q4: SA + BS full + GA (~$38K)
  const q1Costs = Math.round(y1.costs.staffAccountant * 0.15 + y1.costs.implementation * 0.4);
  const q2Costs = Math.round(y1.costs.staffAccountant * 0.25 + y1.costs.implementation * 0.4 + y1.costs.airportStipend * 0.25);
  const q3Costs = Math.round(y1.costs.staffAccountant * 0.30 + y1.costs.billingSpecialist * 0.4 + y1.costs.implementation * 0.2 + y1.costs.airportStipend * 0.25);
  const q4Costs = Math.round(y1.costs.staffAccountant * 0.30 + y1.costs.billingSpecialist * 0.6 + y1.costs.gaCoordinator + y1.costs.airportStipend * 0.5);

  // Y1 cash revenue phasing:
  // Q1: stipend + airport only (immediate savings, no contracts yet)
  const q1Rev = Math.round((y1.value.stipendSavings + y1.value.airportSavings) * 0.25);
  // Q2: + comstar avoided (partial) + collection improvement begins + first regional partial
  const q2Rev = Math.round(
    (y1.value.stipendSavings + y1.value.airportSavings) * 0.25 +
    y1.value.comstarAvoided * 0.15 +
    y1.value.collectionImprovement * 0.10 +
    y1.value.regionalServices * 0.10
  );
  // Q3: + full comstar avoided rate, collection ramping, BS parallel
  const q3Rev = Math.round(
    (y1.value.stipendSavings + y1.value.airportSavings) * 0.25 +
    y1.value.comstarAvoided * 0.35 +
    y1.value.collectionImprovement * 0.30 +
    y1.value.regionalServices * 0.35 +
    y1.value.transferStation * 0.10
  );
  // Q4: remainder
  const q4Rev = Math.round(y1CashRev - q1Rev - q2Rev - q3Rev);

  // Y2 split into 2 halves
  const y2CashRev = y2.value.comstarAvoided + y2.value.collectionImprovement +
    y2.value.stipendSavings + y2.value.airportSavings +
    y2.value.regionalServices + y2.value.emsExternal + y2.value.transferStation;
  const y2CostHalf = Math.round(y2.costs.total / 2);
  const y2RevH1 = Math.round(y2CashRev * 0.45);
  const y2RevH2 = Math.round(y2CashRev * 0.55);

  const quarters = [
    { period: 'Q1 (M1-3)', costs: q1Costs, cashRev: q1Rev, milestone: 'SA hired; stipends eliminated' },
    { period: 'Q2 (M4-6)', costs: q2Costs, cashRev: q2Rev, milestone: 'SA operational; Comstar monitoring' },
    { period: 'Q3 (M7-9)', costs: q3Costs, cashRev: q3Rev, milestone: 'BS hired; interlocals executed' },
    { period: 'Q4 (M10-12)', costs: q4Costs, cashRev: q4Rev, milestone: 'BS live; Comstar cutover complete' },
    { period: 'Y2 H1', costs: y2CostHalf, cashRev: y2RevH1, milestone: 'Full contract year; EMS external client 1' },
    { period: 'Y2 H2', costs: y2CostHalf, cashRev: y2RevH2, milestone: 'TS Phase 1; collection steady-state' },
  ];

  let cumNet = 0;
  return quarters.map(q => {
    const net = q.cashRev - q.costs;
    cumNet += net;
    return { ...q, net, cumulative: cumNet };
  });
}

export default function PaybackChart() {
  const { settings } = useModel();
  const data = useMemo(() => buildQuarterlyData(settings), [settings]);
  const breakEvenIdx = data.findIndex(d => d.cumulative >= 0);

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">Quarterly Payback Analysis — Cash Only</h3>
      <p className="text-xs text-slate-400 mb-1">
        True dollars only: regional contracts, Comstar fee avoided, collection improvement, stipend savings, airport savings.
      </p>
      <p className="text-xs text-amber-600 mb-4">
        Excludes non-cash value (FD/TM capacity, control risk mitigation, ERP value, enterprise overhead).
        {breakEvenIdx >= 0 && ` Cash break-even: ${data[breakEvenIdx].period}.`}
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: '#64748b' }} />
          <Tooltip
            formatter={(v, name) => [`$${Number(v).toLocaleString()}`, name]}
            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
          />
          <ReferenceLine y={0} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'Break-even', position: 'insideTopLeft', fontSize: 10, fill: '#f59e0b' }} />
          <Area type="monotone" dataKey="cumulative" stroke="#1e293b" fill="#1e293b" fillOpacity={0.08} strokeWidth={2} name="Cumulative Cash Net" />
          <Area type="monotone" dataKey="cashRev" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 4" name="Period Cash Revenue" />
          <Area type="monotone" dataKey="costs" stroke="#ef4444" fill="#ef4444" fillOpacity={0.06} strokeWidth={1.5} strokeDasharray="4 4" name="Period Costs" />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
        {data.map(d => (
          <div key={d.period} className={`rounded-lg p-3 ${d.cumulative >= 0 ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50'}`}>
            <p className="text-[10px] font-medium text-slate-400 uppercase">{d.period}</p>
            <p className={`text-xs font-semibold mt-0.5 font-mono ${d.cumulative >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              Cum: ${d.cumulative.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">{d.milestone}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-400 mt-3 italic">
        Note: Billing Specialist cost excluded from GF payback (Ambulance Fund sourced). Quarterly phasing is estimated; actual timing depends on hire dates and contract execution.
      </p>
    </div>
  );
}