
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('🚀 Application starting...');

try {
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
  
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
      <h1 style="color: red;">Application Failed to Load</h1>
      <p>Critical error: ${error instanceof Error ? error.message : String(error)}</p>
      <p>Check the console for details.</p>
      <button onclick="window.location.reload()">Reload Page</button>
    </div>
  `;
}
