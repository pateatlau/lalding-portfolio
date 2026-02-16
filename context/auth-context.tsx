'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { upsertVisitorProfile } from '@/actions/resume';
import type { User } from '@supabase/supabase-js';
import type { VisitorProfile } from '@/lib/supabase/types';

type AuthContextType = {
  user: User | null;
  visitorProfile: VisitorProfile | null;
  isLoading: boolean;
  isNewUser: boolean;
  signInWithProvider: (provider: 'google' | 'github' | 'linkedin_oidc') => Promise<void>;
  signOut: () => Promise<void>;
  refreshVisitorProfile: () => Promise<void>;
  clearNewUserFlag: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [visitorProfile, setVisitorProfile] = useState<VisitorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const supabase = createClient();

  const fetchVisitorProfile = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from('visitor_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setVisitorProfile(data);
      return data;
    },
    [supabase]
  );

  const refreshVisitorProfile = useCallback(async () => {
    if (user) {
      await fetchVisitorProfile(user.id);
    }
  }, [user, fetchVisitorProfile]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
      if (currentUser) {
        fetchVisitorProfile(currentUser.id);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (event === 'SIGNED_IN' && currentUser) {
        // Upsert visitor profile via server action
        const result = await upsertVisitorProfile();
        if (result.data) {
          setVisitorProfile(result.data);
          setIsNewUser(result.isNewUser ?? false);
        }
        // Notify pending action listeners that auth is ready
        window.dispatchEvent(
          new CustomEvent('auth:signed-in', {
            detail: { isNewUser: result.isNewUser ?? false },
          })
        );
      } else if (event === 'SIGNED_OUT') {
        setVisitorProfile(null);
        setIsNewUser(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signInWithProvider = useCallback(
    async (provider: 'google' | 'github' | 'linkedin_oidc') => {
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${window.location.pathname}`,
        },
      });
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setVisitorProfile(null);
    setIsNewUser(false);
  }, [supabase]);

  const clearNewUserFlag = useCallback(() => {
    setIsNewUser(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        visitorProfile,
        isLoading,
        isNewUser,
        signInWithProvider,
        signOut,
        refreshVisitorProfile,
        clearNewUserFlag,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
