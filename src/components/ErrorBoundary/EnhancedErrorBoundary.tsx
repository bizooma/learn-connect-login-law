// Enhanced error boundary with smart recovery and context capture
import React, { Component, ReactNode, ErrorInfo } from 'react';
import { logger } from '@/utils/logger';
import { captureErrorContext, errorBreadcrumbs } from '@/utils/errorContext';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'page' | 'component' | 'widget';
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
  recoveryAttempts: number;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private autoRecoveryTimeout?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: '',
      recoveryAttempts: 0
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add to breadcrumbs
    errorBreadcrumbs.add(`Error boundary triggered: ${error.message}`, 'error');
    
    return {
      hasError: true,
      errorId,
      error
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const context = captureErrorContext({
      component: this.props.level || 'unknown',
      recoveryAttempts: this.state.recoveryAttempts,
      breadcrumbs: errorBreadcrumbs.get()
    });

    // Enhanced error logging with context
    logger.error(
      `🚨 Enhanced Error Boundary (${this.props.level || 'unknown'}) caught error:`,
      error,
      {
        errorInfo: errorInfo.componentStack,
        context,
        errorId: this.state.errorId
      }
    );

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Attempt smart recovery for specific error types
    this.attemptSmartRecovery(error);

    this.setState({ errorInfo });
  }

  private attemptSmartRecovery(error: Error): void {
    const errorMessage = error.message.toLowerCase();

    // Auto-recovery for chunk loading errors
    if (errorMessage.includes('loading chunk') || errorMessage.includes('chunkloaderror')) {
      logger.log('🔄 Attempting auto-recovery for chunk loading error...');
      
      this.autoRecoveryTimeout = setTimeout(() => {
        window.location.reload();
      }, 2000);
      return;
    }

    // Auto-recovery for network errors (component level only)
    if (this.props.level === 'component' && errorMessage.includes('network')) {
      logger.log('🔄 Attempting component-level recovery for network error...');
      
      this.autoRecoveryTimeout = setTimeout(() => {
        this.handleRetry();
      }, 3000);
      return;
    }
  }

  private handleRetry = (): void => {
    if (this.autoRecoveryTimeout) {
      clearTimeout(this.autoRecoveryTimeout);
    }

    errorBreadcrumbs.add('User triggered retry', 'info');
    
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      recoveryAttempts: prevState.recoveryAttempts + 1
    }));
  };

  private handleReload = (): void => {
    errorBreadcrumbs.add('User triggered reload', 'info');
    window.location.reload();
  };

  private handleGoHome = (): void => {
    errorBreadcrumbs.add('User navigated to home', 'info');
    window.location.href = '/';
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Context-aware fallback UI
      const errorType = this.getErrorType(this.state.error);
      
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-background border border-border rounded-lg">
          <div className="text-center space-y-6 max-w-md">
            <div className="flex justify-center">
              <AlertTriangle className="h-16 w-16 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">
                {this.getErrorTitle(errorType)}
              </h2>
              <p className="text-muted-foreground">
                {this.getErrorDescription(errorType)}
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="text-left bg-muted p-4 rounded text-sm">
                <summary className="cursor-pointer font-medium">Technical Details</summary>
                <pre className="mt-2 text-xs overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex flex-wrap gap-3 justify-center">
              <Button onClick={this.handleRetry} variant="default">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              
              {this.props.level === 'page' && (
                <>
                  <Button onClick={this.handleGoHome} variant="outline">
                    <Home className="mr-2 h-4 w-4" />
                    Go Home
                  </Button>
                  <Button onClick={this.handleReload} variant="outline">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reload Page
                  </Button>
                </>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Error ID: {this.state.errorId}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }

  private getErrorType(error?: Error): string {
    if (!error) return 'unknown';
    
    const message = error.message.toLowerCase();
    
    if (message.includes('chunk') || message.includes('loading')) return 'chunk';
    if (message.includes('network') || message.includes('fetch')) return 'network';
    if (message.includes('auth') || message.includes('unauthorized')) return 'auth';
    if (message.includes('memory') || message.includes('heap')) return 'memory';
    
    return 'component';
  }

  private getErrorTitle(errorType: string): string {
    switch (errorType) {
      case 'chunk': return 'Loading Error';
      case 'network': return 'Connection Problem';
      case 'auth': return 'Authentication Issue';
      case 'memory': return 'Performance Issue';
      default: return 'Something Went Wrong';
    }
  }

  private getErrorDescription(errorType: string): string {
    switch (errorType) {
      case 'chunk': return 'Failed to load application resources. Please refresh the page.';
      case 'network': return 'Unable to connect to our servers. Please check your internet connection.';
      case 'auth': return 'There was an authentication problem. Please try logging in again.';
      case 'memory': return 'The application is using too much memory. Please refresh the page.';
      default: return 'An unexpected error occurred. Our team has been notified.';
    }
  }

  componentWillUnmount(): void {
    if (this.autoRecoveryTimeout) {
      clearTimeout(this.autoRecoveryTimeout);
    }
  }
}