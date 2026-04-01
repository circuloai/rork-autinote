import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

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
            void queryClient.invalidateQueries();
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

    void initAuth();

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

  const signUp = useCallback(async (email: string, password: string): Promise<{ error: AuthError | null; user: User | null; session: Session | null; needsEmailConfirmation: boolean }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    const needsEmailConfirmation = !error && !!data.user && !data.session;
    console.log('[Auth] SignUp result - user:', data.user?.id, 'session:', !!data.session, 'needsConfirmation:', needsEmailConfirmation);
    
    return { 
      error, 
      user: data.user ?? null, 
      session: data.session ?? null,
      needsEmailConfirmation 
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    console.log('[Auth] Signing in...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error && data.session) {
      console.log('[Auth] Sign in successful, user:', data.session.user.id);
    }
    return { error };
  }, []);

  const signOut = useCallback(async (): Promise<{ error: AuthError | null }> => {
    console.log('[Auth] Signing out...');
    const { error } = await supabase.auth.signOut();
    if (!error) {
      console.log('[Auth] Sign out successful');
      setSession(null);
      setUser(null);
    }
    return { error };
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  }, []);

  const signInWithOAuth = useCallback(async (provider: 'google' | 'apple'): Promise<{ error: Error | null }> => {
    try {
      console.log(`[Auth] Starting ${provider} OAuth...`);
      const redirectUrl = Linking.createURL('/');
      console.log('[Auth] Redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.error(`[Auth] ${provider} OAuth error:`, error);
        return { error };
      }

      if (data?.url) {
        if (Platform.OS === 'web') {
          window.location.href = data.url;
        } else {
          const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
          console.log('[Auth] WebBrowser result:', result.type);

          if (result.type === 'success' && result.url) {
            const url = new URL(result.url);
            const params = new URLSearchParams(url.hash.substring(1));
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (accessToken && refreshToken) {
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              if (sessionError) {
                console.error('[Auth] Session set error:', sessionError);
                return { error: sessionError };
              }
            }
          } else if (result.type === 'cancel' || result.type === 'dismiss') {
            return { error: new Error('Authentication was cancelled') };
          }
        }
      }

      return { error: null };
    } catch (err) {
      console.error(`[Auth] ${provider} OAuth unexpected error:`, err);
      return { error: err instanceof Error ? err : new Error('An unexpected error occurred') };
    }
  }, []);

  return useMemo(() => ({
    session,
    user,
    isLoading,
    isAuthenticated: !!session,
    signUp,
    signIn,
    signOut,
    resetPassword,
    signInWithOAuth,
  }), [session, user, isLoading, signUp, signIn, signOut, resetPassword, signInWithOAuth]);
});
