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
  const setSessionData = useAuthStore((state) => state.setSessionData);
  const setUser =  useAuthStore((state) => state.setUser);
  const resetAuthStore = useAuthStore((state) => state.reset);
  const userId = session?.user?.id;
  const { data: profile } = useUserProfile(userId || ''); 
  // Get the Zustand setter function
  const setBasicProfile = useFastProfileStore((state) => state.setBasicProfile);

  useEffect(() => {
    if (session) {
      const sessionData = {
          userId: session.user.id,
          // preferences: session.user.preferences, 
      };
      setSessionData(sessionData);
      setUser({
        ...session.user,
        email: session.user.email || undefined,
        role: session.user.role || 'APPLICANT'
      });
    }else {
      // 💡 HANDLE LOGOUT: Session is null, reset the store
      resetAuthStore(); 
    }
  }, [resetAuthStore, session, setSessionData, setUser]);
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
        {/* <ThemeProvider> */}
          {children}
          <Analytics />
          <Toaster />
        {/* </ThemeProvider> */}
      </NextAuthProvider>
  );
}