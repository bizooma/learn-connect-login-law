
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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

  useEffect(() => {
    let mounted = true;
    let initializationComplete = false;

    console.log('Auth: Starting initialization');

    const handleAuthStateChange = (event: string, session: Session | null) => {
      if (!mounted) {
        console.log('Auth: Component unmounted, ignoring state change');
        return;
      }
      
      console.log('Auth: State changed', { 
        event, 
        hasSession: !!session, 
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        sessionExpiry: session?.expires_at
      });
      
      try {
        if (event === 'SIGNED_OUT' || !session) {
          console.log('Auth: User signed out or no session');
          setSession(null);
          setUser(null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log('Auth: User signed in or token refreshed');
          setSession(session);
          setUser(session?.user ?? null);
        } else {
          console.log('Auth: Other auth event, updating session');
          setSession(session);
          setUser(session?.user ?? null);
        }
        
        // Only set loading to false after we've processed the auth state and initialization is complete
        if (initializationComplete) {
          console.log('Auth: Setting loading to false');
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth: Error handling auth state change:', error);
        // On error, clear state and stop loading
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    };

    // Set up auth state listener FIRST (critical for session recovery)
    console.log('Auth: Setting up auth state listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Then get initial session
    const initializeAuth = async () => {
      try {
        console.log('Auth: Getting initial session');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) {
          console.log('Auth: Component unmounted during initialization');
          return;
        }
        
        if (error) {
          console.error('Auth: Error getting initial session:', error);
          // Try to recover from session errors
          try {
            console.log('Auth: Attempting session recovery');
            await supabase.auth.refreshSession();
          } catch (recoveryError) {
            console.error('Auth: Session recovery failed:', recoveryError);
            setSession(null);
            setUser(null);
          }
        } else {
          console.log('Auth: Initial session loaded', {
            hasSession: !!session,
            hasUser: !!session?.user,
            userEmail: session?.user?.email,
            sessionValid: session ? new Date(session.expires_at * 1000) > new Date() : false
          });
          
          // Validate session is not expired
          if (session && session.expires_at * 1000 > Date.now()) {
            setSession(session);
            setUser(session?.user ?? null);
          } else if (session) {
            console.log('Auth: Session expired, attempting refresh');
            try {
              const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
              if (!refreshError && refreshedSession) {
                console.log('Auth: Session refreshed successfully');
                setSession(refreshedSession);
                setUser(refreshedSession.user);
              } else {
                console.log('Auth: Session refresh failed, clearing session');
                setSession(null);
                setUser(null);
              }
            } catch (refreshError) {
              console.error('Auth: Session refresh error:', refreshError);
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
        
        console.error('Auth: Session initialization error:', error);
        setSession(null);
        setUser(null);
      } finally {
        if (mounted) {
          initializationComplete = true;
          setIsInitialized(true);
          setLoading(false);
          console.log('Auth: Initialization complete');
        }
      }
    };

    initializeAuth();

    return () => {
      console.log('Auth: Cleaning up auth listener');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      console.log('Auth: Starting sign out process');
      
      // Clear local state first to prevent errors during sign out
      setUser(null);
      setSession(null);
      
      // Sign out from Supabase with enhanced cleanup
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('Auth: Error signing out:', error);
        // Don't throw error, just log it and continue with cleanup
      }
      
      console.log('Auth: Successfully signed out from Supabase');
      
      // Enhanced localStorage cleanup - remove all Supabase-related items
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
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
          console.log('Auth: Removed localStorage key:', key);
        });
      } catch (storageError) {
        console.error('Auth: Error clearing localStorage:', storageError);
      }
      
      // Navigate to home page
      console.log('Auth: Navigating to home page');
      window.location.href = '/';
      
    } catch (error) {
      console.error('Auth: Unexpected error during sign out:', error);
      
      // Even if there's an error, force clear everything and redirect
      try {
        setUser(null);
        setSession(null);
        
        // Emergency cleanup
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('supabase.') || key.includes('auth-token'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (cleanupError) {
        console.error('Auth: Error during emergency cleanup:', cleanupError);
      }
      
      // Force redirect even on error
      window.location.href = '/';
    }
  };

  // Show loading until auth is properly initialized
  const actualLoading = loading || !isInitialized;

  console.log('Auth: Rendering provider', { 
    hasUser: !!user, 
    hasSession: !!session, 
    loading: actualLoading 
  });

  return (
    <AuthContext.Provider value={{ user, session, loading: actualLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
