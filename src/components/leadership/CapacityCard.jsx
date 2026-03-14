import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Zap, TrendingUp, DollarSign } from 'lucide-react';

export default function CapacityCard({ model }) {
  const remainingAdminHours = model.currentAdminHours - (model.hoursTransferredToSupport || 0);
  const totalStrategicHours = (model.totalWeeklyHours - remainingAdminHours);
  const capacityGainPercentage = model.hoursTransferredToSupport ? 
    Math.round((model.hoursTransferredToSupport / model.currentAdminHours) * 100) : 0;

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    under_review: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    implemented: 'bg-green-100 text-green-800'
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{model.department}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{model.leadershipRole}</p>
          </div>
          <Badge className={statusColors[model.status]}>{model.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current vs Proposed Hours */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Current Admin Hours</p>
            <p className="text-2xl font-bold text-red-600">{model.currentAdminHours}</p>
            <p className="text-xs text-gray-500 mt-1">per week</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">After Support Role</p>
            <p className="text-2xl font-bold text-green-600">{remainingAdminHours}</p>
            <p className="text-xs text-gray-500 mt-1">per week</p>
          </div>
        </div>

        {/* Strategic Capacity */}
        {model.hoursTransferredToSupport > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-semibold text-blue-900">Strategic Capacity Gained</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{model.hoursTransferredToSupport} hrs/week</p>
            <p className="text-xs text-gray-600 mt-1">{capacityGainPercentage}% reduction in admin burden</p>
          </div>
        )}

        {/* Support Role */}
        {model.supportRoleAdded && (
          <div className="bg-purple-50 p-3 rounded-lg">
            <p className="text-xs font-semibold text-gray-600 mb-1">SUPPORT ROLE</p>
            <p className="text-sm font-medium text-purple-900">{model.supportRoleAdded}</p>
          </div>
        )}

        {/* Service Opportunities */}
        {model.serviceDevelopmentOpportunitiesCreated && model.serviceDevelopmentOpportunitiesCreated.length > 0 && (
          <div className="bg-amber-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <p className="text-xs font-semibold text-gray-600">SERVICE OPPORTUNITIES</p>
            </div>
            <ul className="space-y-1">
              {model.serviceDevelopmentOpportunitiesCreated.map((opp, idx) => (
                <li key={idx} className="text-sm text-amber-900 flex items-start gap-2">
                  <span className="text-amber-600 mt-1">•</span>
                  <span>{opp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Financial Impact */}
        {model.estimatedAnnualSavingsOrRevenue && (
          <div className="bg-emerald-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <p className="text-xs font-semibold text-gray-600">FINANCIAL IMPACT</p>
            </div>
            <p className="text-xl font-bold text-emerald-600">
              ${model.estimatedAnnualSavingsOrRevenue.toLocaleString()}/year
            </p>
          </div>
        )}

        {/* Regional Implications */}
        {model.regionalRevenueImplications && (
          <div className="bg-indigo-50 p-3 rounded-lg text-sm">
            <p className="text-xs font-semibold text-gray-600 mb-1">REGIONAL REVENUE POTENTIAL</p>
            <p className="text-indigo-900">{model.regionalRevenueImplications}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}