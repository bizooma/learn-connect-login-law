// Enhanced production-safe logging utility
// Captures essential error details in production while protecting sensitive data

const isDevelopment = import.meta.env.DEV;

// Safe error serialization with size limits
const safeSerializeError = (error: any, maxSize = 1000): string => {
  try {
    if (!error) return 'No error details';
    
    const errorInfo = {
      message: error.message || 'Unknown error',
      stack: isDevelopment ? error.stack : error.stack?.split('\n')[0] || 'Stack unavailable',
      name: error.name || 'Error',
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
    
    const serialized = JSON.stringify(errorInfo);
    return serialized.length > maxSize ? serialized.substring(0, maxSize) + '...' : serialized;
  } catch (e) {
    return `Serialization failed: ${error?.message || 'Unknown error'}`;
  }
};

export const logger = {
  log: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(message, ...args);
    }
  },
  
  error: (message: string, error?: any, context?: Record<string, any>) => {
    // Always log errors with essential details, even in production
    try {
      const errorDetails = safeSerializeError(error);
      const contextInfo = context ? JSON.stringify(context).substring(0, 500) : '';
      
      if (isDevelopment) {
        console.error(message, error, context);
      } else {
        // Production: Log essential info only
        console.error(`${message} | Details: ${errorDetails} | Context: ${contextInfo}`);
      }
    } catch (e) {
      // Fallback if logging fails
      console.error('Logging failed:', e);
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn(message, ...args);
    }
  },
  
  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.info(message, ...args);
    }
  },
  
  debug: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.debug(message, ...args);
    }
  }
};