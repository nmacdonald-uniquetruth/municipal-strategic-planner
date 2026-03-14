import React, { useState, useMemo } from 'react';
import { useModel } from './ModelContext';
import { base44 } from '@/api/base44Client';
import { Users, DollarSign, TrendingUp, Shield, AlertCircle } from 'lucide-react';
import SectionHeader from './SectionHeader';

export default function PoliceAdminConfig() {
  const { settings, updateSettings } = useModel();
  const [policeAdminEnabled, setPoliceAdminEnabled] = useState(settings.police_admin_enabled || false);

  // Admin role salary and benefits
  const adminBaseSalary = 42000;
  const benefitsMultiplier = 1.35;
  const adminFullyLoaded = Math.round(adminBaseSalary * benefitsMultiplier);
  
  // Calculate impacts
  const impacts = useMemo(() => {
    if (!policeAdminEnabled) {
      return {
        annualCost: 0,
        taxImpact: 0,
        leadershipCapacityHours: 0,
        regionalRevenueOffset: 0,
      };
    }

    // Annual cost of admin role
    const annualCost = adminFullyLoaded;
    
    // Estimate tax impact (assuming general fund pays for it)
    const totalAssessedValue = settings.total_assessed_value || 198000000;
    const taxImpact = (annualCost / totalAssessedValue) * 1000; // mills per $1000
    
    // Leadership capacity freed up: ~15-18 hours/week x 50 weeks = ~800-900 hours/year
    const leadershipCapacityHours = 850;
    
    // Potential regional revenue: 3 neighboring towns x $8K/year = $24K
    const regionalRevenueOffset = 24000;
    
    // Net tax impact after regional revenue
    const netTaxImpact = taxImpact - (regionalRevenueOffset / totalAssessedValue * 1000);

    return {
      annualCost,
      taxImpact: Math.round(taxImpact * 1000) / 1000,
      netTaxImpactAfterRevenue: Math.round(netTaxImpact * 1000) / 1000,
      leadershipCapacityHours,
      regionalRevenueOffset,
      regionalRevenueNetBenefit: regionalRevenueOffset - annualCost,
    };
  }, [policeAdminEnabled, settings]);

  const handleToggle = async () => {
    const newValue = !policeAdminEnabled;
    setPoliceAdminEnabled(newValue);
    await updateSettings({ police_admin_enabled: newValue });
  };

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Police Department Administrative Support" 
        subtitle="Configure police leadership capacity and administrative efficiency"
        icon={Shield}
      />

      {/* Toggle Control */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Police Department Admin Support</h3>
            <p className="text-xs text-slate-500 mt-1">
              Enable a dedicated administrative coordinator to reduce administrative burden on Police Chief and Corporal
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleToggle}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                !policeAdminEnabled
                  ? 'bg-slate-100 text-slate-900 border border-slate-200'
                  : 'bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              Without Admin
            </button>
            <button
              onClick={handleToggle}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                policeAdminEnabled
                  ? 'bg-emerald-600 text-white border border-emerald-600'
                  : 'bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              With Admin
            </button>
          </div>
        </div>
      </div>

      {policeAdminEnabled && (
        <>
          {/* Role Description */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Police Administrative Coordinator</h4>
            <div className="grid grid-cols-2 gap-4 text-xs text-slate-700">
              <div>
                <p className="font-medium text-slate-800 mb-2">Administrative Operations:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Records management and case file organization</li>
                  <li>Evidence documentation tracking</li>
                  <li>FOAA request and records processing</li>
                  <li>Report data entry and filing</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-slate-800 mb-2">Operational Support:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Scheduling coordination</li>
                  <li>Training documentation and certification tracking</li>
                  <li>Equipment and asset tracking</li>
                  <li>Court and prosecutor coordination</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Financial Impact */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-amber-700" />
                <h4 className="text-sm font-semibold text-amber-900">Annual Cost</h4>
              </div>
              <p className="text-xl font-bold text-amber-900">${impacts.annualCost.toLocaleString()}</p>
              <p className="text-xs text-amber-700 mt-1">Base salary: $42K + 35% benefits</p>
              <p className="text-xs text-amber-700">Tax mill impact: +{impacts.taxImpact.toFixed(3)}M</p>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-emerald-700" />
                <h4 className="text-sm font-semibold text-emerald-900">Leadership Capacity</h4>
              </div>
              <p className="text-xl font-bold text-emerald-900">{impacts.leadershipCapacityHours} hrs/yr</p>
              <p className="text-xs text-emerald-700 mt-1">Police Chief and Corporal freed</p>
              <p className="text-xs text-emerald-700">~15-18 hours per week recovered</p>
            </div>
          </div>

          {/* Operational Benefits */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-blue-700" />
              <h4 className="text-sm font-semibold text-blue-900">Operational Benefits</h4>
            </div>
            <ul className="space-y-2 text-xs text-blue-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">✓</span>
                <span><strong>Leadership Focus:</strong> Chief can focus on supervision, training, strategy, and community relationships</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">✓</span>
                <span><strong>Operational Efficiency:</strong> Centralized records management, scheduling, and compliance functions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">✓</span>
                <span><strong>Regional Expansion Ready:</strong> Administrative systems enable service expansion to neighboring towns</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">✓</span>
                <span><strong>Officer Retention:</strong> Reduces excessive administrative hours for sworn personnel</span>
              </li>
            </ul>
          </div>

          {/* Regional Revenue Offset */}
          <div className="rounded-lg border border-slate-300 bg-slate-50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-slate-700" />
              <h4 className="text-sm font-semibold text-slate-900">Regional Revenue Opportunities</h4>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="border border-slate-200 rounded p-2 bg-white">
                  <p className="font-medium text-slate-800">Contracted Services</p>
                  <p className="text-slate-600 mt-1">Regional patrol coverage agreements with neighboring towns</p>
                </div>
                <div className="border border-slate-200 rounded p-2 bg-white">
                  <p className="font-medium text-slate-800">Administrative Support</p>
                  <p className="text-slate-600 mt-1">Shared records management and court coordination services</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-700">Projected Annual Regional Revenue</p>
                    <p className="text-sm text-slate-600 mt-0.5">3 towns × ~$8K per town service agreements</p>
                  </div>
                  <p className="text-lg font-bold text-emerald-600">${impacts.regionalRevenueOffset.toLocaleString()}</p>
                </div>
              </div>
              {impacts.regionalRevenueNetBenefit > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded p-3">
                  <p className="text-xs font-medium text-emerald-800">Net Regional Benefit</p>
                  <p className="text-lg font-bold text-emerald-700 mt-1">
                    +${impacts.regionalRevenueNetBenefit.toLocaleString()}/year
                  </p>
                  <p className="text-xs text-emerald-700 mt-1">Regional revenue exceeds admin role cost</p>
                </div>
              )}
            </div>
          </div>

          {/* Summary Impact */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h4 className="text-sm font-semibold text-slate-900 mb-4">Financial Summary</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Administrative Role Annual Cost:</span>
                <span className="font-semibold text-slate-900">${impacts.annualCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Tax Mill Impact:</span>
                <span className="font-semibold text-amber-700">+{impacts.taxImpact.toFixed(3)}M</span>
              </div>
              <div className="border-t border-slate-200 my-2 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Projected Regional Revenue (Year 1):</span>
                  <span className="font-semibold text-emerald-700">${impacts.regionalRevenueOffset.toLocaleString()}</span>
                </div>
              </div>
              <div className="border-t border-slate-200 my-2 pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-900">Net Tax Impact (with regional offset):</span>
                  <span className={`font-bold text-lg ${impacts.netTaxImpactAfterRevenue < 0 ? 'text-emerald-600' : 'text-amber-700'}`}>
                    {impacts.netTaxImpactAfterRevenue < 0 ? '-' : '+'}{Math.abs(impacts.netTaxImpactAfterRevenue).toFixed(3)}M
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Disabled State Message */}
      {!policeAdminEnabled && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-slate-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-900">Admin Role Disabled</p>
            <p className="text-xs text-slate-600 mt-1">
              Enable the Police Administrative Coordinator to see operational benefits and financial impacts. This role reduces administrative burden on sworn officers and enables regional service expansion.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}