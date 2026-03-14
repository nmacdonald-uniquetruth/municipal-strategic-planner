import React, { useRef } from 'react';
import { useModel } from './ModelContext';
import { runProFormaFromSettings } from './FinancialModelV2';
import { Download, FileText } from 'lucide-react';

const fmt  = (n) => n == null ? '—' : `$${Math.abs(Math.round(n)).toLocaleString()}`;
const fmtK = (n) => `$${Math.round(Math.abs(n) / 1000)}K`;
const pct  = (n) => `${(n * 100).toFixed(1)}%`;

export default function ExportExecSummary() {
  const { settings } = useModel();
  const data = runProFormaFromSettings(settings);
  const d1 = data[0];
  const printRef = useRef();

  const cashOnly5yr = data.reduce((sum, d) => {
    const cash = d.value.comstarAvoided + d.value.collectionImprovement +
      d.value.stipendSavings + d.value.airportSavings +
      d.value.regionalServices + d.value.emsExternal + d.value.transferStation;
    return sum + cash - d.costs.total;
  }, 0);
  const cumulative = data.reduce((s, d) => s + d.net, 0);
  const saFL = Math.round(settings.sa_base_salary * (1 + settings.fica_rate + settings.pers_rate + settings.wc_rate) + settings.health_family_annual);
  const bsFL = Math.round(settings.bs_base_salary * (1 + settings.fica_rate + settings.pers_rate + settings.wc_rate) + settings.health_family_annual);
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Machias Administrative Restructuring — Executive Summary</title>
      <style>
        body { font-family: 'Georgia', serif; font-size: 11pt; color: #1e293b; max-width: 750px; margin: 0 auto; padding: 40px; }
        h1 { font-size: 18pt; font-weight: bold; margin-bottom: 4px; }
        h2 { font-size: 13pt; font-weight: bold; border-bottom: 2px solid #1e293b; padding-bottom: 4px; margin-top: 24px; margin-bottom: 12px; }
        h3 { font-size: 11pt; font-weight: bold; margin-top: 16px; margin-bottom: 6px; }
        p { margin: 6px 0; line-height: 1.6; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10pt; }
        th { background: #1e293b; color: white; padding: 6px 10px; text-align: left; font-size: 9pt; }
        td { padding: 5px 10px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) td { background: #f8fafc; }
        .highlight { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 6px; margin: 12px 0; }
        .warning { background: #fffbeb; border: 1px solid #fde68a; padding: 12px; border-radius: 6px; margin: 12px 0; }
        .stats { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; margin: 12px 0; }
        .stat { border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; text-align: center; }
        .stat .val { font-size: 18pt; font-weight: bold; color: #1e293b; }
        .stat .lbl { font-size: 9pt; color: #64748b; }
        .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 9pt; color: #94a3b8; }
        ul { margin: 6px 0; padding-left: 20px; }
        li { margin: 3px 0; }
        @media print { body { padding: 20px; } }
      </style></head><body>${content}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
  };

  return (
    <div>
      <button onClick={handlePrint}
        className="flex items-center gap-2 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-700 transition-colors">
        <Download className="h-3.5 w-3.5" />
        Export Executive Summary
      </button>

      {/* Hidden print content */}
      <div ref={printRef} className="hidden">
        <h1>Town of Machias — Administrative Restructuring</h1>
        <h1 style={{fontSize:'14pt',fontWeight:'normal',marginTop:'2px'}}>Executive Summary — FY2027–FY2031 Strategic Plan</h1>
        <p style={{color:'#64748b',fontSize:'9pt'}}>Prepared: {today} · All figures reflect current model settings · Confidential planning document</p>

        <div className="stats">
          <div className="stat"><div className="val">{fmtK(cashOnly5yr)}</div><div className="lbl">5-Yr Cash Net</div></div>
          <div className="stat"><div className="val">{fmtK(cumulative)}</div><div className="lbl">5-Yr Total Value</div></div>
          <div className="stat"><div className="val">{d1.gf.gfNetLevyImpact <= 0 ? 'Neutral' : 'Review'}</div><div className="lbl">Y1 Tax Impact</div></div>
          <div className="stat"><div className="val">3</div><div className="lbl">New Positions (Ph.1)</div></div>
        </div>

        <div className="highlight">
          <strong>Core Finding:</strong> The Town of Machias currently spends over $229,000/year in structural inefficiency — executive compensation applied to transactional financial tasks, outsourced billing fees ({fmt(d1.value.comstarAvoided)}/yr to Comstar), and informal stipend arrangements ({fmt(settings.stipend_elimination)}/yr). This plan formalizes that expenditure into three dedicated positions at the appropriate staffing level, with no property tax increase required.
        </div>

        <h2>Context</h2>
        <p>Machias is the county seat of Washington County, Maine. The town serves as the regional hub for county government, judicial services, and healthcare in a sparsely populated coastal and inland region. The restructuring described in this plan is designed to strengthen Machias's capacity to deliver professional municipal services while leveraging regional relationships with smaller neighboring communities.</p>

        <h2>The Problem</h2>
        <p>The Finance Director ({fmt(settings.fd_loaded_cost)}/yr fully loaded) currently spends an estimated 45% of time on transactional work — accounts payable, payroll processing, EMS billing oversight, and informal support to neighboring towns. The Town Manager ({fmt(settings.tm_loaded_cost)}/yr) spends 18–22% on financial administration oversight. Simultaneously, Machias pays Comstar {pct(settings.comstar_fee_rate)} of gross EMS collections ({fmt(d1.value.comstarAvoided)}/yr) to manage billing that an in-house specialist can perform at lower cost while improving collection rates. Annual auditors have flagged separation-of-duties deficiencies with an estimated control risk exposure of {fmt(settings.control_risk_exposure)}/year.</p>

        <h2>The Proposed Solution — Three Simultaneous Initiatives</h2>

        <h3>1. Administrative Restructuring — Three New Positions</h3>
        <table>
          <thead><tr><th>Position</th><th>Base Salary</th><th>Fully Loaded</th><th>Y1 Cost</th><th>Fund Source</th></tr></thead>
          <tbody>
            <tr><td>Staff Accountant</td><td>{fmt(settings.sa_base_salary)}</td><td>{fmt(saFL)}</td><td>{fmt(d1.costs.staffAccountant)}</td><td>General Fund</td></tr>
            <tr><td>Billing Specialist</td><td>{fmt(settings.bs_base_salary)}</td><td>{fmt(bsFL)}</td><td>{fmt(d1.costs.billingSpecialist)}</td><td>Ambulance Fund (not GF)</td></tr>
            <tr><td>GA Coordinator</td><td>{fmt(settings.ga_stipend)}</td><td>Stipend</td><td>{fmt(d1.costs.gaCoordinator)}</td><td>General Fund</td></tr>
            <tr><td>Revenue Coord. (Y3 trigger)</td><td>{fmt(settings.rc_base_salary)}</td><td>—</td><td>Triggered</td><td>Regional Revenue</td></tr>
          </tbody>
        </table>

        <h3>2. EMS Billing Transition</h3>
        <p>In-house EMS billing replaces the Comstar contract. Year 1 avoided fees: {fmt(d1.value.comstarAvoided)}. Year 1 collection improvement (87.4% → {(settings.inhouse_y1_rate*100).toFixed(1)}%): {fmt(d1.value.collectionImprovement)}. The Billing Specialist is 100% Ambulance Fund funded — zero General Fund impact.</p>

        <h3>3. Regional Financial Services Program</h3>
        <p>Formal interlocal agreements with Roque Bluffs ({fmt(settings.rb_annual_contract)}/yr) and Machiasport ({fmt(settings.machiasport_annual_contract)}/yr) begin in Year 1. Marshfield added Year 2; Whitneyville and Northfield added Year 3. 5-year total regional revenue: {fmt(data.reduce((s,d)=>s+d.value.regionalServices+d.value.emsExternal,0))}.</p>

        <h3>4. ERP Modernization</h3>
        <p>Replace legacy Trio with a modern fund-accounting platform. Implementation cost: {fmt(settings.erp_y1_cost)} ({fmt(settings.erp_designated_fund_offset)} designated fund offset = {fmt(settings.erp_y1_cost - settings.erp_designated_fund_offset)} net GF). Annual value from Y2: {fmt(settings.erp_annual_value)}/yr. Cannot begin without Staff Accountant in place.</p>

        <h2>General Fund Fiscal Impact — Year 1</h2>
        <table>
          <thead><tr><th>Item</th><th>Amount</th></tr></thead>
          <tbody>
            <tr><td>GF-Funded Position Costs (SA + GA + Airport + ERP)</td><td>{fmt(d1.gf.gfFundedCosts)}</td></tr>
            <tr><td>GF Cash Offsets (regional + Comstar + stipends + overhead)</td><td>({fmt(d1.gf.gfCashOffsets)})</td></tr>
            <tr><td style={{fontWeight:'bold'}}>Net GF Levy Impact</td><td style={{fontWeight:'bold'}}>{d1.gf.gfNetLevyImpact <= 0 ? `(${fmt(Math.abs(d1.gf.gfNetLevyImpact))}) surplus` : fmt(d1.gf.gfNetLevyImpact)}</td></tr>
            <tr><td>Mill Rate Impact</td><td>{d1.gf.millRateImpact.toFixed(4)} mills</td></tr>
            <tr><td>Undesignated Fund Draw</td><td>{d1.gf.undesignatedDraw === 0 ? 'None required' : fmt(d1.gf.undesignatedDraw)}</td></tr>
          </tbody>
        </table>

        <div className={d1.gf.gfNetLevyImpact <= 0 ? 'highlight' : 'warning'}>
          <strong>{d1.gf.gfNetLevyImpact <= 0 ? '✓ Levy Neutral:' : '⚠ Review Required:'}</strong> {d1.gf.gfNetLevyImpact <= 0 ? `The restructuring produces a net General Fund surplus of ${fmt(Math.abs(d1.gf.gfNetLevyImpact))} in Year 1. No tax increase required.` : `Year 1 GF gap of ${fmt(d1.gf.gfNetLevyImpact)} requires review of revenue assumptions.`}
        </div>

        <h2>Five-Year Financial Summary</h2>
        <table>
          <thead><tr><th>Fiscal Year</th><th>Total Costs</th><th>Total Value</th><th>Net</th><th>GF Levy Impact</th></tr></thead>
          <tbody>
            {data.map(d => (
              <tr key={d.year}>
                <td>{d.fiscalYear}</td>
                <td>{fmt(d.costs.total)}</td>
                <td>{fmt(d.value.total)}</td>
                <td style={{fontWeight:'bold',color:d.net>=0?'#166534':'#991b1b'}}>{d.net >= 0 ? fmt(d.net) : `(${fmt(Math.abs(d.net))})`}</td>
                <td style={{color:d.gf.gfNetLevyImpact<=0?'#166534':'#991b1b'}}>{d.gf.gfNetLevyImpact<=0?`(${fmt(Math.abs(d.gf.gfNetLevyImpact))})`:fmt(d.gf.gfNetLevyImpact)}</td>
              </tr>
            ))}
            <tr style={{fontWeight:'bold',background:'#f8fafc'}}>
              <td>5-Year Total</td>
              <td>{fmt(data.reduce((s,d)=>s+d.costs.total,0))}</td>
              <td>{fmt(data.reduce((s,d)=>s+d.value.total,0))}</td>
              <td>{fmt(cumulative)}</td>
              <td>{fmt(data.reduce((s,d)=>s+d.gf.gfNetLevyImpact,0))}</td>
            </tr>
          </tbody>
        </table>

        <h2>Recommended Next Steps</h2>
        <ul>
          <li><strong>Immediate:</strong> Select Board authorizes Staff Accountant recruitment</li>
          <li><strong>Month 1–3:</strong> FD conducts COA analysis; TM initiates interlocal agreement outreach</li>
          <li><strong>Month 7:</strong> Billing Specialist hired; Comstar parallel run begins</li>
          <li><strong>Month 9:</strong> Comstar cutover; interlocal agreements executed</li>
          <li><strong>Town Meeting:</strong> ERP implementation budget approved ({fmt(settings.erp_y1_cost)})</li>
        </ul>

        <div className="footer">
          <p>Town of Machias Administrative Restructuring — FY2027–FY2031 Strategic Plan · Generated {today}</p>
          <p>Note: "Total Value" includes cash revenue, budget impact (avoided costs), and capacity value (FD/TM time redirected). Cash-only 5-year net: {fmtK(cashOnly5yr)}. All figures from live model settings.</p>
        </div>
      </div>
    </div>
  );
}