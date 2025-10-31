'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useMemo, useCallback, useEffect, useState } from 'react';
import { useAllJobs } from '@/hooks/queries/job-queries';
import { Loader2, Briefcase, MapPin, Filter, X, Heart, AlertCircle, Frown, PanelLeft } from 'lucide-react';
import { salaryDisplay } from '@/utils/formatters/salaryFormatter';
import { Job } from '@/types/job';

// --- Type Definitions ---

interface Filters {
  locations: string[];
  employmentTypes: string[];
}

// --- Mock Data & Helpers ---
const MOCK_FILTERS: Filters = {
  locations: ['Remote', 'New York, NY', 'Seattle, WA', 'London, UK'],
  employmentTypes: ['Full-time', 'Part-time', 'Contract'],
};


// --- Full View Error Component ---
const FullViewError = ({ title, message, icon: Icon }: { 
  title: string; 
  message: string; 
  icon: React.ElementType;
}) => (
  <div className="min-h-screen bg-muted/40 flex items-center justify-center p-8">
    <div className="max-w-md w-full text-center bg-card rounded-2xl shadow-lg p-8 border border-border">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
          <Icon className="w-10 h-10 text-destructive" />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-card-foreground mb-4">{title}</h1>
      <p className="text-muted-foreground mb-6 leading-relaxed">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-md"
      >
        Try Again
      </button>
    </div>
  </div>
);

// --- Full View Empty State Component ---
const FullViewEmptyState = () => (
  <div className="min-h-screen bg-muted/40 flex items-center justify-center p-8">
    <div className="max-w-md w-full text-center bg-card rounded-2xl shadow-lg p-8 border border-dashed">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
          <Frown className="w-10 h-10 text-muted-foreground" />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-card-foreground mb-4">No Job Openings Available</h1>
      <p className="text-muted-foreground mb-4 leading-relaxed">
        We couldn&apos;t find any job openings at the moment. This could be because:
      </p>
      <ul className="text-sm text-muted-foreground text-left space-y-2 mb-6">
        <li className="flex items-center">
          <div className="w-2 h-2 bg-muted-foreground rounded-full mr-3"></div>
          All positions have been filled recently
        </li>
        <li className="flex items-center">
          <div className="w-2 h-2 bg-muted-foreground rounded-full mr-3"></div>
          We&apos;re updating our job listings
        </li>
        <li className="flex items-center">
          <div className="w-2 h-2 bg-muted-foreground rounded-full mr-3"></div>
          New opportunities coming soon
        </li>
      </ul>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-md"
        >
          Refresh Page
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 border border-border bg-background text-foreground rounded-lg font-semibold hover:bg-secondary transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  </div>
);

// --- Main Component ---
export default function JobsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // 💡 TanStack Query: Fetch all jobs
  const { 
    data: allJobs, 
    isLoading, 
    isError, 
  } = useAllJobs();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  // --- Button Classes (The "Bubble Gum" Sticky Trigger) ---

  // Base classes for the fixed, half-rounded button
  const buttonBaseClasses =
    'fixed z-[100] p-3 text-white shadow-lg transition-all duration-300 ease-in-out cursor-pointer ' +
    'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800';

  // Desktop (lg+) position and shape: Sticky left side, rounded on the right
  const buttonDesktopClasses = 
    'hidden lg:block lg:left-0 lg:top-1/3 lg:transform lg:-translate-y-1/2 lg:rounded-r-xl';

  // Mobile (sm/md) position and shape: Sticky top center, rounded on the bottom
  const buttonMobileClasses = 
    'block lg:hidden top-0 left-1/2 transform -translate-x-1/2 rounded-b-xl';

  // --- Drawer Classes (The Sliding Panel) ---

  // Base classes for the fixed, full-screen overlay/drawer
  const drawerBaseClasses =
    'fixed bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out overflow-y-auto';

  // Desktop (lg+) drawer size and animation: Slides from the left
  const drawerDesktopClasses =
    'hidden lg:block h-full w-80 top-0 left-0';
  const drawerDesktopTransform = isOpen ? 'translate-x-0' : '-translate-x-full';

  // Mobile (sm/md) drawer size and animation: Slides from the top
  const drawerMobileClasses =
    'block lg:hidden w-full h-3/5 top-0 left-0 rounded-b-2xl';
  const drawerMobileTransform = isOpen ? 'translate-y-0' : '-translate-y-full';

  // Derive state from URL parameters
  const activeFilters = useMemo<Filters>(() => {
    const locs = searchParams.get('locations')?.split(',') || [];
    const types = searchParams.get('employmentTypes')?.split(',') || [];
    return {
      locations: locs.filter(Boolean),
      employmentTypes: types.filter(Boolean)
    };
  }, [searchParams]);

  const selectedJobId = useMemo(() => {
    return searchParams.get('selectedJobId');
  }, [searchParams]);

  // --- Event Handlers ---
  const updateUrl = useCallback((newFilters: Filters, newSelectedId: string | null) => {
    const params = new URLSearchParams();
    if (newFilters.locations.length > 0) {
      params.set('locations', newFilters.locations.join(','));
    }
    if (newFilters.employmentTypes.length > 0) {
      params.set('employmentTypes', newFilters.employmentTypes.join(','));
    }
    if (newSelectedId) {
        params.set('selectedJobId', newSelectedId);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router]);

  // --- Filtering Logic ---
  const filteredJobs = useMemo(() => {
    if (!allJobs) return [];
    
    const jobs: Job[] = allJobs.map((job: Job) => ({
        ...job,
        employmentType: job.employmentType || MOCK_FILTERS.employmentTypes[0],
        companyName: `TechCorp ${job.id.slice(0, 4)}`,
        candidatesCount: (job.id.charCodeAt(0) % 45) + 5,
        salary: job.salaryMin === job.salaryMax? job.salaryMin : (job.salaryMin! + job.salaryMax!) / 2 ,
        salaryCurrency: job.salaryCurrency || 'IDR',
    }));

    return jobs.filter(job => {
      const locationMatch = activeFilters.locations.length === 0 || 
                            activeFilters.locations.includes(job.location || '');
      const typeMatch = activeFilters.employmentTypes.length === 0 || 
                        activeFilters.employmentTypes.includes(job.employmentType || '');
      
      return locationMatch && typeMatch;
    });
  }, [allJobs, activeFilters]);

  const selectedJob = useMemo(() => {
    if (!filteredJobs) return null;
    return filteredJobs.find(job => job.id === selectedJobId) || filteredJobs[0] || null;
  }, [filteredJobs, selectedJobId]);

  // Set the selected job when the list changes
  useEffect(() => {
      if (filteredJobs.length > 0 && !selectedJobId) {
          updateUrl(activeFilters, filteredJobs[0].id);
      }
  }, [filteredJobs, selectedJobId, activeFilters, updateUrl]);

  const handleFilterChange = (type: keyof Filters, value: string) => {
    const currentList = activeFilters[type];
    const newFilters = { ...activeFilters };
    
    if (currentList.includes(value)) {
      newFilters[type] = currentList.filter(v => v !== value) as string[];
    } else {
      newFilters[type] = [...currentList, value] as string[];
    }
    
    updateUrl(newFilters, selectedJobId);
  };

  const handleJobSelect = (jobId: string) => {
    updateUrl(activeFilters, jobId);
  };
  
  // --- Critical Error Handling ---
  if (isError) {
    return (
      <FullViewError
        title="Service Temporarily Unavailable"
        message="Our job listings server is experiencing technical difficulties. Our team has been notified and is working to resolve the issue. Please try again in a few moments."
        icon={AlertCircle}
      />
    );
  }

  // --- Empty Data State ---
  if (!isLoading && allJobs && allJobs.length === 0) {
    return <FullViewEmptyState />;
  }

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-8">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Fetching latest job openings...</p>
      </div>
    );
  }

  // --- Render Functions ---
  const renderSidebar = () => (
    <div className="w-full lg:w-64 xl:w-72 p-4 bg-card rounded-xl shadow-lg h-fit sticky top-20">
      <h2 className="text-xl font-bold mb-4 flex items-center text-primary"><Filter className="w-5 h-5 mr-2" />Filters</h2>
      
      {/* Location Filters */}
      <div className="mb-6">
        <h3 className="text-md font-semibold mb-2">Location</h3>
        {MOCK_FILTERS.locations.map(loc => (
          <div key={loc} className="flex items-center space-x-2 py-1">
            <input
              type="checkbox"
              id={loc}
              checked={activeFilters.locations.includes(loc)}
              onChange={() => handleFilterChange('locations', loc)}
              className="rounded text-primary focus:ring-primary h-4 w-4"
            />
            <label htmlFor={loc} className="text-sm font-medium leading-none">
              {loc}
            </label>
          </div>
        ))}
      </div>

      {/* Employment Type Filters */}
      <div className="mb-6">
        <h3 className="text-md font-semibold mb-2">Employment Type</h3>
        {MOCK_FILTERS.employmentTypes.map(type => (
          <div key={type} className="flex items-center space-x-2 py-1">
            <input
              type="checkbox"
              id={type}
              checked={activeFilters.employmentTypes.includes(type)}
              onChange={() => handleFilterChange('employmentTypes', type)}
              className="rounded text-primary focus:ring-primary h-4 w-4"
            />
            <label htmlFor={type} className="text-sm font-medium leading-none">
              {type}
            </label>
          </div>
        ))}
      </div>

      {/* Active Filters Display */}
      <div className="mt-4 pt-4 border-t border-border">
        <h3 className="text-sm font-semibold mb-2">Active Filters</h3>
        <div className="flex flex-wrap gap-2">
          {[...activeFilters.locations, ...activeFilters.employmentTypes].map(filter => (
            <span 
              key={filter} 
              className="inline-flex items-center px-3 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-full cursor-pointer hover:bg-red-100 transition-colors"
              onClick={() => {
                const type = MOCK_FILTERS.locations.includes(filter) ? 'locations' : 'employmentTypes';
                handleFilterChange(type, filter);
              }}
            >
              {filter} <X className="ml-1 h-3 w-3" />
            </span>
          ))}
          {activeFilters.locations.length === 0 && activeFilters.employmentTypes.length === 0 && (
            <p className="text-sm text-muted-foreground">None applied.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderJobList = () => (
    <div className="w-full lg:w-96 xl:w-[400px] space-y-3 pr-2 overflow-y-auto max-h-[calc(100vh-100px)] no-scrollbar">
      {/* {isFetching && (
        <div className="p-4 bg-yellow-500/10 text-yellow-700 rounded-lg flex items-center gap-2 text-sm sticky top-0 z-10">
          <Loader2 className="h-4 w-4 animate-spin" />
          Refetching data...
        </div>
      )} */}
      
      {filteredJobs.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground bg-card rounded-xl border border-dashed">
          <Briefcase className="w-8 h-8 mx-auto mb-2" />
          <p className="font-semibold">No Jobs Match Your Filters</p>
          <p className="text-sm">Adjust your filters to see more openings.</p>
        </div>
      ) : (
        filteredJobs.map(job => (
          <div
            key={job.id}
            className={`p-4 rounded-xl cursor-pointer transition-all border ${
              selectedJobId === job.id
                ? 'bg-primary/10 border-primary shadow-lg'
                : 'bg-card border-border hover:shadow-md hover:border-primary/50'
            }`}
            onClick={() => handleJobSelect(job.id)}
          >
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-bold text-card-foreground line-clamp-1">{job.title}</h3>
              <Heart className="w-5 h-5 text-gray-400 hover:text-red-500 transition-colors" />
            </div>
            <p className="text-sm text-muted-foreground mb-2">{job.companyName}</p>
            <div className="text-sm space-y-1 mt-2">
              <span className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />{job.location} ({job.employmentType})
              </span>
              <span className="flex items-center text-sm text-gray-600">
                {salaryDisplay(job.salaryMin, job.salaryMax, job.salaryCurrency)} / year
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderJobDetail = () => {
    if (!selectedJob) {
      return (
        <div className="w-full p-8 text-center text-muted-foreground bg-card rounded-xl border border-dashed flex flex-col items-center justify-center h-full">
          <Briefcase className="w-10 h-10 mb-4" />
          <p className="text-lg font-semibold">Select a Job</p>
          <p>Click on a job listing on the left to view details.</p>
        </div>
      );
    }
    
    return (
      <div className="w-full p-6 bg-card rounded-xl shadow-lg overflow-y-auto max-h-[calc(100vh-100px)] sticky top-20 no-scrollbar">
        <h1 className="text-3xl font-extrabold text-primary mb-2">{selectedJob.title}</h1>
        <p className="text-xl text-muted-foreground mb-4">{selectedJob.companyName}</p>
        
        <div className="flex items-center space-x-4 mb-6 text-gray-600">
          <span className="flex items-center">
            <MapPin className="w-5 h-5 mr-1" />{selectedJob.location}
          </span>
          <span className="flex items-center">
            {salaryDisplay(selectedJob.salaryMin, selectedJob.salaryMax, selectedJob.salaryCurrency)}
          </span>
          <span className="flex items-center">
            <Briefcase className="w-5 h-5 mr-1" />{selectedJob.employmentType}
          </span>
        </div>

        <div className="mb-6">
            <p className="text-sm text-muted-foreground">
                Posted: {new Date(selectedJob.createdAt).toLocaleDateString()} | 
                {selectedJob.candidatesCount} candidates applied
            </p>
        </div>

        <div className="flex gap-4 mb-8">
            <button className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-md">
                Apply Now
            </button>
            <button className="px-6 py-3 border border-border bg-background text-foreground rounded-lg font-semibold hover:bg-secondary transition-colors">
                <Heart className="w-5 h-5" />
            </button>
        </div>

        <h2 className="text-2xl font-bold mb-3 border-b pb-2">Job Description</h2>
        <div className="prose max-w-none text-card-foreground">
          <p>{selectedJob.description}</p>
          <p>This role involves developing cutting-edge software solutions and collaborating with cross-functional teams. We are looking for a candidate with strong problem-solving skills and a passion for technology.</p>
          <h3 className="mt-4 font-semibold text-lg">Requirements</h3>
          <ul>
              <li>5+ years of experience in relevant field.</li>
              <li>Proficiency in modern web frameworks (e.g., React, Next.js).</li>
              <li>Strong knowledge of database design and SQL.</li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-muted/40 p-4 md:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Filter Sidebar */}
        {/* 1. Backdrop Overlay (Visible only when open on mobile/small screens) */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black opacity-40 z-40 lg:hidden"
            onClick={toggleDrawer}
          ></div>
        )}

        {/* 2. Responsive Toggle Button (Bubble Gum Stick) */}
        <div 
          onClick={toggleDrawer} 
          aria-label={isOpen ? "Close Sidebar" : "Open Sidebar"}
          className={`${buttonBaseClasses} ${buttonDesktopClasses}`}
        >
          {isOpen ? <X size={24} /> : <PanelLeft size={24} />}
        </div>
        
        <div 
          onClick={toggleDrawer} 
          aria-label={isOpen ? "Close Sidebar" : "Open Sidebar"}
          className={`${buttonBaseClasses} ${buttonMobileClasses}`}
        >
          {isOpen ? <X size={24} /> : <PanelLeft size={24} />}
        </div>

        {/* 3. Responsive Drawer Panel */}

        {/* Desktop Drawer */}
        <div 
          className={`${drawerBaseClasses} ${drawerDesktopClasses} transform ${drawerDesktopTransform}`}
        >
          <div className="flex justify-end p-2 lg:hidden">
              <button onClick={toggleDrawer} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
              </button>
          </div>
          {renderSidebar()}
        </div>

        {/* Mobile Drawer */}
        <div 
          className={`${drawerBaseClasses} ${drawerMobileClasses} transform ${drawerMobileTransform}`}
        >
          <div className="flex justify-end p-4">
              <button onClick={toggleDrawer} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
              </button>
          </div>
          {renderSidebar()}
        </div>


        {/* 2. Job List */}
        <div className="col-span-1">
          {renderJobList()}
        </div>

        {/* 3. Job Detail */}
        <div className="col-span-1 lg:col-span-1 xl:col-span-1 hidden md:block">
          {renderJobDetail()}
        </div>
      </div>
    </div>
  );
}