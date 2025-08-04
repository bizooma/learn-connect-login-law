import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

class GlobalErrorBoundary extends Component<Props, State> {
  private errorCount = 0;
  private maxErrors = 3;

  public state: State = {
    hasError: false,
    errorId: ''
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log error safely
    try {
      logger.error('Global Error Boundary caught error:', error);
    } catch (logError) {
      console.error('Error logging failed:', logError);
    }

    return { hasError: true, error, errorId };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.errorCount++;
    
    try {
      logger.error('Global Error Boundary details:', { 
        error: error.message, 
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorCount: this.errorCount,
        errorId: this.state.errorId
      });

      // Report to production error tracking if available
      if (import.meta.env.PROD) {
        this.reportError(error, errorInfo);
      }
    } catch (reportError) {
      console.error('Error reporting failed:', reportError);
    }

    // If too many errors, reload the page
    if (this.errorCount >= this.maxErrors) {
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Safe error reporting without causing additional crashes
      const errorData = {
        message: error.message,
        stack: error.stack?.substring(0, 1000), // Limit stack size
        componentStack: errorInfo.componentStack?.substring(0, 500),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        errorId: this.state.errorId
      };

      // Could send to logging service here
      console.warn('Error data prepared for reporting:', errorData);
    } catch (reportingError) {
      console.error('Error reporting preparation failed:', reportingError);
    }
  };

  private handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: ''
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-100 p-4">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">
              We encountered an unexpected error. This has been logged and will be investigated.
            </p>
            
            {this.errorCount >= this.maxErrors && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                <p className="text-sm text-red-700">
                  Multiple errors detected. The page will reload automatically.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={this.handleRetry}
                className="w-full"
                variant="default"
                disabled={this.errorCount >= this.maxErrors}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
              <Button
                onClick={this.handleReload}
                variant="outline"
                className="w-full"
                size="sm"
              >
                Reload Page
              </Button>
            </div>

            <details className="mt-4 text-left">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                Error Details (ID: {this.state.errorId.slice(-8)})
              </summary>
              {this.state.error && (
                <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              )}
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;