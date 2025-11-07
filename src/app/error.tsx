'use client' 

import { useEffect } from 'react'

// Define the type for the component props for better type safety
interface ErrorComponentProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Next.js Error Boundary Component
 * This is automatically rendered when a critical error occurs in a nested segment.
 */
export default function ErrorBoundary({ error, reset }: ErrorComponentProps) {
  
  // 1. Log the error for internal diagnostics.
  // This should ideally be replaced with or supplemented by an external error reporting service.
  useEffect(() => {
    console.error('Critical Client Error:', error);
    // You could also call a service here: reportErrorToSentry(error);
  }, [error]);

  return (
    <div 
      className="flex items-center justify-center overflow-y-auto no-scrollbar"
      role="alert" // ARIA role to announce this as an important status message
      aria-live="assertive" // Ensures screen readers announce the content immediately
    >
      <div className="fixed max-w-md w-full top-1/5 left-1/2 -translate-x-1/2 space-y-4 p-8 bg-danger-foreground dark:bg-gray-800 rounded-lg shadow-xl border border-danger-border">
        
        {/* Visual Cue for Error */}
        <div className="flex items-center justify-center">
          <svg className="w-12 h-12 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        </div>

        {/* Primary Heading */}
        <h1 className="text-2xl font-extrabold text-danger dark:text-red-400 text-center leading-tight tracking-tight">
          Oops! Something went critically wrong.
        </h1>

        {/* Detailed Error Message (More user-friendly text) */}
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          We&apos;ve hit an unexpected roadblock. This part of the page couldn&apos;t load.
        </p>

        {/* Technical Detail (Optional, but good for reporting) */}
        <div className="bg-red-50 dark:bg-gray-700 p-3 rounded-md border border-red-100 dark:border-gray-600">
            <p className="text-xs font-mono text-danger-pressed truncate">
                {/* Displaying the error message to the user is often helpful for debugging, but we'll limit it's size */}
                **Error Details:** {error.message || 'Unknown error occurred.'}
            </p>
        </div>
        
        {/* Recovery Action Button */}
        <div className="flex justify-center">
          <button
            className="w-full sm:w-auto px-6 py-3 bg-danger hover:bg-danger-hover text-danger-surface font-semibold rounded-lg shadow-md hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-danger-focus focus:ring-opacity-50 transition duration-150 ease-in-out active:bg-danger-pressed"
            onClick={() => {
                console.log('Attempting to reset error boundary...');
                reset(); // Call the Next.js function to attempt re-rendering the segment
            }}
          >
            🔄 Reload Component (Try Again)
          </button>
        </div>

        {/* Secondary Action/Help */}
        <div className="text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                If this keeps happening, please try refreshing the **entire page** or contact support.
            </p>
        </div>
      </div>
    </div>
  )
}