import { lazy, Suspense } from "react";

// Lazy load chart components
const Chart = lazy(() => import("@/components/ui/chart").then(m => ({ default: m.ChartContainer })));
const ChartTooltip = lazy(() => import("@/components/ui/chart").then(m => ({ default: m.ChartTooltip })));
const ChartTooltipContent = lazy(() => import("@/components/ui/chart").then(m => ({ default: m.ChartTooltipContent })));

// Lazy load recharts components
const BarChart = lazy(() => import("recharts").then(m => ({ default: m.BarChart })));
const Bar = lazy(() => import("recharts").then(m => ({ default: m.Bar })));
const XAxis = lazy(() => import("recharts").then(m => ({ default: m.XAxis })));
const YAxis = lazy(() => import("recharts").then(m => ({ default: m.YAxis })));
const CartesianGrid = lazy(() => import("recharts").then(m => ({ default: m.CartesianGrid })));
const ResponsiveContainer = lazy(() => import("recharts").then(m => ({ default: m.ResponsiveContainer })));
const PieChart = lazy(() => import("recharts").then(m => ({ default: m.PieChart })));
const Pie = lazy(() => import("recharts").then(m => ({ default: m.Pie })));
const Cell = lazy(() => import("recharts").then(m => ({ default: m.Cell })));

// Loading component for charts
const ChartLoader = () => (
  <div className="w-full h-64 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
    <div className="text-gray-500">Loading chart...</div>
  </div>
);

// Wrapped chart components with lazy loading
export const LazyBarChart = ({ children, ...props }: any) => (
  <Suspense fallback={<ChartLoader />}>
    <BarChart {...props}>{children}</BarChart>
  </Suspense>
);

export const LazyPieChart = ({ children, ...props }: any) => (
  <Suspense fallback={<ChartLoader />}>
    <PieChart {...props}>{children}</PieChart>
  </Suspense>
);

export const LazyResponsiveContainer = ({ children, ...props }: any) => (
  <Suspense fallback={<ChartLoader />}>
    <ResponsiveContainer {...props}>{children}</ResponsiveContainer>
  </Suspense>
);

// Export lazy-loaded components
export { 
  Chart as LazyChart,
  ChartTooltip as LazyChartTooltip,
  ChartTooltipContent as LazyChartTooltipContent,
  Bar as LazyBar,
  XAxis as LazyXAxis,
  YAxis as LazyYAxis,
  CartesianGrid as LazyCartesianGrid,
  Pie as LazyPie,
  Cell as LazyCell
};