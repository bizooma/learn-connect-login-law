
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
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
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    let initializationComplete = false;

    const handleAuthStateChange = (event: string, session: Session | null) => {
      if (!mounted) return;
      
      try {
        logger.info(`Auth state change: ${event}`, { 
          hasSession: !!session, 
          userId: session?.user?.id,
          expiresAt: session?.expires_at 
        });

        if (event === 'SIGNED_OUT' || !session) {
          setSession(null);
          setUser(null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Additional validation for session stability
          if (session && session.expires_at * 1000 > Date.now() + 30000) { // 30 second buffer
            setSession(session);
            setUser(session?.user ?? null);
            logger.info('Session established successfully', { userId: session.user?.id });
          } else {
            logger.warn('Received session is expired or expires too soon', { 
              expiresAt: session?.expires_at, 
              now: Date.now() / 1000 
            });
            // Don't set an expired session - try to refresh instead
            if (session) {
              supabase.auth.refreshSession().then(({ data, error }) => {
                if (!error && data.session && mounted) {
                  setSession(data.session);
                  setUser(data.session.user);
                } else {
                  logger.error('Failed to refresh expired session', error);
                  setSession(null);
                  setUser(null);
                }
              });
            }
          }
        } else {
          // Validate any other session before setting
          if (session && session.expires_at * 1000 > Date.now() + 30000) {
            setSession(session);
            setUser(session?.user ?? null);
          } else {
            logger.warn('Session validation failed for event', { event, expiresAt: session?.expires_at });
            setSession(null);
            setUser(null);
          }
        }
        
        if (initializationComplete) {
          setLoading(false);
        }
      } catch (error) {
        logger.error('Auth error handling state change:', error);
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    const initializeAuth = async () => {
      try {
        logger.info('Initializing auth...');
        
        // Add retry mechanism for rate limit issues
        let retryCount = 0;
        const maxRetries = 3;
        let session = null;
        let error = null;

        while (retryCount < maxRetries) {
          const response = await supabase.auth.getSession();
          session = response.data?.session;
          error = response.error;

          if (!error) break;
          
          // If rate limited, wait and retry
          if (error.message?.includes('rate limit') || error.message?.includes('429')) {
            retryCount++;
            logger.warn(`Rate limit hit, retrying ${retryCount}/${maxRetries}`, error);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          } else {
            break;
          }
        }
        
        if (!mounted) return;
        
        if (error) {
          logger.error('Auth session error after retries:', error);
          try {
            // Only try refresh if not rate limited
            if (!error.message?.includes('rate limit') && !error.message?.includes('429')) {
              const refreshResponse = await supabase.auth.refreshSession();
              if (!refreshResponse.error && refreshResponse.data.session) {
                session = refreshResponse.data.session;
                error = null;
              }
            }
          } catch (recoveryError) {
            logger.error('Auth recovery failed:', recoveryError);
            setSession(null);
            setUser(null);
          }
        }

        if (!error && session) {
          // Validate session with buffer time (5 minutes)
          const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
          const sessionExpiry = session.expires_at * 1000;
          const now = Date.now();
          
          if (sessionExpiry > now + bufferTime) {
            setSession(session);
            setUser(session?.user ?? null);
            logger.info('Valid session found', { 
              userId: session.user?.id, 
              expiresIn: Math.round((sessionExpiry - now) / 1000 / 60) + ' minutes'
            });
          } else if (sessionExpiry > now) {
            // Session expires soon, try to refresh
            logger.info('Session expires soon, attempting refresh');
            try {
              const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
              if (!refreshError && refreshedSession) {
                setSession(refreshedSession);
                setUser(refreshedSession.user);
                logger.info('Session refreshed successfully');
              } else {
                logger.warn('Session refresh failed', refreshError);
                setSession(null);
                setUser(null);
              }
            } catch (refreshError) {
              logger.error('Auth refresh error:', refreshError);
              setSession(null);
              setUser(null);
            }
          } else {
            logger.warn('Session already expired, clearing');
            setSession(null);
            setUser(null);
          }
        } else {
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        if (!mounted) return;
        
        logger.error('Auth initialization error:', error);
        setSession(null);
        setUser(null);
      } finally {
        if (mounted) {
          initializationComplete = true;
          setIsInitialized(true);
          setLoading(false);
          logger.info('Auth initialization complete');
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
      setUser(null);
      setSession(null);
      
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        logger.error('Sign out error:', error);
        toast({
          title: "Sign out warning",
          description: "There was an issue signing out, but you've been logged out locally.",
          variant: "destructive"
        });
      }
      
      // Clean up localStorage
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.startsWith('supabase.') || 
            key.includes('auth-token') ||
            key.includes('sb-') ||
            key.includes('supabase-auth-token')
          )) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (storageError) {
        logger.error('Storage cleanup error:', storageError);
      }
      
      window.location.href = '/';
      
    } catch (error) {
      logger.error('Unexpected sign out error:', error);
      
      // Emergency cleanup
      try {
        setUser(null);
        setSession(null);
        
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('supabase.') || key.includes('auth-token'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (cleanupError) {
        logger.error('Emergency cleanup error:', cleanupError);
      }
      
      toast({
        title: "Sign out error",
        description: "An unexpected error occurred during sign out.",
        variant: "destructive"
      });
      
      window.location.href = '/';
    }
  };

  const actualLoading = loading || !isInitialized;

  return (
    <AuthContext.Provider value={{ user, session, loading: actualLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
