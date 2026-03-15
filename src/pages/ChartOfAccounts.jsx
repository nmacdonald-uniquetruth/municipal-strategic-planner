/**
 * ChartOfAccounts — COA Crosswalk & Migration Engine
 *
 * Tabs:
 *  1. Crosswalk     — full table with search/filter/edit
 *  2. Old → New     — sorted crosswalk listing
 *  3. By Department — dept-grouped view
 *  4. Revenue       — revenue accounts
 *  5. Expenditures  — expenditure accounts
 *  6. Exceptions    — unmapped / flagged accounts
 *  7. Validation    — errors and warnings
 *  8. Import        — paste/upload to seed from TRIO data
 */

import React, { useState, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SectionHeader from '../components/machias/SectionHeader';
import COACrossWalkTable from '../components/coa/COACrossWalkTable';
import COAAccountForm from '../components/coa/COAAccountForm';
import COAValidationPanel from '../components/coa/COAValidationPanel';
import COAGovernancePanel from '../components/coa/COAGovernancePanel';
import COAAuditLogPanel from '../components/coa/COAAuditLogPanel';
import COAExceptionWorkflows from '../components/coa/COAExceptionWorkflows';
import COAImportWorkbook from '../components/coa/COAImportWorkbook';
import { OldToNewView, DepartmentView, RevenueView, ExpenditureView, ExceptionsReport } from '../components/coa/COAReportingViews';
import { validateCrosswall, buildSummaryStats, buildExceptionsReport } from '../components/coa/coaEngine';
import {
  GitMerge, Plus, AlertTriangle, FileText, Upload,
  Table, ArrowRight, Building2, TrendingDown, TrendingUp, CheckCircle,
  Shield, Clock
} from 'lucide-react';

// ── Seed data ─────────────────────────────────────────────────────────────────
const SEED_ACCOUNTS = [
  { trio_account: '01-001-5100', trio_department: 'Administration', trio_object_code: '5100', trio_description: 'Town Manager Salary', trio_historical_budget: 75000, trio_historical_actual: 74800, new_account_number: '01-110-51100', new_account_title: 'Town Manager — Salary', account_type: 'expenditure', fund: 'general_fund', fund_type: 'governmental', department: 'Administration', function_program: 'General Government', natural_account: 'Salaries & Wages', reporting_category: 'salaries_wages', budget_article_mapping: 'Article 4', gasb_34_class: 'governmental_activities', mapping_type: 'one_to_one', mapping_split_percent: 100, validation_status: 'mapped', status: 'active', fiscal_year_effective: 'FY2027', transition_notes: 'Direct 1:1 mapping.', notes: '' },
  { trio_account: '01-001-5200', trio_department: 'Administration', trio_object_code: '5200', trio_description: 'Finance Director Salary', trio_historical_budget: 65000, trio_historical_actual: 64500, new_account_number: '01-120-51100', new_account_title: 'Finance Director — Salary', account_type: 'expenditure', fund: 'general_fund', fund_type: 'governmental', department: 'Administration', function_program: 'General Government', natural_account: 'Salaries & Wages', reporting_category: 'salaries_wages', budget_article_mapping: 'Article 4', gasb_34_class: 'governmental_activities', mapping_type: 'one_to_one', mapping_split_percent: 100, validation_status: 'approved', status: 'active', fiscal_year_effective: 'FY2027', transition_notes: '', notes: '' },
  { trio_account: null, trio_department: null, trio_object_code: null, trio_description: null, trio_historical_budget: 0, trio_historical_actual: 0, new_account_number: '01-130-51100', new_account_title: 'Staff Accountant — Salary', account_type: 'expenditure', fund: 'general_fund', fund_type: 'governmental', department: 'Administration', function_program: 'General Government', natural_account: 'Salaries & Wages', reporting_category: 'salaries_wages', budget_article_mapping: 'Article 4', gasb_34_class: 'governmental_activities', mapping_type: 'one_to_one', mapping_split_percent: 100, validation_status: 'mapped', status: 'active', fiscal_year_effective: 'FY2027', transition_notes: 'New position — no TRIO predecessor.', notes: '' },
  { trio_account: '02-001-5100', trio_department: 'Police', trio_object_code: '5100', trio_description: 'Police Chief & Staff Salaries', trio_historical_budget: 420000, trio_historical_actual: 415000, new_account_number: '02-110-51100', new_account_title: 'Police — Salaries', account_type: 'expenditure', fund: 'general_fund', fund_type: 'governmental', department: 'Police', function_program: 'Public Safety', natural_account: 'Salaries & Wages', reporting_category: 'salaries_wages', budget_article_mapping: 'Article 5', gasb_34_class: 'governmental_activities', mapping_type: 'one_to_one', mapping_split_percent: 100, validation_status: 'mapped', status: 'active', fiscal_year_effective: 'FY2027', transition_notes: '', notes: '' },
  { trio_account: '04-001-5100', trio_department: 'Fire / EMS', trio_object_code: '5100', trio_description: 'Fire Department', trio_historical_budget: 95000, trio_historical_actual: 92000, new_account_number: '04-110-51100', new_account_title: 'Fire — Salaries & Ops', account_type: 'expenditure', fund: 'general_fund', fund_type: 'governmental', department: 'Fire / EMS', function_program: 'Public Safety', natural_account: 'Salaries & Wages', reporting_category: 'salaries_wages', budget_article_mapping: 'Article 6', gasb_34_class: 'governmental_activities', mapping_type: 'one_to_one', mapping_split_percent: 100, validation_status: 'mapped', status: 'active', fiscal_year_effective: 'FY2027', transition_notes: '', notes: '' },
  { trio_account: '04-200-5100', trio_department: 'Ambulance', trio_object_code: '5100', trio_description: 'Ambulance Service', trio_historical_budget: 480000, trio_historical_actual: 475000, new_account_number: '04-200-51100', new_account_title: 'Ambulance — Salaries', account_type: 'expenditure', fund: 'ambulance_fund', fund_type: 'enterprise', department: 'Fire / EMS', function_program: 'EMS', natural_account: 'Salaries & Wages', reporting_category: 'salaries_wages', budget_article_mapping: 'Article 7', gasb_34_class: 'business_type_activities', mapping_type: 'one_to_one', mapping_split_percent: 100, validation_status: 'mapped', status: 'active', fiscal_year_effective: 'FY2027', transition_notes: 'Enterprise fund — separate from GF.', notes: '' },
  { trio_account: '05-001-4100', trio_department: 'Revenue', trio_object_code: '4100', trio_description: 'Excise Tax', trio_historical_budget: 280000, trio_historical_actual: 285000, new_account_number: '00-000-41100', new_account_title: 'Motor Vehicle Excise Tax', account_type: 'revenue', fund: 'general_fund', fund_type: 'governmental', department: 'General Government', function_program: 'Revenue', natural_account: 'Tax Revenue', reporting_category: 'tax_revenue', budget_article_mapping: 'Article 9', gasb_34_class: 'governmental_activities', mapping_type: 'one_to_one', mapping_split_percent: 100, validation_status: 'approved', status: 'active', fiscal_year_effective: 'FY2027', transition_notes: '', notes: '' },
  { trio_account: '05-002-4200', trio_department: 'Revenue', trio_object_code: '4200', trio_description: 'State Revenue Sharing', trio_historical_budget: 160000, trio_historical_actual: 162000, new_account_number: '00-000-42100', new_account_title: 'State Revenue Sharing', account_type: 'revenue', fund: 'general_fund', fund_type: 'governmental', department: 'General Government', function_program: 'Revenue', natural_account: 'Intergovernmental', reporting_category: 'non_tax_revenue', budget_article_mapping: 'Article 9', gasb_34_class: 'governmental_activities', mapping_type: 'one_to_one', mapping_split_percent: 100, validation_status: 'approved', status: 'active', fiscal_year_effective: 'FY2027', transition_notes: '', notes: '' },
  { trio_account: '03-001-5100', trio_department: 'Public Works', trio_object_code: '5100', trio_description: 'Public Works — Personnel', trio_historical_budget: 380000, trio_historical_actual: 372000, new_account_number: '03-110-51100', new_account_title: 'Public Works — Salaries', account_type: 'expenditure', fund: 'general_fund', fund_type: 'governmental', department: 'Public Works', function_program: 'Public Works', natural_account: 'Salaries & Wages', reporting_category: 'salaries_wages', budget_article_mapping: 'Article 8', gasb_34_class: 'governmental_activities', mapping_type: 'one_to_one', mapping_split_percent: 100, validation_status: 'needs_review', status: 'active', fiscal_year_effective: 'FY2027', transition_notes: 'May need to split between road maintenance and facility maintenance functions.', notes: '' },
  { trio_account: '06-001-5999', trio_department: 'Misc', trio_object_code: '5999', trio_description: 'Miscellaneous — unclassified', trio_historical_budget: 12000, trio_historical_actual: 8500, new_account_number: '', new_account_title: '', account_type: 'expenditure', fund: 'general_fund', fund_type: 'governmental', department: '', function_program: '', natural_account: '', reporting_category: 'other', budget_article_mapping: '', gasb_34_class: 'governmental_activities', mapping_type: 'unmapped', mapping_split_percent: 100, validation_status: 'unmapped', status: 'active', fiscal_year_effective: 'FY2027', transition_notes: 'Needs classification before ERP go-live.', notes: '' },
];

const TABS = [
  { id: 'crosswalk',    label: 'Crosswalk',        icon: Table },
  { id: 'oldnew',       label: 'Old → New',         icon: ArrowRight },
  { id: 'dept',         label: 'By Department',    icon: Building2 },
  { id: 'revenue',      label: 'Revenue',          icon: TrendingUp },
  { id: 'expenditure',  label: 'Expenditures',     icon: TrendingDown },
  { id: 'exceptions',   label: 'Exceptions',       icon: AlertTriangle },
  { id: 'validation',   label: 'Validation',       icon: CheckCircle },
  { id: 'governance',   label: 'Governance',       icon: Shield },
  { id: 'audit',        label: 'Audit Log',        icon: Clock },
  { id: 'import',       label: 'Import',           icon: Upload },
];

// ── Audit log helper ──────────────────────────────────────────────────────────
async function writeAuditLog(entry) {
  await base44.entities.COAAuditLog.create({
    ...entry,
    timestamp: new Date().toISOString(),
  });
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ChartOfAccounts() {
  const queryClient = useQueryClient();

  const { data: dbAccounts, isLoading } = useQuery({
    queryKey: ['coa'],
    queryFn: () => base44.entities.ChartOfAccounts.list('-created_date', 500),
    initialData: [],
  });

  // Use DB accounts if any exist, otherwise seed data
  const [localAccounts, setLocalAccounts] = useState(null);
  const accounts = localAccounts ?? (dbAccounts?.length ? dbAccounts : SEED_ACCOUNTS.map((a, i) => ({ ...a, id: `seed_${i}` })));

  const createMutation = useMutation({
    mutationFn: data => base44.entities.ChartOfAccounts.create(data),
    onSuccess: () => queryClient.invalidateQueries(['coa']),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ChartOfAccounts.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['coa']),
  });
  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.ChartOfAccounts.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['coa']),
  });

  const [activeTab, setActiveTab] = useState('crosswalk');
  const [editingAccount, setEditingAccount] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const validation = useMemo(() => validateCrosswall(accounts), [accounts]);
  const stats      = useMemo(() => buildSummaryStats(accounts), [accounts]);
  const exceptionCount = useMemo(() => buildExceptionsReport(accounts).length, [accounts]);
  const issueCount = validation.errors.length + validation.warnings.length;
  const errorCount = validation.errors.length;

  const handleSave = useCallback(async (form) => {
    const { id, ...data } = form;
    const isEdit = editingAccount?.id && !editingAccount.id.startsWith('seed_');
    if (isEdit) {
      await updateMutation.mutateAsync({ id: editingAccount.id, data });
      writeAuditLog({ event_type: 'account_updated', account_id: editingAccount.id, account_number: form.new_account_number, trio_account: form.trio_account, description: `Account ${form.new_account_number} updated` });
    } else {
      if (localAccounts) {
        const newId = `local_${Date.now()}`;
        setLocalAccounts(prev => editingAccount
          ? prev.map(a => a.id === editingAccount.id ? { ...form, id: editingAccount.id } : a)
          : [...prev, { ...form, id: newId }]
        );
      } else {
        await createMutation.mutateAsync(data);
      }
      writeAuditLog({ event_type: 'account_created', account_number: form.new_account_number, trio_account: form.trio_account, description: `Account ${form.new_account_number} created` });
    }
    setEditingAccount(null);
    setIsAdding(false);
  }, [editingAccount, localAccounts, updateMutation, createMutation]);

  const handleEdit = useCallback(a => { setEditingAccount(a); setIsAdding(false); }, []);

  const handleDelete = useCallback(async a => {
    // Deletion protection: block if account has historical actuals or article mapping
    if ((a.trio_historical_actual > 0 || a.budget_article_mapping) && a.status !== 'inactive') {
      const proceed = window.confirm(
        `⚠ Deletion Protected\n\nAccount "${a.new_account_number || a.trio_account}" has historical data or is referenced in warrant articles.\n\nMark as Inactive instead of deleting? Click OK to mark inactive, Cancel to abort.`
      );
      if (proceed) {
        if (a.id && !a.id.startsWith('seed_') && !a.id.startsWith('local_')) {
          await updateMutation.mutateAsync({ id: a.id, data: { status: 'inactive' } });
        } else {
          setLocalAccounts(prev => (prev || accounts).map(x => x.id === a.id ? { ...x, status: 'inactive' } : x));
        }
        writeAuditLog({ event_type: 'deletion_blocked', account_id: a.id, account_number: a.new_account_number, trio_account: a.trio_account, description: `Deletion blocked — ${a.new_account_number} marked inactive instead (historical data or article reference present)` });
      }
      return;
    }
    if (!window.confirm(`Delete account ${a.new_account_number || a.trio_account}?`)) return;
    if (a.id && !a.id.startsWith('seed_') && !a.id.startsWith('local_')) {
      await deleteMutation.mutateAsync(a.id);
    } else {
      setLocalAccounts(prev => (prev || accounts).filter(x => x.id !== a.id));
    }
    writeAuditLog({ event_type: 'account_deleted', account_id: a.id, account_number: a.new_account_number, trio_account: a.trio_account, description: `Account ${a.new_account_number} deleted` });
  }, [accounts, deleteMutation, updateMutation]);

  const handleImport = useCallback((parsed, mergeMode = 'append') => {
    const withIds = parsed.map((a, i) => ({ ...a, id: `import_${Date.now()}_${i}` }));
    if (mergeMode === 'replace') {
      setLocalAccounts(withIds);
    } else {
      setLocalAccounts(prev => [...(prev || accounts), ...withIds]);
    }
    setActiveTab('crosswalk');
  }, [accounts]);

  const handleExceptionResolve = useCallback((account, action, note) => {
    const newStatus = action.includes('Approv') ? 'approved' : action.includes('Review') ? 'needs_review' : action.includes('Inactive') ? 'inactive' : 'mapped';
    setLocalAccounts(prev => (prev || accounts).map(a =>
      a.id === account.id ? { ...a, validation_status: newStatus, transition_notes: note ? `${a.transition_notes || ''} [${action}: ${note}]`.trim() : a.transition_notes } : a
    ));
    writeAuditLog({ event_type: 'exception_resolved', account_id: account.id, account_number: account.new_account_number, trio_account: account.trio_account, description: `Exception resolved via "${action}"${note ? `: ${note}` : ''}` });
  }, [accounts]);

  const handleCancelForm = () => { setEditingAccount(null); setIsAdding(false); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <SectionHeader
          title="Chart of Accounts Crosswalk"
          subtitle="TRIO → New COA migration engine · Historical comparability · ERP transition readiness"
          icon={GitMerge}
        />
        <button onClick={() => { setIsAdding(true); setEditingAccount(null); }}
          className="flex items-center gap-1.5 text-xs font-semibold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors flex-shrink-0">
          <Plus className="h-3.5 w-3.5" /> New Account
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {[
          { label: 'Total Accounts', value: stats.total, sub: 'in crosswalk', color: 'text-slate-900' },
          { label: 'Mapped', value: stats.mapped, sub: `${stats.completionPct}% complete`, color: 'text-emerald-700' },
          { label: 'Unmapped', value: stats.unmapped, sub: 'need mapping', color: stats.unmapped > 0 ? 'text-red-700' : 'text-slate-400' },
          { label: 'Exceptions', value: exceptionCount, sub: 'flagged', color: exceptionCount > 0 ? 'text-amber-700' : 'text-slate-400' },
          { label: 'Enterprise', value: stats.enterprise, sub: 'enterprise fund accounts', color: 'text-slate-700' },
          {
            label: 'Validation',
            value: issueCount === 0 ? '✓ Clean' : `${issueCount} issue${issueCount !== 1 ? 's' : ''}`,
            sub: issueCount === 0 ? 'no issues' : `${errorCount} error${errorCount !== 1 ? 's' : ''}`,
            color: issueCount === 0 ? 'text-emerald-700' : errorCount > 0 ? 'text-red-700' : 'text-amber-700',
          },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] font-medium text-slate-600 mt-0.5">{s.label}</p>
            <p className="text-[9px] text-slate-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Completion bar */}
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-bold text-slate-700">Crosswalk Completion</p>
          <p className="text-[10px] text-slate-500">{stats.mapped} of {stats.total} accounts mapped ({stats.completionPct}%)</p>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-2 rounded-full transition-all" style={{ width: `${stats.completionPct}%`, background: stats.completionPct === 100 ? '#2A7F7F' : stats.completionPct > 70 ? '#344A60' : '#9C5334' }} />
        </div>
      </div>

      {/* Inline form */}
      {(isAdding || editingAccount) && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold text-slate-700 mb-4">{editingAccount ? `Editing: ${editingAccount.new_account_number || editingAccount.trio_account}` : 'New Crosswalk Account'}</p>
          <COAAccountForm account={editingAccount} onSave={handleSave} onCancel={handleCancelForm} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map(({ id, label, icon: TabIcon }) => {
          const badge = id === 'validation' && issueCount > 0 ? issueCount
            : id === 'exceptions' && exceptionCount > 0 ? exceptionCount : null;
          return (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === id ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
              <TabIcon className="h-3.5 w-3.5 flex-shrink-0" />
              {label}
              {badge && (
                <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${id === 'validation' && errorCount > 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'crosswalk'   && <COACrossWalkTable accounts={accounts} onEdit={handleEdit} onDelete={handleDelete} />}
      {activeTab === 'oldnew'      && <OldToNewView accounts={accounts} />}
      {activeTab === 'dept'        && <DepartmentView accounts={accounts} />}
      {activeTab === 'revenue'     && <RevenueView accounts={accounts} />}
      {activeTab === 'expenditure' && <ExpenditureView accounts={accounts} />}
      {activeTab === 'exceptions'  && <ExceptionsReport accounts={accounts} />}
      {activeTab === 'validation'  && <COAValidationPanel validation={validation} />}
      {activeTab === 'import'      && <ImportPanel onImport={handleImport} />}
    </div>
  );
}