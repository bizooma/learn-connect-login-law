
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Course from "./pages/Course";
import Section from "./pages/Section";
import Courses from "./pages/Courses";
import LMSTree from "./pages/LMSTree";
import OwnerDashboard from "./pages/OwnerDashboard";
import Homepage from "./pages/Homepage";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import AdminResources from "./pages/AdminResources";

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
            <Route path="/homepage" element={<Homepage />} />
            <Route path="/course/:id" element={<Course />} />
            <Route path="/section/:id" element={<Section />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/lms-tree" element={<LMSTree />} />
            <Route path="/owner-dashboard" element={<OwnerDashboard />} />
            <Route path="/student-dashboard" element={<Index />} />
            <Route path="/client-dashboard" element={<Index />} />
            <Route path="/free-dashboard" element={<Index />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin/resources" element={<AdminResources />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
