import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';

export const [AuthProvider, useAuth] = createContextHook(() => {
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
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
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
  }, []);

  const signUp = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async (): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signOut();
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
