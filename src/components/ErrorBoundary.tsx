
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Catch ALL errors for debugging white screen issues
    console.error('ErrorBoundary caught error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Current URL:', window.location.href);
    console.error('User agent:', navigator.userAgent);
    
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    console.error('Component stack:', errorInfo.componentStack);
    console.error('Error boundary triggered at:', new Date().toISOString());
    
    // Send error details to console for debugging
    console.group('🚨 Critical Error Details');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Props:', this.props);
    console.error('State:', this.state);
    console.groupEnd();
    
    this.setState({ errorInfo });
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleRestart = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Application Error
            </h2>
            <p className="text-gray-600 mb-6">
              Something went wrong. Check the console for details or try refreshing the page.
            </p>
            <div className="space-y-4">
              <Button
                onClick={this.handleRefresh}
                className="w-full"
              >
                Refresh Page
              </Button>
              <Button
                variant="outline"
                onClick={this.handleRestart}
                className="w-full"
              >
                Clear Cache & Restart
              </Button>
            </div>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer">
                  Technical Details
                </summary>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
