import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, AlertCircle, CheckCircle2, Zap, Eye } from 'lucide-react';
import PublicProposalSummary from './PublicProposalSummary';

const CATEGORY_ICONS = {
  staffing: '👥',
  shared_services: '🤝',
  regional_revenue: '💰',
  capital: '🏗️',
  governance: '⚖️',
  administration: '📋'
};

const CATEGORY_COLORS = {
  staffing: 'bg-blue-100 text-blue-800',
  shared_services: 'bg-purple-100 text-purple-800',
  regional_revenue: 'bg-green-100 text-green-800',
  capital: 'bg-orange-100 text-orange-800',
  governance: 'bg-indigo-100 text-indigo-800',
  administration: 'bg-gray-100 text-gray-800'
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700'
};

const STATUS_COLORS = {
  concept: 'bg-gray-50 border-gray-200',
  in_development: 'bg-blue-50 border-blue-200',
  ready_for_review: 'bg-yellow-50 border-yellow-200',
  approved: 'bg-green-50 border-green-200',
  implemented: 'bg-emerald-50 border-emerald-200',
  archived: 'bg-slate-50 border-slate-200'
};

export default function ProposalCard({ proposal, onSelect, isSelected, showCheckbox }) {
  const netFinancialImpact = (proposal.estimatedAnnualSavings || 0) + (proposal.estimatedAnnualRevenue || 0);
  const hasPositiveImpact = netFinancialImpact > 0;

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-lg border-l-4 ${
        STATUS_COLORS[proposal.status]
      } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={() => onSelect && onSelect(proposal)}
      style={{ borderLeftColor: isSelected ? '#3b82f6' : 'transparent' }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{CATEGORY_ICONS[proposal.category]}</span>
              <Badge className={CATEGORY_COLORS[proposal.category]}>
                {proposal.category.replace(/_/g, ' ')}
              </Badge>
              <Badge className={PRIORITY_COLORS[proposal.priority]}>
                {proposal.priority}
              </Badge>
            </div>
            <CardTitle className="text-lg">{proposal.title}</CardTitle>
          </div>
          {showCheckbox && (
            <input
              type="checkbox"
              checked={isSelected || false}
              onChange={(e) => {
                e.stopPropagation();
                onSelect && onSelect(proposal);
              }}
              className="w-5 h-5 mt-1"
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2">{proposal.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {proposal.departments && proposal.departments.map(dept => (
            <Badge key={dept} variant="outline" className="text-xs">
              📍 {dept}
            </Badge>
          ))}
          {proposal.serviceTypes && proposal.serviceTypes.map(service => (
            <Badge key={service} variant="outline" className="text-xs">
              🔧 {service}
            </Badge>
          ))}
          {proposal.fiscalYear && (
            <Badge variant="outline" className="text-xs">
              📅 {proposal.fiscalYear}
            </Badge>
          )}
        </div>

        {/* Financial Impact */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded">
          {proposal.estimatedAnnualSavings > 0 && (
            <div className="text-center">
              <p className="text-xs text-gray-600">Savings</p>
              <p className="text-sm font-bold text-green-600">
                ${(proposal.estimatedAnnualSavings / 1000).toFixed(0)}k
              </p>
            </div>
          )}
          {proposal.estimatedAnnualRevenue > 0 && (
            <div className="text-center">
              <p className="text-xs text-gray-600">Revenue</p>
              <p className="text-sm font-bold text-blue-600">
                ${(proposal.estimatedAnnualRevenue / 1000).toFixed(0)}k
              </p>
            </div>
          )}
          {proposal.implementationCost > 0 && (
            <div className="text-center">
              <p className="text-xs text-gray-600">Cost</p>
              <p className="text-sm font-bold text-red-600">
                -${(proposal.implementationCost / 1000).toFixed(0)}k
              </p>
            </div>
          )}
          {netFinancialImpact > 0 && (
            <div className="col-span-3 border-t pt-2 mt-2">
              <p className="text-xs text-gray-600">Net Annual Impact</p>
              <p className="text-lg font-bold text-emerald-600">
                +${(netFinancialImpact / 1000).toFixed(0)}k/year
              </p>
            </div>
          )}
        </div>

        {/* Benefits & Risks */}
        <div className="grid grid-cols-2 gap-2">
          {proposal.keyBenefits && proposal.keyBenefits.length > 0 && (
            <div className="bg-green-50 p-2 rounded">
              <p className="text-xs font-semibold text-green-900 mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Benefits
              </p>
              <ul className="text-xs text-green-800 space-y-0.5">
                {proposal.keyBenefits.slice(0, 2).map((b, i) => (
                  <li key={i} className="truncate">• {b}</li>
                ))}
                {proposal.keyBenefits.length > 2 && (
                  <li className="text-green-600 italic">+{proposal.keyBenefits.length - 2} more</li>
                )}
              </ul>
            </div>
          )}
          {proposal.risks && proposal.risks.length > 0 && (
            <div className="bg-red-50 p-2 rounded">
              <p className="text-xs font-semibold text-red-900 mb-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Risks
              </p>
              <ul className="text-xs text-red-800 space-y-0.5">
                {proposal.risks.slice(0, 2).map((r, i) => (
                  <li key={i} className="truncate">• {r}</li>
                ))}
                {proposal.risks.length > 2 && (
                  <li className="text-red-600 italic">+{proposal.risks.length - 2} more</li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-gray-600">
            Status: <span className="font-semibold text-gray-900">{proposal.status.replace(/_/g, ' ')}</span>
          </span>
          <span className="text-xs text-gray-500">
            {proposal.implementationTimeline && `Timeline: ${proposal.implementationTimeline}`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}