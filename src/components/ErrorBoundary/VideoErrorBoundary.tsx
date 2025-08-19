import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

// PHASE 3: Enhanced video error boundary with better recovery
class VideoErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Video Error Boundary caught an error:', error, { errorInfo });
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // PHASE 3: Auto-retry for certain video errors
    if (this.shouldAutoRetry(error.message) && this.state.retryCount < 2) {
      setTimeout(() => {
        this.handleRetry();
      }, 2000); // Auto-retry after 2 seconds
    }
  }

  shouldAutoRetry(errorMessage: string): boolean {
    const retryableErrors = [
      'network error',
      'load failed',
      'timeout',
      'connection'
    ];
    
    return retryableErrors.some(keyword => 
      errorMessage.toLowerCase().includes(keyword)
    );
  }

  handleRetry = () => {
    this.setState(prevState => ({ 
      hasError: false, 
      error: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="bg-gray-100 rounded-lg flex items-center justify-center min-h-48 p-6">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <p className="text-gray-600 mb-2">Video playback issue</p>
            <p className="text-sm text-gray-500 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {this.state.retryCount < 3 && (
              <Button 
                onClick={this.handleRetry}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </Button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default VideoErrorBoundary;