"use client";

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { Session } from 'next-auth';
import { ThemeProvider } from 'next-themes';
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
  const setSessionData = useAuthStore((state) => state.setSessionData);
  const userId = session?.user?.id;
  const { data: profile } = useUserProfile(userId || ''); 
  // Get the Zustand setter function
  const setBasicProfile = useFastProfileStore((state) => state.setBasicProfile);

  useEffect(() => {
    const sessionData = session?.user
      ? {
          userId: session.user.id,
          // preferences: session.user.preferences, // Data is already in the JWT! No DB call needed.
        }
      : null;
    // This runs once on the client after hydration
    if (sessionData) {
      setSessionData(sessionData);
    }
  }, [session, setSessionData]);
  useEffect(() => {
    if (profile) {
      // 3. Destructure the key pieces you want to store in Zustand
      const { fullname, avatarUrl } = profile; 
      
      setBasicProfile({ 
        fullname: fullname || 'User', // Provide a fallback
        avatarUrl: avatarUrl || null 
      });
    }
  }, [profile, setBasicProfile]); // This effect re-runs only when 'profile' data changes

  return (

      <NextAuthProvider session={session}>  
        <ThemeProvider>
          {children}
          <Analytics />
          <Toaster />
        </ThemeProvider>
      </NextAuthProvider>
  );
}