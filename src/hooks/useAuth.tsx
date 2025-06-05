
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

    const handleAuthStateChange = (event: string, session: Session | null) => {
      if (!mounted) return;
      
      console.log('Auth state changed:', event, {
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email
      });
      
      try {
        if (event === 'SIGNED_OUT' || !session) {
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
        
        // Only set loading to false after we've processed the auth state
        if (initializationComplete) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error handling auth state change:', error);
        // On error, clear state and stop loading
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    };

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Then get initial session
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting initial session:', error);
          setSession(null);
          setUser(null);
        } else {
          console.log('Initial session loaded:', {
            hasSession: !!session,
            hasUser: !!session?.user,
            userEmail: session?.user?.email
          });
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        if (!mounted) return;
        
        console.error('Session initialization error:', error);
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
      console.log('Starting sign out process');
      setLoading(true);
      
      // Sign out from Supabase with global scope to clear all sessions
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
      
      console.log('Successfully signed out from Supabase');
      
      // Force clear all Supabase-related localStorage items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('supabase.') || key.includes('auth-token'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('Cleared localStorage items:', keysToRemove);
      
      // Clear local state
      setUser(null);
      setSession(null);
      
      // Force a full page reload to clear all cached state
      console.log('Forcing page reload to clear all cached state');
      window.location.replace('/');
      
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      
      // Even if there's an error, force clear everything
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('supabase.') || key.includes('auth-token'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      setUser(null);
      setSession(null);
      
      // Force reload even on error
      window.location.replace('/');
    } finally {
      setLoading(false);
    }
  };

  // Show loading until auth is properly initialized
  const actualLoading = loading || !isInitialized;

  return (
    <AuthContext.Provider value={{ user, session, loading: actualLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
