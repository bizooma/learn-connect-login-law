import { lazy, Suspense } from "react";

// Lazy load heavy flowchart components
const FlowchartSidebar = lazy(() => import("@/components/flowchart-lms/FlowchartSidebar"));
const FlowchartCanvas = lazy(() => import("@/components/flowchart-lms/FlowchartCanvas"));

// Loading component for flowchart components
const FlowchartLoader = () => (
  <div className="h-full w-full flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <p className="text-sm text-gray-600">Loading flowchart...</p>
    </div>
  </div>
);

export const LazyFlowchartSidebar = () => (
  <Suspense fallback={<FlowchartLoader />}>
    <FlowchartSidebar />
  </Suspense>
);

export const LazyFlowchartCanvas = () => (
  <Suspense fallback={<FlowchartLoader />}>
    <FlowchartCanvas />
  </Suspense>
);