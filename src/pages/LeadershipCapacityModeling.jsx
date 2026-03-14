import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit2, Trash2, Download, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import CapacityCard from '../components/leadership/CapacityCard';
import CapacityModelForm from '../components/leadership/CapacityModelForm';

export default function LeadershipCapacityModeling() {
  const [showForm, setShowForm] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [filterDept, setFilterDept] = useState('all');
  const queryClient = useQueryClient();

  const { data: models = [], isLoading } = useQuery({
    queryKey: ['leadershipCapacityModels'],
    queryFn: () => base44.entities.LeadershipCapacityModel.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LeadershipCapacityModel.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leadershipCapacityModels'] });
      setShowForm(false);
      setEditingModel(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LeadershipCapacityModel.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leadershipCapacityModels'] });
      setShowForm(false);
      setEditingModel(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LeadershipCapacityModel.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leadershipCapacityModels'] });
    }
  });

  const handleSubmit = (data) => {
    if (editingModel) {
      updateMutation.mutate({ id: editingModel.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (model) => {
    setEditingModel(model);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingModel(null);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this model?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredModels = filterDept === 'all' 
    ? models 
    : models.filter(m => m.department === filterDept);

  const departments = [...new Set(models.map(m => m.department))].sort();

  // Calculate summary metrics
  const totalAdminHoursTransferred = models.reduce((sum, m) => sum + (m.hoursTransferredToSupport || 0), 0);
  const totalStrategicCapacityGained = models.reduce((sum, m) => sum + (m.strategicCapacityGained || m.hoursTransferredToSupport || 0), 0);
  const totalFinancialImpact = models.reduce((sum, m) => sum + (m.estimatedAnnualSavingsOrRevenue || 0), 0);
  const totalServiceOpportunities = models.reduce((sum, m) => sum + ((m.serviceDevelopmentOpportunitiesCreated || []).length), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leadership Capacity Modeling</h1>
          <p className="text-gray-600 mt-2">Analyze how support roles free up leadership time for strategic initiatives</p>
        </div>
        <AnimatePresence mode="wait">
          {!showForm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Button
                onClick={() => { setEditingModel(null); setShowForm(true); }}
                className="bg-blue-600 hover:bg-blue-700 gap-2"
              >
                <Plus className="w-5 h-5" /> Create Model
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
                <CardTitle>{editingModel ? 'Edit Capacity Model' : 'Create New Capacity Model'}</CardTitle>
              </CardHeader>
              <CardContent>
                <CapacityModelForm
                  model={editingModel}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Metrics */}
      {models.length > 0 && !showForm && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-2">Admin Hours Transferred</p>
              <p className="text-3xl font-bold text-blue-600">{totalAdminHoursTransferred}</p>
              <p className="text-xs text-gray-500 mt-2">hours per week</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-2">Strategic Capacity Gained</p>
              <p className="text-3xl font-bold text-green-600">{totalStrategicCapacityGained}</p>
              <p className="text-xs text-gray-500 mt-2">hours per week</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-2">Annual Financial Impact</p>
              <p className="text-3xl font-bold text-emerald-600">
                ${(totalFinancialImpact / 1000).toFixed(0)}k
              </p>
              <p className="text-xs text-gray-500 mt-2">estimated impact</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-2">Service Opportunities</p>
              <p className="text-3xl font-bold text-amber-600">{totalServiceOpportunities}</p>
              <p className="text-xs text-gray-500 mt-2">identified</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      {models.length > 0 && !showForm && (
        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-sm font-medium text-gray-700">Filter by Department:</span>
          <button
            onClick={() => setFilterDept('all')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filterDept === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Departments
          </button>
          {departments.map(dept => (
            <button
              key={dept}
              onClick={() => setFilterDept(dept)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filterDept === dept
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      )}

      {/* Models Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading models...</p>
        </div>
      ) : filteredModels.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Capacity Models Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first leadership capacity model to start analyzing administrative burden and strategic capacity.
            </p>
            <Button
              onClick={() => { setEditingModel(null); setShowForm(true); }}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Plus className="w-5 h-5" /> Create Model
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredModels.map(model => (
              <motion.div
                key={model.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative group"
              >
                <CapacityCard model={model} />
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button
                    onClick={() => handleEdit(model)}
                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-lg"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(model.id)}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}