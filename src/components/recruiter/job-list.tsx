import React, { useState, useMemo, lazy, Suspense } from 'react';
import { Search, Loader2, Briefcase } from 'lucide-react'; // Using Lucide icons for aesthetics
import { Job } from '@/types/job';

const LazyJobCard = lazy(() => import('./job-card'));

const ScrollArea = ({ children, onScroll, className }: { children: React.ReactNode; onScroll: (e: React.UIEvent<HTMLDivElement>) => void, className: string }) => (
<div
    className={`overflow-y-auto h-full ${className}`}
    style={{
      /* Hide scrollbar for IE, Edge and Firefox */
      msOverflowStyle: 'none',  /* IE and Edge */
      scrollbarWidth: 'none',  /* Firefox */
      /* Hide scrollbar for Chrome, Safari and Opera */
      WebkitOverflowScrolling: 'touch',
    }}
    onScroll={onScroll}
  >
    {children}
  </div>
);
// --- Hero Content for No Jobs ---
const NoJobsHero = ({onCreateJob}: {onCreateJob: () => void}) => (
  <div className="flex flex-col items-center justify-center h-full p-16 bg-white rounded-xl shadow-lg border border-gray-100 text-center">
      <Briefcase className="h-16 w-16 text-primary mb-4 opacity-70" />
      <h2 className="text-xl font-bold text-gray-800 mb-2">There are no job listings right now.</h2>
      <p className="text-gray-500 mb-6">Start by creating your first job post to attract top talent.</p>
      <button 
          className="flex h-10 items-center justify-center rounded-lg bg-primary px-6 py-2 text-base font-bold leading-7 text-white shadow-md transition-colors hover:bg-primary/90"
          onClick={onCreateJob}
      >
          Create Now
      </button>
  </div>
);
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
      job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [jobs, searchTerm]);


  // --- Conditional Rendered Content for Job Listings ---
  const jobListContent = (
    <ScrollArea onScroll={handleScroll} className="hide-scrollbar">
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
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* We need to include a style block to hide the Webkit scrollbar (Chrome/Safari) */}
      <style>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 pt-4 h-full">
        <main className="flex gap-8 h-[calc(100vh-2rem)]"> {/* Set height for the main container */}
          
          {/* LEFT COLUMN: Job Listings (Scrollable) */}
          <div className="flex flex-1 flex-col gap-6 min-w-0">
            <div className="flex flex-col gap-4">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search by job details (50 mock jobs loaded)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 pr-12 text-base leading-6 text-gray-700 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-shadow"
                />
                <Search className="absolute right-4 h-5 w-5 text-primary" />
              </div>
            </div>
            
             {/* Conditional Rendering of Job List or Hero Section */}
            {jobs.length === 0 ? <NoJobsHero onCreateJob={onCreateJob} /> : jobListContent}
          </div>

          {/* RIGHT COLUMN: Sticky Aside Card */}
          <aside className="hidden lg:flex flex-col gap-6 w-[300px]">
            {/* The 'top-4' class is critical for making 'sticky' work effectively inside a flexible container */}
            <div className="sticky top-4">
              <div
                className="flex flex-col items-end justify-center gap-6 rounded-2xl p-6 shadow-2xl"
                style={{
                  backgroundImage:
                    "linear-gradient(0deg, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.72) 100%), url('https://api.builder.io/api/v1/image/assets/TEMP/3ecfcde75f4a68c505478c3cb850d6305db5abe2?width=600')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="flex flex-col gap-1 self-stretch">
                  <h2 className="text-xl font-bold leading-7 text-white">
                    Recruit the best candidates
                  </h2>
                  <p className="text-sm font-medium leading-6 text-gray-200">
                    Create jobs, invite, and hire with ease
                  </p>
                </div>
                <button onClick={onCreateJob} className="flex h-10 w-full items-center justify-center gap-1 self-stretch rounded-lg bg-primary px-4 py-1.5 text-base font-bold leading-7 text-white shadow-md transition-colors hover:bg-primary/90">
                  Create a new job
                </button>
              </div>
            </div>
            <div className="sticky top-[150px] p-4 bg-white rounded-xl shadow-md border border-gray-100">
                <p className="font-semibold text-gray-700">Analytics Summary</p>
                <p className="text-2xl mt-1 text-primary">{jobs.length}</p>
                <p className="text-sm text-gray-500">Total Listings</p>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default JobList;
