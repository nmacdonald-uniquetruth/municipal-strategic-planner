import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, TrendingDown, DollarSign, Users, Briefcase, Zap, AlertCircle, Target } from 'lucide-react';
import SectionHeader from '@/components/machias/SectionHeader';
import { useModel } from '@/components/machias/ModelContext';

const MetricCard = ({ title, value, subtitle, trend, icon: Icon, color = 'slate' }) => {
  const colorMap = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorMap[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-[10px] font-bold uppercase tracking-wide ${color === 'emerald' ? 'text-emerald-600' : color === 'red' ? 'text-red-600' : color === 'blue' ? 'text-blue-600' : color === 'amber' ? 'text-amber-600' : 'text-slate-600'}`}>
            {title}
          </p>
          <p className="text-2xl font-bold mt-2">{value}</p>
          {subtitle && <p className="text-xs mt-2 opacity-75">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2 text-xs">
              {trend.direction === 'up' ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{trend.label}</span>
            </div>
          )}
        </div>
        {Icon && <Icon className="h-8 w-8 opacity-30 flex-shrink-0" />}
      </div>
    </div>
  );
};

const OpportunityCard = ({ title, items, icon: Icon, color = 'slate' }) => {
  const colorMap = {
    emerald: 'border-emerald-200 bg-emerald-50',
    amber: 'border-amber-200 bg-amber-50',
    blue: 'border-blue-200 bg-blue-50',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorMap[color]}`}>
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="h-4 w-4" />}
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-slate-600">No items to display</p>
        ) : (
          items.slice(0, 4).map((item, idx) => (
            <div key={idx} className="text-xs border-t border-current border-opacity-10 pt-2 first:border-t-0 first:pt-0">
              <p className="font-semibold">{item.title}</p>
              {item.detail && <p className="opacity-75 mt-1">{item.detail}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default function ExecutiveDashboard() {
  const { settings } = useModel();
  const [summaryMetrics, setSummaryMetrics] = useState({
    netSavings: 0,
    newCosts: 0,
    regionalRevenue: 0,
    taxImpact: 0,
  });

  const { data: scenarios = [] } = useQuery({
    queryKey: ['scenarios'],
    queryFn: () => base44.entities.Scenario.list('-last_modified', 50),
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ['proposals'],
    queryFn: () => base44.entities.Proposal.filter({ status: 'approved' }, '-created_date', 50),
  });

  const { data: regionalServices = [] } = useQuery({
    queryKey: ['regionalServices'],
    queryFn: () => base44.entities.RegionalServiceContract.filter({ status: 'active' }, '-created_date', 50),
  });

  const { data: restructuringPlans = [] } = useQuery({
    queryKey: ['restructuring'],
    queryFn: () => base44.entities.DepartmentRestructuring.filter({ status: 'approved' }, '-created_date', 50),
  });

  const { data: regionalRels = [] } = useQuery({
    queryKey: ['regionalRels'],
    queryFn: () => base44.entities.RegionalRelationship.filter({ priority_level: 'critical' }, '-created_date', 50),
  });

  // Calculate metrics from active proposals
  useEffect(() => {
    let savings = 0;
    let costs = 0;
    let revenue = 0;
    let taxChange = 0;

    proposals.forEach((p) => {
      if (p.budget_impact) {
        if (p.budget_impact.annual_benefit) savings += p.budget_impact.annual_benefit;
        if (p.budget_impact.annual_cost) costs += p.budget_impact.annual_cost;
      }
      if (p.tax_impact?.tax_levy_change) taxChange += p.tax_impact.tax_levy_change;
    });

    regionalServices.forEach((s) => {
      if (s.service_delivery_cost) revenue += s.service_delivery_cost * 0.5; // rough estimate
    });

    setSummaryMetrics({
      netSavings: Math.round(savings - costs),
      newCosts: Math.round(costs),
      regionalRevenue: Math.round(revenue),
      taxImpact: Math.round(taxChange),
    });
  }, [proposals, regionalServices]);

  const activeScenarios = scenarios.filter((s) => s.is_active || s.is_baseline).slice(0, 3);
  const topProposals = proposals.filter((p) => p.status === 'approved').slice(0, 5);
  const highestSavings = proposals
    .filter((p) => p.budget_impact?.annual_benefit)
    .sort((a, b) => (b.budget_impact?.annual_benefit || 0) - (a.budget_impact?.annual_benefit || 0))
    .slice(0, 4)
    .map((p) => ({
      title: p.title,
      detail: `$${(p.budget_impact.annual_benefit || 0).toLocaleString()}/year`,
    }));

  const highestCosts = proposals
    .filter((p) => p.budget_impact?.annual_cost)
    .sort((a, b) => (b.budget_impact?.annual_cost || 0) - (a.budget_impact?.annual_cost || 0))
    .slice(0, 4)
    .map((p) => ({
      title: p.title,
      detail: `$${(p.budget_impact.annual_cost || 0).toLocaleString()}/year`,
    }));

  const regionalOpportunities = regionalServices
    .filter((s) => s.status === 'active')
    .slice(0, 4)
    .map((s) => ({
      title: s.service_name,
      detail: `${s.participating_towns?.length || 0} towns • $${(s.service_delivery_cost || 0).toLocaleString()}/year`,
    }));

  const staffingChanges = restructuringPlans
    .filter((r) => r.status === 'approved')
    .slice(0, 4)
    .map((r) => ({
      title: r.department_name,
      detail: `${r.proposed_fte > r.current_fte ? '+' : ''}${(r.proposed_fte - r.current_fte).toFixed(1)} FTE`,
    }));

  const criticalPartnerships = regionalRels
    .filter((r) => r.priority_level === 'critical')
    .slice(0, 4)
    .map((r) => ({
      title: r.municipality,
      detail: r.relationship_type.replace(/_/g, ' '),
    }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Executive Dashboard</h1>
        <p className="text-sm text-slate-600">Leadership summary of active initiatives and strategic opportunities</p>
      </div>

      {/* Key Metrics */}
      <div>
        <SectionHeader title="Financial Summary (5-Year Horizon)" icon={DollarSign} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Net Modeled Savings"
            value={`$${(summaryMetrics.netSavings / 1000).toFixed(0)}K`}
            color="emerald"
            icon={TrendingUp}
          />
          <MetricCard
            title="New Costs"
            value={`$${(summaryMetrics.newCosts / 1000).toFixed(0)}K`}
            color="red"
            icon={TrendingDown}
          />
          <MetricCard
            title="Regional Revenue Opportunity"
            value={`$${(summaryMetrics.regionalRevenue / 1000).toFixed(0)}K`}
            color="blue"
            icon={Briefcase}
          />
          <MetricCard
            title="Projected Tax Effect"
            value={`${((summaryMetrics.taxImpact / settings.annual_tax_levy) * 100).toFixed(2)}%`}
            subtitle={`$${(summaryMetrics.taxImpact / 1000).toFixed(0)}K change`}
            color={summaryMetrics.taxImpact > 0 ? 'red' : 'emerald'}
            icon={AlertCircle}
          />
        </div>
      </div>

      {/* Active Initiatives */}
      <div>
        <SectionHeader title="Active Strategic Initiatives" icon={Target} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <OpportunityCard
            title={`Active Scenarios (${activeScenarios.length})`}
            items={activeScenarios.map((s) => ({ title: s.name, detail: s.description?.substring(0, 60) }))}
            icon={Target}
            color="blue"
          />
          <OpportunityCard
            title={`Approved Proposals (${topProposals.length})`}
            items={topProposals.map((p) => ({ title: p.title }))}
            icon={Zap}
            color="blue"
          />
          <OpportunityCard
            title={`Restructuring Plans (${restructuringPlans.length})`}
            items={restructuringPlans
              .filter((r) => r.status === 'approved')
              .slice(0, 4)
              .map((r) => ({ title: r.department_name }))}
            icon={Users}
            color="blue"
          />
        </div>
      </div>

      {/* Opportunities */}
      <div>
        <SectionHeader title="Top Opportunities" icon={TrendingUp} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <OpportunityCard
            title="Highest Savings Opportunities"
            items={highestSavings}
            icon={TrendingUp}
            color="emerald"
          />
          <OpportunityCard
            title="Highest Cost Initiatives"
            items={highestCosts}
            icon={AlertCircle}
            color="amber"
          />
          <OpportunityCard
            title="Regional Revenue Opportunities"
            items={regionalOpportunities}
            icon={Briefcase}
            color="blue"
          />
          <OpportunityCard
            title="Major Staffing Changes"
            items={staffingChanges}
            icon={Users}
            color="blue"
          />
        </div>
      </div>

      {/* Strategic Partnerships */}
      <div>
        <SectionHeader title="Critical Regional Partnerships" icon={Briefcase} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <OpportunityCard
            title="Priority Partnership Targets"
            items={criticalPartnerships}
            icon={Briefcase}
            color="blue"
          />
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-bold mb-3">Next Steps</h3>
            <ul className="space-y-2 text-xs text-slate-700">
              <li>• Review approved proposals with Select Board</li>
              <li>• Finalize interlocal agreements for active services</li>
              <li>• Schedule regional partner outreach</li>
              <li>• Finalize FY2027 budget impact assessment</li>
              <li>• Communicate plan to town taxpayers</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        <p>
          <strong>Note:</strong> Dashboard displays approved proposals, active scenarios, and active regional services. View individual pages (Proposals, Scenarios, Regional Services) for detailed analysis and modifications.
        </p>
      </div>
    </div>
  );
}