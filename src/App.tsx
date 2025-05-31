
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Courses from "./pages/Courses";
import Course from "./pages/Course";
import Section from "./pages/Section";
import OwnerDashboard from "./pages/OwnerDashboard";
import StudentDashboard from "./components/StudentDashboard";
import ClientDashboard from "./components/ClientDashboard";
import FreeDashboard from "./components/FreeDashboard";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/course/:id" element={<Course />} />
            <Route path="/section/:id" element={<Section />} />
            <Route path="/owner-dashboard" element={<OwnerDashboard />} />
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/client-dashboard" element={<ClientDashboard />} />
            <Route path="/free-dashboard" element={<FreeDashboard />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
