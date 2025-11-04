// app/auth/verify-request/page.tsx

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // Assuming these are your Shadcn UI components
import Image from 'next/image';

// The component receives an object containing 'searchParams' 
// which is standard for Next.js App Router pages accessing URL queries.
interface VerifyRequestProps {
  searchParams: {
    email?: string; // Auth.js passes the email here
  };
}

// Renamed the function to reflect its use as the page component
function VerifyRequestPage({ searchParams }: VerifyRequestProps) {
  // Extract the email from the query parameters
  const email = searchParams.email || '';
  
  // Custom message for the email display
  const emailDisplay = email 
    ? <b>{email}</b> 
    : <span className="font-semibold">alamat email Anda</span>;

  return (
    <div className="flex justify-center items-center min-h-[80vh] p-4">
      <Card className="min-h-[400px] md:w-[500px] border-neutral-40 bg-neutral-10 p-10">
        <CardHeader className="p-0 pt-8 text-center">
            <CardTitle className="font-bold text-2xl text-neutral-100 mb-3">
                Periksa Email Anda
            </CardTitle>
            
            <CardDescription className="text-neutral-90 text-s px-2">
                {/* Modified content to clearly state the action needed */}
                Kami sudah mengirimkan link sign-in ke {emailDisplay} 
                {email ? ' yang berlaku dalam 30 menit.' : '.'}
            </CardDescription>
            
            <p className="text-neutral-70 text-sm mt-4 px-2">
              Jika Anda tidak melihat email tersebut, periksa folder **Spam** atau **Promosi** Anda.
            </p>

        </CardHeader>
        
        <CardContent className="p-0 mt-8">
            {/* Make sure the image path is correct relative to your public folder */}
            <Image 
                src="/illustrations/pana.svg" 
                alt="email-sent" 
                width={184} 
                height={184} 
                className="mx-auto object-contain" 
            />
        </CardContent>
        {/* Optional: Add a link back to the login page */}
        <div className="text-center mt-6">
            <a 
                href="/login" 
                className="text-blue-600 hover:underline text-sm"
            >
                Kirim ulang email atau kembali ke halaman login
            </a>
        </div>
      </Card>
    </div>
  );
}

export default VerifyRequestPage;