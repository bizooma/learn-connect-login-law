
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import HomepagePage from "./pages/Homepage";
import Index from "./pages/Index";
import Course from "./pages/Course";
import Section from "./pages/Section";
import Courses from "./pages/Courses";
import OwnerDashboard from "./pages/OwnerDashboard";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import LMSTree from "./pages/LMSTree";
import StudentDashboard from "./components/StudentDashboard";
import ClientDashboard from "./components/ClientDashboard";
import FreeDashboard from "./components/FreeDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomepagePage />} />
            <Route path="/login" element={<Index />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/course/:id" element={<Course />} />
            <Route path="/section/:id" element={<Section />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/owner-dashboard" element={<OwnerDashboard />} />
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/client-dashboard" element={<ClientDashboard />} />
            <Route path="/free-dashboard" element={<FreeDashboard />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/lms-tree" element={<LMSTree />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
