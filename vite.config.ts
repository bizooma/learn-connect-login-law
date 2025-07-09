import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React and routing
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // UI Components (Radix + Shadcn)
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-toast',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select'
          ],
          
          // Heavy libraries
          'flowchart-vendor': ['@xyflow/react'],
          'charts-vendor': ['recharts'],
          'query-vendor': ['@tanstack/react-query'],
          'supabase-vendor': ['@supabase/supabase-js'],
          
          // Admin-specific components
          'admin-chunk': [
            'src/components/admin',
            'src/pages/AdminKnowledgeBase.tsx'
          ],
          
          // Dashboard pages
          'dashboard-chunk': [
            'src/pages/OwnerDashboard.tsx',
            'src/pages/TeamLeaderDashboard.tsx',
            'src/pages/StudentDashboard.tsx',
            'src/pages/ClientDashboard.tsx'
          ]
        }
      }
    },
    // Enable code splitting and tree shaking
    minify: 'terser',
    sourcemap: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000
  }
}));
