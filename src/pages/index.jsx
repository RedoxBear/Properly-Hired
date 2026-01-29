import Layout from "./Layout.jsx";
import Home from "./Home.jsx";
import Auth from "./Auth.jsx";
import AboutUs from "./AboutUs.jsx";
import HowItWorks from "./HowItWorks.jsx";
import NotFound from "./NotFound.jsx";
import ProtectedRoute from "@/components/ProtectedRoute";

import Dashboard from "./Dashboard";

import JobAnalysis from "./JobAnalysis";

import ResumeOptimizer from "./ResumeOptimizer";

import CoverLetters from "./CoverLetters";

import QAAssistant from "./QAAssistant";

import MyResumes from "./MyResumes";

import JobLibrary from "./JobLibrary";

import ResumeViewer from "./ResumeViewer";

import ResumeTemplates from "./ResumeTemplates";

import ResumeBuilder from "./ResumeBuilder";

import JobDetails from "./JobDetails";

import TransferableSkills from "./TransferableSkills";

import ApplicationQnA from "./ApplicationQnA";

import ExtensionGuide from "./ExtensionGuide";

import JobSummary from "./JobSummary";

import OptimizeResume from "./OptimizeResume";

import CoverLetter from "./CoverLetter";

import ActivityInsights from "./ActivityInsights";

import AutofillVault from "./AutofillVault";

import ResumeQuality from "./ResumeQuality";

import ResumeReview from "./ResumeReview";

import Pricing from "./Pricing";

import ResumeEditor from "./ResumeEditor";

import ResumeHumanizer from "./ResumeHumanizer";

import ResumeEditorTest from "./ResumeEditorTest";

import ApplicationTracker from "./ApplicationTracker";

import JobMatcher from "./JobMatcher";

import UserProfile from "./UserProfile";

import ReferralProgram from "./ReferralProgram";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    Home: Home,
    Auth: Auth,
    AboutUs: AboutUs,
    HowItWorks: HowItWorks,
    NotFound: NotFound,
    Dashboard: Dashboard,
    
    JobAnalysis: JobAnalysis,
    
    ResumeOptimizer: ResumeOptimizer,
    
    CoverLetters: CoverLetters,
    
    QAAssistant: QAAssistant,
    
    MyResumes: MyResumes,
    
    JobLibrary: JobLibrary,
    
    ResumeViewer: ResumeViewer,
    
    ResumeTemplates: ResumeTemplates,
    
    ResumeBuilder: ResumeBuilder,
    
    JobDetails: JobDetails,
    
    TransferableSkills: TransferableSkills,
    
    ApplicationQnA: ApplicationQnA,
    
    ExtensionGuide: ExtensionGuide,
    
    JobSummary: JobSummary,
    
    OptimizeResume: OptimizeResume,
    
    CoverLetter: CoverLetter,
    
    ActivityInsights: ActivityInsights,
    
    AutofillVault: AutofillVault,
    
    ResumeQuality: ResumeQuality,
    
    ResumeReview: ResumeReview,
    
    Pricing: Pricing,
    
    ResumeEditor: ResumeEditor,
    
    ResumeHumanizer: ResumeHumanizer,
    
    ResumeEditorTest: ResumeEditorTest,
    
    ApplicationTracker: ApplicationTracker,
    
    JobMatcher: JobMatcher,
    
    UserProfile: UserProfile,
    
    ReferralProgram: ReferralProgram,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/about" element={<AboutUs />} />
                <Route path="/how-it-works" element={<HowItWorks />} />

                <Route path="/Auth" element={<Auth />} />
                <Route path="/auth" element={<Auth />} />
                
                <Route path="/Dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                
                <Route path="/JobAnalysis" element={<ProtectedRoute><JobAnalysis /></ProtectedRoute>} />
                
                <Route path="/ResumeOptimizer" element={<ProtectedRoute><ResumeOptimizer /></ProtectedRoute>} />
                
                <Route path="/CoverLetters" element={<ProtectedRoute><CoverLetters /></ProtectedRoute>} />
                
                <Route path="/QAAssistant" element={<ProtectedRoute><QAAssistant /></ProtectedRoute>} />
                
                <Route path="/MyResumes" element={<ProtectedRoute><MyResumes /></ProtectedRoute>} />
                
                <Route path="/JobLibrary" element={<ProtectedRoute><JobLibrary /></ProtectedRoute>} />
                
                <Route path="/ResumeViewer" element={<ProtectedRoute><ResumeViewer /></ProtectedRoute>} />
                
                <Route path="/ResumeTemplates" element={<ProtectedRoute><ResumeTemplates /></ProtectedRoute>} />
                
                <Route path="/ResumeBuilder" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />
                
                <Route path="/JobDetails" element={<ProtectedRoute><JobDetails /></ProtectedRoute>} />
                
                <Route path="/TransferableSkills" element={<ProtectedRoute><TransferableSkills /></ProtectedRoute>} />
                
                <Route path="/ApplicationQnA" element={<ProtectedRoute><ApplicationQnA /></ProtectedRoute>} />
                
                <Route path="/ExtensionGuide" element={<ProtectedRoute><ExtensionGuide /></ProtectedRoute>} />
                
                <Route path="/JobSummary" element={<ProtectedRoute><JobSummary /></ProtectedRoute>} />
                
                <Route path="/OptimizeResume" element={<ProtectedRoute><OptimizeResume /></ProtectedRoute>} />
                
                <Route path="/CoverLetter" element={<ProtectedRoute><CoverLetter /></ProtectedRoute>} />
                
                <Route path="/ActivityInsights" element={<ProtectedRoute><ActivityInsights /></ProtectedRoute>} />
                
                <Route path="/AutofillVault" element={<ProtectedRoute><AutofillVault /></ProtectedRoute>} />
                
                <Route path="/ResumeQuality" element={<ProtectedRoute><ResumeQuality /></ProtectedRoute>} />
                
                <Route path="/ResumeReview" element={<ProtectedRoute><ResumeReview /></ProtectedRoute>} />
                
                <Route path="/Pricing" element={<Pricing />} />
                
                <Route path="/ResumeEditor" element={<ProtectedRoute><ResumeEditor /></ProtectedRoute>} />
                
                <Route path="/ResumeHumanizer" element={<ProtectedRoute><ResumeHumanizer /></ProtectedRoute>} />
                
                <Route path="/ResumeEditorTest" element={<ProtectedRoute><ResumeEditorTest /></ProtectedRoute>} />
                
                <Route path="/ApplicationTracker" element={<ProtectedRoute><ApplicationTracker /></ProtectedRoute>} />
                
                <Route path="/JobMatcher" element={<ProtectedRoute><JobMatcher /></ProtectedRoute>} />
                
                <Route path="/UserProfile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                
                <Route path="/ReferralProgram" element={<ProtectedRoute><ReferralProgram /></ProtectedRoute>} />
                
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}