import React, { useState } from 'react';
import {
  ShieldCheck, FileText, Clock, Users, Download, AlertTriangle,
  CheckCircle2, Circle, Lock, Database, Eye, ChevronDown, ChevronUp, Info
} from 'lucide-react';
import SectionHeader from '@/components/machias/SectionHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ComplianceChecklist from '@/components/compliance/ComplianceChecklist';
import DEFAULT_COMPLIANCE_CONFIG from '@/components/compliance/complianceConfig';

const SECTION_COLOR = {
  audit:      { border: 'border-slate-200',  bg: 'bg-white',        icon: 'text-slate-600' },
  retention:  { border: 'border-blue-200',   bg: 'bg-blue-50/30',   icon: 'text-blue-700'  },
  roles:      { border: 'border-amber-200',  bg: 'bg-amber-50/30',  icon: 'text-amber-700' },
  settings:   { border: 'border-emerald-200',bg: 'bg-emerald-50/30',icon: 'text-emerald-700'},
};

const ToggleField = ({ label, description, value, onChange, legalNote }) => (
  <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-slate-800">{label}</p>
      <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      {legalNote && (
        <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
          {legalNote}
        </p>
      )}
    </div>
    <button
      onClick={() => onChange(!value)}
      className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${value ? 'bg-slate-800' : 'bg-slate-300'}`}
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
        {legalNote && (
          <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 flex-shrink-0" />
            {legalNote}
          </p>
        )}
      </div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 min-w-[140px]"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  </div>
);

const TextField = ({ label, description, value, onChange, placeholder, legalNote }) => (
  <div className="py-3 border-b border-slate-100 last:border-0">
    <p className="text-sm font-medium text-slate-800">{label}</p>
    <p className="text-xs text-slate-500 mt-0.5 mb-2">{description}</p>
    {legalNote && (
      <p className="text-[10px] text-amber-600 mb-2 flex items-center gap-1">
        <AlertTriangle className="h-3 w-3 flex-shrink-0" />
        {legalNote}
      </p>
    )}
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
    />
  </div>
);

const SectionCard = ({ colorKey, icon: Icon, title, children }) => {
  const c = SECTION_COLOR[colorKey];
  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-5`}>
      <div className={`flex items-center gap-2 mb-4 ${c.icon}`}>
        <Icon className="h-4 w-4" />
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      {children}
    </div>
  );
};

export default function ComplianceSettings() {
  const [config, setConfig] = useState(DEFAULT_COMPLIANCE_CONFIG);
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

  const handleSave = () => setSaved(true);

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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Compliance &amp; Environment</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            App-level standards, data governance, audit controls, and regulatory alignment settings.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={handleExportConfig} className="flex items-center gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            Export Config
          </Button>
          <Button size="sm" onClick={handleSave} className="flex items-center gap-1.5 text-xs">
            {saved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            {saved ? 'Saved' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Legal review banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-amber-800">Items Requiring Legal Review</p>
          <p className="text-xs text-amber-700 mt-1">
            Fields marked <strong>⚠ Requires legal review</strong> are placeholders that must be validated by municipal counsel before enforcement. This screen provides structure and defaults only — it does not constitute legal advice.
          </p>
        </div>
      </div>

      {/* Compliance Checklist */}
      <div>
        <SectionHeader title="Compliance Checklist" subtitle="Standards &amp; regulations this app operates under" icon={ShieldCheck} />
        <ComplianceChecklist />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Audit Logging */}
        <SectionCard colorKey="audit" icon={Eye} title="Audit Logging">
          <ToggleField
            label="Enable Audit Logging"
            description="Record all user actions, data changes, and financial model updates with timestamps and user attribution."
            value={config.audit.enabled}
            onChange={v => set('audit.enabled', v)}
          />
          <ToggleField
            label="Log Financial Model Changes"
            description="Capture before/after snapshots whenever ModelSettings or scenario assumptions are modified."
            value={config.audit.logFinancialChanges}
            onChange={v => set('audit.logFinancialChanges', v)}
          />
          <ToggleField
            label="Log Export Events"
            description="Record every CSV, JSON, or PDF export including the requesting user and timestamp."
            value={config.audit.logExports}
            onChange={v => set('audit.logExports', v)}
          />
          <SelectField
            label="Change History Window"
            description="How long to retain detailed change history in the audit log before archival."
            value={config.audit.retentionYears}
            options={[
              { value: '3', label: '3 years' },
              { value: '5', label: '5 years' },
              { value: '7', label: '7 years (recommended)' },
              { value: '10', label: '10 years' },
            ]}
            onChange={v => set('audit.retentionYears', v)}
            legalNote="Requires legal review — Maine municipal record-retention law may mandate minimum 7 years."
          />
        </SectionCard>

        {/* Data Retention */}
        <SectionCard colorKey="retention" icon={Database} title="Data Retention &amp; Export">
          <SelectField
            label="Scenario Data Retention"
            description="Duration to retain archived or deleted scenarios before permanent removal."
            value={config.retention.scenarioRetentionYears}
            options={[
              { value: '3', label: '3 years' },
              { value: '5', label: '5 years' },
              { value: '7', label: '7 years' },
            ]}
            onChange={v => set('retention.scenarioRetentionYears', v)}
          />
          <SelectField
            label="Financial Model Snapshots"
            description="How long to keep auto-snapshots of the financial model (taken on each save)."
            value={config.retention.snapshotRetentionMonths}
            options={[
              { value: '12', label: '12 months' },
              { value: '24', label: '24 months' },
              { value: '36', label: '36 months' },
              { value: '60', label: '60 months' },
            ]}
            onChange={v => set('retention.snapshotRetentionMonths', v)}
          />
          <div className="py-3">
            <p className="text-sm font-medium text-slate-800 mb-2">Allowed Export Formats</p>
            <div className="flex flex-wrap gap-2">
              {['CSV', 'JSON', 'PDF'].map(fmt => {
                const active = config.retention.exportFormats.includes(fmt);
                return (
                  <button
                    key={fmt}
                    onClick={() => {
                      const fmts = active
                        ? config.retention.exportFormats.filter(f => f !== fmt)
                        : [...config.retention.exportFormats, fmt];
                      set('retention.exportFormats', fmts);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      active
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {fmt}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mt-2">PDF exports include audit watermark when audit logging is enabled.</p>
          </div>
          <ToggleField
            label="Encryption at Rest"
            description="Ensure all stored financial data and audit logs are encrypted at the storage layer."
            value={config.retention.encryptionAtRest}
            onChange={v => set('retention.encryptionAtRest', v)}
            legalNote="Requires legal review — verify against Maine data security statutes and any applicable federal requirements."
          />
        </SectionCard>

        {/* Roles & Approvals */}
        <SectionCard colorKey="roles" icon={Users} title="Roles &amp; Required Approvals">
          <div className="space-y-3">
            <p className="text-xs text-slate-600">Define which roles must approve financial changes before they are applied to the canonical model.</p>
            {config.roles.approvalWorkflow.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${step.required ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800">{step.role}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{step.description}</p>
                  {step.legalNote && (
                    <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                      {step.legalNote}
                    </p>
                  )}
                </div>
                <Badge variant={step.required ? 'default' : 'secondary'} className="text-[10px] flex-shrink-0">
                  {step.required ? 'Required' : 'Optional'}
                </Badge>
              </div>
            ))}
            <p className="text-[10px] text-amber-600 flex items-center gap-1 pt-1">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              Role assignment and enforcement require legal review against municipal charter and procurement policies.
            </p>
          </div>
        </SectionCard>

        {/* Compliance Contacts */}
        <SectionCard colorKey="settings" icon={ShieldCheck} title="Compliance Contacts &amp; Standards">
          <TextField
            label="Finance Admin Contact"
            description="Primary finance administrator responsible for model accuracy."
            value={config.contacts.financeAdmin}
            onChange={v => set('contacts.financeAdmin', v)}
            placeholder="e.g. finance@machias.me.gov"
          />
          <TextField
            label="Auditor Contact"
            description="External or internal auditor for annual review and audit log access."
            value={config.contacts.auditor}
            onChange={v => set('contacts.auditor', v)}
            placeholder="e.g. audit@maineaudit.gov"
          />
          <TextField
            label="Legal Reviewer Contact"
            description="Municipal counsel for compliance sign-off on flagged items."
            value={config.contacts.legalReviewer}
            onChange={v => set('contacts.legalReviewer', v)}
            placeholder="e.g. town.counsel@machias.me.gov"
            legalNote="Requires legal review — confirm scope of counsel's authority over this platform."
          />
          <TextField
            label="Local Ordinance Reference"
            description="Placeholder for legal team: cite the applicable local ordinance(s) governing municipal financial planning software."
            value={config.contacts.localOrdinanceRef}
            onChange={v => set('contacts.localOrdinanceRef', v)}
            placeholder="e.g. Town of Machias Ordinance §XX-YY (placeholder — legal review required)"
            legalNote="Requires legal review — fill in actual ordinance citation before enforcement."
          />
          <SelectField
            label="GASB Compliance Target"
            description="Applicable GASB standard set for financial reporting and model outputs."
            value={config.standards.gasbTarget}
            options={[
              { value: 'gasb_34', label: 'GASB 34 (Basic Financial Statements)' },
              { value: 'gasb_54', label: 'GASB 54 (Fund Balance Reporting)' },
              { value: 'gasb_77', label: 'GASB 77 (Tax Abatement Disclosures)' },
              { value: 'gasb_87', label: 'GASB 87 (Leases)' },
            ]}
            onChange={v => set('standards.gasbTarget', v)}
            legalNote="Requires legal review — confirm applicable GASB standards with your external auditor."
          />
        </SectionCard>
      </div>

      {/* Machine-readable config preview */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <button
          onClick={() => setShowJson(!showJson)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors rounded-2xl"
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
            <pre className="mt-4 text-[11px] text-slate-700 bg-slate-50 rounded-xl p-4 overflow-x-auto leading-relaxed">
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
            This screen provides configuration structure and defaults only. Items marked with ⚠ require sign-off from municipal counsel and/or your external auditor before they are treated as binding policy. The JSON export may be used as input to a formal compliance management system.
          </p>
        </div>
      </div>
    </div>
  );
}