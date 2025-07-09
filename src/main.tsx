
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
  // Skip YouTube API loading for faster startup
  console.log('📺 Skipping YouTube API preload for faster startup...');
  
  // Skip resource preloading for faster startup
  console.log('🔄 Skipping resource preload for faster startup...');

  console.log('✅ Pre-initialization complete, rendering app...');
  
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  console.log('🎯 Creating React root...');
  const root = createRoot(rootElement);
  
  console.log('🚀 Rendering App component...');
  root.render(<App />);
  
  console.log('✅ App render complete');
} catch (error) {
  console.error('❌ Critical error during app initialization:', error);
  console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack available');
  console.error('❌ Error details:', {
    name: error instanceof Error ? error.name : 'Unknown',
    message: error instanceof Error ? error.message : String(error)
  });
  
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
      <h1 style="color: red;">Application Failed to Load</h1>
      <p>Critical error: ${error instanceof Error ? error.message : String(error)}</p>
      <p>Check the console for details.</p>
      <button onclick="window.location.reload()">Reload Page</button>
    </div>
  `;
}
