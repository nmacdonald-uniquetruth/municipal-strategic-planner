import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { ModelProvider } from './components/machias/ModelContext.jsx';

import AppLayout from './components/machias/AppLayout';
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
      <Routes>
        <Route path="/" element={<Navigate to="/Dashboard" replace />} />
        <Route element={<AppLayout />}>
          <Route path="/Dashboard" element={<Dashboard />} />
          <Route path="/ProForma" element={<ProForma />} />
          <Route path="/Positions" element={<Positions />} />
          <Route path="/ERPRoadmap" element={<ERPRoadmapPage />} />
          <Route path="/EnterpriseFunds" element={<EnterpriseFunds />} />
          <Route path="/Scenarios" element={<Scenarios />} />
          <Route path="/Milestones" element={<Milestones />} />
          <Route path="/MathVerify" element={<MathVerify />} />
          <Route path="/ModelSettings" element={<ModelSettings />} />
          <Route path="/AIPlanner" element={<AIPlanner />} />
          <Route path="/Narrative" element={<Narrative />} />
          <Route path="/RegionalServices" element={<RegionalServices />} />
          <Route path="/TransferStation" element={<TransferStation />} />
          <Route path="/SensitivityAnalysis" element={<SensitivityAnalysis />} />
          <Route path="/ReferencesAndResearch" element={<ReferencesAndResearch />} />
          <Route path="/QandA" element={<QandA />} />
          <Route path="/CommunicationStrategy" element={<CommunicationStrategy />} />
          <Route path="/PerformanceMetrics" element={<PerformanceMetrics />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </ModelProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App