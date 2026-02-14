/**
 * pages.config.js - Page routing configuration
 *
 * Uses React.lazy() for route-based code splitting.
 * Home and Layout are eagerly loaded (always needed on first visit).
 * All other pages are lazy-loaded on navigation.
 */
import { lazy } from 'react';
import Home from './pages/Home';
import __Layout from './Layout.jsx';

const ActivityInsights = lazy(() => import('./pages/ActivityInsights'));
const AgentFeedbackInsights = lazy(() => import('./pages/AgentFeedbackInsights'));
const AgentTraining = lazy(() => import('./pages/AgentTraining'));
const AgentWorkspace = lazy(() => import('./pages/AgentWorkspace'));
const ApplicationQnA = lazy(() => import('./pages/ApplicationQnA'));
const ApplicationTracker = lazy(() => import('./pages/ApplicationTracker'));
const AutofillVault = lazy(() => import('./pages/AutofillVault'));
const CollaborationDashboard = lazy(() => import('./pages/CollaborationDashboard'));
const CompanyResearchTool = lazy(() => import('./pages/CompanyResearchTool'));
const CoverLetter = lazy(() => import('./pages/CoverLetter'));
const CoverLetters = lazy(() => import('./pages/CoverLetters'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ExtensionGuide = lazy(() => import('./pages/ExtensionGuide'));
const ExternalResources = lazy(() => import('./pages/ExternalResources'));
const HowTo = lazy(() => import('./pages/HowTo'));
const JobAnalysis = lazy(() => import('./pages/JobAnalysis'));
const JobDetails = lazy(() => import('./pages/JobDetails'));
const JobLibrary = lazy(() => import('./pages/JobLibrary'));
const JobMatcher = lazy(() => import('./pages/JobMatcher'));
const JobSummary = lazy(() => import('./pages/JobSummary'));
const MyNetwork = lazy(() => import('./pages/MyNetwork'));
const MyResumes = lazy(() => import('./pages/MyResumes'));
const NetworkingHub = lazy(() => import('./pages/NetworkingHub'));
const NetworkingMessages = lazy(() => import('./pages/NetworkingMessages'));
const ONetImport = lazy(() => import('./pages/ONetImport'));
const OptimizeResume = lazy(() => import('./pages/OptimizeResume'));
const PeopleSearch = lazy(() => import('./pages/PeopleSearch'));
const Pricing = lazy(() => import('./pages/Pricing'));
const QAAssistant = lazy(() => import('./pages/QAAssistant'));
const RAGMonitor = lazy(() => import('./pages/RAGMonitor'));
const RecruiterConnect = lazy(() => import('./pages/RecruiterConnect'));
const ReferralProgram = lazy(() => import('./pages/ReferralProgram'));
const ResumeBuilder = lazy(() => import('./pages/ResumeBuilder'));
const ResumeEditor = lazy(() => import('./pages/ResumeEditor'));
const ResumeHumanizer = lazy(() => import('./pages/ResumeHumanizer'));
const ResumeOptimizer = lazy(() => import('./pages/ResumeOptimizer'));
const ResumeQuality = lazy(() => import('./pages/ResumeQuality'));
const ResumeReview = lazy(() => import('./pages/ResumeReview'));
const ResumeTemplates = lazy(() => import('./pages/ResumeTemplates'));
const ResumeViewer = lazy(() => import('./pages/ResumeViewer'));
const SearchHub = lazy(() => import('./pages/SearchHub'));
const TransferableSkills = lazy(() => import('./pages/TransferableSkills'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const Users = lazy(() => import('./pages/Users'));

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
    "MyNetwork": MyNetwork,
    "MyResumes": MyResumes,
    "NetworkingHub": NetworkingHub,
    "NetworkingMessages": NetworkingMessages,
    "ONetImport": ONetImport,
    "OptimizeResume": OptimizeResume,
    "PeopleSearch": PeopleSearch,
    "Pricing": Pricing,
    "QAAssistant": QAAssistant,
    "RAGMonitor": RAGMonitor,
    "RecruiterConnect": RecruiterConnect,
    "ReferralProgram": ReferralProgram,
    "ResumeBuilder": ResumeBuilder,
    "ResumeEditor": ResumeEditor,
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
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
