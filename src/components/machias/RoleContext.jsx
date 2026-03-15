import React, { createContext, useContext, useState } from 'react';

export const ROLES = {
  administrator: {
    label: 'Administrator',
    color: '#9C5334',
    description: 'Full access — configuration, compliance, data imports',
  },
  finance_director: {
    label: 'Finance Director',
    color: '#344A60',
    description: 'Financial models, proposals, scenarios, tax analysis',
  },
  town_manager: {
    label: 'Town Manager',
    color: '#2A7F7F',
    description: 'Review proposals, compare scenarios, roadmaps',
  },
  select_board: {
    label: 'Select Board',
    color: '#4a5568',
    description: 'Dashboards, policy options, tax impacts',
  },
  public_viewer: {
    label: 'Public Viewer',
    color: '#64748b',
    description: 'Simplified summaries and transparency reports',
  },
};

// Which nav paths each role can access. '*' means all.
export const ROLE_ACCESS = {
  administrator: '*',
  finance_director: [
    '/ExecutiveDashboard', '/Dashboard', '/ProForma', '/Scenarios', '/SensitivityAnalysis',
    '/PerformanceMetrics', '/Proposals', '/ProposalComparison', '/ProposalEvaluations',
    '/DepartmentProposals', '/RestructuringProposalLibrary', '/ProposalComparison',
    '/TaxImpact', '/RegionalServiceRevenue', '/RegionalFeasibility', '/RegionalFiscalFeasibility',
    '/EnterpriseFunds', '/ERPRoadmap', '/Positions', '/ModelSettings', '/AssumptionsManager',
    '/RiskAdjustedPlanning', '/MathVerify', '/AIPlanner', '/Milestones', '/ImplementationRoadmap',
    '/DepartmentRestructuring', '/LeadershipCapacityModeling', '/CapitalProjects',
    '/RegionalServices', '/TransferStation', '/OrgChart', '/RegionalMap',
    '/ServiceTerritoryAnalysis', '/RegionalParticipationSettings',
  ],
  town_manager: [
    '/ExecutiveDashboard', '/Dashboard', '/Scenarios', '/SensitivityAnalysis',
    '/Proposals', '/ProposalComparison', '/ProposalEvaluations', '/RestructuringProposalLibrary',
    '/TaxImpact', '/ImplementationRoadmap', '/Milestones', '/RiskAdjustedPlanning',
    '/RegionalMap', '/RegionalServices', '/RegionalServiceRevenue',
    '/DepartmentRestructuring', '/OrgChart', '/PerformanceMetrics',
    '/CommunicationStrategy', '/SelectBoardPresentation', '/BoardMemoGenerator',
    '/QandA', '/TaxpayerFAQ', '/Narrative',
  ],
  select_board: [
    '/ExecutiveDashboard', '/Dashboard', '/Scenarios', '/ProposalComparison',
    '/TaxImpact', '/RegionalMap', '/PerformanceMetrics', '/SelectBoardPresentation',
    '/TaxpayerFAQ', '/Narrative', '/QandA', '/CommunicationStrategy',
  ],
  public_viewer: [
    '/ExecutiveDashboard', '/TaxpayerFAQ', '/Narrative', '/RegionalMap',
    '/SelectBoardPresentation',
  ],
};

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const [role, setRole] = useState('administrator');
  return (
    <RoleContext.Provider value={{ role, setRole, roleConfig: ROLES[role], access: ROLE_ACCESS[role] }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}

export function useCanAccess(path) {
  const { access } = useRole();
  if (access === '*') return true;
  return access.includes(path);
}