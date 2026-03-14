import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

const MUNICIPALITIES = [
  'Machias', 'Machiasport', 'East Machias', 'Roque Bluffs',
  'Jonesboro', 'Jonesport', 'Beals', 'Cutler', 'Whiting',
  'Marshfield', 'Northfield', 'Deblois', 'Beddington',
  'Addison', 'Columbia', 'Columbia Falls',
];

export default function FiscalResearchForm({ record, onClose }) {
  const [formData, setFormData] = useState(record || {
    municipality: '',
    county: 'Washington County',
    financial_admin_structure: '',
    treasurer_annual_allocation: '',
    finance_director_allocation: '',
    bookkeeper_allocation: '',
    accounting_services_contract: '',
    total_annual_cost: '',
    source_document: '',
    source_document_detail: '',
    fiscal_feasibility: 'moderate',
    estimated_regional_service_price_low: '',
    estimated_regional_service_price_high: '',
    potential_net_fiscal_impact: '',
    existing_relationships: '',
    research_notes: '',
    data_confidence: 'moderate',
  });

  const [saving, setSaving] = useState(false);

  const calculateTotal = (data) => {
    const values = [
      data.treasurer_annual_allocation,
      data.finance_director_allocation,
      data.bookkeeper_allocation,
      data.accounting_services_contract,
    ].map(v => parseFloat(v) || 0);
    return values.reduce((a, b) => a + b, 0);
  };

  const handleChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    if (['treasurer_annual_allocation', 'finance_director_allocation', 'bookkeeper_allocation', 'accounting_services_contract'].includes(field)) {
      updated.total_annual_cost = calculateTotal(updated);
    }
    setFormData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.municipality) {
      alert('Please select a municipality');
      return;
    }
    setSaving(true);
    try {
      if (record?.id) {
        await base44.entities.MunicipalFinancialAdmin.update(record.id, formData);
      } else {
        await base44.entities.MunicipalFinancialAdmin.create(formData);
      }
      onClose();
    } catch (err) {
      alert('Error saving record: ' + err.message);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full my-8">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            {record ? 'Edit Research Record' : 'Add Municipal Research'}
          </h3>

          {/* Municipality */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Municipality *</label>
            <Select value={formData.municipality} onValueChange={(v) => handleChange('municipality', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select municipality" />
              </SelectTrigger>
              <SelectContent>
                {MUNICIPALITIES.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Financial Admin Structure */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Financial Admin Structure</label>
            <Input
              value={formData.financial_admin_structure}
              onChange={(e) => handleChange('financial_admin_structure', e.target.value)}
              placeholder="E.g., Elected Treasurer + Part-time Bookkeeper"
            />
          </div>

          {/* Allocations Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Treasurer Annual ($)</label>
              <Input
                type="number"
                value={formData.treasurer_annual_allocation}
                onChange={(e) => handleChange('treasurer_annual_allocation', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Finance Director Annual ($)</label>
              <Input
                type="number"
                value={formData.finance_director_allocation}
                onChange={(e) => handleChange('finance_director_allocation', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Bookkeeper Annual ($)</label>
              <Input
                type="number"
                value={formData.bookkeeper_allocation}
                onChange={(e) => handleChange('bookkeeper_allocation', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Accounting Services Contract ($)</label>
              <Input
                type="number"
                value={formData.accounting_services_contract}
                onChange={(e) => handleChange('accounting_services_contract', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Total Annual Cost (Auto-calculated) */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Total Annual Cost (Auto-calculated)</label>
            <div className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold">
              ${formData.total_annual_cost ? parseFloat(formData.total_annual_cost).toLocaleString() : '0'}
            </div>
          </div>

          {/* Source Document */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Source Document</label>
            <Select value={formData.source_document} onValueChange={(v) => handleChange('source_document', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="town_meeting_warrant">Town Meeting Warrant</SelectItem>
                <SelectItem value="town_meeting_minutes">Town Meeting Minutes</SelectItem>
                <SelectItem value="municipal_budget">Municipal Budget Document</SelectItem>
                <SelectItem value="website_posting">Website Posting</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Source Details (URL, warrant article, year, etc.)</label>
            <Input
              value={formData.source_document_detail}
              onChange={(e) => handleChange('source_document_detail', e.target.value)}
              placeholder="E.g., 2024 ATM Warrant Article 5, or URL"
            />
          </div>

          {/* Fiscal Feasibility */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Fiscal Feasibility</label>
            <Select value={formData.fiscal_feasibility} onValueChange={(v) => handleChange('fiscal_feasibility', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High — Strong candidate for regional services</SelectItem>
                <SelectItem value="moderate">Moderate — Potential with conditions</SelectItem>
                <SelectItem value="low">Low — Limited feasibility</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Regional Service Price Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Est. Service Price Low ($)</label>
              <Input
                type="number"
                value={formData.estimated_regional_service_price_low}
                onChange={(e) => handleChange('estimated_regional_service_price_low', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Est. Service Price High ($)</label>
              <Input
                type="number"
                value={formData.estimated_regional_service_price_high}
                onChange={(e) => handleChange('estimated_regional_service_price_high', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Net Fiscal Impact */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Potential Net Fiscal Impact ($)</label>
            <Input
              type="number"
              value={formData.potential_net_fiscal_impact}
              onChange={(e) => handleChange('potential_net_fiscal_impact', e.target.value)}
              placeholder="Positive = revenue for Machias, Negative = cost"
            />
          </div>

          {/* Existing Relationships */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Existing Relationships with Machias</label>
            <Input
              value={formData.existing_relationships}
              onChange={(e) => handleChange('existing_relationships', e.target.value)}
              placeholder="E.g., Shares school district, regional EMS, etc."
            />
          </div>

          {/* Research Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Research Notes</label>
            <textarea
              value={formData.research_notes}
              onChange={(e) => handleChange('research_notes', e.target.value)}
              placeholder="Additional observations, challenges, opportunities, etc."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
              rows={3}
            />
          </div>

          {/* Data Confidence */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Data Confidence</label>
            <Select value={formData.data_confidence} onValueChange={(v) => handleChange('data_confidence', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High — Official document verified</SelectItem>
                <SelectItem value="moderate">Moderate — Multiple sources confirm</SelectItem>
                <SelectItem value="low">Low — Single source or estimated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white"
              disabled={saving}
            >
              {saving ? 'Saving…' : record ? 'Update' : 'Add Record'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}