'use client';

import { useSearchParams } from 'next/navigation.js';
import { TriangleAlert } from 'lucide-react'; // Assuming you use lucide-react for icons

// Map NextAuth.js error codes to user-friendly messages
const errorMap = {
  Signin: 'Try signing in with a different account.',
  OAuthSignin: 'Try signing in with a different account.',
  OAuthCallback: 'Try signing in with a different account.',
  OAuthCreateAccount: 'Try signing in with a different account.',
  EmailCreateAccount: 'The email address is already associated with an account using a different method.',
  Callback: 'Check your network connection and try again.',
  OAuthAccountNotLinked: 'This email is already registered with a different provider (e.g., Google or Email). Sign in with that method first.',
  EmailSignin: 'The sign-in link is no longer valid. Request a new link.',
  CredentialsSignin: 'Sign in failed. Check your email and password.',
  SessionRequired: 'Please sign in to access this page.',
  default: 'An unexpected error occurred. Please try again.',
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') as keyof typeof errorMap | 'default';

  // Get the appropriate message, falling back to the default message
  const errorMessage = errorMap[error] ?? errorMap.default;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-6 shadow-xl">
        
        {/* Error Header */}
        <div className="flex items-center space-x-3 text-red-600">
          <TriangleAlert className="h-6 w-6" />
          <h1 className="text-xl font-bold tracking-tight">
            Authentication Error
          </h1>
        </div>
        
        {/* Error Message */}
        <p className="text-gray-700">
          {errorMessage}
        </p>

        {/* Optional: Show original error code for debugging (in development only) */}
        {process.env.NODE_ENV === 'development' && error !== 'default' && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            <p className="font-medium">Error Code: {error}</p>
          </div>
        )}
        
        {/* Call to Action */}
        <a 
          href="/login" 
          className="inline-block w-full rounded-md bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Go back to Login
        </a>
      </div>
    </div>
  );
}