/**
 * COAImportWorkbook — Enhanced import with:
 *  - File upload (Excel/CSV via UploadFile + ExtractDataFromUploadedFile integrations)
 *  - JSON paste fallback
 *  - Field validation preview table before committing
 *  - Version tracking (links import to a COACrosswalkVersion)
 *  - Audit event on import completion
 */
import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { parseCOAImport, validateCrosswall } from './coaEngine';
import { Upload, CheckCircle, AlertTriangle, FileText, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

const REQUIRED_FIELDS = ['new_account_number', 'account_type', 'fund'];
const WARN_FIELDS     = ['new_account_title', 'department', 'reporting_category'];

function ValidationPreview({ rows }) {
  const [showAll, setShowAll] = useState(false);
  if (!rows.length) return null;

  const { errors, warnings } = validateCrosswall(rows.map((r, i) => ({ ...r, id: `pre_${i}` })));
  const display = showAll ? rows : rows.slice(0, 10);

  return (
    <div className="space-y-3">
      {/* Validation summary */}
      <div className={`rounded-xl border px-4 py-2.5 flex items-center gap-3 ${errors.length > 0 ? 'border-red-200 bg-red-50' : warnings.length > 0 ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
        {errors.length > 0
          ? <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
          : <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />}
        <div className="flex-1">
          <p className={`text-xs font-semibold ${errors.length > 0 ? 'text-red-800' : warnings.length > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>
            {rows.length} accounts parsed · {errors.length} errors · {warnings.length} warnings
          </p>
          {errors.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {errors.slice(0, 4).map((e, i) => <li key={i} className="text-[10px] text-red-700">• {e.msg}</li>)}
              {errors.length > 4 && <li className="text-[10px] text-red-500">…and {errors.length - 4} more</li>}
            </ul>
          )}
        </div>
      </div>

      {/* Field mapping preview table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white px-3 py-2 grid grid-cols-5 text-[9px] font-bold uppercase tracking-wider">
          <span>TRIO Account</span>
          <span>New Account #</span>
          <span>New Title</span>
          <span>Fund</span>
          <span>Type / Status</span>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {display.map((r, i) => {
            const missingRequired = REQUIRED_FIELDS.some(f => !r[f]?.toString().trim());
            const missingWarn     = WARN_FIELDS.some(f => !r[f]?.toString().trim());
            return (
              <div key={i} className={`px-3 py-1.5 grid grid-cols-5 text-[10px] border-t border-slate-100 ${missingRequired ? 'bg-red-50' : missingWarn ? 'bg-amber-50/40' : ''}`}>
                <span className="font-mono text-slate-500 truncate">{r.trio_account || '—'}</span>
                <span className={`font-mono font-semibold truncate ${!r.new_account_number ? 'text-red-600' : 'text-slate-800'}`}>{r.new_account_number || '(missing)'}</span>
                <span className="text-slate-600 truncate">{r.new_account_title || '—'}</span>
                <span className="text-slate-500 truncate">{r.fund || '—'}</span>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 truncate">{r.account_type || '—'}</span>
                  {missingRequired && <span className="text-[8px] text-red-600 font-bold">ERR</span>}
                  {!missingRequired && missingWarn && <span className="text-[8px] text-amber-600 font-bold">WARN</span>}
                </div>
              </div>
            );
          })}
        </div>
        {rows.length > 10 && (
          <button onClick={() => setShowAll(v => !v)}
            className="w-full flex items-center justify-center gap-1.5 text-[10px] text-slate-400 hover:text-slate-600 py-2 border-t border-slate-100 transition-colors">
            {showAll ? <><ChevronUp className="h-3 w-3" /> Show fewer</> : <><ChevronDown className="h-3 w-3" /> Show all {rows.length} rows</>}
          </button>
        )}
      </div>
    </div>
  );
}

export default function COAImportWorkbook({ accounts, onImport, onLogEvent }) {
  const [mode, setMode]           = useState('file');   // 'file' | 'json'
  const [json, setJson]           = useState('');
  const [file, setFile]           = useState(null);
  const [preview, setPreview]     = useState(null);  // parsed rows before commit
  const [loading, setLoading]     = useState(false);
  const [status, setStatus]       = useState(null);
  const [mergeMode, setMergeMode] = useState('append'); // 'append' | 'replace'
  const [versionLabel, setVersionLabel] = useState('');

  const handleFileUpload = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f); setLoading(true); setStatus(null); setPreview(null);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
    const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: 'object',
        properties: {
          accounts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                'TRIO Account':        { type: 'string' },
                'TRIO Dept':           { type: 'string' },
                'Object Code':         { type: 'string' },
                'TRIO Description':    { type: 'string' },
                'New Account':         { type: 'string' },
                'New Title':           { type: 'string' },
                'Fund':                { type: 'string' },
                'Account Type':        { type: 'string' },
                'Prior Budget':        { type: 'number' },
                'Prior Actual':        { type: 'number' },
                'Department':          { type: 'string' },
                'Reporting Category':  { type: 'string' },
                'Mapping Type':        { type: 'string' },
                'Split %':             { type: 'number' },
                'Transition Notes':    { type: 'string' },
              }
            }
          }
        }
      }
    });
    setLoading(false);
    if (result.status !== 'success') {
      setStatus({ ok: false, msg: `Extraction failed: ${result.details}` });
      return;
    }
    const rows = Array.isArray(result.output) ? result.output : result.output?.accounts || [];
    const parsed = parseCOAImport(rows);
    setPreview(parsed);
    setVersionLabel(`${f.name.replace(/\.[^.]+$/, '')}-${new Date().toISOString().slice(0, 10)}`);
    setStatus({ ok: true, msg: `Extracted ${parsed.length} accounts from "${f.name}". Review below, then confirm.` });
  };

  const handleJsonParse = () => {
    try {
      const rows = JSON.parse(json);
      if (!Array.isArray(rows)) throw new Error('Expected a JSON array of objects.');
      const parsed = parseCOAImport(rows);
      setPreview(parsed);
      setStatus({ ok: true, msg: `Parsed ${parsed.length} accounts. Review below, then confirm.` });
    } catch (e) {
      setStatus({ ok: false, msg: `Parse error: ${e.message}` });
    }
  };

  const handleConfirmImport = async () => {
    if (!preview) return;
    const withIds = preview.map((a, i) => ({ ...a, id: `import_${Date.now()}_${i}` }));

    // Create a version record
    const stats = {
      account_count:   preview.length,
      mapped_count:    preview.filter(a => a.validation_status === 'mapped' || a.new_account_number).length,
      unmapped_count:  preview.filter(a => !a.new_account_number?.trim()).length,
      exception_count: preview.filter(a => ['duplicate','ambiguous','needs_review'].includes(a.validation_status)).length,
      source_file_name: file?.name || 'JSON import',
      upload_date: new Date().toISOString(),
      version_label: versionLabel || `import-${new Date().toISOString().slice(0, 10)}`,
    };

    await base44.entities.COACrosswalkVersion.create({ ...stats, fiscal_year: 'FY2027', status: 'draft', is_active: false });

    onLogEvent?.({ event_type: 'import_completed', description: `Imported ${preview.length} accounts from ${file?.name || 'JSON'}. Mode: ${mergeMode}.` });
    onImport(withIds, mergeMode);
    setPreview(null); setJson(''); setFile(null);
    setStatus({ ok: true, msg: `✓ ${preview.length} accounts imported in ${mergeMode} mode. Version draft created.` });
  };

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Mode toggle */}
      <div className="flex gap-1.5">
        {[{ id: 'file', label: 'Upload Workbook (Excel/CSV)' }, { id: 'json', label: 'Paste JSON' }].map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); setPreview(null); setStatus(null); }}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors ${mode === m.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Info panel */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
        <p className="text-xs font-semibold text-blue-800">Import from Workbook</p>
        <p className="text-[10px] text-blue-700 mt-1">
          Upload the town's chart of accounts workbook (Excel or CSV). Required columns: <code className="bg-blue-100 px-1 rounded">TRIO Account</code>, <code className="bg-blue-100 px-1 rounded">New Account</code>, <code className="bg-blue-100 px-1 rounded">Account Type</code>, <code className="bg-blue-100 px-1 rounded">Fund</code>. All other fields optional.
          Import creates a draft crosswalk version automatically. Data is validated before committing.
        </p>
      </div>

      {mode === 'file' ? (
        <label className="flex flex-col items-center gap-3 border-2 border-dashed border-slate-200 rounded-xl px-6 py-8 cursor-pointer hover:border-slate-400 transition-colors bg-white">
          <Upload className="h-8 w-8 text-slate-300" />
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-700">Click to upload or drag & drop</p>
            <p className="text-[10px] text-slate-400 mt-1">Excel (.xlsx, .xls) or CSV — up to 10 MB</p>
          </div>
          {file && <p className="text-[10px] text-emerald-700 font-semibold">{file.name}</p>}
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
        </label>
      ) : (
        <div className="space-y-2">
          <textarea
            rows={10}
            value={json}
            onChange={e => setJson(e.target.value)}
            placeholder={'[\n  {"TRIO Account": "01-001-5100", "TRIO Dept": "Administration", "New Account": "01-110-51100", "New Title": "Town Manager — Salary", "Account Type": "expenditure", "Fund": "general_fund"},\n  ...\n]'}
            className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white resize-none"
          />
          <button onClick={handleJsonParse}
            className="text-xs bg-slate-900 text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-slate-700 transition-colors">
            Parse JSON
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Extracting data from workbook…
        </div>
      )}

      {status && (
        <p className={`text-xs font-medium ${status.ok ? 'text-emerald-700' : 'text-red-600'}`}>{status.msg}</p>
      )}

      {/* Preview + confirm */}
      {preview && (
        <>
          <ValidationPreview rows={preview} />
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-semibold text-slate-600">Version label:</label>
              <input value={versionLabel} onChange={e => setVersionLabel(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none w-52" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-semibold text-slate-600">Import mode:</label>
              <select value={mergeMode} onChange={e => setMergeMode(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none">
                <option value="append">Append to existing</option>
                <option value="replace">Replace all accounts</option>
              </select>
            </div>
            <button onClick={handleConfirmImport}
              className="flex items-center gap-1.5 text-xs bg-slate-900 text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-slate-700 transition-colors">
              <CheckCircle className="h-3.5 w-3.5" /> Confirm Import ({preview.length} accounts)
            </button>
            <button onClick={() => { setPreview(null); setStatus(null); }}
              className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5">Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}