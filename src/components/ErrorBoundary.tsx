
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
    // Only catch specific auth-related errors, not general JavaScript errors
    const isAuthError = error.message?.includes('JWT') || 
                       error.message?.includes('token') ||
                       error.message?.includes('unauthorized') ||
                       error.message?.includes('authentication failed');
    
    if (isAuthError) {
      return { hasError: true, error };
    }
    
    // Let other errors bubble up normally (including null reference errors)
    throw error;
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Auth Error Boundary caught an error:', error, errorInfo);
    
    // Auto-recover after a short delay for auth errors only
    setTimeout(() => {
      this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    }, 1000);
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
              Authentication Error
            </h2>
            <p className="text-gray-600 mb-6">
              Something went wrong with the authentication system. Please try refreshing the page.
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
