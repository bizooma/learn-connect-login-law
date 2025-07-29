// Mobile authentication utilities for handling mobile-specific auth issues
import { logger } from '@/utils/logger';

// Detect if we're on a mobile device
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isIOSSafari = /iPhone|iPad|iPod/i.test(userAgent) && /Safari/i.test(userAgent);
  
  return isMobile || isIOSSafari;
};

// Check if we're in an iOS app context (which can have storage issues)
export const isIOSApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(window.navigator.userAgent);
};

// Clear all auth-related storage
export const clearAuthStorage = (): void => {
  try {
    if (typeof window === 'undefined') return;
    
    const keysToRemove: string[] = [];
    
    // Collect all auth-related keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('supabase.') ||
        key.includes('auth-token') ||
        key.includes('sb-') ||
        key.includes('refresh-token') ||
        key.includes('access-token')
      )) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all auth keys
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        logger.warn(`Failed to remove storage key: ${key}`, error);
      }
    });
    
    // Also try sessionStorage
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.includes('supabase')) {
          sessionStorage.removeItem(key);
        }
      }
    } catch (error) {
      logger.warn('Failed to clear sessionStorage', error);
    }
    
    logger.info('Auth storage cleared successfully');
  } catch (error) {
    logger.error('Failed to clear auth storage', error);
  }
};

// Check if an error is related to refresh token issues
export const isRefreshTokenError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';
  
  return (
    errorMessage.includes('refresh_token_not_found') ||
    errorMessage.includes('invalid_refresh_token') ||
    errorMessage.includes('refresh token') ||
    errorMessage.includes('token_expired') ||
    errorCode.includes('refresh') ||
    errorCode === 'invalid_token'
  );
};

// Check if an error is network-related
export const isNetworkError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  
  return (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('aborted') ||
    error.name === 'NetworkError'
  );
};

// Get mobile-friendly error message
export const getMobileErrorMessage = (error: any): string => {
  if (isRefreshTokenError(error)) {
    return "Your session has expired. Please log in again.";
  }
  
  if (isNetworkError(error)) {
    return "Please check your internet connection and try again.";
  }
  
  // Default mobile-friendly message
  return "Please try logging in again. If the problem persists, try closing and reopening your browser.";
};

// Storage fallback for mobile devices
export const createMobileStorage = () => {
  const isMobile = isMobileDevice();
  
  return {
    getItem: (key: string): string | null => {
      try {
        if (typeof window === 'undefined') return null;
        
        // Try localStorage first
        let value = localStorage.getItem(key);
        
        // If mobile and localStorage fails, try sessionStorage
        if (isMobile && !value) {
          try {
            value = sessionStorage.getItem(key);
          } catch (error) {
            logger.warn('sessionStorage fallback failed', error);
          }
        }
        
        return value;
      } catch (error) {
        logger.warn(`Failed to get item ${key} from storage`, error);
        return null;
      }
    },
    
    setItem: (key: string, value: string): void => {
      try {
        if (typeof window === 'undefined') return;
        
        localStorage.setItem(key, value);
        
        // On mobile, also store in sessionStorage as backup
        if (isMobile) {
          try {
            sessionStorage.setItem(key, value);
          } catch (error) {
            logger.warn('sessionStorage backup failed', error);
          }
        }
      } catch (error) {
        logger.warn(`Failed to set item ${key} in storage`, error);
        
        // If localStorage fails on mobile, try sessionStorage only
        if (isMobile) {
          try {
            sessionStorage.setItem(key, value);
          } catch (fallbackError) {
            logger.error('All storage methods failed', fallbackError);
          }
        }
      }
    },
    
    removeItem: (key: string): void => {
      try {
        if (typeof window === 'undefined') return;
        
        localStorage.removeItem(key);
        
        if (isMobile) {
          try {
            sessionStorage.removeItem(key);
          } catch (error) {
            logger.warn('sessionStorage remove failed', error);
          }
        }
      } catch (error) {
        logger.warn(`Failed to remove item ${key} from storage`, error);
      }
    }
  };
};