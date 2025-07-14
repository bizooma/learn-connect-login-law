
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
        if (event === 'SIGNED_OUT' || !session) {
          setSession(null);
          setUser(null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(session);
          setUser(session?.user ?? null);
          
        } else {
          setSession(session);
          setUser(session?.user ?? null);
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
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          logger.error('Auth session error:', error);
          try {
            await supabase.auth.refreshSession();
          } catch (recoveryError) {
            logger.error('Auth recovery failed:', recoveryError);
            setSession(null);
            setUser(null);
          }
        } else {
          // Validate session is not expired
          if (session && session.expires_at * 1000 > Date.now()) {
            setSession(session);
            setUser(session?.user ?? null);
          } else if (session) {
            try {
              const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
              if (!refreshError && refreshedSession) {
                setSession(refreshedSession);
                setUser(refreshedSession.user);
              } else {
                setSession(null);
                setUser(null);
              }
            } catch (refreshError) {
              logger.error('Auth refresh error:', refreshError);
              setSession(null);
              setUser(null);
            }
          } else {
            setSession(null);
            setUser(null);
          }
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
