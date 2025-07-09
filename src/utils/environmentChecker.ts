// Environment and dependency checker for production issues
export const checkEnvironment = () => {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: {
      hostname: window.location.hostname,
      origin: window.location.origin,
      pathname: window.location.pathname,
      userAgent: navigator.userAgent,
      cookieEnabled: navigator.cookieEnabled,
      language: navigator.language,
      platform: navigator.platform,
      onLine: navigator.onLine
    },
    browser: {
      localStorage: typeof localStorage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',
      indexedDB: typeof indexedDB !== 'undefined',
      webGL: !!window.WebGLRenderingContext,
      serviceWorker: 'serviceWorker' in navigator
    },
    features: {
      fetch: typeof fetch !== 'undefined',
      promises: typeof Promise !== 'undefined',
      dynamicImport: typeof (window as any).import !== 'undefined',
      customElements: typeof customElements !== 'undefined'
    },
    performance: {
      timing: (performance as any).timing ? {
        domContentLoaded: (performance as any).timing.domContentLoadedEventEnd - (performance as any).timing.navigationStart,
        loadComplete: (performance as any).timing.loadEventEnd - (performance as any).timing.navigationStart
      } : null,
      memory: (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null
    }
  };

  console.group('🔍 Environment Diagnostic Report');
  console.log('Environment:', checks.environment);
  console.log('Browser Features:', checks.browser);
  console.log('JavaScript Features:', checks.features);
  console.log('Performance:', checks.performance);
  console.groupEnd();

  return checks;
};

export const checkExternalDependencies = async () => {
  const dependencies = [];

  // Check Supabase connectivity
  try {
    const response = await fetch('https://zloqccxqgatkpnngeqbq.supabase.co/rest/v1/', {
      method: 'HEAD',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsb3FjY3hxZ2F0a3BubmdlcWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MzA5NjcsImV4cCI6MjA2NDIwNjk2N30.S2lE3tTqtW4AI8ER7BxWeXvYe56p7YEFPKQrG8WYcks'
      }
    });
    dependencies.push({
      name: 'Supabase API',
      status: response.ok ? 'connected' : 'error',
      statusCode: response.status,
      responseTime: performance.now()
    });
  } catch (error) {
    dependencies.push({
      name: 'Supabase API',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Check YouTube API (if needed) - Skip to avoid CORS issues
  dependencies.push({
    name: 'YouTube API',
    status: 'skipped',
    note: 'Skipped to avoid CORS issues in diagnostic'
  });

  console.group('🌐 External Dependencies Check');
  dependencies.forEach(dep => {
    console.log(`${dep.name}:`, dep);
  });
  console.groupEnd();

  return dependencies;
};

export const runFullDiagnostic = async () => {
  console.log('🚀 Running full diagnostic...');
  
  const environment = checkEnvironment();
  const dependencies = await checkExternalDependencies();
  
  const diagnostic = {
    timestamp: new Date().toISOString(),
    environment,
    dependencies,
    summary: {
      criticalIssues: dependencies.filter(d => d.status === 'failed').length,
      warnings: dependencies.filter(d => d.status === 'error').length,
      overall: dependencies.every(d => ['connected', 'available'].includes(d.status)) ? 'healthy' : 'issues'
    }
  };

  console.group('📋 Full Diagnostic Summary');
  console.log('Overall Status:', diagnostic.summary.overall);
  console.log('Critical Issues:', diagnostic.summary.criticalIssues);
  console.log('Warnings:', diagnostic.summary.warnings);
  console.groupEnd();

  return diagnostic;
};