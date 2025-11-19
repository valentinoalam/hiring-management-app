'use client';

import { signOut } from "next-auth/react";
import { useEffect } from "react";

export default function SignOutPage() {
  useEffect(() => {
    // Auto sign out when page loads
    signOut({ 
      callbackUrl: '/jobs' 
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-4">Signing you out...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
}