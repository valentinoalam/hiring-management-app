import { useQueryClient } from '@tanstack/react-query';
import { signOut } from 'next-auth/react';

export const useAuth = () => {
  const queryClient = useQueryClient();

  const logout = async () => {
    // Clear semua cache React Query
    queryClient.clear();
    
    // Lakukan logout
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  return { logout };
};