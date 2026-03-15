import React, { useState } from 'react';
import {
  ShieldCheck, FileText, Users, Download, AlertTriangle,
  CheckCircle2, Database, Eye, ChevronDown, ChevronUp, Info,
  Scale, Landmark, BookOpen, Gavel, Globe
} from 'lucide-react';
import SectionHeader from '@/components/machias/SectionHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ComplianceChecklist from '@/components/compliance/ComplianceChecklist';
import ComplianceViolationBanner from '@/components/compliance/ComplianceViolationBanner';
import { useComplianceValidation } from '@/components/compliance/useComplianceValidation';
import { COMPLIANCE_CONFIG } from '@/components/compliance/complianceConfig';

// ── Reusable form primitives ─────────────────────────────────────────────────

const ToggleField = ({ label, description, value, onChange, legalNote }) => (
  <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-slate-800">{label}</p>
      <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      {legalNote && <LegalNote text={legalNote} />}
    </div>
    <button
      onClick={() => onChange(!value)}
      className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${value ? 'bg-slate-800' : 'bg-slate-300'}`}
      role="switch"
      aria-checked={value}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);

const SelectField = ({ label, description, value, options, onChange, legalNote }) => (
  <div className="py-3 border-b border-slate-100 last:border-0">
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        {legalNote && <LegalNote text={legalNote} />}
      </div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-[160px]"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  </div>
);

const NumberField = ({ label, description, value, onChange, prefix, suffix, legalNote }) => (
  <div className="py-3 border-b border-slate-100 last:border-0">
    <p className="text-sm font-medium text-slate-800">{label}</p>
    <p className="text-xs text-slate-500 mt-0.5 mb-2">{description}</p>
    {legalNote && <LegalNote text={legalNote} />}
    <div className="flex items-center gap-1 mt-1">
      {prefix && <span className="text-xs text-slate-500">{prefix}</span>}
      <input
        type="number"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-32 text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
      {suffix && <span className="text-xs text-slate-500">{suffix}</span>}
    </div>
  </div>
);

const TextField = ({ label, description, value, onChange, placeholder, legalNote }) => (
  <div className="py-3 border-b border-slate-100 last:border-0">
    <p className="text-sm font-medium text-slate-800">{label}</p>
    <p className="text-xs text-slate-500 mt-0.5 mb-2">{description}</p>
    {legalNote && <LegalNote text={legalNote} />}
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 mt-1"
    />
  </div>
);

const LegalNote = ({ text }) => (
  <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
    <AlertTriangle className="h-3 w-3 flex-shrink-0" />
    {text}
  </p>
);

const SECTION_COLORS = {
  audit:      'border-slate-200 bg-white',
  retention:  'border-blue-200 bg-blue-50/20',
  roles:      'border-amber-200 bg-amber-50/20',
  compliance: 'border-emerald-200 bg-emerald-50/20',
  fiscal:     'border-indigo-200 bg-indigo-50/20',
  capital:    'border-purple-200 bg-purple-50/20',
  debt:       'border-red-200 bg-red-50/20',
  procure:    'border-teal-200 bg-teal-50/20',
};

const SectionCard = ({ colorKey, icon: Icon, title, subtitle, children }) => (
  <div className={`rounded-2xl border ${SECTION_COLORS[colorKey]} p-5`}>
    <div className="flex items-center gap-2 mb-1">
      <Icon className="h-4 w-4 text-slate-600" />
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
    </div>
    {subtitle && <p className="text-[10px] text-slate-500 mb-4 ml-6">{subtitle}</p>}
    {!subtitle && <div className="mb-3" />}
    {children}
  </div>
);

// ── Main page ────────────────────────────────────────────────────────────────

export default function ComplianceSettings() {
  const { violations } = useComplianceValidation();
  const [config, setConfig] = useState(COMPLIANCE_CONFIG);
  const [showJson, setShowJson] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (path, value) => {
    setConfig(prev => {
      const keys = path.split('.');
      const next = JSON.parse(JSON.stringify(prev));
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
    setSaved(false);
  };

  const handleExportConfig = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'machias_compliance_config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Compliance &amp; Environment
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Central configuration for fiscal standards, fund accounting, procurement rules, debt constraints, and regulatory alignment.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={handleExportConfig} className="flex items-center gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            Export Config
          </Button>
          <Button size="sm" onClick={() => setSaved(true)} className="flex items-center gap-1.5 text-xs">
            {saved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            {saved ? 'Saved' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Live compliance violations from model */}
      <div>
        <SectionHeader title="Live Model Compliance Check" subtitle="Violations detected against current model settings" icon={ShieldCheck} />
        <ComplianceViolationBanner violations={violations} />
      </div>

      {/* Legal banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-amber-800">Items Requiring Legal Review</p>
          <p className="text-xs text-amber-700 mt-1">
            Fields marked <strong>⚠ Requires legal review</strong> are structural placeholders that must be validated by municipal counsel before enforcement. This screen does not constitute legal advice.
          </p>
        </div>
      </div>

      {/* ── Compliance Checklist ─────────────────────────────────────── */}
      <div>
        <SectionHeader title="Compliance Checklist" subtitle="Standards &amp; regulations this app operates under" icon={Scale} />
        <ComplianceChecklist />
      </div>

      {/* ── Configuration Grid ───────────────────────────────────────── */}
      <div>
        <SectionHeader title="Configuration Controls" subtitle="Adjust compliance parameters — changes take effect on next model validation" icon={FileText} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4">

          {/* Fiscal Year */}
          <SectionCard colorKey="fiscal" icon={BookOpen} title="Fiscal Year Definition" subtitle="Maine MRS Title 30-A §2151">
            <SelectField
              label="Fiscal Year Start Month"
              description="Municipal fiscal year start per Maine statute. July 1 is the standard."
              value={String(config.fiscalYear.start_month)}
              options={[
                { value: '7', label: 'July (standard — Maine §2151)' },
                { value: '1', label: 'January' },
                { value: '4', label: 'April' },
              ]}
              onChange={v => set('fiscalYear.start_month', parseInt(v))}
            />
            <SelectField
              label="Current Fiscal Year"
              description="The active fiscal year for all projections and budget submissions."
              value={config.fiscalYear.current_fy}
              options={[
                { value: 'FY2027', label: 'FY2027 (Jul 2026 – Jun 2027)' },
                { value: 'FY2028', label: 'FY2028 (Jul 2027 – Jun 2028)' },
              ]}
              onChange={v => set('fiscalYear.current_fy', v)}
            />
            <NumberField
              label="Budget Submission Deadline"
              description="Weeks before fiscal year start that the budget must be submitted."
              value={config.fiscalYear.budget_submission_deadline_weeks_before_fy}
              onChange={v => set('fiscalYear.budget_submission_deadline_weeks_before_fy', v)}
              suffix="weeks before FY start"
            />
          </SectionCard>

          {/* Fund Accounting */}
          <SectionCard colorKey="compliance" icon={Landmark} title="Fund Accounting Structure" subtitle="GASB 34 &amp; 54">
            <SelectField
              label="GASB Primary Standard"
              description="Applicable GASB standard for fund accounting and financial reporting."
              value={config.fundAccounting.gasbStandard}
              options={[
                { value: 'GASB 34', label: 'GASB 34 (Basic Financial Statements)' },
                { value: 'GASB 54', label: 'GASB 54 (Fund Balance Reporting)' },
              ]}
              onChange={v => set('fundAccounting.gasbStandard', v)}
              legalNote="Requires legal review — confirm with external auditor."
            />
            <SelectField
              label="Basis of Accounting"
              description="Modified accrual is standard for governmental funds; full accrual for enterprise funds."
              value={config.fundAccounting.basisOfAccounting}
              options={[
                { value: 'modified_accrual', label: 'Modified Accrual (governmental funds)' },
                { value: 'full_accrual', label: 'Full Accrual (enterprise funds)' },
              ]}
              onChange={v => set('fundAccounting.basisOfAccounting', v)}
              legalNote="Requires legal review — auditor must confirm basis for each fund type."
            />
            <SelectField
              label="Fund Balance Classification"
              description="GASB 54 requires classification into non-spendable, restricted, committed, assigned, and unassigned."
              value={config.fundAccounting.fundBalanceClassification}
              options={[
                { value: 'gasb_54', label: 'GASB 54 (required)' },
              ]}
              onChange={v => set('fundAccounting.fundBalanceClassification', v)}
            />
          </SectionCard>

          {/* Capital Project Accounting */}
          <SectionCard colorKey="capital" icon={FileText} title="Capital Project Accounting" subtitle="GASB 34 §20-23">
            <NumberField
              label="Capitalization Threshold"
              description="Assets at or above this cost are capitalized. Below this threshold are expensed."
              value={config.capital.capitalization_threshold}
              onChange={v => set('capital.capitalization_threshold', v)}
              prefix="$"
              legalNote="Requires legal review — confirm against Town's adopted capital asset policy."
            />
            <NumberField
              label="Minimum Useful Life"
              description="Assets must have a useful life of at least this many years to be capitalized."
              value={config.capital.useful_life_min_years}
              onChange={v => set('capital.useful_life_min_years', v)}
              suffix="years"
            />
            <SelectField
              label="Depreciation Method"
              description="Method used for computing depreciation on capital assets."
              value={config.capital.depreciation_method}
              options={[
                { value: 'straight_line', label: 'Straight-Line (standard)' },
                { value: 'units_of_service', label: 'Units of Service (GASB modified approach)' },
              ]}
              onChange={v => set('capital.depreciation_method', v)}
            />
            <ToggleField
              label="Capitalize ERP Implementation Costs"
              description="ERP implementation costs treated as intangible capital asset per GASB 51."
              value={config.capital.erp_capitalization}
              onChange={v => set('capital.erp_capitalization', v)}
            />
            {config.capital.erp_capitalization && (
              <NumberField
                label="ERP Useful Life"
                description="Years over which ERP implementation cost is amortized."
                value={config.capital.erp_useful_life_years}
                onChange={v => set('capital.erp_useful_life_years', v)}
                suffix="years"
              />
            )}
          </SectionCard>

          {/* Debt & Bond Constraints */}
          <SectionCard colorKey="debt" icon={Scale} title="Debt &amp; Bond Modeling" subtitle="Maine MRS Title 30-A §5702">
            <NumberField
              label="Statutory Debt Limit"
              description="Maximum outstanding debt as a % of total assessed value (Maine MRS 30-A §5702)."
              value={Math.round(config.debt.statutory_debt_limit_pct_of_assessed_value * 100)}
              onChange={v => set('debt.statutory_debt_limit_pct_of_assessed_value', v / 100)}
              suffix="% of assessed value"
              legalNote="Requires legal review — confirm with Town Counsel and State Treasurer."
            />
            <NumberField
              label="Max Debt Service (% of Levy)"
              description="Conservative ceiling: annual debt service should not exceed this % of the annual tax levy."
              value={Math.round(config.debt.max_debt_service_pct_of_levy * 100)}
              onChange={v => set('debt.max_debt_service_pct_of_levy', v / 100)}
              suffix="% of annual levy"
            />
            <SelectField
              label="Bond Authorization Requirement"
              description="Which body must formally authorize general obligation bond issuance."
              value={config.debt.bond_authorization_requires}
              options={[
                { value: 'town_meeting_vote', label: 'Town Meeting Vote (required)' },
                { value: 'select_board', label: 'Select Board Resolution' },
              ]}
              onChange={v => set('debt.bond_authorization_requires', v)}
              legalNote="Requires legal review — confirm against Town Charter and Maine statute."
            />
            <NumberField
              label="Select Board Approval Threshold"
              description="Expenditures above this amount require Select Board approval before commitment."
              value={config.debt.require_select_board_approval_above}
              onChange={v => set('debt.require_select_board_approval_above', v)}
              prefix="$"
              legalNote="Requires legal review — confirm threshold in Town Charter."
            />
          </SectionCard>

          {/* Procurement */}
          <SectionCard colorKey="procure" icon={Gavel} title="Procurement Thresholds" subtitle="Maine Model Procurement Ordinance">
            <NumberField
              label="Informal Quote Threshold"
              description="Below this amount, no formal quotation process is required."
              value={config.procurement.informal_quote_threshold}
              onChange={v => set('procurement.informal_quote_threshold', v)}
              prefix="$"
              legalNote="Requires legal review — confirm against Town's adopted procurement ordinance."
            />
            <NumberField
              label="3-Quote Threshold"
              description="Between informal threshold and this amount: 3 informal quotes required."
              value={config.procurement.three_quote_threshold}
              onChange={v => set('procurement.three_quote_threshold', v)}
              prefix="$"
            />
            <NumberField
              label="Formal Bid / RFP Threshold"
              description="Above this amount: formal sealed bid or competitive RFP required."
              value={config.procurement.formal_bid_threshold}
              onChange={v => set('procurement.formal_bid_threshold', v)}
              prefix="$"
              legalNote="Requires legal review — ERP ($47K) exceeds this threshold and requires RFP."
            />
            <NumberField
              label="Professional Services Threshold"
              description="Professional services (legal, engineering, consulting) above this amount require RFP."
              value={config.procurement.professional_services_threshold}
              onChange={v => set('procurement.professional_services_threshold', v)}
              prefix="$"
            />
            <ToggleField
              label="Cooperative Purchasing Allowed"
              description="Allow use of Maine Cooperative Purchasing Program to satisfy competitive requirements."
              value={config.procurement.cooperative_purchasing_allowed}
              onChange={v => set('procurement.cooperative_purchasing_allowed', v)}
            />
          </SectionCard>

          {/* Public Transparency */}
          <SectionCard colorKey="retention" icon={Globe} title="Public Transparency" subtitle="Maine MRS Title 1 §408-A (FOAA)">
            <ToggleField
              label="Budget Posting Required"
              description="Annual budget must be publicly posted before town meeting."
              value={config.transparency.budget_posting_required}
              onChange={v => set('transparency.budget_posting_required', v)}
            />
            <ToggleField
              label="Annual Audit Public Posting"
              description="Final audited financial statements must be publicly posted."
              value={config.transparency.annual_audit_public_posting}
              onChange={v => set('transparency.annual_audit_public_posting', v)}
            />
            <ToggleField
              label="Interlocal Agreement Public Posting"
              description="All interlocal agreements must be publicly available."
              value={config.transparency.interlocal_agreement_posting}
              onChange={v => set('transparency.interlocal_agreement_posting', v)}
              legalNote="Requires legal review — confirm posting requirements with Town Counsel."
            />
            <NumberField
              label="FOAA Response Window"
              description="Maximum business days to respond to a public records request (Maine FOAA)."
              value={config.transparency.foaa_response_days}
              onChange={v => set('transparency.foaa_response_days', v)}
              suffix="business days"
            />
          </SectionCard>

          {/* Audit Logging */}
          <SectionCard colorKey="audit" icon={Eye} title="Audit Trail Requirements" subtitle="Maine MRS Title 30-A §2601">
            <ToggleField
              label="Enable Audit Logging"
              description="Record all user actions, data changes, and financial model updates."
              value={config.audit.enabled}
              onChange={v => set('audit.enabled', v)}
            />
            <ToggleField
              label="Log Financial Model Changes"
              description="Capture before/after snapshots on every ModelSettings or scenario save."
              value={config.audit.log_financial_changes}
              onChange={v => set('audit.log_financial_changes', v)}
            />
            <ToggleField
              label="Log Export Events"
              description="Record every CSV, JSON, or PDF export with user and timestamp."
              value={config.audit.log_exports}
              onChange={v => set('audit.log_exports', v)}
            />
            <NumberField
              label="Audit Log Retention"
              description="Years to retain detailed audit logs before archival."
              value={config.audit.retention_years}
              onChange={v => set('audit.retention_years', v)}
              suffix="years"
              legalNote="Maine MRS Title 30-A §2601 may mandate 7-year minimum."
            />
            <NumberField
              label="Levy Change Approval Trigger"
              description="Scenarios changing the tax levy by more than this % require Finance Admin approval."
              value={Math.round(config.audit.require_approval_above_levy_change_pct * 100)}
              onChange={v => set('audit.require_approval_above_levy_change_pct', v / 100)}
              suffix="% levy change"
            />
            <NumberField
              label="Legal Review Trigger"
              description="Levy changes above this % additionally require Legal Reviewer sign-off."
              value={Math.round(config.audit.require_legal_review_above_levy_change_pct * 100)}
              onChange={v => set('audit.require_legal_review_above_levy_change_pct', v / 100)}
              suffix="% levy change"
              legalNote="Requires legal review — threshold must be confirmed with Town Counsel."
            />
          </SectionCard>

          {/* Budgeting Standards */}
          <SectionCard colorKey="compliance" icon={Scale} title="Municipal Budgeting Standards" subtitle="GFOA Best Practices; Maine MRS Title 30-A §2151">
            <ToggleField
              label="Balanced Budget Required"
              description="Model must not produce a scenario where expenditures exceed revenues + fund draws."
              value={config.budgeting.balanced_budget_required}
              onChange={v => set('budgeting.balanced_budget_required', v)}
            />
            <NumberField
              label="Fund Balance Minimum (% of Levy)"
              description="GFOA recommends maintaining at least this % of annual levy in undesignated fund balance."
              value={Math.round(config.budgeting.undesignated_fund_balance_min_pct * 100)}
              onChange={v => set('budgeting.undesignated_fund_balance_min_pct', v / 100)}
              suffix="% of annual levy"
            />
            <NumberField
              label="Fund Balance Target (% of Levy)"
              description="GFOA best practice target for undesignated fund balance."
              value={Math.round(config.budgeting.undesignated_fund_balance_target_pct * 100)}
              onChange={v => set('budgeting.undesignated_fund_balance_target_pct', v / 100)}
              suffix="% of annual levy"
            />
            <NumberField
              label="Multi-Year Projection Horizon"
              description="Number of fiscal years included in forward-looking financial model."
              value={config.budgeting.projection_years}
              onChange={v => set('budgeting.projection_years', v)}
              suffix="years"
            />
          </SectionCard>

          {/* Approval Roles */}
          <SectionCard colorKey="roles" icon={Users} title="Approval Workflow &amp; Roles" subtitle="Governance: approval chain for financial model changes">
            <div className="space-y-3">
              <p className="text-xs text-slate-600">Roles that must approve financial changes before they are committed to the canonical model.</p>
              {config.approvals.workflow.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${step.required ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800">{step.role}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Trigger: <span className="font-medium">{step.triggers.replace(/_/g, ' ')}</span></p>
                  </div>
                  <Badge variant={step.required ? 'default' : 'secondary'} className="text-[10px] flex-shrink-0">
                    {step.required ? 'Required' : 'Optional'}
                  </Badge>
                </div>
              ))}
              <LegalNote text="Role enforcement requires legal review against Town Charter and Maine procurement policies." />
            </div>
          </SectionCard>

          {/* Contacts */}
          <SectionCard colorKey="retention" icon={ShieldCheck} title="Compliance Contacts">
            <TextField
              label="Finance Admin"
              description="Primary contact for financial model accuracy and approval workflow."
              value={config.contacts.financeAdmin}
              onChange={v => set('contacts.financeAdmin', v)}
              placeholder="finance@machias.me.gov"
            />
            <TextField
              label="Auditor"
              description="External or internal auditor for annual review and audit log access."
              value={config.contacts.auditor}
              onChange={v => set('contacts.auditor', v)}
              placeholder="audit@maineaudit.gov"
            />
            <TextField
              label="Legal Reviewer"
              description="Municipal counsel for compliance sign-off on flagged items."
              value={config.contacts.legalReviewer}
              onChange={v => set('contacts.legalReviewer', v)}
              placeholder="counsel@machias.me.gov"
              legalNote="Requires legal review — confirm scope of counsel's authority."
            />
            <TextField
              label="Local Ordinance Reference"
              description="Applicable local ordinance(s) governing this planning software."
              value={config.contacts.localOrdinanceRef}
              onChange={v => set('contacts.localOrdinanceRef', v)}
              placeholder="Town of Machias Ordinance §XX-YY"
              legalNote="Requires legal review — fill in actual citation before enforcement."
            />
          </SectionCard>
        </div>
      </div>

      {/* Checklist again — detailed reference */}
      <div>
        <SectionHeader title="Regulatory Reference Checklist" subtitle="Framework compliance status — click categories to expand" icon={BookOpen} />
        <ComplianceChecklist />
      </div>

      {/* JSON config preview */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <button
          onClick={() => setShowJson(!showJson)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors rounded-2xl focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-400"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-800">Machine-Readable Config (JSON)</span>
            <Badge variant="secondary" className="text-[10px]">Live Preview</Badge>
          </div>
          {showJson ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>
        {showJson && (
          <div className="border-t border-slate-100 px-5 pb-5">
            <pre className="mt-4 text-[11px] text-slate-700 bg-slate-50 rounded-xl p-4 overflow-x-auto leading-relaxed max-h-96">
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        <div className="flex items-start gap-2">
          <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-slate-400" />
          <p>
            Configuration defaults only. Items marked ⚠ require sign-off from municipal counsel and/or external auditor before enforcement. The JSON export may be used as input to a formal compliance management system.
            The <code className="bg-slate-200 px-1 rounded text-[10px]">validateScenario()</code> engine in <code className="bg-slate-200 px-1 rounded text-[10px]">complianceConfig.js</code> is referenced by the financial model to surface live violations.
          </p>
        </div>
      </div>
    </div>
  );
}