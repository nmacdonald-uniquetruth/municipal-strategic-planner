import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { ModelProvider } from './components/machias/ModelContext.jsx';
import { ScenarioProvider } from './components/machias/ScenarioContext.jsx';

import AppLayout from './components/machias/AppLayout';
import Layout from './Layout';
import { DepartmentProvider } from './components/machias/DepartmentContext';
import Dashboard from './pages/Dashboard';
import ProForma from './pages/ProForma';
import Positions from './pages/Positions';
import ERPRoadmapPage from './pages/ERPRoadmapPage';
import EnterpriseFunds from './pages/EnterpriseFunds';
import Scenarios from './pages/Scenarios';
import Milestones from './pages/Milestones';
import MathVerify from './pages/MathVerify';
import ModelSettings from './pages/ModelSettings';
import AIPlanner from './pages/AIPlanner';
import Narrative from './pages/Narrative';
import RegionalServices from './pages/RegionalServices';
import TransferStation from './pages/TransferStation';
import SensitivityAnalysis from './pages/SensitivityAnalysis';
import ReferencesAndResearch from './pages/ReferencesAndResearch';
import QandA from './pages/QandA';
import CommunicationStrategy from './pages/CommunicationStrategy';
import PerformanceMetrics from './pages/PerformanceMetrics';
import SelectBoardPresentation from './pages/SelectBoardPresentation';
import TaxpayerFAQ from './pages/TaxpayerFAQ';
import RegionalFeasibility from './pages/RegionalFeasibility';
import RegionalFiscalFeasibility from './pages/RegionalFiscalFeasibility';
import RegionalServicesDashboard from './pages/RegionalServicesDashboard';
import OrgChart from './pages/OrgChart';
import RegionalMap from './pages/RegionalMap';
import RegionalParticipationSettings from './pages/RegionalParticipationSettings';
import DepartmentProposals from './pages/DepartmentProposals';
import ProposalEvaluations from './pages/ProposalEvaluations';
import Proposals from './pages/Proposals';
import TaxImpact from './pages/TaxImpact';
import RegionalServiceRevenue from './pages/RegionalServiceRevenue';
import DepartmentRestructuring from './pages/DepartmentRestructuring';
import ImplementationRoadmap from './pages/ImplementationRoadmap';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import ProposalComparison from './pages/ProposalComparison';
import AssumptionsManager from './pages/AssumptionsManager';
import RiskAdjustedPlanning from './pages/RiskAdjustedPlanning';
import BoardMemoGenerator from './pages/BoardMemoGenerator';
import CapitalProjects from './pages/CapitalProjects';
import ServiceTerritoryAnalysis from './pages/ServiceTerritoryAnalysis';
import LeadershipCapacityModeling from './pages/LeadershipCapacityModeling';
import RestructuringProposalLibrary from './pages/RestructuringProposalLibrary';
import ComplianceSettings from './pages/ComplianceSettings';
import BudgetEngine from './pages/BudgetEngine';
import WarrantManager from './pages/WarrantManager';
import ChartOfAccounts from './pages/ChartOfAccounts';
import AnnualBudgetProcess from './pages/AnnualBudgetProcess';
import BudgetControl from './pages/BudgetControl';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400">Loading Machias Strategic Plan...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <ModelProvider>
      <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/ExecutiveDashboard" replace />} />
        <Route element={<AppLayout />}>
          <Route path="/ExecutiveDashboard" element={<ExecutiveDashboard />} />
          <Route path="/Dashboard" element={<Dashboard />} />
          <Route path="/ProForma" element={<ProForma />} />
          <Route path="/Positions" element={<Positions />} />
          <Route path="/ERPRoadmap" element={<ERPRoadmapPage />} />
          <Route path="/EnterpriseFunds" element={<EnterpriseFunds />} />
          <Route path="/Scenarios" element={<Scenarios />} />
          <Route path="/Milestones" element={<Milestones />} />
          <Route path="/MathVerify" element={<MathVerify />} />
          <Route path="/ModelSettings" element={<ModelSettings />} />
          <Route path="/AssumptionsManager" element={<AssumptionsManager />} />
          <Route path="/RiskAdjustedPlanning" element={<RiskAdjustedPlanning />} />
          <Route path="/BoardMemoGenerator" element={<BoardMemoGenerator />} />
          <Route path="/CapitalProjects" element={<CapitalProjects />} />
          <Route path="/ServiceTerritoryAnalysis" element={<ServiceTerritoryAnalysis />} />
          <Route path="/AIPlanner" element={<AIPlanner />} />
          <Route path="/Narrative" element={<Narrative />} />
          <Route path="/RegionalServices" element={<RegionalServices />} />
          <Route path="/TransferStation" element={<TransferStation />} />
          <Route path="/SensitivityAnalysis" element={<SensitivityAnalysis />} />
          <Route path="/ReferencesAndResearch" element={<ReferencesAndResearch />} />
          <Route path="/QandA" element={<QandA />} />
          <Route path="/CommunicationStrategy" element={<CommunicationStrategy />} />
          <Route path="/PerformanceMetrics" element={<PerformanceMetrics />} />
          <Route path="/SelectBoardPresentation" element={<SelectBoardPresentation />} />
          <Route path="/TaxpayerFAQ" element={<TaxpayerFAQ />} />
          <Route path="/RegionalFeasibility" element={<RegionalFeasibility />} />
          <Route path="/RegionalFiscalFeasibility" element={<RegionalFiscalFeasibility />} />
          <Route path="/RegionalServicesDashboard" element={<RegionalServicesDashboard />} />
          <Route path="/OrgChart" element={<OrgChart />} />
          <Route path="/RegionalMap" element={<RegionalMap />} />
          <Route path="/RegionalParticipationSettings" element={<RegionalParticipationSettings />} />
          <Route path="/DepartmentProposals" element={<DepartmentProposals />} />
          <Route path="/ProposalEvaluations" element={<ProposalEvaluations />} />
          <Route path="/Proposals" element={<Proposals />} />
          <Route path="/ProposalComparison" element={<ProposalComparison />} />
          <Route path="/TaxImpact" element={<TaxImpact />} />
          <Route path="/RegionalServiceRevenue" element={<RegionalServiceRevenue />} />
          <Route path="/DepartmentRestructuring" element={<DepartmentRestructuring />} />
          <Route path="/ImplementationRoadmap" element={<ImplementationRoadmap />} />
          <Route path="/LeadershipCapacityModeling" element={<LeadershipCapacityModeling />} />
          <Route path="/RestructuringProposalLibrary" element={<RestructuringProposalLibrary />} />
          <Route path="/ComplianceSettings" element={<ComplianceSettings />} />
          <Route path="/BudgetEngine" element={<BudgetEngine />} />
          <Route path="/WarrantManager" element={<WarrantManager />} />
          <Route path="/ChartOfAccounts" element={<ChartOfAccounts />} />
          <Route path="/AnnualBudgetProcess" element={<AnnualBudgetProcess />} />
          <Route path="/BudgetControl" element={<BudgetControl />} />
          </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      </Layout>
    </ModelProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <ScenarioProvider>
          <DepartmentProvider>
            <Router>
              <AuthenticatedApp />
            </Router>
          </DepartmentProvider>
        </ScenarioProvider>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App