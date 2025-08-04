// PERFORMANCE OPTIMIZATION: Lazy loading for heavy components
import { lazy, Suspense } from "react";

// Lazy load heavy dashboard components
export const LazyFreeDashboard = lazy(() => import("@/components/FreeDashboard"));
export const LazyStudentDashboard = lazy(() => import("@/components/StudentDashboard"));
export const LazyAdminDashboard = lazy(() => import("@/components/AdminDashboard"));

// Lazy load heavy course components
export const LazyCourseContent = lazy(() => import("@/components/course/CourseContent"));
export const LazyQuizDisplay = lazy(() => import("@/components/course/QuizDisplay"));

// Lazy load heavy admin components
export const LazyUserManagement = lazy(() => import("@/components/admin/UserManagement"));
export const LazyPowerPointImport = lazy(() => import("@/components/admin/quiz-management/PowerPointImport"));

// Loading component for lazy-loaded components
export const ComponentLoader = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading component...</p>
      </div>
    </div>
  }>
    {children}
  </Suspense>
);

// Error boundary fallback for lazy components
export const LazyComponentErrorFallback = ({ error }: { error: Error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
    <div className="text-center p-8">
      <div className="text-red-600 text-6xl mb-4">⚠️</div>
      <h2 className="text-2xl font-bold text-red-800 mb-2">Component Failed to Load</h2>
      <p className="text-red-700 mb-4">There was an error loading this component.</p>
      <button 
        onClick={() => window.location.reload()} 
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
      >
        Reload Page
      </button>
    </div>
  </div>
);