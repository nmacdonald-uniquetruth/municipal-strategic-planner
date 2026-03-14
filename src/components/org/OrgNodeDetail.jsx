import React, { useState } from 'react';
import { NODE_TYPE_CONFIG, RESTRUCTURING_STATUS_CONFIG } from './orgUtils';
import { X, Users, DollarSign, AlertTriangle, FileText, ArrowRight, Pencil } from 'lucide-react';

export default function OrgNodeDetail({ node, onClose, onEdit }) {
  if (!node) return null;
  const cfg = NODE_TYPE_CONFIG[node.node_type] || NODE_TYPE_CONFIG.staff_role;
  const rCfg = RESTRUCTURING_STATUS_CONFIG[node.restructuring_status] || RESTRUCTURING_STATUS_CONFIG.unchanged;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-slate-200">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: cfg.color }}
            >
              {cfg.label}
            </span>
            {node.is_advisory && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Advisory
              </span>
            )}
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${rCfg.color}`}>
              {rCfg.label}
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 leading-tight">{node.name}</h3>
          {node.staff_name && <p className="text-xs text-slate-500 mt-0.5">{node.staff_name}</p>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {onEdit && (
            <button onClick={() => onEdit(node)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Description */}
        {node.description && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</p>
            <p className="text-xs text-slate-700 leading-relaxed">{node.description}</p>
          </div>
        )}

        {/* Staff info */}
        {(node.staff_name || node.staff_email || node.staff_count > 1) && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Staff</p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-xs">
              {node.staff_name && (
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 text-slate-400" />
                  <span className="font-medium text-slate-800">{node.staff_name}</span>
                </div>
              )}
              {node.staff_email && (
                <p className="text-slate-500 pl-5">{node.staff_email}</p>
              )}
              {node.staff_count > 1 && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Users className="h-3 w-3 text-slate-400" />
                  <span>{node.staff_count} positions</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Budget link */}
        {node.budget_link && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Budget</p>
            <div className="flex items-center gap-2 text-xs rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-blue-800">
              <DollarSign className="h-3 w-3 flex-shrink-0" />
              <span>{node.budget_link}</span>
            </div>
          </div>
        )}

        {/* Restructuring section */}
        {node.restructuring_status !== 'unchanged' && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Restructuring</p>
            <div className={`rounded-xl border-l-4 px-3 py-2.5 text-xs space-y-2 ${
              node.restructuring_status === 'proposed_new'       ? 'bg-emerald-50 border-emerald-400' :
              node.restructuring_status === 'proposed_change'    ? 'bg-amber-50 border-amber-400' :
              node.restructuring_status === 'proposed_eliminate' ? 'bg-red-50 border-red-400' :
              'bg-blue-50 border-blue-400'
            }`}>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                <span className="font-bold">{rCfg.label}</span>
              </div>
              {node.restructuring_notes && (
                <p className="leading-relaxed text-slate-700">{node.restructuring_notes}</p>
              )}
              {node.proposed_name && (
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="line-through opacity-60">{node.name}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="font-semibold">{node.proposed_name}</span>
                </div>
              )}
              {node.proposed_description && (
                <p className="text-slate-600 italic">{node.proposed_description}</p>
              )}
            </div>
          </div>
        )}

        {/* Branch */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Branch</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            node.branch === 'municipal' ? 'bg-blue-100 text-blue-800' :
            node.branch === 'school'    ? 'bg-purple-100 text-purple-800' :
            node.branch === 'root'      ? 'bg-slate-200 text-slate-700' :
            'bg-teal-100 text-teal-800'
          }`}>
            {node.branch === 'municipal' ? 'Municipal Government'
           : node.branch === 'school'    ? 'School Governance (AOS 96)'
           : node.branch === 'root'      ? 'Community'
           : 'Shared'}
          </span>
        </div>
      </div>
    </div>
  );
}