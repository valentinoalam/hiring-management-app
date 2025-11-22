'use client'
import Image from 'next/image.js'
import React from 'react'
import { Button } from '@/components/ui/button.js'
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation.js';

const JobsNotFound = () => {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-8">
        <Image
          src="/illustrations/no-jobs.svg"
          alt="No job openings"
          width={256}
          height={192}
          className="w-64 h-auto"
        />
      </div>

      <h2 className="heading-m-bold text-neutral-100 mb-2">Job not found</h2>
      <p className="text-m-regular text-neutral-80 mb-6">The job you&apos;re looking for doesn&apos;t exist.</p>
      
      <Button onClick={()=> router.back()} className="mt-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Go Back
    </Button>
    </div>

  )
}

export default JobsNotFound