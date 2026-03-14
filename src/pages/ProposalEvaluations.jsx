import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ProposalEvaluationForm from '../components/proposals/ProposalEvaluationForm';
import ProposalEvaluationDisplay from '../components/proposals/ProposalEvaluationDisplay';
import ProposalEvaluationSummary from '../components/proposals/ProposalEvaluationSummary';
import SectionHeader from '../components/machias/SectionHeader';
import { Zap, Plus, Edit2, Trash2 } from 'lucide-react';

export default function ProposalEvaluations() {
  const [evaluations, setEvaluations] = useState([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterRecommendation, setFilterRecommendation] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvaluations();
  }, []);

  const loadEvaluations = async () => {
    try {
      const data = await base44.entities.ProposalEvaluation.list();
      setEvaluations(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading evaluations:', error);
      setLoading(false);
    }
  };

  const handleSaveEvaluation = async (evaluationData) => {
    try {
      if (editingEvaluation) {
        await base44.entities.ProposalEvaluation.update(editingEvaluation.id, evaluationData);
        setEvaluations(evaluations.map(e => e.id === editingEvaluation.id ? { ...e, ...evaluationData } : e));
      } else {
        const created = await base44.entities.ProposalEvaluation.create(evaluationData);
        setEvaluations([...evaluations, created]);
      }
      setEditingEvaluation(null);
      setShowForm(false);
      setSelectedEvaluation(null);
    } catch (error) {
      console.error('Error saving evaluation:', error);
    }
  };

  const handleDeleteEvaluation = async (id) => {
    if (window.confirm('Delete this evaluation?')) {
      try {
        await base44.entities.ProposalEvaluation.delete(id);
        setEvaluations(evaluations.filter(e => e.id !== id));
        if (selectedEvaluation?.id === id) setSelectedEvaluation(null);
      } catch (error) {
        console.error('Error deleting evaluation:', error);
      }
    }
  };

  const filteredEvaluations = evaluations.filter(e => {
    const typeMatch = filterType === 'all' || e.proposal_type === filterType;
    const recMatch = filterRecommendation === 'all' || e.recommendation === filterRecommendation;
    return typeMatch && recMatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Loading evaluations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Proposal Evaluation Framework"
        subtitle="Standardized scoring system for all proposals, capital projects, regional services, and restructuring initiatives."
        icon={Zap}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evaluation List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Evaluations</h2>
            <button
              onClick={() => {
                setEditingEvaluation(null);
                setShowForm(true);
              }}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Filters */}
          <div className="space-y-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium"
            >
              <option value="all">All Types</option>
              <option value="departmental">Departmental</option>
              <option value="capital_project">Capital Projects</option>
              <option value="shared_service">Shared Services</option>
              <option value="restructuring">Restructuring</option>
              <option value="regional_service">Regional Services</option>
              <option value="initiative">Initiatives</option>
            </select>

            <select
              value={filterRecommendation}
              onChange={(e) => setFilterRecommendation(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium"
            >
              <option value="all">All Recommendations</option>
              <option value="recommended">Recommended</option>
              <option value="recommended_with_conditions">With Conditions</option>
              <option value="further_study_needed">Further Study</option>
              <option value="not_recommended">Not Recommended</option>
            </select>
          </div>

          {/* Evaluation Items */}
          <div className="space-y-2">
            {filteredEvaluations.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
                <p className="text-xs text-slate-600">No evaluations found</p>
              </div>
            ) : (
              filteredEvaluations.map(evaluation => (
                <div
                  key={evaluation.id}
                  onClick={() => setSelectedEvaluation(evaluation)}
                  className={`rounded-lg border p-3 cursor-pointer transition-all ${
                    selectedEvaluation?.id === evaluation.id
                      ? 'border-slate-800 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{evaluation.proposal_name}</h3>
                      <p className="text-[10px] text-slate-500">{evaluation.proposal_type}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900">{evaluation.overall_score?.toFixed(1)}</div>
                      <p className="text-[10px] text-slate-500">/10</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className={`px-2 py-1 rounded font-semibold ${
                      evaluation.recommendation === 'recommended' ? 'bg-emerald-100 text-emerald-700' :
                      evaluation.recommendation === 'recommended_with_conditions' ? 'bg-blue-100 text-blue-700' :
                      evaluation.recommendation === 'further_study_needed' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {evaluation.recommendation?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {showForm ? (
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900">
                  {editingEvaluation ? 'Edit Evaluation' : 'New Evaluation'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingEvaluation(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
              <ProposalEvaluationForm
                evaluation={editingEvaluation}
                onSave={handleSaveEvaluation}
              />
            </div>
          ) : selectedEvaluation ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Evaluation Details</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingEvaluation(selectedEvaluation)}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEvaluation(selectedEvaluation.id)}
                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <ProposalEvaluationDisplay evaluation={selectedEvaluation} />
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-12 text-center">
              <p className="text-sm text-slate-600 mb-4">Select an evaluation to view details or create a new one</p>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800"
              >
                Create New Evaluation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Dashboard */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Evaluation Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600 uppercase">Total</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{evaluations.length}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs font-semibold text-emerald-700 uppercase">Recommended</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">
              {evaluations.filter(e => e.recommendation === 'recommended').length}
            </p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs font-semibold text-blue-700 uppercase">With Conditions</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {evaluations.filter(e => e.recommendation === 'recommended_with_conditions').length}
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold text-amber-700 uppercase">Further Study</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">
              {evaluations.filter(e => e.recommendation === 'further_study_needed').length}
            </p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-xs font-semibold text-red-700 uppercase">Not Recommended</p>
            <p className="text-2xl font-bold text-red-700 mt-1">
              {evaluations.filter(e => e.recommendation === 'not_recommended').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}