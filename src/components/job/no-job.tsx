import Image from 'next/image'
import React from 'react'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react';

const NoData = () => {
  const { data: session } = useSession();
  const user = session?.user;
  const userRole = user?.role;
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

      <h2 className="heading-m-bold text-neutral-100 mb-2">No job openings available</h2>
      <p className="text-m-regular text-neutral-80 mb-6">Create a job opening now and start the candidate process.</p>
      
      {userRole === 'RECRUITER' && (
        <Button 
          onClick={() => {}}
          className="bg-secondary-main hover:bg-secondary-hover active:bg-secondary-pressed text-m-bold text-black px-8 h-11 rounded-lg"
        >
          Create a new job
        </Button>
      )}
    </div>

  )
}

export default NoData