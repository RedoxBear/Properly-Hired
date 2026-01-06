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
import JobMatcher from './pages/JobMatcher';
import JobSummary from './pages/JobSummary';
import MyResumes from './pages/MyResumes';
import OptimizeResume from './pages/OptimizeResume';
import Pricing from './pages/Pricing';
import QAAssistant from './pages/QAAssistant';
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
    "JobMatcher": JobMatcher,
    "JobSummary": JobSummary,
    "MyResumes": MyResumes,
    "OptimizeResume": OptimizeResume,
    "Pricing": Pricing,
    "QAAssistant": QAAssistant,
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
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};