import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, Plus, X } from 'lucide-react';

const DEPARTMENTS = [
  'Police',
  'Finance',
  'Ambulance/Fire',
  'Public Works',
  'Parks & Recreation',
  'Planning & Development'
];

const SUPPORT_ROLES = {
  'Police': ['Administrative Assistant', 'Records Manager', 'Dispatch Support'],
  'Finance': ['Accounting Clerk', 'Payroll Specialist', 'Budget Analyst'],
  'Ambulance/Fire': ['Administrative Coordinator', 'Training Specialist', 'Equipment Manager'],
  'Public Works': ['Administrative Assistant', 'Maintenance Coordinator', 'Project Scheduler'],
  'Parks & Recreation': ['Program Coordinator', 'Facilities Manager', 'Administrative Assistant'],
  'Planning & Development': ['Permit Clerk', 'Administrative Assistant', 'Code Enforcement Coordinator']
};

export default function CapacityModelForm({ model, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(model || {
    department: '',
    leadershipRole: '',
    totalWeeklyHours: 40,
    currentAdminHours: 0,
    adminHoursBreakdown: {},
    supportRoleAdded: '',
    hoursTransferredToSupport: 0,
    serviceDevelopmentOpportunitiesCreated: [],
    regionalRevenueImplications: '',
    estimatedAnnualSavingsOrRevenue: 0,
    notes: '',
    status: 'draft'
  });

  const [newOpportunity, setNewOpportunity] = useState('');
  const [newAdminItem, setNewAdminItem] = useState({ label: '', hours: 0 });

  const handleAddOpportunity = () => {
    if (newOpportunity.trim()) {
      setFormData(prev => ({
        ...prev,
        serviceDevelopmentOpportunitiesCreated: [
          ...(prev.serviceDevelopmentOpportunitiesCreated || []),
          newOpportunity
        ]
      }));
      setNewOpportunity('');
    }
  };

  const handleRemoveOpportunity = (idx) => {
    setFormData(prev => ({
      ...prev,
      serviceDevelopmentOpportunitiesCreated: prev.serviceDevelopmentOpportunitiesCreated.filter((_, i) => i !== idx)
    }));
  };

  const handleAddAdminItem = () => {
    if (newAdminItem.label && newAdminItem.hours > 0) {
      setFormData(prev => ({
        ...prev,
        adminHoursBreakdown: {
          ...prev.adminHoursBreakdown,
          [newAdminItem.label]: newAdminItem.hours
        }
      }));
      setNewAdminItem({ label: '', hours: 0 });
    }
  };

  const handleRemoveAdminItem = (key) => {
    setFormData(prev => {
      const updated = { ...prev.adminHoursBreakdown };
      delete updated[key];
      return { ...prev, adminHoursBreakdown: updated };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const remainingHours = formData.totalWeeklyHours - formData.currentAdminHours;
  const projectedAdminHours = Math.max(0, formData.currentAdminHours - formData.hoursTransferredToSupport);
  const projectedStrategicHours = formData.totalWeeklyHours - projectedAdminHours;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Department & Role */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Department & Leadership Role</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Department</option>
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Leadership Role Title</label>
            <input
              type="text"
              value={formData.leadershipRole}
              onChange={(e) => setFormData(prev => ({ ...prev, leadershipRole: e.target.value }))}
              placeholder="e.g., Police Chief, Finance Director"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </CardContent>
      </Card>

      {/* Time Allocation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weekly Time Allocation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Weekly Hours</label>
              <input
                type="number"
                value={formData.totalWeeklyHours}
                onChange={(e) => setFormData(prev => ({ ...prev, totalWeeklyHours: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Admin Hours/Week</label>
              <input
                type="number"
                value={formData.currentAdminHours}
                onChange={(e) => setFormData(prev => ({ ...prev, currentAdminHours: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Current Strategic Capacity: <span className="font-bold text-blue-600">{remainingHours} hrs/week</span></p>
          </div>

          {/* Admin Hours Breakdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Administrative Duties Breakdown</label>
            <div className="space-y-2 mb-3">
              {Object.entries(formData.adminHoursBreakdown).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{key}</p>
                    <p className="text-xs text-gray-500">{value} hrs/week</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAdminItem(key)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newAdminItem.label}
                onChange={(e) => setNewAdminItem(prev => ({ ...prev, label: e.target.value }))}
                placeholder="e.g., Email management"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                value={newAdminItem.hours}
                onChange={(e) => setNewAdminItem(prev => ({ ...prev, hours: parseFloat(e.target.value) }))}
                placeholder="Hours"
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                type="button"
                onClick={handleAddAdminItem}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Role & Transfer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Support Role Implementation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Support Role to Add</label>
            <select
              value={formData.supportRoleAdded}
              onChange={(e) => setFormData(prev => ({ ...prev, supportRoleAdded: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Support Role</option>
              {formData.department && SUPPORT_ROLES[formData.department]?.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hours to Transfer to Support Staff</label>
            <input
              type="number"
              value={formData.hoursTransferredToSupport}
              onChange={(e) => setFormData(prev => ({ ...prev, hoursTransferredToSupport: parseFloat(e.target.value) }))}
              max={formData.currentAdminHours}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum: {formData.currentAdminHours} hours</p>
          </div>

          {formData.hoursTransferredToSupport > 0 && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Projected Strategic Capacity</p>
              <p className="text-2xl font-bold text-green-600">{projectedStrategicHours} hrs/week</p>
              <p className="text-xs text-gray-500 mt-1">Currently: {remainingHours} hrs/week</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service Development Opportunities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 mb-3">
            {(formData.serviceDevelopmentOpportunitiesCreated || []).map((opp, idx) => (
              <div key={idx} className="flex items-center justify-between bg-amber-50 p-2 rounded">
                <p className="text-sm text-gray-700 flex-1">{opp}</p>
                <button
                  type="button"
                  onClick={() => handleRemoveOpportunity(idx)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newOpportunity}
              onChange={(e) => setNewOpportunity(e.target.value)}
              placeholder="e.g., Expand community policing program"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleAddOpportunity()}
            />
            <button
              type="button"
              onClick={handleAddOpportunity}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Financial & Regional */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Financial & Regional Impact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Annual Financial Impact</label>
            <input
              type="number"
              value={formData.estimatedAnnualSavingsOrRevenue}
              onChange={(e) => setFormData(prev => ({ ...prev, estimatedAnnualSavingsOrRevenue: parseFloat(e.target.value) }))}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Positive = revenue/savings, Negative = cost</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Regional Revenue Implications</label>
            <textarea
              value={formData.regionalRevenueImplications}
              onChange={(e) => setFormData(prev => ({ ...prev, regionalRevenueImplications: e.target.value }))}
              placeholder="Describe potential regional service opportunities and revenue implications..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notes & Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="draft">Draft</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="implemented">Implemented</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes or context..."
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
          {model ? 'Update Model' : 'Create Model'}
        </Button>
      </div>
    </form>
  );
}