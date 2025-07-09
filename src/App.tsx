
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useSessionTracking } from "@/hooks/useSessionTracking";
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

const queryClient = new QueryClient();

const AppContent = () => {
  // Initialize session tracking
  useSessionTracking();

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/homepage" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
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
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ChatbotWidget />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
