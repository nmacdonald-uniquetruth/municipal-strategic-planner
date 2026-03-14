import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ProposalGenerator from '../components/proposals/ProposalGenerator';
import ProposalDisplay from '../components/proposals/ProposalDisplay';
import SectionHeader from '../components/machias/SectionHeader';
import { FileText, Plus, Trash2, Edit2 } from 'lucide-react';

export default function Proposals() {
  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [sourceData, setSourceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    try {
      const data = await base44.entities.Proposal.list();
      setProposals(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading proposals:', error);
      setLoading(false);
    }
  };

  const handleDeleteProposal = async (id) => {
    if (window.confirm('Delete this proposal?')) {
      try {
        await base44.entities.Proposal.delete(id);
        setProposals(proposals.filter(p => p.id !== id));
        if (selectedProposal?.id === id) setSelectedProposal(null);
      } catch (error) {
        console.error('Error deleting proposal:', error);
      }
    }
  };

  const handleProposalGenerated = (proposal) => {
    setProposals([...proposals, proposal]);
    setSelectedProposal(proposal);
    setShowGenerator(false);
  };

  const filteredProposals = proposals.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Loading proposals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Proposal Generator"
        subtitle="Create formal proposals from scenarios, staffing changes, and service restructuring options. Generate board-ready and internal versions."
        icon={FileText}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Proposal List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Proposals</h2>
            <button
              onClick={() => {
                setSourceData(null);
                setShowGenerator(true);
              }}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="published">Published</option>
          </select>

          {/* Proposal Items */}
          <div className="space-y-2">
            {filteredProposals.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
                <p className="text-xs text-slate-600">No proposals found</p>
              </div>
            ) : (
              filteredProposals.map(proposal => (
                <div
                  key={proposal.id}
                  onClick={() => setSelectedProposal(proposal)}
                  className={`rounded-lg border p-3 cursor-pointer transition-all ${
                    selectedProposal?.id === proposal.id
                      ? 'border-slate-800 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-xs font-bold text-slate-900 line-clamp-2">{proposal.title}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProposal(proposal.id);
                      }}
                      className="text-slate-400 hover:text-red-600 p-0.5"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-slate-500">{proposal.proposal_type}</span>
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${
                      proposal.status === 'draft' ? 'bg-slate-100 text-slate-700' :
                      proposal.status === 'review' ? 'bg-blue-100 text-blue-700' :
                      proposal.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      proposal.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {proposal.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {showGenerator ? (
            <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900">Generate New Proposal</h2>
                <button
                  onClick={() => setShowGenerator(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <p className="text-xs text-slate-600 mb-3">
                  The proposal generator will create a comprehensive formal proposal based on a scenario, staffing change, or service restructuring option.
                </p>
                <ProposalGenerator
                  source={sourceData}
                  sourceType="manual"
                  onProposalGenerated={handleProposalGenerated}
                />
              </div>
            </div>
          ) : selectedProposal ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 flex-1">Proposal Details</h2>
                <select
                  value={selectedProposal.status}
                  onChange={(e) => {
                    const updated = { ...selectedProposal, status: e.target.value };
                    base44.entities.Proposal.update(selectedProposal.id, { status: e.target.value });
                    setProposals(proposals.map(p => p.id === selectedProposal.id ? updated : p));
                    setSelectedProposal(updated);
                  }}
                  className="px-3 py-1.5 border border-slate-200 rounded text-xs font-medium bg-white"
                >
                  <option value="draft">Draft</option>
                  <option value="review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <ProposalDisplay proposal={selectedProposal} />
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-12 text-center">
              <p className="text-sm text-slate-600 mb-4">Select a proposal to view or create a new one</p>
              <button
                onClick={() => setShowGenerator(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800"
              >
                Create New Proposal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Proposal Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600 uppercase">Total</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{proposals.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600 uppercase">Draft</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {proposals.filter(p => p.status === 'draft').length}
            </p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs font-semibold text-blue-700 uppercase">Review</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {proposals.filter(p => p.status === 'review').length}
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs font-semibold text-emerald-700 uppercase">Approved</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">
              {proposals.filter(p => p.status === 'approved').length}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600 uppercase">Published</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {proposals.filter(p => p.status === 'published').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}