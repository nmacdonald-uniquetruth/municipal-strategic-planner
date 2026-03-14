import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Download, Copy, FileText } from 'lucide-react';
import SectionHeader from '@/components/machias/SectionHeader';

export default function BoardMemoGenerator() {
  const [selectedProposalId, setSelectedProposalId] = useState(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [tone, setTone] = useState('select_board');
  const [generatedMemo, setGeneratedMemo] = useState(null);
  const [copied, setCopied] = useState(false);

  const { data: proposals = [] } = useQuery({
    queryKey: ['proposals'],
    queryFn: () => base44.entities.Proposal.list('-updated_date', 100),
  });

  const { data: scenarios = [] } = useQuery({
    queryKey: ['scenarios'],
    queryFn: () => base44.entities.Scenario.list('-updated_date', 100),
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateBoardMemo', {
        proposalId: selectedProposalId,
        scenarioId: selectedScenarioId,
        tone,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setGeneratedMemo(data);
    },
  });

  const handleGenerate = () => {
    if (!selectedProposalId && !selectedScenarioId) return;
    generateMutation.mutate();
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedMemo.memo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedMemo.memo], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `memo_${generatedMemo.sourceType}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const toneOptions = [
    { value: 'select_board', label: 'Select Board', description: 'For elected officials' },
    { value: 'budget_committee', label: 'Budget Committee', description: 'For finance experts' },
    { value: 'staff', label: 'Internal Staff', description: 'For municipal staff' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Board-Ready Memo Generator"
        subtitle="Generate professional municipal memos from proposals and scenarios"
        icon={FileText}
      />

      {!generatedMemo ? (
        /* Selection and Generation Panel */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Proposal/Scenario Selection */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h3 className="font-bold text-slate-900 mb-4">1. Select Source</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Proposal</label>
                <select
                  value={selectedProposalId || ''}
                  onChange={(e) => {
                    setSelectedProposalId(e.target.value || null);
                    setSelectedScenarioId(null);
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="">Select a proposal...</option>
                  {proposals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-center text-xs text-slate-500 font-semibold">OR</div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Scenario</label>
                <select
                  value={selectedScenarioId || ''}
                  onChange={(e) => {
                    setSelectedScenarioId(e.target.value || null);
                    setSelectedProposalId(null);
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="">Select a scenario...</option>
                  {scenarios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tone Selection */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h3 className="font-bold text-slate-900 mb-4">2. Select Tone</h3>

            <div className="space-y-3">
              {toneOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    tone === option.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    value={option.value}
                    checked={tone === option.value}
                    onChange={(e) => setTone(e.target.value)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-900">{option.label}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 mb-4">3. Generate</h3>
              <p className="text-sm text-slate-600 mb-4">
                {selectedProposalId || selectedScenarioId
                  ? 'Ready to generate memo with selected options'
                  : 'Select a proposal or scenario to continue'}
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={(!selectedProposalId && !selectedScenarioId) || generateMutation.isPending}
              className="w-full px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {generateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {generateMutation.isPending ? 'Generating...' : 'Generate Memo'}
            </button>
          </div>
        </div>
      ) : (
        /* Generated Memo Display */
        <div className="space-y-4">
          {/* Header and Actions */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  Generated Memo: {generatedMemo.sourceTitle}
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  Tone: <span className="font-semibold">{toneOptions.find((t) => t.value === tone)?.label}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyToClipboard}
                  className="px-3 py-2 text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleDownload}
                  className="px-3 py-2 text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setGeneratedMemo(null);
                setSelectedProposalId(null);
                setSelectedScenarioId(null);
              }}
              className="text-sm text-slate-600 hover:text-slate-900 font-semibold"
            >
              ← Generate Another Memo
            </button>
          </div>

          {/* Memo Content */}
          <div className="rounded-lg border border-slate-200 bg-white p-8 whitespace-pre-wrap font-serif text-slate-800 leading-relaxed">
            {generatedMemo.memo}
          </div>
        </div>
      )}

      {/* Information Panel */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
        <h3 className="font-bold text-slate-900 mb-3">About This Tool</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-700">
          <div>
            <p className="font-bold text-slate-900 mb-2">What it does:</p>
            <ul className="space-y-1 text-xs">
              <li>• Generates professional municipal memos</li>
              <li>• Customizes tone for your audience</li>
              <li>• Extracts key financial and tax impacts</li>
              <li>• Highlights risks and recommendations</li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-slate-900 mb-2">Best practices:</p>
            <ul className="space-y-1 text-xs">
              <li>• Review and edit generated content</li>
              <li>• Verify all numbers and dates</li>
              <li>• Customize for specific audiences</li>
              <li>• Save copies for records</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}