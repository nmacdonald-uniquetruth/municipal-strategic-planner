import React, { useState } from 'react';
import SectionHeader from '../components/machias/SectionHeader';
import { BookOpen, ExternalLink, FileText, Users, MapPin, DollarSign, Monitor } from 'lucide-react';

const REFS = [
  {
    category: 'Maine Municipal Law & Governance',
    icon: '⚖️',
    items: [
      { title: '30-A M.R.S.A. § 2201 — Interlocal Cooperation Act', type: 'Statute', url: 'https://legislature.maine.gov/statutes/30-A/title30-Asec2201.html', note: 'Legal authority for regional service agreements between Maine municipalities.' },
      { title: '30-A M.R.S.A. Title 30-A — Municipal Code', type: 'Statute', url: 'https://legislature.maine.gov/statutes/30-A/', note: 'Governs Town Manager authority, Select Board powers, budget procedures, enterprise funds.' },
      { title: 'Maine Title 22 — General Assistance (GA) Administration', type: 'Statute', url: 'https://legislature.maine.gov/statutes/22/title22ch1201.html', note: 'GA coordinator statutory requirements. Town Manager responsible for administration.' },
      { title: 'Maine AOS Municipal Accounting Manual', type: 'Reference', url: 'https://www.maine.gov/osa/', note: 'Office of the State Auditor — Chart of Accounts standards and financial reporting requirements for Maine municipalities.' },
      { title: 'Maine PERS Municipal Plan Documents', type: 'Reference', url: 'https://www.mainepers.org/', note: 'Maine Public Employees Retirement System — contribution rates, plan design, enrollment requirements.' },
      { title: 'Maine Municipal Bond Bank', type: 'Reference', url: 'https://www.mmbb.org/', note: 'Primary mechanism for municipal capital borrowing in Maine. Relevant for any capital projects.' },
    ],
  },
  {
    category: 'Financial Management & ERP',
    icon: '💻',
    items: [
      { title: 'GASB Statement No. 34 — Basic Financial Statements (GASB 34)', type: 'Standard', url: 'https://www.gasb.org/standards/gasb-statement-no-34/', note: 'Foundational GAAP standard for governmental financial reporting. Drives ERP requirements for fund accounting, MD&A, and CAFR structure.' },
      { title: 'GFOA Best Practices — Financial Management', type: 'Best Practice', url: 'https://www.gfoa.org/resources/best-practices', note: 'Government Finance Officers Association best practices for budgeting, financial reporting, internal controls, and ERP selection.' },
      { title: 'GFOA — ERP Selection for Local Government', type: 'Guidance', url: 'https://www.gfoa.org/materials/erp-selection', note: 'Comprehensive guide to ERP RFP development, evaluation criteria, and implementation project management.' },
      { title: 'ICMA — Shared Services in Small Municipalities', type: 'Research', url: 'https://icma.org/topics/shared-services', note: 'International City/County Management Association research on interlocal service sharing models and pricing.' },
      { title: 'Tyler Technologies — ERP Pro / Munis', type: 'Vendor', url: 'https://www.tylertech.com/', note: 'Major municipal ERP vendor. Largest installed base in Maine local government.' },
      { title: 'Edmunds GovTech', type: 'Vendor', url: 'https://www.edmundsgov.com/', note: 'NE-focused municipal ERP with Maine references. Strong small municipality focus.' },
      { title: 'OpenGov Financial Suite', type: 'Vendor', url: 'https://opengov.com/', note: 'Cloud-native government financial platform. Strong reporting and transparency features.' },
      { title: 'Black Mountain Software', type: 'Vendor', url: 'https://www.bmsweb.com/', note: 'Small/medium municipal focus. Maine references.' },
    ],
  },
  {
    category: 'EMS Billing & Ambulance Revenue',
    icon: '🚑',
    items: [
      { title: 'Maine EMS — Billing & Reimbursement Guidance', type: 'Reference', url: 'https://www.maine.gov/ems/', note: 'Maine EMS office — state-specific ambulance billing regulations, PCR requirements, and reimbursement guidelines.' },
      { title: 'Comstar — EMS Billing Services', type: 'Vendor', url: 'https://www.comstar-ems.com/', note: 'Current Machias EMS billing vendor. Fee rate confirmed at 5.22% of gross collections.' },
      { title: 'NAEMSE — EMS Revenue Recovery Research', type: 'Research', url: 'https://www.naemse.org/', note: 'National EMS billing benchmarks. Collection rate targets and best practices for in-house vs. outsourced billing.' },
      { title: 'CMS Medicare Ambulance Fee Schedule', type: 'Reference', url: 'https://www.cms.gov/medicare/payment/fee-schedules/ambulance', note: 'Primary reimbursement benchmark for transport coding and billing accuracy. Critical for in-house billing training.' },
    ],
  },
  {
    category: 'Salary Benchmarking',
    icon: '💼',
    items: [
      { title: 'Maine Municipal Association — Annual Wage Survey', type: 'Survey', url: 'https://www.memun.org/', note: 'Maine-specific salary data for Finance Directors, Town Managers, Accountants. Primary benchmark for proposed salaries.' },
      { title: 'GFOA — Municipal Finance Professional Salary Survey', type: 'Survey', url: 'https://www.gfoa.org/salary-survey', note: 'National salary data segmented by population, budget size, and region. Validates Staff Accountant ($65K) and Controller ($85K) estimates.' },
      { title: 'Bureau of Labor Statistics — SOC 13-2011 (Accountants and Auditors)', type: 'Data', url: 'https://www.bls.gov/oes/current/oes132011.htm', note: 'National and Maine-specific wage data for accounting professionals. Maine median: ~$58K; entry-level: $45–55K.' },
      { title: 'Maine DOL — Wage and Occupation Statistics', type: 'Data', url: 'https://www.maine.gov/labor/cwri/oes.html', note: 'Maine occupational employment and wage statistics. Washington County tends 10–15% below statewide median.' },
    ],
  },
  {
    category: 'Transfer Station & Solid Waste',
    icon: '♻️',
    items: [
      { title: 'Maine DEP — Solid Waste Management Program', type: 'Reference', url: 'https://www.maine.gov/dep/waste/', note: 'Licensing requirements, HHW program details, and recycling program resources.' },
      { title: 'Maine Resource Recovery Association (MRRA)', type: 'Association', url: 'https://www.mrra.us/', note: 'Maine-specific transfer station management resources, member agreements, and equipment procurement guidance.' },
      { title: 'EPA — Municipal Solid Waste Landfill Guidance', type: 'Reference', url: 'https://www.epa.gov/landfills/municipal-solid-waste-landfills', note: 'Federal requirements for solid waste facilities.' },
      { title: 'SWANA — Transfer Station Management Best Practices', type: 'Best Practice', url: 'https://swana.org/', note: 'Solid Waste Association of North America — pricing models, cost allocation methodologies, and member agreement structures.' },
    ],
  },
  {
    category: 'Grant Funding Opportunities',
    icon: '💰',
    items: [
      { title: 'USDA Rural Development — Community Facilities Program', type: 'Grant', url: 'https://www.rd.usda.gov/programs-services/community-facilities/', note: 'Grants and loans for essential community facilities in rural areas. Eligible uses: equipment, construction, ERP software. Washington County likely qualifies at highest grant percentage.' },
      { title: 'CDBG — Maine DECD Community Development Block Grant', type: 'Grant', url: 'https://www.maine.gov/decd/community-development/community-development-block-grant', note: 'Federal CDBG funds administered by Maine DECD. Potential for ERP implementation and administrative capacity building.' },
      { title: 'ARPA / State Fiscal Recovery Fund', type: 'Grant', url: 'https://home.treasury.gov/policy-issues/coronavirus/assistance-for-state-local-and-tribal-governments/state-and-local-fiscal-recovery-funds', note: 'If unspent local ARPA funds are available, ERP implementation is an eligible use under government services category.' },
      { title: 'Maine Technology Institute — Digital Infrastructure', type: 'Grant', url: 'https://www.meine.org/', note: 'MTI programs for digital infrastructure in rural Maine. Potential for cloud ERP connectivity support.' },
      { title: 'EDA — Economic Development Administration', type: 'Grant', url: 'https://eda.gov/', note: 'EDA supports regional economic development capacity. Administrative infrastructure improvements can be framed as economic development capacity building.' },
      { title: 'Northern Border Regional Commission (NBRC)', type: 'Grant', url: 'https://www.nbrc.usda.gov/', note: 'NBRC provides grants to distressed communities in northern New England. Machias / Washington County may qualify.' },
    ],
  },
  {
    category: 'Peer Municipality Research',
    icon: '🏙️',
    items: [
      { title: 'ICMA — Small Town Financial Administration Survey', type: 'Research', url: 'https://icma.org/', note: 'Benchmarks for finance staffing ratios in small municipalities. Industry standard: 1 FTE per $2–3M in budget. Machias at $2.87M with 1 FTE is under-staffed.' },
      { title: 'MMA — Maine Town & City Magazine', type: 'Publication', url: 'https://www.memun.org/publications', note: 'Case studies of Maine municipal shared services and financial management reforms.' },
      { title: 'New Hampshire Municipal Association — Shared Services Guide', type: 'Guide', url: 'https://www.nhmunicipal.org/', note: 'NH experience with regional financial services is highly relevant — similar small town structure, same interlocal legal framework pattern.' },
    ],
  },
];

export default function ReferencesAndResearch() {
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = ['all', ...REFS.map(r => r.category)];
  const filtered = activeCategory === 'all' ? REFS : REFS.filter(r => r.category === activeCategory);

  const totalRefs = REFS.reduce((s, r) => s + r.items.length, 0);

  return (
    <div className="space-y-8">
      <SectionHeader title="References, Research & Data Sources" subtitle={`${totalRefs} references across legislation, benchmarks, vendors, and funding sources`} icon={BookOpen} />

      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${activeCategory === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {cat === 'all' ? `All (${totalRefs})` : cat.split(' ').slice(0, 3).join(' ')}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {filtered.map((cat, ci) => (
          <div key={ci} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-base">{cat.icon}</span>
              <h3 className="font-bold text-slate-900 text-sm">{cat.category}</h3>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{cat.items.length} refs</span>
            </div>
            <div className="space-y-2">
              {cat.items.map((item, ii) => (
                <div key={ii} className="rounded-xl border border-slate-200 bg-white p-4 flex items-start gap-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${
                    item.type === 'Statute' ? 'bg-purple-100 text-purple-800' :
                    item.type === 'Grant' ? 'bg-emerald-100 text-emerald-800' :
                    item.type === 'Vendor' ? 'bg-blue-100 text-blue-800' :
                    item.type === 'Survey' || item.type === 'Data' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>{item.type}</span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-900 text-sm">{item.title}</p>
                      <a href={item.url} target="_blank" rel="noopener noreferrer"
                        className="flex-shrink-0 text-slate-400 hover:text-slate-700 transition-colors">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}