import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

class VideoErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('🎥 Video Error Boundary caught error:', { 
      error: error.message, 
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount
    });

    // Report to monitoring
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-retry for certain errors
    if (this.shouldAutoRetry(error) && this.state.retryCount < this.maxRetries) {
      setTimeout(() => {
        this.handleRetry();
      }, 1000 * (this.state.retryCount + 1)); // Exponential backoff
    }
  }

  private shouldAutoRetry(error: Error): boolean {
    const retriableErrors = [
      'Network Error',
      'Loading chunk',
      'Script error',
      'YouTube API'
    ];
    
    return retriableErrors.some(msg => 
      error.message.includes(msg) || error.stack?.includes(msg)
    );
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      logger.log('🔄 Video Error Boundary retrying...', { 
        attempt: this.state.retryCount + 1,
        maxRetries: this.maxRetries 
      });
      
      this.setState(prevState => ({ 
        hasError: false, 
        error: undefined,
        retryCount: prevState.retryCount + 1 
      }));
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < this.maxRetries;
      
      return (
        <div className="bg-muted rounded-lg flex items-center justify-center min-h-[200px] p-6">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <div>
              <h3 className="font-semibold text-foreground">Video Player Error</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {canRetry 
                  ? 'Something went wrong while loading the video.' 
                  : 'Video failed to load after multiple attempts.'
                }
              </p>
              {this.state.retryCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Retry attempt: {this.state.retryCount}/{this.maxRetries}
                </p>
              )}
            </div>
            {canRetry && (
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
            <div className="text-xs text-muted-foreground">
              If this persists, please refresh the page or contact support.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default VideoErrorBoundary;