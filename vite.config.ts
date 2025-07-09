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
          
          // Core UI Components - only most used ones
          'ui-core': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-toast'
          ],
          
          // Secondary UI Components - loaded when needed
          'ui-secondary': [
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-popover'
          ],
          
          // Heavy libraries - separate chunks for better caching
          'flowchart-vendor': ['@xyflow/react'],
          'charts-vendor': ['recharts'],
          'markdown-vendor': ['react-markdown', 'remark-gfm'],
          'date-vendor': ['date-fns'],
          'query-vendor': ['@tanstack/react-query'],
          'supabase-vendor': ['@supabase/supabase-js'],
          
          // Form and validation libraries
          'forms-vendor': ['react-hook-form', '@hookform/resolvers', 'zod']
        }
      }
    },
    // Enable code splitting and tree shaking
    minify: 'esbuild', // Use esbuild instead of terser for faster builds
    sourcemap: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000
  }
}));
