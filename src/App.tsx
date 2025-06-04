
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Homepage from "./pages/Homepage";
import Course from "./pages/Course";
import Section from "./pages/Section";
import Courses from "./pages/Courses";
import LMSTree from "./pages/LMSTree";
import OwnerDashboard from "./pages/OwnerDashboard";
import StudentDashboard from "./components/StudentDashboard";
import ClientDashboard from "./components/ClientDashboard";
import FreeDashboard from "./components/FreeDashboard";
import ResetPassword from "./pages/ResetPassword";
import AuthPage from "./components/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/homepage" element={<Homepage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/course/:id" element={<Course />} />
            <Route path="/section/:id" element={<Section />} />
            <Route path="/lms-tree" element={<LMSTree />} />
            <Route path="/owner-dashboard" element={<OwnerDashboard />} />
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/client-dashboard" element={<ClientDashboard />} />
            <Route path="/free-dashboard" element={<FreeDashboard />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
