import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.js"
import Image from 'next/image.js'
function LinkSentSuccess({email}: {email: string}) {
  return (
    <Card className="min-h-[400px] md:w-[500px] border-neutral-40 bg-neutral-10 p-10">
        <CardHeader className="p-0 pt-8 text-center">
            <CardTitle className="font-bold text-2xl text-neutral-100 mb-3">
                Periksa Email Anda
            </CardTitle>
            <CardDescription className="text-neutral-90 text-s px-2">
                Kami sudah mengirimkan link register ke <b>{email || "dityo@rakamin.com"}</b> yang berlaku dalam <b>30 menit</b>
            </CardDescription>

        </CardHeader>
        
        <CardContent className="p-0 mt-8">
            <Image src="/illustrations/pana.svg" alt="email-sent" width={184} height={184} className="mx-auto object-contain" />
        </CardContent>
    </Card>
  )
}

export default LinkSentSuccess