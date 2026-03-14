import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';

const CATEGORIES = [
  { value: 'staffing', label: 'Staffing' },
  { value: 'shared_services', label: 'Shared Services' },
  { value: 'regional_revenue', label: 'Regional Revenue' },
  { value: 'capital', label: 'Capital' },
  { value: 'governance', label: 'Governance' },
  { value: 'administration', label: 'Administration' }
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' }
];

const STATUSES = [
  { value: 'concept', label: 'Concept' },
  { value: 'in_development', label: 'In Development' },
  { value: 'ready_for_review', label: 'Ready for Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'implemented', label: 'Implemented' },
  { value: 'archived', label: 'Archived' }
];

const DEPARTMENTS = ['Police', 'Finance', 'Fire/EMS', 'Public Works', 'Parks & Recreation', 'Planning & Development', 'Selectmen', 'Town Manager'];
const SERVICE_TYPES = ['Police', 'Fire', 'EMS', 'Finance', 'Public Works', 'Parks', 'Planning', 'Administration', 'Public Health'];

export default function ProposalForm({ proposal, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(proposal || {
    title: '',
    description: '',
    category: 'staffing',
    departments: [],
    towns: [],
    serviceTypes: [],
    priority: 'medium',
    fiscalYear: '',
    estimatedAnnualSavings: 0,
    estimatedAnnualRevenue: 0,
    implementationCost: 0,
    implementationTimeline: '',
    keyBenefits: [],
    risks: [],
    mitigationStrategies: [],
    successMetrics: [],
    stakeholders: [],
    status: 'concept',
    relatedProposals: [],
    notes: ''
  });

  const [newBenefit, setNewBenefit] = useState('');
  const [newRisk, setNewRisk] = useState('');
  const [newMitigation, setNewMitigation] = useState('');
  const [newMetric, setNewMetric] = useState('');
  const [newStakeholder, setNewStakeholder] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newTown, setNewTown] = useState('');
  const [newService, setNewService] = useState('');

  const addItem = (key, value, setter) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [key]: [...(prev[key] || []), value]
      }));
      setter('');
    }
  };

  const removeItem = (key, index) => {
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addDept = () => addItem('departments', newDept, setNewDept);
  const addTown = () => addItem('towns', newTown, setNewTown);
  const addService = () => addItem('serviceTypes', newService, setNewService);
  const addBenefit = () => addItem('keyBenefits', newBenefit, setNewBenefit);
  const addRisk = () => addItem('risks', newRisk, setNewRisk);
  const addMitigation = () => addItem('mitigationStrategies', newMitigation, setNewMitigation);
  const addMetric = () => addItem('successMetrics', newMetric, setNewMetric);
  const addStakeholder = () => addItem('stakeholders', newStakeholder, setNewStakeholder);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Consolidate Finance Department with Regional Partner"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of the proposal..."
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {PRIORITIES.map(pri => (
                  <option key={pri.value} value={pri.value}>{pri.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {STATUSES.map(stat => (
                  <option key={stat.value} value={stat.value}>{stat.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tags & Classification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Departments</label>
            <div className="space-y-2 mb-3">
              {formData.departments.map((dept, idx) => (
                <div key={idx} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                  <span className="text-sm text-gray-700">{dept}</span>
                  <button
                    type="button"
                    onClick={() => removeItem('departments', idx)}
                    className="p-1 text-red-500 hover:bg-red-100 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <select
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={addDept}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Types</label>
            <div className="space-y-2 mb-3">
              {formData.serviceTypes.map((service, idx) => (
                <div key={idx} className="flex items-center justify-between bg-purple-50 p-2 rounded">
                  <span className="text-sm text-gray-700">{service}</span>
                  <button
                    type="button"
                    onClick={() => removeItem('serviceTypes', idx)}
                    className="p-1 text-red-500 hover:bg-red-100 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <select
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Select Service Type</option>
                {SERVICE_TYPES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={addService}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fiscal Year</label>
              <input
                type="text"
                value={formData.fiscalYear}
                onChange={(e) => setFormData(prev => ({ ...prev, fiscalYear: e.target.value }))}
                placeholder="e.g., FY2027"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Towns (if regional)</label>
              <input
                type="text"
                value={newTown}
                onChange={(e) => setNewTown(e.target.value)}
                placeholder="Town name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                onKeyPress={(e) => e.key === 'Enter' && addTown()}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Impact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Financial Impact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Annual Savings ($)</label>
              <input
                type="number"
                value={formData.estimatedAnnualSavings}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedAnnualSavings: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Annual Revenue ($)</label>
              <input
                type="number"
                value={formData.estimatedAnnualRevenue}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedAnnualRevenue: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Implementation Cost ($)</label>
              <input
                type="number"
                value={formData.implementationCost}
                onChange={(e) => setFormData(prev => ({ ...prev, implementationCost: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Implementation Timeline</label>
            <input
              type="text"
              value={formData.implementationTimeline}
              onChange={(e) => setFormData(prev => ({ ...prev, implementationTimeline: e.target.value }))}
              placeholder="e.g., Q1 2027 - Q3 2027"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </CardContent>
      </Card>

      {/* Benefits & Risks */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Key Benefits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 mb-3">
              {formData.keyBenefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start justify-between bg-green-50 p-2 rounded text-sm">
                  <span className="text-gray-700 flex-1">{benefit}</span>
                  <button
                    type="button"
                    onClick={() => removeItem('keyBenefits', idx)}
                    className="p-1 text-red-500 hover:bg-red-100 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newBenefit}
                onChange={(e) => setNewBenefit(e.target.value)}
                placeholder="Add benefit..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                onKeyPress={(e) => e.key === 'Enter' && addBenefit()}
              />
              <button
                type="button"
                onClick={addBenefit}
                className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 mb-3">
              {formData.risks.map((risk, idx) => (
                <div key={idx} className="flex items-start justify-between bg-red-50 p-2 rounded text-sm">
                  <span className="text-gray-700 flex-1">{risk}</span>
                  <button
                    type="button"
                    onClick={() => removeItem('risks', idx)}
                    className="p-1 text-red-500 hover:bg-red-100 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newRisk}
                onChange={(e) => setNewRisk(e.target.value)}
                placeholder="Add risk..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                onKeyPress={(e) => e.key === 'Enter' && addRisk()}
              />
              <button
                type="button"
                onClick={addRisk}
                className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mitigation & Metrics */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mitigation Strategies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 mb-3">
              {formData.mitigationStrategies.map((strategy, idx) => (
                <div key={idx} className="flex items-start justify-between bg-blue-50 p-2 rounded text-sm">
                  <span className="text-gray-700 flex-1">{strategy}</span>
                  <button
                    type="button"
                    onClick={() => removeItem('mitigationStrategies', idx)}
                    className="p-1 text-red-500 hover:bg-red-100 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMitigation}
                onChange={(e) => setNewMitigation(e.target.value)}
                placeholder="Add strategy..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                onKeyPress={(e) => e.key === 'Enter' && addMitigation()}
              />
              <button
                type="button"
                onClick={addMitigation}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Success Metrics (KPIs)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 mb-3">
              {formData.successMetrics.map((metric, idx) => (
                <div key={idx} className="flex items-start justify-between bg-purple-50 p-2 rounded text-sm">
                  <span className="text-gray-700 flex-1">{metric}</span>
                  <button
                    type="button"
                    onClick={() => removeItem('successMetrics', idx)}
                    className="p-1 text-red-500 hover:bg-red-100 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMetric}
                onChange={(e) => setNewMetric(e.target.value)}
                placeholder="Add metric..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                onKeyPress={(e) => e.key === 'Enter' && addMetric()}
              />
              <button
                type="button"
                onClick={addMetric}
                className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stakeholders & Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stakeholders & Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Key Stakeholders</label>
            <div className="space-y-2 mb-3">
              {formData.stakeholders.map((stakeholder, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                  <span className="text-gray-700">{stakeholder}</span>
                  <button
                    type="button"
                    onClick={() => removeItem('stakeholders', idx)}
                    className="p-1 text-red-500 hover:bg-red-100 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newStakeholder}
                onChange={(e) => setNewStakeholder(e.target.value)}
                placeholder="e.g., Finance Director, Police Chief"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                onKeyPress={(e) => e.key === 'Enter' && addStakeholder()}
              />
              <button
                type="button"
                onClick={addStakeholder}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional considerations..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          {proposal ? 'Update Proposal' : 'Create Proposal'}
        </Button>
      </div>
    </form>
  );
}