import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { resendVerificationEmail } from './action';

// No need to define props interface - Next.js handles this automatically
// The params and searchParams are now Promises

async function VerifyRequestPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  // Await the searchParams Promise
  const params = await searchParams;
  
  // Extract the email
  const emailParam = params.email;
  const email = Array.isArray(emailParam) ? emailParam[0] : emailParam || '';

  // Server action to handle resend
  async function handleResend() {
    'use server';
    
    if (!email) {
      console.error('Email is required for resending verification');
      return;
    }

    try {
      await resendVerificationEmail(email);
    } catch (error) {
      console.error("Resend verification error:", error);
    }
  }

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
              Jika Anda tidak melihat email tersebut, periksa folder <strong>Spam</strong> atau <strong>Promosi</strong> Anda.
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
        
        <div className="text-center mt-6 space-y-4">
          {email && (
            <form action={handleResend}>
              <Button 
                type="submit"
                variant="outline"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
              >
                Kirim Ulang Email Verifikasi
              </Button>
            </form>
          )}
          
          <div>
            <a 
              href="/login" 
              className="text-blue-600 hover:underline text-sm block mt-2"
            >
              Kembali ke halaman login
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default VerifyRequestPage;