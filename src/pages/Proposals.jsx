import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ProposalGenerator from '../components/proposals/ProposalGenerator';
import ProposalDisplay from '../components/proposals/ProposalDisplay';
import { FileText, Plus, Trash2, Search, CheckCircle, Clock, XCircle, BookOpen, BarChart2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const STATUS_CONFIG = {
  draft:     { label: 'Draft',        bg: 'bg-slate-100',   text: 'text-slate-700',  icon: Clock },
  review:    { label: 'Under Review', bg: 'bg-blue-100',    text: 'text-blue-700',   icon: Clock },
  approved:  { label: 'Approved',     bg: 'bg-emerald-100', text: 'text-emerald-700',icon: CheckCircle },
  rejected:  { label: 'Rejected',     bg: 'bg-red-100',     text: 'text-red-700',    icon: XCircle },
  published: { label: 'Published',    bg: 'bg-indigo-100',  text: 'text-indigo-700', icon: BookOpen },
};

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.bg} ${s.text}`}>
      <Icon className="h-3 w-3" />
      {s.label}
    </span>
  );
}

export default function Proposals() {
  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => { loadProposals(); }, []);

  const loadProposals = async () => {
    const data = await base44.entities.Proposal.list();
    setProposals(data || []);
    setLoading(false);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this proposal?')) return;
    await base44.entities.Proposal.delete(id);
    setProposals(p => p.filter(x => x.id !== id));
    if (selectedProposal?.id === id) setSelectedProposal(null);
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedProposal) return;
    await base44.entities.Proposal.update(selectedProposal.id, { status: newStatus });
    const updated = { ...selectedProposal, status: newStatus };
    setProposals(p => p.map(x => x.id === selectedProposal.id ? updated : x));
    setSelectedProposal(updated);
  };

  const handleProposalGenerated = (proposal) => {
    setProposals(p => [...p, proposal]);
    setSelectedProposal(proposal);
    setShowGenerator(false);
  };

  const filtered = proposals.filter(p => {
    const matchFilter = filter === 'all' || p.status === filter;
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = Object.fromEntries(
    Object.keys(STATUS_CONFIG).map(k => [k, proposals.filter(p => p.status === k).length])
  );

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Loading proposals…</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #344A60 0%, #2a3c4f 100%)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#F6C85F' }}>Proposal Workspace</p>
            <h1 className="text-xl font-bold" style={{ color: '#E7D0B1' }}>Restructuring Proposals</h1>
            <p className="text-sm mt-1" style={{ color: '#B3C6C8' }}>Create, review, and track proposals through the approval workflow</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/Scenarios" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
              style={{ borderColor: 'rgba(179,198,200,0.4)', color: '#E7D0B1', background: 'rgba(255,255,255,0.08)' }}>
              <BarChart2 className="h-3.5 w-3.5" />
              Scenarios
            </Link>
            <button onClick={() => { setSelectedProposal(null); setShowGenerator(true); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: '#F6C85F', color: '#2F2F30' }}>
              <Plus className="h-3.5 w-3.5" />
              New Proposal
            </button>
          </div>
        </div>
      </div>

      {/* ── Status Summary ────────────────────────────────────────── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <button onClick={() => setFilter('all')}
          className={`rounded-xl border p-3 text-center transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 ${filter === 'all' ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
          <p className="text-lg font-bold">{proposals.length}</p>
          <p className="text-[10px] font-semibold uppercase mt-0.5">All</p>
        </button>
        {Object.entries(STATUS_CONFIG).map(([k, s]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`rounded-xl border p-3 text-center transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 ${filter === k ? `${s.bg} border-transparent` : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
            <p className={`text-lg font-bold ${filter === k ? s.text : 'text-slate-700'}`}>{counts[k] || 0}</p>
            <p className={`text-[10px] font-semibold uppercase mt-0.5 ${filter === k ? s.text : 'text-slate-500'}`}>{s.label}</p>
          </button>
        ))}
      </div>

      {/* ── Workspace ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: proposal list */}
        <div className="lg:col-span-1 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search proposals…"
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <FileText className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No proposals match your filter</p>
                <button onClick={() => setShowGenerator(true)}
                  className="mt-3 text-xs font-semibold text-slate-700 underline">
                  Create one →
                </button>
              </div>
            ) : (
              filtered.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedProposal(p); setShowGenerator(false); }}
                  className={`w-full text-left rounded-xl border p-3 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                    selectedProposal?.id === p.id
                      ? 'border-slate-800 bg-slate-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-xs font-bold text-slate-900 line-clamp-2 flex-1">{p.title || 'Untitled Proposal'}</p>
                    <button onClick={e => handleDelete(p.id, e)} className="text-slate-300 hover:text-red-500 flex-shrink-0 p-0.5 focus:outline-none">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <StatusBadge status={p.status} />
                    {p.proposal_type && (
                      <span className="text-[10px] text-slate-500">{p.proposal_type}</span>
                    )}
                  </div>
                  {selectedProposal?.id === p.id && (
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-500">
                      <ArrowRight className="h-3 w-3" /> Viewing
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: detail / generator */}
        <div className="lg:col-span-2">
          {showGenerator ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Generate New Proposal</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Fill in the details below to create a board-ready formal proposal</p>
                </div>
                <button onClick={() => setShowGenerator(false)} className="text-slate-400 hover:text-slate-600 text-lg focus:outline-none">✕</button>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <ProposalGenerator source={null} sourceType="manual" onProposalGenerated={handleProposalGenerated} />
              </div>
            </div>
          ) : selectedProposal ? (
            <div className="space-y-4">
              {/* Status workflow bar */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedProposal.status} />
                  <span className="text-xs text-slate-500">Change status:</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {Object.entries(STATUS_CONFIG).map(([k, s]) => (
                    <button key={k} onClick={() => handleStatusChange(k)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                        selectedProposal.status === k
                          ? `${s.bg} ${s.text} ring-1 ring-inset ring-current`
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <ProposalDisplay proposal={selectedProposal} />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700 mb-1">Proposal Workspace</h3>
              <p className="text-xs text-slate-500 mb-5 max-w-sm mx-auto">
                Select a proposal from the list to review its details, or create a new one to begin the approval workflow.
              </p>
              <button onClick={() => setShowGenerator(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
                style={{ background: '#344A60' }}>
                <Plus className="h-4 w-4" />
                Create New Proposal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Links to related tools ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { to: '/ProposalEvaluations', label: 'Evaluate Proposals', desc: 'Score and rank proposals using weighted criteria' },
          { to: '/ProposalComparison',  label: 'Compare Proposals',  desc: 'Side-by-side financial and staffing comparison' },
          { to: '/RestructuringProposalLibrary', label: 'Proposal Library', desc: 'Browse all restructuring proposals across categories' },
        ].map(l => (
          <Link key={l.to} to={l.to}
            className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-400 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <p className="text-xs font-bold text-slate-800">{l.label}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}