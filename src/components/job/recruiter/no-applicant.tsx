import { Button } from '@/components/ui/button.js'
import Image from 'next/image.js'
import React from 'react'

const NoApplicantsHero = ({onUseMock}: {onUseMock: () => void}) => {

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-8">
        <Image
          src="/illustrations/no-candidates.svg"
          alt="No job openings"
          width={276}
          height={260}
          className="w-69 h-65"
        />
      </div>

      <h2 className="heading-m-bold font-bold text-neutral-100 mb-2">No candidates found</h2>
      <p className="text-m-regular text-m text-neutral-70 mb-6">Share your job vacancies so that more candidates will apply.</p>
      <Button variant={'outline'} onClick={onUseMock}
        className="absolute top-5 right-5 flex items-center justify-center text-s font-medium leading-7 transition-colors active:bg-secondary-pressed text-neutral-80 rounded-lg"
      >
        Mock data View
      </Button>
    </div>

  )
}

export default NoApplicantsHero