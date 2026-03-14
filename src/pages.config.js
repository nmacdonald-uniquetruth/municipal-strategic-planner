/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AIPlanner from './pages/AIPlanner';
import CommunicationStrategy from './pages/CommunicationStrategy';
import Dashboard from './pages/Dashboard';
import ERPRoadmapPage from './pages/ERPRoadmapPage';
import EnterpriseFunds from './pages/EnterpriseFunds';
import MathVerify from './pages/MathVerify';
import Milestones from './pages/Milestones';
import ModelSettings from './pages/ModelSettings';
import Narrative from './pages/Narrative';
import OrgStructure from './pages/OrgStructure';
import PerformanceMetrics from './pages/PerformanceMetrics';
import Positions from './pages/Positions';
import ProForma from './pages/ProForma';
import QandA from './pages/QandA';
import ReferencesAndResearch from './pages/ReferencesAndResearch';
import RegionalFeasibility from './pages/RegionalFeasibility';
import RegionalServices from './pages/RegionalServices';
import Scenarios from './pages/Scenarios';
import SelectBoardPresentation from './pages/SelectBoardPresentation';
import SensitivityAnalysis from './pages/SensitivityAnalysis';
import TaxpayerFAQ from './pages/TaxpayerFAQ';
import TransferStation from './pages/TransferStation';
import EfficiencyAnalyzer from './pages/EfficiencyAnalyzer';
import FinancialSimulator from './pages/FinancialSimulator';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIPlanner": AIPlanner,
    "CommunicationStrategy": CommunicationStrategy,
    "Dashboard": Dashboard,
    "ERPRoadmapPage": ERPRoadmapPage,
    "EnterpriseFunds": EnterpriseFunds,
    "MathVerify": MathVerify,
    "Milestones": Milestones,
    "ModelSettings": ModelSettings,
    "Narrative": Narrative,
    "OrgStructure": OrgStructure,
    "PerformanceMetrics": PerformanceMetrics,
    "Positions": Positions,
    "ProForma": ProForma,
    "QandA": QandA,
    "ReferencesAndResearch": ReferencesAndResearch,
    "RegionalFeasibility": RegionalFeasibility,
    "RegionalServices": RegionalServices,
    "Scenarios": Scenarios,
    "SelectBoardPresentation": SelectBoardPresentation,
    "SensitivityAnalysis": SensitivityAnalysis,
    "TaxpayerFAQ": TaxpayerFAQ,
    "TransferStation": TransferStation,
    "EfficiencyAnalyzer": EfficiencyAnalyzer,
    "FinancialSimulator": FinancialSimulator,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};