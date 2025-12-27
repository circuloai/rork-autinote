import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let subscription: any = null;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Auth session error:', error);
        setSession(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }

      try {
        const { data } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('[Auth] State change:', event, session?.user?.id);
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            console.log('[Auth] User signed in, invalidating queries...');
            queryClient.invalidateQueries();
          } else if (event === 'SIGNED_OUT') {
            console.log('[Auth] User signed out, clearing queries...');
            queryClient.clear();
          }
        });
        subscription = data.subscription;
      } catch (error) {
        console.error('Auth state change listener error:', error);
      }
    };

    initAuth();

    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from auth:', error);
        }
      }
    };
  }, [queryClient]);

  const signUp = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    console.log('[Auth] Signing in...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error && data.session) {
      console.log('[Auth] Sign in successful, user:', data.session.user.id);
    }
    return { error };
  };

  const signOut = async (): Promise<{ error: AuthError | null }> => {
    console.log('[Auth] Signing out...');
    const { error } = await supabase.auth.signOut();
    if (!error) {
      console.log('[Auth] Sign out successful');
      setSession(null);
      setUser(null);
    }
    return { error };
  };

  const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  };

  return {
    session,
    user,
    isLoading,
    isAuthenticated: !!session,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };
});
