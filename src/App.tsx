
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { EnhancedErrorBoundary } from "@/components/ErrorBoundary/EnhancedErrorBoundary";
import { useSessionTracking } from "@/hooks/useSessionTracking";
import { useSystemHealthMonitor } from "@/hooks/useSystemHealthMonitor";
import { AuthProvider } from "@/hooks/useAuth";
import ChatbotWidget from "@/components/support/ChatbotWidget";
import Index from "./pages/Index";
import Course from "./pages/Course";
import Courses from "./pages/Courses";
import Section from "./pages/Section";
import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import KnowledgeBase from "./pages/KnowledgeBase";
import AdminKnowledgeBase from "./pages/AdminKnowledgeBase";
import LMSTree from "./pages/LMSTree";
import FlowchartLMSTree from "./pages/FlowchartLMSTree";
import ProtectedFlowchartLMSTree from "./pages/ProtectedFlowchartLMSTree";
import NotFound from "./pages/NotFound";
import OwnerDashboard from "./pages/OwnerDashboard";
import TeamLeaderDashboard from "./pages/TeamLeaderDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import FreeDashboard from "./pages/FreeDashboard";
import AdminDashboard from "./components/AdminDashboard";
import AdminWikiPage from "./pages/AdminWikiPage";
import AdminWikiHomePage from "./pages/AdminWikiHomePage";
import AdminWikiDirectoryPage from "./pages/AdminWikiDirectoryPage";
import AdminWikiPeopleChartPage from "./pages/AdminWikiPeopleChartPage";
import AdminWikiRoleChartPage from "./pages/AdminWikiRoleChartPage";

import AdminWikiGroupsPage from "./pages/AdminWikiGroupsPage";
import AdminWikiReportsContent from "./pages/AdminWikiReportsContent";
import AdminWikiReportsPeople from "./pages/AdminWikiReportsPeople";
import AdminWikiReportsActivity from "./pages/AdminWikiReportsActivity";
import AdminWikiManageUsersPage from "./pages/AdminWikiManageUsersPage";
import AdminWikiSettingsPage from "./pages/AdminWikiSettingsPage";
import AdminWikiTrainingPathsPage from "./pages/AdminWikiTrainingPathsPage";
import WikiPageEditorPage from "./pages/WikiPageEditorPage";
import WikiFlowchartEditorPage from "./pages/WikiFlowchartEditorPage";
import WikiKnowledgeCheckPage from "./pages/WikiKnowledgeCheckPage";

import AuthPage from "./components/AuthPage";
import ProtectedRoute from "./components/ProtectedRoute";
import RegisterPage from "./pages/RegisterPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancelled from "./pages/PaymentCancelled";

import LawFirmStaffTraining from "./pages/LawFirmStaffTraining";
import ImmigrationLawTraining from "./pages/ImmigrationLawTraining";
import AccountPage from "./pages/AccountPage";
import Hub from "./pages/Hub";

const queryClient = new QueryClient();

const AppContent = () => {
  // SYSTEM HEALTH MONITORING (Phase 3)
  const { getHealthStatus } = useSystemHealthMonitor();
  
  // Session tracking (simplified and stabilized)
  useSessionTracking();

  return (
    <>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/dashboard" element={<Navigate to="/index" replace />} />
        <Route path="/homepage" element={<Navigate to="/" replace />} />
        <Route path="/index" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/course/:id" element={<Course />} />
        <Route path="/section/:id" element={<Section />} />
        <Route path="/knowledge-base" element={<KnowledgeBase />} />
        <Route path="/admin-knowledge-base" element={<AdminKnowledgeBase />} />
        <Route path="/lms-tree" element={<LMSTree />} />
        <Route path="/flowchart-lms-tree" element={<FlowchartLMSTree />} />
        <Route path="/protected-flowchart-lms-tree" element={<ProtectedFlowchartLMSTree />} />
        <Route path="/owner-dashboard" element={<OwnerDashboard />} />
        <Route path="/team-leader-dashboard" element={<TeamLeaderDashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/client-dashboard" element={<ClientDashboard />} />
        <Route path="/free-dashboard" element={<FreeDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/wiki" element={<AdminWikiHomePage />} />
        <Route path="/admin/wiki/content" element={<AdminWikiPage />} />
        <Route path="/admin/wiki/training-paths" element={<AdminWikiTrainingPathsPage />} />
        <Route path="/admin/wiki/directory" element={<AdminWikiDirectoryPage />} />
        <Route path="/admin/wiki/people-chart" element={<AdminWikiPeopleChartPage />} />
        <Route path="/admin/wiki/role-chart" element={<AdminWikiRoleChartPage />} />

        <Route path="/admin/wiki/groups" element={<AdminWikiGroupsPage />} />
        <Route path="/admin/wiki/reports/content" element={<AdminWikiReportsContent />} />
        <Route path="/admin/wiki/reports/people" element={<AdminWikiReportsPeople />} />
        <Route path="/admin/wiki/reports/activity" element={<AdminWikiReportsActivity />} />
        <Route path="/admin/wiki/account/users" element={<AdminWikiManageUsersPage />} />
        <Route path="/admin/wiki/account/settings" element={<AdminWikiSettingsPage />} />
        <Route path="/admin/wiki/pages/:pageId" element={<WikiPageEditorPage />} />
        <Route path="/admin/wiki/flowchart/:articleId" element={<WikiFlowchartEditorPage />} />
        <Route path="/admin/wiki/knowledge-check/:articleId" element={<WikiKnowledgeCheckPage />} />
        <Route path="/admin/wiki/knowledge-check/category/:categoryId" element={<WikiKnowledgeCheckPage />} />


        <Route path="/auth" element={<AuthPage />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-cancelled" element={<PaymentCancelled />} />
        <Route path="/law-firm-training" element={<Navigate to="/" replace />} />
        <Route path="/law-firm-staff-training" element={<LawFirmStaffTraining />} />
        <Route path="/immigration-law-training" element={<ImmigrationLawTraining />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/profile" element={<AccountPage />} />
        <Route path="/hub" element={<ProtectedRoute><Hub /></ProtectedRoute>} />
        <Route path="/hub/:departmentId" element={<ProtectedRoute><Hub /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ChatbotWidget />
    </>
  );
};

const App = () => (
  <EnhancedErrorBoundary level="page">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </EnhancedErrorBoundary>
);

export default App;
