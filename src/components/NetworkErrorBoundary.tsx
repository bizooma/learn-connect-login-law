import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasNetworkError: boolean;
  isOffline: boolean;
}

class NetworkErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasNetworkError: false,
    isOffline: !navigator.onLine,
  };

  private handleOnline = () => {
    console.log('🌐 Network: Back online');
    this.setState({ isOffline: false, hasNetworkError: false });
  };

  private handleOffline = () => {
    console.log('🚫 Network: Gone offline');
    this.setState({ isOffline: true, hasNetworkError: true });
  };

  public componentDidMount() {
    console.log('🌐 NetworkErrorBoundary: Initial network status:', {
      online: navigator.onLine,
      connection: (navigator as any).connection?.effectiveType
    });

    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // Check for network errors in fetch requests - but ignore diagnostic calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok && response.status >= 500) {
          const url = args[0]?.toString() || '';
          // Don't trigger error for diagnostic API calls
          if (!url.includes('googleapis.com') && !url.includes('diagnostic')) {
            console.error('🌐 Network: Server error detected:', response.status);
            if (response.status === 502 || response.status === 503 || response.status === 504) {
              this.setState({ hasNetworkError: true });
            }
          }
        }
        return response;
      } catch (error) {
        const url = args[0]?.toString() || '';
        // Don't trigger error for diagnostic API calls
        if (!url.includes('googleapis.com') && !url.includes('diagnostic')) {
          console.error('🌐 Network: Fetch error detected:', error);
          if (error instanceof TypeError && error.message.includes('fetch')) {
            this.setState({ hasNetworkError: true });
          }
        }
        throw error;
      }
    };
  }

  public componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  private handleRetry = () => {
    this.setState({ hasNetworkError: false });
    window.location.reload();
  };

  public render() {
    if (this.state.isOffline || this.state.hasNetworkError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-100 p-4">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌐</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {this.state.isOffline ? 'No Internet Connection' : 'Network Error'}
              </h2>
              <p className="text-gray-600 mb-4">
                {this.state.isOffline 
                  ? 'Please check your internet connection and try again.'
                  : 'Unable to connect to our servers. Please try again.'}
              </p>
            </div>
            
            <Button
              onClick={this.handleRetry}
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default NetworkErrorBoundary;