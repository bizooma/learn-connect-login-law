
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { youTubeAPIService } from './services/youTubeAPIService';
import { preloadCriticalResources } from './utils/routePreloading';

console.log('🚀 Application starting...', {
  timestamp: new Date().toISOString(),
  url: window.location.href,
  userAgent: navigator.userAgent
});

// Add global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason);
  console.error('Promise:', event.promise);
});

// Add global error handler for JavaScript errors
window.addEventListener('error', (event) => {
  console.error('🚨 Global JavaScript error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

try {
  // Initialize YouTube API service early for better performance
  console.log('📺 Loading YouTube API...');
  youTubeAPIService.loadAPI().catch(error => {
    console.warn('⚠️ Failed to preload YouTube API:', error);
  });

  // Preload critical resources based on device capabilities
  console.log('🔄 Preloading critical resources...');
  preloadCriticalResources();

  console.log('✅ Pre-initialization complete, rendering app...');
  createRoot(document.getElementById("root")!).render(<App />);
} catch (error) {
  console.error('❌ Critical error during app initialization:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
      <h1 style="color: red;">Application Failed to Load</h1>
      <p>Check the console for details.</p>
      <button onclick="window.location.reload()">Reload Page</button>
    </div>
  `;
}
