import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Edit2, Trash2, Link2 } from 'lucide-react';

const CATEGORY_ICONS = {
  staffing: '👥',
  shared_services: '🤝',
  regional_revenue: '💰',
  capital: '🏗️',
  governance: '⚖️',
  administration: '📋'
};

export default function ProposalDetail({ proposal, onClose, onEdit, onDelete, relatedProposals = [] }) {
  if (!proposal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl my-8">
        <CardHeader className="flex flex-row items-start justify-between border-b pb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">{CATEGORY_ICONS[proposal.category]}</span>
              <Badge className="bg-blue-100 text-blue-800">
                {proposal.category.replace(/_/g, ' ')}
              </Badge>
              <Badge className={`
                ${proposal.priority === 'critical' ? 'bg-red-100 text-red-800' : ''}
                ${proposal.priority === 'high' ? 'bg-orange-100 text-orange-800' : ''}
                ${proposal.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${proposal.priority === 'low' ? 'bg-gray-100 text-gray-800' : ''}
              `}>
                {proposal.priority} priority
              </Badge>
              <Badge className="bg-purple-100 text-purple-800">
                {proposal.status.replace(/_/g, ' ')}
              </Badge>
            </div>
            <CardTitle className="text-2xl">{proposal.title}</CardTitle>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed">{proposal.description}</p>
          </div>

          {/* Financial Impact */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {proposal.estimatedAnnualSavings > 0 && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-600 mb-1">Annual Savings</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${(proposal.estimatedAnnualSavings / 1000).toFixed(0)}k
                  </p>
                </CardContent>
              </Card>
            )}
            {proposal.estimatedAnnualRevenue > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-600 mb-1">Annual Revenue</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${(proposal.estimatedAnnualRevenue / 1000).toFixed(0)}k
                  </p>
                </CardContent>
              </Card>
            )}
            {proposal.implementationCost > 0 && (
              <Card className="bg-red-50 border-red-200">
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-600 mb-1">Implementation Cost</p>
                  <p className="text-2xl font-bold text-red-600">
                    -${(proposal.implementationCost / 1000).toFixed(0)}k
                  </p>
                </CardContent>
              </Card>
            )}
            {((proposal.estimatedAnnualSavings || 0) + (proposal.estimatedAnnualRevenue || 0)) > 0 && (
              <Card className="bg-emerald-50 border-emerald-200">
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-600 mb-1">Net Annual Impact</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    +${((proposal.estimatedAnnualSavings || 0) + (proposal.estimatedAnnualRevenue || 0)) / 1000).toFixed(0)}k
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Tags */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {proposal.departments?.map(dept => (
                <Badge key={dept} variant="outline">📍 {dept}</Badge>
              ))}
              {proposal.serviceTypes?.map(service => (
                <Badge key={service} variant="outline">🔧 {service}</Badge>
              ))}
              {proposal.towns?.map(town => (
                <Badge key={town} variant="outline">🏛️ {town}</Badge>
              ))}
              {proposal.fiscalYear && (
                <Badge variant="outline">📅 {proposal.fiscalYear}</Badge>
              )}
            </div>
          </div>

          {/* Key Benefits */}
          {proposal.keyBenefits?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Key Benefits</h3>
              <ul className="space-y-2">
                {proposal.keyBenefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risks & Mitigation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {proposal.risks?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Risks</h3>
                <ul className="space-y-2">
                  {proposal.risks.map((risk, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <span className="text-red-600 font-bold mt-1">⚠</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {proposal.mitigationStrategies?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Mitigation Strategies</h3>
                <ul className="space-y-2">
                  {proposal.mitigationStrategies.map((strategy, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <span className="text-blue-600 font-bold mt-1">→</span>
                      <span>{strategy}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Success Metrics */}
          {proposal.successMetrics?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Success Metrics (KPIs)</h3>
              <ul className="space-y-2">
                {proposal.successMetrics.map((metric, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <span className="text-purple-600 font-bold mt-1">📊</span>
                    <span>{metric}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Stakeholders */}
          {proposal.stakeholders?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Key Stakeholders</h3>
              <div className="flex flex-wrap gap-2">
                {proposal.stakeholders.map((stakeholder, idx) => (
                  <Badge key={idx} variant="outline">{stakeholder}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Implementation Timeline */}
          {proposal.implementationTimeline && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Implementation Timeline</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded">{proposal.implementationTimeline}</p>
            </div>
          )}

          {/* Related Proposals */}
          {relatedProposals.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Link2 className="w-4 h-4" /> Related Proposals
              </h3>
              <div className="space-y-2">
                {relatedProposals.map(related => (
                  <div key={related.id} className="text-sm bg-gray-50 p-2 rounded border">
                    {related.title}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {proposal.notes && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded">{proposal.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={() => onEdit(proposal)}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Edit2 className="w-4 h-4" /> Edit
            </Button>
            <Button
              onClick={() => {
                if (confirm('Are you sure you want to delete this proposal?')) {
                  onDelete(proposal.id);
                  onClose();
                }
              }}
              variant="destructive"
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
            <Button variant="outline" onClick={onClose} className="ml-auto">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}