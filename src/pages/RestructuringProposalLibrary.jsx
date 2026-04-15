import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit2, LayoutGrid, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ProposalCard from '../components/proposals/ProposalCard';
import ProposalFilters from '../components/proposals/ProposalFilters';
import ProposalComparison from '../components/proposals/ProposalComparison';
import ProposalDetail from '../components/proposals/ProposalDetail';
import ProposalForm from '../components/proposals/ProposalForm';
import { WORKFLOW_STAGES } from '../components/proposals/workflowValidator';

export default function RestructuringProposalLibrary() {
  const [showForm, setShowForm] = useState(false);
  const [editingProposal, setEditingProposal] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [filters, setFilters] = useState({});
  const queryClient = useQueryClient();

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ['restructuringProposals'],
    queryFn: () => base44.entities.RestructuringProposal.list()
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['proposalEvaluations'],
    queryFn: () => base44.entities.ProposalEvaluation.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RestructuringProposal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restructuringProposals'] });
      setShowForm(false);
      setEditingProposal(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RestructuringProposal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restructuringProposals'] });
      setShowForm(false);
      setEditingProposal(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (deletedId) => base44.entities.RestructuringProposal.delete(deletedId),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['restructuringProposals'] });
      if (selectedProposal?.id === deletedId) setSelectedProposal(null);
      setSelectedForComparison(prev => prev.filter(p => p.id !== deletedId));
    }
  });

  const statusChangeMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.RestructuringProposal.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restructuringProposals'] });
    }
  });

  // Extract unique values for filters
  const departments = useMemo(() => {
    const all = new Set();
    proposals.forEach(p => {
      p.departments?.forEach(d => all.add(d));
    });
    return Array.from(all).sort();
  }, [proposals]);

  const serviceTypes = useMemo(() => {
    const all = new Set();
    proposals.forEach(p => {
      p.serviceTypes?.forEach(s => all.add(s));
    });
    return Array.from(all).sort();
  }, [proposals]);

  const towns = useMemo(() => {
    const all = new Set();
    proposals.forEach(p => {
      p.towns?.forEach(t => all.add(t));
    });
    return Array.from(all).sort();
  }, [proposals]);

  const fiscalYears = useMemo(() => {
    const all = new Set();
    proposals.forEach(p => {
      if (p.fiscalYear) all.add(p.fiscalYear);
    });
    return Array.from(all).sort().reverse();
  }, [proposals]);

  // Filter proposals
  const filteredProposals = useMemo(() => {
    return proposals.filter(p => {
      // Search
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matches = p.title.toLowerCase().includes(search) ||
                       p.description.toLowerCase().includes(search);
        if (!matches) return false;
      }

      // Categories
      if (filters.categories?.length > 0 && !filters.categories.includes(p.category)) {
        return false;
      }

      // Priorities
      if (filters.priorities?.length > 0 && !filters.priorities.includes(p.priority)) {
        return false;
      }

      // Statuses
      if (filters.statuses?.length > 0 && !filters.statuses.includes(p.status)) {
        return false;
      }

      // Departments
      if (filters.departments?.length > 0) {
        const hasDept = p.departments?.some(d => filters.departments.includes(d));
        if (!hasDept) return false;
      }

      // Service Types
      if (filters.serviceTypes?.length > 0) {
        const hasService = p.serviceTypes?.some(s => filters.serviceTypes.includes(s));
        if (!hasService) return false;
      }

      // Fiscal Years
      if (filters.fiscalYears?.length > 0 && !filters.fiscalYears.includes(p.fiscalYear)) {
        return false;
      }

      // Minimum Annual Impact
      if (filters.minAnnualImpact && filters.minAnnualImpact > 0) {
        const impact = (p.estimatedAnnualSavings || 0) + (p.estimatedAnnualRevenue || 0);
        if (impact < filters.minAnnualImpact) return false;
      }

      return true;
    });
  }, [proposals, filters]);

  const handleSubmit = (data) => {
    if (editingProposal) {
      updateMutation.mutate({ id: editingProposal.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (proposal) => {
    setEditingProposal(proposal);
    setShowForm(true);
    setSelectedProposal(null);
  };

  const handleSelectForComparison = (proposal) => {
    setSelectedForComparison(prev => {
      const exists = prev.find(p => p.id === proposal.id);
      if (exists) {
        return prev.filter(p => p.id !== proposal.id);
      } else {
        return [...prev, proposal];
      }
    });
  };

  const handleRemoveFromComparison = (id) => {
    setSelectedForComparison(prev => prev.filter(p => p.id !== id));
  };

  const relatedProposals = useMemo(() => {
    if (!selectedProposal?.relatedProposals) return [];
    return proposals.filter(p => selectedProposal.relatedProposals?.includes(p.id));
  }, [selectedProposal, proposals]);

  const selectedProposalEvaluation = useMemo(() => {
    if (!selectedProposal) return null;
    return evaluations.find(e => e.proposal_id === selectedProposal.id);
  }, [selectedProposal, evaluations]);

  const handleStatusChange = (newStatus) => {
    if (selectedProposal) {
      statusChangeMutation.mutate(
        { id: selectedProposal.id, status: newStatus },
        {
          onSuccess: () => {
            setSelectedProposal(prev => prev ? { ...prev, status: newStatus } : null);
          }
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Restructuring Proposal Library</h1>
          <p className="text-gray-600 mt-2">Search, compare, and reuse restructuring proposals across departments and services</p>
        </div>
        <AnimatePresence mode="wait">
          {!showForm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Button
                onClick={() => { setEditingProposal(null); setShowForm(true); }}
                className="bg-blue-600 hover:bg-blue-700 gap-2"
              >
                <Plus className="w-5 h-5" /> Create Proposal
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Form Section */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle>{editingProposal ? 'Edit Proposal' : 'Create New Proposal'}</CardTitle>
              </CardHeader>
              <CardContent>
                <ProposalForm
                  proposal={editingProposal}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingProposal(null);
                  }}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Panel */}
      {selectedForComparison.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <ProposalComparison
            proposals={selectedForComparison}
            onRemove={handleRemoveFromComparison}
            onClearAll={() => setSelectedForComparison([])}
          />
        </motion.div>
      )}

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <div>
          <ProposalFilters
            filters={filters}
            onFiltersChange={setFilters}
            departments={departments}
            serviceTypes={serviceTypes}
            towns={towns}
            fiscalYears={fiscalYears}
          />
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600">Loading proposals...</p>
              </CardContent>
            </Card>
          ) : filteredProposals.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Proposals Found</h3>
                <p className="text-gray-600 mb-6">
                  {proposals.length === 0 
                    ? 'Create your first restructuring proposal to get started.'
                    : 'Try adjusting your filters or search criteria.'}
                </p>
                {proposals.length === 0 && (
                  <Button
                    onClick={() => { setEditingProposal(null); setShowForm(true); }}
                    className="bg-blue-600 hover:bg-blue-700 gap-2"
                  >
                    <Plus className="w-5 h-5" /> Create Proposal
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{filteredProposals.length}</span> proposal{filteredProposals.length !== 1 ? 's' : ''}
                </p>
              </div>

              <motion.div
                layout
                className="grid gap-4"
              >
                <AnimatePresence>
                  {filteredProposals.map(proposal => (
                    <motion.div
                      key={proposal.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <div className="relative group">
                        <ProposalCard
                          proposal={proposal}
                          onSelect={() => setSelectedProposal(proposal)}
                          isSelected={selectedProposal?.id === proposal.id}
                          showCheckbox
                          onClick={(e) => {
                            if (!e.target.closest('input[type="checkbox"]')) {
                              setSelectedProposal(proposal);
                            }
                          }}
                        />
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectForComparison(proposal);
                            }}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              selectedForComparison.find(p => p.id === proposal.id)
                                ? 'bg-green-500 text-white'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                          >
                            {selectedForComparison.find(p => p.id === proposal.id) ? '✓ Selected' : '+ Compare'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(proposal);
                            }}
                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-lg"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedProposal && (
          <ProposalDetail
            proposal={selectedProposal}
            evaluation={selectedProposalEvaluation}
            onClose={() => setSelectedProposal(null)}
            onEdit={handleEdit}
            onDelete={(id) => deleteMutation.mutate(id)}
            onStatusChange={handleStatusChange}
            relatedProposals={relatedProposals}
          />
        )}
      </AnimatePresence>
    </div>
  );
}