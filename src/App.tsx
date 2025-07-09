
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import * as React from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import FallbackErrorBoundary from "@/components/FallbackErrorBoundary";
import NetworkErrorBoundary from "@/components/NetworkErrorBoundary";
import { useSessionTracking } from "@/hooks/useSessionTracking";
import { usePerformanceTracking } from "@/hooks/usePerformanceTracking";
import { AuthProvider } from "@/hooks/useAuth";
import { ProgressProvider } from "@/contexts/ProgressContext";
import { SupportChatbot } from "@/components/support/SupportChatbot";
import { runFullDiagnostic } from "@/utils/environmentChecker";

// Lazy load components for better code splitting
const Index = lazy(() => import("./pages/Index"));
const Course = lazy(() => import("./pages/Course"));
const Courses = lazy(() => import("./pages/Courses"));
const Section = lazy(() => import("./pages/Section"));
const Homepage = lazy(() => import("./pages/Homepage"));
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase"));
const AdminKnowledgeBase = lazy(() => import("./pages/AdminKnowledgeBase"));
const LMSTree = lazy(() => import("./pages/LMSTree"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Separate admin/owner specific routes into their own chunks
const OwnerDashboard = lazy(() => import("./pages/OwnerDashboard"));
const TeamLeaderDashboard = lazy(() => import("./pages/TeamLeaderDashboard"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));
const FreeDashboard = lazy(() => import("./pages/FreeDashboard"));

// Heavy flowchart components - separate chunk
const FlowchartLMSTree = lazy(() => import("./pages/FlowchartLMSTree"));
const ProtectedFlowchartLMSTree = lazy(() => import("./pages/ProtectedFlowchartLMSTree"));

const queryClient = new QueryClient();

// Loading component for better UX during code splitting
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

const AppContent = () => {
  console.log('🚀 AppContent rendering at:', new Date().toISOString());
  console.log('🌐 Current URL:', window.location.href);
  console.log('🔧 User Agent:', navigator.userAgent);
  
  try {
    // Initialize session tracking
    console.log('📊 Initializing session tracking...');
    useSessionTracking();
    
    // Initialize performance tracking
    console.log('⚡ Initializing performance tracking...');
    usePerformanceTracking();
    
    console.log('✅ App hooks initialized successfully');
  } catch (error) {
    console.error('❌ Error in App hooks:', error);
    throw error;
  }

  // Run diagnostic on first load
  React.useEffect(() => {
    const runDiagnostic = async () => {
      try {
        await runFullDiagnostic();
      } catch (error) {
        console.error('❌ Diagnostic failed:', error);
      }
    };
    
    runDiagnostic();
  }, []);

  return (
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
  );
};

const App = () => {
  console.log('🎯 App component initializing...');
  console.log('🔗 Environment check:', {
    href: window.location.href,
    origin: window.location.origin,
    pathname: window.location.pathname,
    timestamp: new Date().toISOString()
  });
  
  return (
    <FallbackErrorBoundary>
      <NetworkErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <ErrorBoundary>
              <AuthProvider>
                <ProgressProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <AppContent />
                    <SupportChatbot />
                  </BrowserRouter>
                </ProgressProvider>
              </AuthProvider>
            </ErrorBoundary>
          </TooltipProvider>
        </QueryClientProvider>
      </NetworkErrorBoundary>
    </FallbackErrorBoundary>
  );
};

export default App;
