import ActivityInsights from './pages/ActivityInsights';
import ApplicationQnA from './pages/ApplicationQnA';
import ApplicationTracker from './pages/ApplicationTracker';
import AutofillVault from './pages/AutofillVault';
import CoverLetter from './pages/CoverLetter';
import CoverLetters from './pages/CoverLetters';
import Dashboard from './pages/Dashboard';
import ExtensionGuide from './pages/ExtensionGuide';
import Home from './pages/Home';
import JobAnalysis from './pages/JobAnalysis';
import JobDetails from './pages/JobDetails';
import JobLibrary from './pages/JobLibrary';
import JobSummary from './pages/JobSummary';
import MyNetwork from './pages/MyNetwork';
import MyResumes from './pages/MyResumes';
import NetworkingHub from './pages/NetworkingHub';
import NetworkingMessages from './pages/NetworkingMessages';
import OptimizeResume from './pages/OptimizeResume';
import PeopleSearch from './pages/PeopleSearch';
import Pricing from './pages/Pricing';
import QAAssistant from './pages/QAAssistant';
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
import TransferableSkills from './pages/TransferableSkills';
import UserProfile from './pages/UserProfile';
import ONetImport from './pages/ONetImport';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ActivityInsights": ActivityInsights,
    "ApplicationQnA": ApplicationQnA,
    "ApplicationTracker": ApplicationTracker,
    "AutofillVault": AutofillVault,
    "CoverLetter": CoverLetter,
    "CoverLetters": CoverLetters,
    "Dashboard": Dashboard,
    "ExtensionGuide": ExtensionGuide,
    "Home": Home,
    "JobAnalysis": JobAnalysis,
    "JobDetails": JobDetails,
    "JobLibrary": JobLibrary,
    "JobSummary": JobSummary,
    "MyNetwork": MyNetwork,
    "MyResumes": MyResumes,
    "NetworkingHub": NetworkingHub,
    "NetworkingMessages": NetworkingMessages,
    "OptimizeResume": OptimizeResume,
    "PeopleSearch": PeopleSearch,
    "Pricing": Pricing,
    "QAAssistant": QAAssistant,
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
    "TransferableSkills": TransferableSkills,
    "UserProfile": UserProfile,
    "ONetImport": ONetImport,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
