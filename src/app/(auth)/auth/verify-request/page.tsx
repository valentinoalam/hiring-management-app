import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from 'next/image';

// 1. Define the standard type for App Router Page Props
// The searchParams key needs to accept the standard structure (string | string[])
interface VerifyRequestPageProps {
  // The 'params' object is usually for dynamic routes like /posts/[slug]
  params: object; 
  // 'searchParams' is for URL query parameters like ?email=...
  searchParams: { 
    email?: string | string[]; // Auth.js passes 'email' as a string
    // You can add other expected query params here
    [key: string]: string | string[] | undefined; 
  };
}

function VerifyRequestPage({ searchParams }: VerifyRequestPageProps) {
  // Extract the email. If it's an array (which shouldn't happen here), take the first element.
  const emailParam = searchParams.email;
  const email = Array.isArray(emailParam) ? emailParam[0] : emailParam || '';
  
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
                Kami sudah mengirimkan link sign-in ke {emailDisplay} 
                {email ? ' yang berlaku dalam 30 menit.' : '.'}
            </CardDescription>
            
            <p className="text-neutral-70 text-sm mt-4 px-2">
              Jika Anda tidak melihat email tersebut, periksa folder **Spam** atau **Promosi** Anda.
            </p>

        </CardHeader>
        
        <CardContent className="p-0 mt-8">
            <Image 
                src="/illustrations/pana.svg" 
                alt="email-sent" 
                width={184} 
                height={184} 
                className="mx-auto object-contain" 
            />
        </CardContent>
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