
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { 
  isMobileDevice, 
  clearAuthStorage, 
  isRefreshTokenError 
} from '@/utils/mobileAuthUtils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  checkAndRecoverSession?: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  checkAndRecoverSession: async () => false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncRetryCount, setSyncRetryCount] = useState(0);
  const { toast } = useToast();

  // Session recovery mechanism
  const checkAndRecoverSession = async () => {
    try {
      logger.log('Auth: Checking session sync status');
      
      // Get current frontend session
      const frontendHasSession = !!session?.access_token;
      
      // Check backend auth state
      let backendAuth = null;
      try {
        const response = await supabase.rpc('debug_auth_state' as any);
        backendAuth = response.data;
      } catch (error) {
        logger.error('Auth: Backend auth check failed:', error);
        backendAuth = null;
      }
      const backendHasSession = !!backendAuth?.auth_uid;
      
      logger.log('Auth: Session sync check', {
        frontend: frontendHasSession,
        backend: backendHasSession,
        syncRetryCount
      });
      
      // If frontend has session but backend doesn't, try to recover
      if (frontendHasSession && !backendHasSession && syncRetryCount < 3) {
        logger.log('Auth: Session desync detected, attempting recovery');
        setSyncRetryCount(prev => prev + 1);
        
        // Force session refresh
        const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
        
        if (error) {
          logger.error('Auth: Session refresh failed:', error);
          // Clear invalid session
          setSession(null);
          setUser(null);
          return false;
        }
        
        if (refreshedSession) {
          logger.log('Auth: Session refreshed successfully');
          setSession(refreshedSession);
          setUser(refreshedSession.user);
          setSyncRetryCount(0);
          return true;
        }
      }
      
      return backendHasSession;
    } catch (error) {
      logger.error('Auth: Session recovery error:', error);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    const handleAuthStateChange = (event: string, session: Session | null) => {
      if (!mounted) return;
      
      logger.log(`Auth state change: ${event}`, { 
        hasSession: !!session, 
        hasUser: !!session?.user,
        sessionId: session?.access_token?.slice(-10) // Last 10 chars for debugging
      });

      if (event === 'SIGNED_OUT' || !session) {
        logger.log('Auth: Clearing user and session state');
        setSession(null);
        setUser(null);
      } else {
        logger.log('Auth: Setting user and session state', { 
          userId: session.user?.id,
          email: session.user?.email 
        });
        setSession(session);
        setUser(session.user);
      }
      
      setLoading(false);
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        logger.log('Auth: Initializing auth state');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          logger.error('Auth: Error getting session', error);
          setSession(null);
          setUser(null);
        } else if (session) {
          logger.log('Auth: Found existing session', { 
            userId: session.user?.id,
            email: session.user?.email,
            sessionId: session.access_token?.slice(-10)
          });
          setSession(session);
          setUser(session.user);
        } else {
          logger.log('Auth: No existing session found');
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        if (!mounted) return;
        logger.error('Auth: Unexpected initialization error:', error);
        setSession(null);
        setUser(null);
      } finally {
        if (mounted) {
          logger.log('Auth: Initialization complete');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);


  const signOut = async () => {
    try {
      logger.log('Auth: Starting sign out process');
      
      // Clear state immediately to prevent UI flicker
      setUser(null);
      setSession(null);
      
      // Check if we have a valid session before attempting sign out
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession) {
        logger.log('Auth: Found active session, signing out from Supabase');
        const { error } = await supabase.auth.signOut({ scope: 'global' });
        
        if (error) {
          // Don't treat session_not_found as a real error since user is already logged out
          if (error.message?.includes('session_not_found') || error.message?.includes('Session not found')) {
            logger.log('Auth: Session already expired/invalid, proceeding with local cleanup');
          } else {
            logger.error('Auth: Sign out error:', error);
            toast({
              title: "Sign out warning",
              description: "There was an issue signing out, but you've been logged out locally.",
              variant: "destructive"
            });
          }
        } else {
          logger.log('Auth: Successfully signed out from Supabase');
        }
      } else {
        logger.log('Auth: No active session found, proceeding with local cleanup');
      }
      
      // Clean up localStorage more aggressively
      await cleanupAuthStorage();
      
      logger.log('Auth: Sign out complete, redirecting to home');
      window.location.href = '/';
      
    } catch (error) {
      logger.error('Auth: Unexpected sign out error:', error);
      
      // Emergency cleanup - still complete the logout locally
      setUser(null);
      setSession(null);
      await cleanupAuthStorage();
      
      toast({
        title: "Signed out",
        description: "You have been signed out locally.",
        variant: "default"
      });
      
      window.location.href = '/';
    }
  };

  const cleanupAuthStorage = async () => {
    try {
      logger.log('Auth: Cleaning up auth storage');
      
      // Clear all Supabase-related localStorage keys
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('supabase.') || 
          key.includes('auth-token') ||
          key.includes('sb-') ||
          key.includes('supabase-auth-token') ||
          key.includes('auth.token')
        )) {
          keysToRemove.push(key);
        }
      }
      
      logger.log('Auth: Removing storage keys:', keysToRemove);
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          logger.error('Auth: Error removing key:', key, e);
        }
      });

      // Also clear sessionStorage
      try {
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.includes('supabase')) {
            sessionStorage.removeItem(key);
          }
        }
      } catch (e) {
        logger.error('Auth: Error clearing sessionStorage:', e);
      }
      
    } catch (storageError) {
      logger.error('Auth: Storage cleanup error:', storageError);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, checkAndRecoverSession }}>
      {children}
    </AuthContext.Provider>
  );
};
