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
import ActivityInsights from './pages/ActivityInsights';
import AgentFeedbackInsights from './pages/AgentFeedbackInsights';
import AgentTraining from './pages/AgentTraining';
import AgentWorkspace from './pages/AgentWorkspace';
import ApplicationQnA from './pages/ApplicationQnA';
import ApplicationTracker from './pages/ApplicationTracker';
import AutofillVault from './pages/AutofillVault';
import CollaborationDashboard from './pages/CollaborationDashboard';
import CompanyResearchTool from './pages/CompanyResearchTool';
import CoverLetter from './pages/CoverLetter';
import CoverLetters from './pages/CoverLetters';
import Dashboard from './pages/Dashboard';
import ExtensionGuide from './pages/ExtensionGuide';
import ExternalResources from './pages/ExternalResources';
import Home from './pages/Home';
import HowTo from './pages/HowTo';
import JobAnalysis from './pages/JobAnalysis';
import JobDetails from './pages/JobDetails';
import JobLibrary from './pages/JobLibrary';
import JobMatcher from './pages/JobMatcher';
import JobSummary from './pages/JobSummary';
import KnowledgeIngest from './pages/KnowledgeIngest';
import MyNetwork from './pages/MyNetwork';
import MyResumes from './pages/MyResumes';
import NetworkingHub from './pages/NetworkingHub';
import NetworkingMessages from './pages/NetworkingMessages';
import ONetImport from './pages/ONetImport';
import ONetInsights from './pages/ONetInsights';
import OptimizeResume from './pages/OptimizeResume';
import PeopleSearch from './pages/PeopleSearch';
import Pricing from './pages/Pricing';
import QAAssistant from './pages/QAAssistant';
import RAGMonitor from './pages/RAGMonitor';
import RecruiterConnect from './pages/RecruiterConnect';
import ReferralProgram from './pages/ReferralProgram';
import ResumeBuilder from './pages/ResumeBuilder';
import ResumeEditor from './pages/ResumeEditor';
import ResumeEditorTest from './pages/ResumeEditorTest';
import ResumeHumanizer from './pages/ResumeHumanizer';
import ResumeOptimizer from './pages/ResumeOptimizer';
import ResumeQuality from './pages/ResumeQuality';
import ResumeReview from './pages/ResumeReview';
import ResumeTemplates from './pages/ResumeTemplates';
import ResumeViewer from './pages/ResumeViewer';
import SearchHub from './pages/SearchHub';
import TransferableSkills from './pages/TransferableSkills';
import UserProfile from './pages/UserProfile';
import Users from './pages/Users';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ActivityInsights": ActivityInsights,
    "AgentFeedbackInsights": AgentFeedbackInsights,
    "AgentTraining": AgentTraining,
    "AgentWorkspace": AgentWorkspace,
    "ApplicationQnA": ApplicationQnA,
    "ApplicationTracker": ApplicationTracker,
    "AutofillVault": AutofillVault,
    "CollaborationDashboard": CollaborationDashboard,
    "CompanyResearchTool": CompanyResearchTool,
    "CoverLetter": CoverLetter,
    "CoverLetters": CoverLetters,
    "Dashboard": Dashboard,
    "ExtensionGuide": ExtensionGuide,
    "ExternalResources": ExternalResources,
    "Home": Home,
    "HowTo": HowTo,
    "JobAnalysis": JobAnalysis,
    "JobDetails": JobDetails,
    "JobLibrary": JobLibrary,
    "JobMatcher": JobMatcher,
    "JobSummary": JobSummary,
    "KnowledgeIngest": KnowledgeIngest,
    "MyNetwork": MyNetwork,
    "MyResumes": MyResumes,
    "NetworkingHub": NetworkingHub,
    "NetworkingMessages": NetworkingMessages,
    "ONetImport": ONetImport,
    "ONetInsights": ONetInsights,
    "OptimizeResume": OptimizeResume,
    "PeopleSearch": PeopleSearch,
    "Pricing": Pricing,
    "QAAssistant": QAAssistant,
    "RAGMonitor": RAGMonitor,
    "RecruiterConnect": RecruiterConnect,
    "ReferralProgram": ReferralProgram,
    "ResumeBuilder": ResumeBuilder,
    "ResumeEditor": ResumeEditor,
    "ResumeEditorTest": ResumeEditorTest,
    "ResumeHumanizer": ResumeHumanizer,
    "ResumeOptimizer": ResumeOptimizer,
    "ResumeQuality": ResumeQuality,
    "ResumeReview": ResumeReview,
    "ResumeTemplates": ResumeTemplates,
    "ResumeViewer": ResumeViewer,
    "SearchHub": SearchHub,
    "TransferableSkills": TransferableSkills,
    "UserProfile": UserProfile,
    "Users": Users,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
