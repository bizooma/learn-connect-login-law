
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
  const [isSessionRestored, setIsSessionRestored] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const handleAuthStateChange = (event: string, session: Session | null) => {
      if (!mounted) return;
      
      logger.log(`Auth state change: ${event}`, { hasSession: !!session });

      if (event === 'SIGNED_OUT' || !session) {
        setSession(null);
        setUser(null);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        setIsSessionRestored(true);
      }
      
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (!error && session) {
          setSession(session);
          setUser(session?.user ?? null);
          setIsSessionRestored(true);
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

  // More conservative loading state - only consider loaded when both auth is initialized AND session is properly restored
  const actualLoading = loading || !isInitialized || (!isSessionRestored && !!session);

  return (
    <AuthContext.Provider value={{ user, session, loading: actualLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
