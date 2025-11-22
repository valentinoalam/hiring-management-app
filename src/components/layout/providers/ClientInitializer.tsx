"use client";

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store.js';
import { Session } from 'next-auth';
import { NextAuthProvider } from './next-auth-provider';
import { Analytics } from '@vercel/analytics/next';
import { Toaster } from 'sonner';
import { useUserProfile } from '@/hooks/queries/application-queries';
import { useFastProfileStore } from '@/stores/fast-profile-store.js';
import { useQueryClient } from '@tanstack/react-query';

interface ClientInitializerProps {
  session: Session | null;
  children: ReactNode;
}

export default function ClientInitializer({ session, children }: ClientInitializerProps) {
  const setAuthData = useAuthStore((state) => state.setAuthData);
  const setProfile = useAuthStore((state) => state.setProfile);
  const setIsLoading = useAuthStore((state) => state.setIsLoading);
  const resetAuthStore = useAuthStore((state) => state.reset);
  const queryClient = useQueryClient();
  const userId = session?.user?.id;
  const { data: profile, isLoading: profileLoading } = useUserProfile(userId || ''); 
  
  const setBasicProfile = useFastProfileStore((state) => state.setBasicProfile);

  // Main auth state management
  useEffect(() => {
    console.log('Session changed:', session ? 'Authenticated' : 'Not authenticated');
    
    if (session?.user) {
      const userData = {
        ...session.user,
        email: session.user.email || undefined,
        role: session.user.role || 'APPLICANT'
      };
      
      // Set auth data immediately with user
      setAuthData(userData, null);
      console.log('Auth store updated with user data');
    } else {
      // No session - user is signed out
      resetAuthStore();
      console.log('Auth store reset - user signed out');
    }
  }, [session, setAuthData, resetAuthStore]);

  // Handle profile data
  useEffect(() => {
    if (profile && session?.user) {
      // Only update profile if user is authenticated
      setProfile(profile);
      
      const { fullname, avatarUrl } = profile; 
      setBasicProfile({ 
        fullname: fullname || 'User',
        avatarUrl: avatarUrl || null 
      });
      console.log('Profile data updated');
    }
  }, [profile, session, setProfile, setBasicProfile]);

  // Handle loading state - SIMPLIFIED
  useEffect(() => {
    // If session is null (definitely not authenticated), we're not loading
    if (session === null) {
      setIsLoading(false);
      queryClient.clear();
      return;
    }

    // If we have a session and user ID, check if profile is still loading
    if (session?.user?.id) {
      setIsLoading(profileLoading);
    } else {
      // Session exists but no user ID (shouldn't happen normally)
      setIsLoading(false);
    }
  }, [session, profileLoading, setIsLoading, queryClient]);

  return (
    <NextAuthProvider session={session}>  
      {children}
      <Analytics />
      <Toaster />
    </NextAuthProvider>
  );
}