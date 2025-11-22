import Image from "next/image.js";

export default function Index() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4 py-8">
      <div className="flex flex-col items-center justify-center gap-4 max-w-[606px] w-full">
        <Image width={214} height={214}
          src="/illustrations/Verified.svg"
          alt="Success celebration illustration"
          className="w-[214px] h-[214px] object-contain"
        />
        <div className="flex flex-col items-center gap-0 w-full">
          <h1 className="text-[#404040] text-center font-bold text-2xl leading-9 w-full">
            🎉 Your application was sent!
          </h1>
          <p className="text-[#404040] text-center font-normal text-base leading-7 w-full mt-0">
            Congratulations! You&apos;ve taken the first step towards a rewarding career at Rakamin. We look forward to learning more about you during the application process.
          </p>
        </div>
      </div>
    </div>
  );
}
