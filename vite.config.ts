import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    // Bundle analyzer - generates stats.html in build
    mode === 'production' && visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Advanced build optimizations
    minify: 'esbuild',
    sourcemap: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
    // Asset optimization
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    cssCodeSplit: true,
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Rollup options for better tree shaking and chunking
    rollupOptions: {
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false,
      },
      output: {
        manualChunks: (id) => {
          // Node modules chunking strategy
          if (id.includes('node_modules')) {
            // Core React and routing - highest priority
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            
            // Core UI Components - most frequently used
            if (id.includes('@radix-ui/react-dialog') || 
                id.includes('@radix-ui/react-dropdown-menu') || 
                id.includes('@radix-ui/react-toast')) {
              return 'ui-core';
            }
            
            // Secondary UI Components - loaded when needed
            if (id.includes('@radix-ui')) {
              return 'ui-secondary';
            }
            
            // Heavy libraries - separate chunks for better caching
            if (id.includes('@xyflow/react')) return 'flowchart-vendor';
            if (id.includes('recharts')) return 'charts-vendor';
            if (id.includes('react-markdown') || id.includes('remark-gfm')) return 'markdown-vendor';
            if (id.includes('date-fns')) return 'date-vendor';
            if (id.includes('@tanstack/react-query')) return 'query-vendor';
            if (id.includes('@supabase/supabase-js')) return 'supabase-vendor';
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) return 'forms-vendor';
            if (id.includes('lucide-react')) return 'icons-vendor';
            
            // All other node_modules
            return 'vendor';
          }
          
          // App code chunking
          if (id.includes('src/components/admin')) return 'admin-components';
          if (id.includes('src/components/flowchart-lms')) return 'flowchart-components';
          if (id.includes('src/pages') && (
            id.includes('OwnerDashboard') || 
            id.includes('TeamLeaderDashboard') || 
            id.includes('StudentDashboard') || 
            id.includes('ClientDashboard')
          )) return 'dashboard-pages';
        },
        // Optimize chunk names for better caching
        chunkFileNames: '[name]-[hash].js',
        entryFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash].[ext]'
      }
    }
  },
  
  // Development optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-toast'
    ],
    exclude: [
      '@xyflow/react',
      'recharts',
      'react-markdown'
    ]
  },
  
  // Preload critical resources
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js') {
        return { js: true };
      }
      return { relative: true };
    },
  }
}));
