'use client'
import React, { useState, useMemo, lazy, Suspense } from 'react';
import { Search, Loader2 } from 'lucide-react'; // Using Lucide icons for aesthetics
import { Job } from '@/types/job.js';
import Image from 'next/image';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.js';
import { Input } from '@/components/ui/input.js';
import { Button } from '@/components/ui/button.js';
import { ScrollArea } from '@/components/ui/scroll-area.js';

const LazyJobCard = lazy(() => import('./job-card'));

const JobList = ({ jobs, onCreateJob } : { jobs: Job[], onCreateJob: () => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleJobsCount, setVisibleJobsCount] = useState(10); // Start with 10 jobs visible

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    // Check if user is near the bottom (within 200px)
    if (scrollHeight - scrollTop - clientHeight < 200) {
      // Load 5 more jobs
      if (visibleJobsCount < jobs.length) {
        setVisibleJobsCount((prevCount) => Math.min(prevCount + 5, jobs.length));
      }
    }
  };

  const filteredJobs = useMemo(() => {
    if (!searchTerm) return jobs;
    return jobs.filter((job: Job) =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.companyName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [jobs, searchTerm]);


  return (
    <div className="max-w-7xl mx-auto px-6 pt-4">
      <div className="relative flex flex-col lg:flex-row gap-8"> {/* Set height for the main container */}
        
        {/* LEFT COLUMN: Job Listings (Scrollable) */}
        <div className="flex flex-1 flex-col gap-6 min-w-0">
          <div className="flex flex-col gap-4">
            <div className="relative flex items-center">
              <Input suppressHydrationWarning
                type="text"
                placeholder="Search by job details (50 mock jobs loaded)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 w-full rounded-xl border-2 border-neutral-20 bg-white px-4 pr-12 text-base leading-6 text-gray-700 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-shadow"
              />
              <Search className="absolute right-4 h-5 w-5 text-primary" />
            </div>
          </div>
          <ScrollArea onScroll={handleScroll} className="h-[84%] no-scrollbar">
            <div className="flex flex-col gap-4 pb-4">
            {filteredJobs.slice(0, visibleJobsCount).map((job) => (
              <Suspense 
              key={job.id} 
              fallback={
                  <div className="p-4 bg-gray-200 rounded-xl animate-pulse h-28">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2 mt-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/3 mt-4"></div>
                  </div>
              }
              >
              <LazyJobCard job={job} />
              </Suspense>
            ))}
            
            {visibleJobsCount < filteredJobs.length && (
              <div className="flex justify-center items-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-gray-500">Loading more jobs...</span>
              </div>
            )}

            {filteredJobs.length === 0 && searchTerm.length > 0 && (
                <div className="text-center p-10 text-gray-500 bg-white rounded-xl shadow-lg">
                No jobs match your search criteria. Try a different search term.
                </div>
            )}
            </div>
          </ScrollArea>
        </div>

        {/* RIGHT COLUMN: Sticky Aside Card */}
        <aside className="flex flex-col gap-6 w-[300px]">
          <div className="sticky lg:fixed top-4 lg:top-[110px] space-y-6">
            <Card className="relative flex flex-col items-end justify-center gap-6 overflow-clip rounded-[16px] p-6 shadow-2xl"
            >
              <Image src={'/bg.jpg'} fill
                quality={80} priority={true} alt={'Background image for container'} 
                className='absolute w-full h-full object-cover' />
              <div className="absolute w-full h-full inset-0 z-10 rounded-2xl bg-neutral-100 opacity-72" />
              <div className="relative flex flex-col z-20 gap-6 text-white">
                <CardHeader className="flex flex-col p-0 gap-1 space-y-0 self-stretch">
                  <CardTitle className="text-xl font-bold leading-7 text-neutral-40">
                    Recruit the best candidates
                  </CardTitle>
                  <CardDescription className="text-sm font-bold leading-6 text-gray-200">
                    Create jobs, invite, and hire with ease
                  </CardDescription>
                </CardHeader>
                <CardFooter className='p-0'>
                  <Button onClick={onCreateJob} className="flex h-10 w-full items-center justify-center gap-1 self-stretch rounded-xl bg-primary px-4 py-1.5 text-base font-bold leading-7 text-white shadow-md transition-colors hover:bg-primary/90">
                    Create a new job
                  </Button>
                </CardFooter>
              </div>
            </Card>
            <div className="sticky p-4 bg-white rounded-xl shadow-md border border-gray-100">
              <p className="font-semibold text-gray-700">Analytics Summary</p>
              <p className="text-2xl mt-1 text-primary">{jobs.length}</p>
              <p className="text-sm text-gray-500">Total Listings</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default JobList;
