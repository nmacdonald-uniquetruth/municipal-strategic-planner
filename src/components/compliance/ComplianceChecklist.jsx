import React, { useState } from 'react';
import { CheckCircle2, Circle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const CHECKLIST = [
  {
    category: 'GASB Accounting Principles',
    color: 'blue',
    items: [
      {
        id: 'gasb_fund_accounting',
        label: 'Fund Accounting Structure',
        description: 'Model separates General Fund, Ambulance Fund, and Enterprise Funds per GASB fund accounting requirements.',
        status: 'compliant',
        legalReview: false,
      },
      {
        id: 'gasb_basis',
        label: 'Basis of Accounting Disclosure',
        description: 'Pro-forma outputs note whether projections use modified accrual or full accrual basis (GASB 34).',
        status: 'partial',
        legalReview: true,
        note: 'Requires legal review — auditor must confirm applicable basis for each fund type.',
      },
      {
        id: 'gasb_fund_balance',
        label: 'Fund Balance Classification (GASB 54)',
        description: 'Undesignated fund balance is classified per GASB 54 (non-spendable, restricted, committed, assigned, unassigned).',
        status: 'partial',
        legalReview: true,
        note: 'Requires legal review — classification must be confirmed with finance director.',
      },
      {
        id: 'gasb_tax_abatement',
        label: 'Tax Abatement Disclosure (GASB 77)',
        description: 'If any TIF or tax abatement agreements exist, they must be disclosed in levy calculations.',
        status: 'placeholder',
        legalReview: true,
        note: 'Requires legal review — legal team must identify and document any applicable abatements.',
      },
    ],
  },
  {
    category: 'State Municipal Code (Maine)',
    color: 'amber',
    items: [
      {
        id: 'maine_budget_submission',
        label: 'Budget Submission Deadline Compliance',
        description: 'Planning calendar reflects Maine MRS Title 30-A §2151 requirement for annual municipal budget submission.',
        status: 'compliant',
        legalReview: false,
      },
      {
        id: 'maine_interlocal',
        label: 'Interlocal Agreement Authorization',
        description: 'Regional service contracts are structured under Maine MRS Title 30-A §2201 (Interlocal Cooperation Act).',
        status: 'partial',
        legalReview: true,
        note: 'Requires legal review — each interlocal agreement must be individually authorized by counsel.',
      },
      {
        id: 'maine_warrant',
        label: 'Town Meeting Warrant Requirements',
        description: 'Budget scenarios destined for town meeting include warrant article formatting per Maine MRS Title 30-A §2523.',
        status: 'placeholder',
        legalReview: true,
        note: 'Requires legal review — warrant language must be approved by municipal counsel before publication.',
      },
      {
        id: 'maine_records',
        label: 'Public Records Compliance (MRS Title 1 §400+)',
        description: 'Exported reports and audit logs are formatted to satisfy Maine Freedom of Access Act (FOAA) production requests.',
        status: 'partial',
        legalReview: true,
        note: 'Requires legal review — confirm FOAA applicability to planning software outputs.',
      },
    ],
  },
  {
    category: 'Procurement & Record Retention',
    color: 'slate',
    items: [
      {
        id: 'procurement_policy',
        label: 'Procurement Policy Alignment',
        description: 'Capital project and ERP cost estimates reference Maine Model Procurement Ordinance thresholds for competitive bidding.',
        status: 'partial',
        legalReview: true,
        note: 'Requires legal review — confirm local procurement ordinance thresholds.',
      },
      {
        id: 'retention_7yr',
        label: '7-Year Financial Record Retention',
        description: 'Audit logs, model snapshots, and exported reports are retained for a minimum of 7 years per Maine MRS Title 30-A §2601.',
        status: 'compliant',
        legalReview: false,
      },
      {
        id: 'retention_contracts',
        label: 'Contract Document Retention',
        description: 'Interlocal agreements and regional service contracts retained for duration of agreement + 7 years.',
        status: 'placeholder',
        legalReview: true,
        note: 'Requires legal review — retention period for executed interlocal agreements must be confirmed.',
      },
      {
        id: 'export_audit_trail',
        label: 'Export Audit Trail',
        description: 'Every CSV, JSON, and PDF export is logged with user, timestamp, and exported data version.',
        status: 'compliant',
        legalReview: false,
      },
    ],
  },
  {
    category: 'Local Ordinance (Placeholder)',
    color: 'emerald',
    items: [
      {
        id: 'local_ord_1',
        label: 'Financial Planning Software Authorization',
        description: 'Placeholder: Legal team to insert the specific Town of Machias ordinance authorizing use of this planning tool and its outputs for budgetary purposes.',
        status: 'placeholder',
        legalReview: true,
        note: 'Requires legal review — municipal counsel must confirm whether a formal ordinance or resolution is required.',
      },
      {
        id: 'local_ord_2',
        label: 'Data Governance Policy',
        description: 'Placeholder: Insert reference to any adopted Town data governance or acceptable use policy governing this application.',
        status: 'placeholder',
        legalReview: true,
        note: 'Requires legal review — legal team to fill with adopted policy citation.',
      },
      {
        id: 'local_ord_3',
        label: 'Regional Service Pricing Authority',
        description: 'Placeholder: Confirm which body (Select Board, Town Meeting) has authority to set prices for regional services provided by Machias.',
        status: 'placeholder',
        legalReview: true,
        note: 'Requires legal review — pricing authority source must be confirmed in Town Charter or relevant ordinance.',
      },
    ],
  },
];

const STATUS_CONFIG = {
  compliant:   { label: 'Compliant',   color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2, iconColor: 'text-emerald-600' },
  partial:     { label: 'Partial',     color: 'bg-amber-100 text-amber-800 border-amber-200',       icon: AlertTriangle, iconColor: 'text-amber-500'  },
  placeholder: { label: 'Placeholder', color: 'bg-slate-100 text-slate-600 border-slate-200',       icon: Circle,       iconColor: 'text-slate-400'   },
};

const CATEGORY_COLORS = {
  blue:    'border-blue-200 bg-blue-50/40',
  amber:   'border-amber-200 bg-amber-50/40',
  slate:   'border-slate-200 bg-white',
  emerald: 'border-emerald-200 bg-emerald-50/40',
};

export default function ComplianceChecklist() {
  const [expanded, setExpanded] = useState({});

  const toggle = key => setExpanded(p => ({ ...p, [key]: !p[key] }));

  const totalItems = CHECKLIST.flatMap(c => c.items).length;
  const compliantCount = CHECKLIST.flatMap(c => c.items).filter(i => i.status === 'compliant').length;
  const legalCount = CHECKLIST.flatMap(c => c.items).filter(i => i.legalReview).length;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-center">
          <p className="text-xl font-bold text-emerald-700">{compliantCount}/{totalItems}</p>
          <p className="text-[10px] text-emerald-600 font-medium uppercase tracking-wide mt-0.5">Compliant</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-center">
          <p className="text-xl font-bold text-amber-700">{totalItems - compliantCount - legalCount + CHECKLIST.flatMap(c => c.items).filter(i => i.legalReview && i.status === 'partial').length}</p>
          <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wide mt-0.5">Partial / Action</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
          <p className="text-xl font-bold text-slate-600">{legalCount}</p>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mt-0.5">Legal Review</p>
        </div>
      </div>

      {/* Categories */}
      {CHECKLIST.map(cat => {
        const open = expanded[cat.category] !== false; // default open
        const catCompliant = cat.items.filter(i => i.status === 'compliant').length;
        return (
          <div key={cat.category} className={`rounded-xl border ${CATEGORY_COLORS[cat.color]}`}>
            <button
              onClick={() => toggle(cat.category)}
              className="w-full flex items-center justify-between px-4 py-3 hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-800">{cat.category}</span>
                <Badge variant="secondary" className="text-[10px]">{catCompliant}/{cat.items.length}</Badge>
              </div>
              {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </button>
            {open && (
              <div className="border-t border-current border-opacity-10 divide-y divide-slate-100">
                {cat.items.map(item => {
                  const sc = STATUS_CONFIG[item.status];
                  const StatusIcon = sc.icon;
                  return (
                    <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                      <StatusIcon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${sc.iconColor}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <p className="text-xs font-semibold text-slate-800">{item.label}</p>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${sc.color}`}>
                            {sc.label}
                          </span>
                          {item.legalReview && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold border bg-amber-50 text-amber-700 border-amber-200">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              Legal Review
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">{item.description}</p>
                        {item.note && (
                          <p className="text-[10px] text-amber-600 mt-1 italic">{item.note}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}