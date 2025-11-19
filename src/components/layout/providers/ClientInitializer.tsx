"use client";

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { Session } from 'next-auth';
import { NextAuthProvider } from './next-auth-provider';
import { Analytics } from '@vercel/analytics/next';
import { Toaster } from 'sonner';
import { useUserProfile } from '@/hooks/queries/application-queries';
import { useFastProfileStore } from '@/stores/fast-profile-store';

interface ClientInitializerProps {
  session: Session | null;
  children: ReactNode;
}

export default function ClientInitializer({ session, children }: ClientInitializerProps) {
  const setAuthData = useAuthStore((state) => state.setAuthData);
  const setProfile = useAuthStore((state) => state.setProfile);
  const setIsLoading = useAuthStore((state) => state.setIsLoading);
  const resetAuthStore = useAuthStore((state) => state.reset);
  
  const userId = session?.user?.id;
  const { data: profile, isLoading: profileLoading } = useUserProfile(userId || ''); 
  
  const setBasicProfile = useFastProfileStore((state) => state.setBasicProfile);

  // Handle authentication state
  useEffect(() => {
    if (session?.user) {
      const userData = {
        ...session.user,
        email: session.user.email || undefined,
        role: session.user.role || 'APPLICANT'
      };
      
      // Set auth data immediately with user, profile will be updated later
      setAuthData(userData, null);
    } else {
      // No session means user is not authenticated
      resetAuthStore();
    }
  }, [session, setAuthData, resetAuthStore]);

  // Handle profile data when it's loaded
  useEffect(() => {
    if (profile) {
      // Update auth store with profile
      setProfile(profile);
      
      // Update fast profile store
      const { fullname, avatarUrl } = profile; 
      setBasicProfile({ 
        fullname: fullname || 'User',
        avatarUrl: avatarUrl || null 
      });
    }
  }, [profile, setProfile, setBasicProfile]);

  // Handle loading state
  useEffect(() => {
    // If we have a session decision AND profile is done loading (or not needed)
    const authLoading = !session; // Still determining auth state
    const shouldBeLoading = authLoading || (session?.user && profileLoading);
    
    setIsLoading(shouldBeLoading);
  }, [session, profileLoading, setIsLoading]);

  return (
    <NextAuthProvider session={session}>  
      {children}
      <Analytics />
      <Toaster />
    </NextAuthProvider>
  );
}