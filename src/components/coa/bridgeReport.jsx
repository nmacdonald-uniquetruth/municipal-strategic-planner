/**
 * Bridge Report Components — Display Old-to-New account mappings with confidence flags.
 * Supports views by department, fund, revenue type, expenditure type, and article.
 */
import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import {
  buildBridgeMapping, getMappingConfidence, buildDepartmentBridge,
  buildFundBridge, bridgeReconciliation
} from './coaEngine';

const CONFIDENCE_CONFIG = {
  exact:      { icon: CheckCircle, text: 'Exact',      bg: 'bg-emerald-50',  border: 'border-emerald-200',  badge: 'bg-emerald-100 text-emerald-700' },
  estimated:  { icon: AlertTriangle, text: 'Estimated', bg: 'bg-amber-50',    border: 'border-amber-200',    badge: 'bg-amber-100 text-amber-700' },
  ambiguous:  { icon: AlertCircle,   text: 'Ambiguous', bg: 'bg-red-50',      border: 'border-red-200',      badge: 'bg-red-100 text-red-700' },
};

function ConfidenceBadge({ confidence }) {
  const cfg = CONFIDENCE_CONFIG[confidence?.level] || CONFIDENCE_CONFIG.ambiguous;
  const Icon = cfg.icon;
  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badge}`} title={confidence?.reason || ''}>
      <Icon className="h-3 w-3" /> {cfg.text}
    </div>
  );
}

function BridgeRow({ bridge }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`border rounded-lg overflow-hidden ${CONFIDENCE_CONFIG[bridge.confidence?.level]?.border || 'border-slate-200'}`}>
      <div className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-mono text-xs font-bold text-slate-800">{bridge.trioAccount}</p>
            <span className="text-[9px] text-slate-500 truncate">{bridge.trioDescription}</span>
          </div>
        </div>
        <ConfidenceBadge confidence={bridge.confidence} />
        <div className="text-right text-[10px] font-semibold">
          <p className="text-slate-800">${bridge.trioHistBudget.toLocaleString()}</p>
          <p className="text-slate-400 text-[9px]">budget</p>
        </div>
        <div className="text-slate-400">
          {expanded ? '▼' : '▶'}
        </div>
      </div>

      {expanded && bridge.newMappings.length > 0 && (
        <div className="px-3 pb-2.5 border-t border-slate-100 space-y-1.5 pt-2">
          {bridge.newMappings.map((nm, i) => (
            <div key={i} className="flex items-start gap-2 text-[10px]">
              <ArrowRight className="h-3 w-3 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-slate-800">
                  {nm.newAccountNumber} — {nm.newTitle}
                </p>
                <p className="text-slate-500">
                  ${nm.allocatedBudget.toLocaleString()} budget · ${nm.allocatedActual.toLocaleString()} actual
                  {nm.splitPercent < 100 && <span className="text-[9px] text-slate-400"> ({nm.splitPercent}% alloc)</span>}
                </p>
              </div>
            </div>
          ))}
          {bridge.newMappings.length === 0 && (
            <p className="text-[10px] text-slate-400 italic">No mappings found for this account.</p>
          )}
        </div>
      )}
    </div>
  );
}

export function BridgeReportByDepartment({ accounts }) {
  const bridges = useMemo(() => buildDepartmentBridge(accounts), [accounts]);

  return (
    <div className="space-y-6">
      {bridges.map(deptBridge => (
        <div key={deptBridge.department} className="space-y-2">
          {/* Dept header */}
          <div className="bg-slate-900 text-white px-4 py-2.5 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm">{deptBridge.department}</p>
              <div className="flex items-center gap-4 text-[10px]">
                <span>TRIO: ${deptBridge.trioHistBudgetTotal.toLocaleString()}</span>
                <span>New: ${deptBridge.bridges.reduce((s, b) => s + b.totalMapped, 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Bridge rows */}
          <div className="space-y-1.5 pl-2">
            {deptBridge.bridges.map((br, i) => (
              <BridgeRow key={i} bridge={br} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function BridgeReportByFund({ accounts }) {
  const bridges = useMemo(() => buildFundBridge(accounts), [accounts]);

  return (
    <div className="space-y-6">
      {bridges.map(fundBridge => (
        <div key={fundBridge.fund} className="space-y-2">
          {/* Fund header */}
          <div className="bg-slate-900 text-white px-4 py-2.5 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm">{fundBridge.fund}</p>
              <p className="text-[10px] text-white/60 font-medium">{fundBridge.fundType}</p>
            </div>
            <p className="text-[10px] text-white/70 mt-1">
              TRIO: ${fundBridge.trioHistBudgetTotal.toLocaleString()} · New: ${fundBridge.bridges.reduce((s, b) => s + b.totalMapped, 0).toLocaleString()}
            </p>
          </div>

          {/* Bridge rows */}
          <div className="space-y-1.5 pl-2">
            {fundBridge.bridges.map((br, i) => (
              <BridgeRow key={i} bridge={br} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function BridgeReportByType({ accounts, accountType }) {
  const { trioToNew } = useMemo(() => buildBridgeMapping(accounts), [accounts]);
  const filtered = accounts.filter(a => a.account_type === accountType);

  const bridges = useMemo(() => {
    const result = [];
    Object.entries(trioToNew).forEach(([trioNum, newAccts]) => {
      const typeMatches = newAccts.some(a => a.account_type === accountType);
      if (!typeMatches) return;
      const budget = newAccts[0]?.trio_historical_budget || 0;
      const actual = newAccts[0]?.trio_historical_actual || 0;
      const conf = getMappingConfidence(newAccts);
      result.push({ trioAccount: trioNum, trioHistBudget: budget, trioHistActual: actual, confidence: conf, newMappings: newAccts });
    });
    return result;
  }, [accounts, accountType]);

  const total = bridges.reduce((s, b) => s + b.trioHistBudget, 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-lg bg-slate-900 text-white px-4 py-2.5">
        <p className="font-bold text-sm">{accountType === 'revenue' ? 'Revenue' : 'Expenditure'} Accounts</p>
        <p className="text-[10px] text-white/70 mt-1">{filtered.length} new accounts · ${total.toLocaleString()} historical budget</p>
      </div>

      {/* Bridges */}
      <div className="space-y-1.5">
        {bridges.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No bridge mappings for this account type.</p>
        ) : (
          bridges.map((br, i) => (
            <BridgeRow key={i} bridge={{ ...br, trioDescription: '', newMappings: br.newMappings.filter(a => a.account_type === accountType) }} />
          ))
        )}
      </div>
    </div>
  );
}

export function BridgeSummaryTable({ accounts }) {
  const { trioToNew } = useMemo(() => buildBridgeMapping(accounts), [accounts]);
  const confCounts = { exact: 0, estimated: 0, ambiguous: 0 };

  const rows = Object.entries(trioToNew).map(([trioNum, newAccts]) => {
    const conf = getMappingConfidence(newAccts);
    confCounts[conf.level]++;
    return {
      trioAccount: trioNum,
      trioDesc: newAccts[0]?.trio_description || '',
      mappedCount: newAccts.length,
      mappingType: newAccts[0]?.mapping_type || 'unknown',
      confidence: conf,
      budget: newAccts[0]?.trio_historical_budget || 0,
    };
  });

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { level: 'exact', label: 'Exact Mappings', icon: CheckCircle },
          { level: 'estimated', label: 'Estimated', icon: AlertTriangle },
          { level: 'ambiguous', label: 'Ambiguous', icon: AlertCircle },
        ].map(s => (
          <div key={s.level} className={`rounded-lg px-3 py-2 ${CONFIDENCE_CONFIG[s.level].badge}`}>
            <p className="text-sm font-bold">{confCounts[s.level]}</p>
            <p className="text-[9px] uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-[10px]">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="px-3 py-2 text-left font-bold">TRIO Account</th>
              <th className="px-3 py-2 text-left font-bold">Description</th>
              <th className="px-3 py-2 text-center font-bold">Mapped To</th>
              <th className="px-3 py-2 text-left font-bold">Type</th>
              <th className="px-3 py-2 text-right font-bold">Budget</th>
              <th className="px-3 py-2 text-center font-bold">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-3 py-1.5 font-mono text-slate-800">{r.trioAccount}</td>
                <td className="px-3 py-1.5 text-slate-600 truncate">{r.trioDesc}</td>
                <td className="px-3 py-1.5 text-center text-slate-700 font-semibold">{r.mappedCount}</td>
                <td className="px-3 py-1.5 text-slate-600 capitalize">{r.mappingType}</td>
                <td className="px-3 py-1.5 text-right font-semibold">${r.budget.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-center"><ConfidenceBadge confidence={r.confidence} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}