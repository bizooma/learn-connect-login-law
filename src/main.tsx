
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { youTubeAPIService } from './services/youTubeAPIService';
import { logger } from './utils/logger';

// Initialize YouTube API service early for better performance
youTubeAPIService.loadAPI().catch(error => {
  logger.warn('Failed to preload YouTube API:', error);
});

createRoot(document.getElementById("root")!).render(<App />);
