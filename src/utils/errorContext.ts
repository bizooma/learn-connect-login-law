// Error context service for capturing app state and user info

interface ErrorContext {
  userId?: string;
  userRole?: string;
  currentRoute: string;
  timestamp: string;
  browserInfo: {
    userAgent: string;
    url: string;
    referrer: string;
    viewport: string;
  };
  appState?: Record<string, any>;
}

export const captureErrorContext = (additionalContext?: Record<string, any>): ErrorContext => {
  try {
    // Get auth state safely (will be enhanced when auth store is available)
    let userId: string | undefined;
    let userRole: string | undefined;
    
    // TODO: Integrate with actual auth system
    // For now, capture what we can from the environment

    return {
      userId,
      userRole,
      currentRoute: window.location.pathname,
      timestamp: new Date().toISOString(),
      browserInfo: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer,
        viewport: `${window.innerWidth}x${window.innerHeight}`
      },
      appState: additionalContext
    };
  } catch (error) {
    // Fallback context if capture fails
    return {
      currentRoute: window.location.pathname || 'unknown',
      timestamp: new Date().toISOString(),
      browserInfo: {
        userAgent: 'unknown',
        url: window.location.href || 'unknown',
        referrer: 'unknown',
        viewport: 'unknown'
      }
    };
  }
};

// Error breadcrumb tracking
class ErrorBreadcrumbs {
  private breadcrumbs: Array<{ message: string; timestamp: string; level: string }> = [];
  private maxBreadcrumbs = 10;

  add(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    this.breadcrumbs.push({
      message,
      timestamp: new Date().toISOString(),
      level
    });

    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  get() {
    return [...this.breadcrumbs];
  }

  clear() {
    this.breadcrumbs = [];
  }
}

export const errorBreadcrumbs = new ErrorBreadcrumbs();