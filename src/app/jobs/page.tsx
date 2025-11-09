/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useMemo, useCallback, useEffect, useState } from 'react';
import { useAllJobs } from '@/hooks/queries/job-queries';
import { Loader2, Briefcase, MapPin, Filter, X, Heart, AlertCircle, Frown, Search, Check } from 'lucide-react';
import { salaryDisplay } from '@/utils/formatters/salaryFormatter';
import { Job } from '@/types/job';
import Drawer from '@/components/custom-ui/drawer';
import JobDetail from '@/components/job/job-seeker/JobDetail';
import JobCard from '@/components/job/job-seeker/JobCard';
import NoData from '@/components/job/no-job';

// --- Type Definitions ---

interface Filters {
  locations: string[];
  employmentTypes: string[];
}

// --- Mock Data & Helpers ---
const employmentTypes= ['Full-time', 'Part-time', 'Contract'];

const LocationAutocomplete = ({
  locations,
  selectedLocations,
  onLocationToggle,
  onLocationAdd,
}: {
  locations: string[];
  selectedLocations: string[];
  onLocationToggle: (location: string) => void;
  onLocationAdd: (location: string) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredLocations = useMemo(() => {
    if (!searchTerm) return locations;
    return locations.filter(location =>
      location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [locations, searchTerm]);

  const handleSelect = (location: string) => {
    onLocationToggle(location);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleAddCustom = () => {
    if (searchTerm.trim() && !locations.includes(searchTerm.trim())) {
      onLocationAdd(searchTerm.trim());
    }
    setSearchTerm('');
    setIsOpen(false);
  };

  const canAddCustom = searchTerm.trim() && 
    !locations.includes(searchTerm.trim()) && 
    !selectedLocations.includes(searchTerm.trim());

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <input
          type="text"
          placeholder="Search locations..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {isOpen && (filteredLocations.length > 0 || canAddCustom) && (
        <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredLocations.map((location) => (
            <div
              key={location}
              className="flex items-center px-4 py-2 hover:bg-secondary cursor-pointer transition-colors"
              onClick={() => handleSelect(location)}
            >
              <Check
                className={`h-4 w-4 mr-2 ${
                  selectedLocations.includes(location)
                    ? 'text-primary opacity-100'
                    : 'opacity-0'
                }`}
              />
              <span className="flex-1">{location}</span>
            </div>
          ))}
          {canAddCustom && (
            <div
              className="flex items-center px-4 py-2 hover:bg-secondary cursor-pointer transition-colors border-t border-border"
              onClick={handleAddCustom}
            >
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="flex-1">Add &quot;{searchTerm}&quot;</span>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
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

// --- Main Component ---
export default function JobsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // 💡 TanStack Query: Fetch all jobs
  const { 
    data: allJobs, 
    isLoading, 
    isError,
    isFetching, // Added to distinguish between cache and fresh fetch
  } = useAllJobs();
  const [isOpen, setIsOpen] = useState(false);
  const [customLocations, setCustomLocations] = useState<string[]>([]);
  
  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  // Extract unique locations from job data
  const availableLocations = useMemo(() => {
    const jobLocations = allJobs && allJobs.length > 0 
      ? [...new Set(allJobs
          .map(job => job.location)
          .filter((location): location is string => 
            Boolean(location) && location?.trim() !== ''
          )
        )]
      : [];
    return [...new Set([...jobLocations, ...customLocations])].sort();
  }, [allJobs, customLocations]);

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
    // Use cached data immediately, don't wait for fresh fetch
    const jobsToFilter = allJobs || [];
    
    const jobs: Job[] = jobsToFilter.map((job: Job) => ({
        ...job,
        employmentType: job.employmentType || employmentTypes[0],
        companyName: job.companyName || `TechCorp ${job.id.slice(0, 4)}`,
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
    if (!filteredJobs || filteredJobs.length === 0) return null;
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

  const handleLocationAdd = (newLocation: string) => {
    // Add the new location to custom locations if it doesn't exist
    if (!availableLocations.includes(newLocation)) {
      setCustomLocations(prev => [...prev, newLocation]);
    }
    // Also select the new location
    handleFilterChange('locations', newLocation);
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
  // Only show empty state when we're not loading AND there's truly no data
  if (!isLoading && allJobs && allJobs.length === 0) {
    return <NoData />;
  }

  // --- Loading State ---
  // Only show loading if there's no cached data at all
  if (isLoading || !allJobs) {
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
      <h2 className="text-xl font-bold mb-4 flex items-center text-primary">
        <Filter className="w-5 h-5 mr-2" />Filters
      </h2>
      
      {/* Location Filters */}
      <div className="mb-6">
        <h3 className="text-md font-semibold mb-2">Location</h3>
        
        {/* Location Autocomplete */}
        <div className="mb-3">
          <LocationAutocomplete
            locations={availableLocations}
            selectedLocations={activeFilters.locations}
            onLocationToggle={(location) => handleFilterChange('locations', location)}
            onLocationAdd={handleLocationAdd}
          />
        </div>

        {/* Selected Locations */}
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {activeFilters.locations.map(location => (
            <div key={location} className="flex items-center justify-between py-1 px-2 bg-secondary rounded">
              <div className="flex items-center space-x-2 flex-1">
                <MapPin className="w-3 h-3 text-muted-foreground" />
                <span className="text-sm font-medium truncate">{location}</span>
              </div>
              <button
                onClick={() => handleFilterChange('locations', location)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {activeFilters.locations.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              No locations selected
            </p>
          )}
        </div>
      </div>

      {/* Employment Type Filters */}
      <div className="mb-6">
        <h3 className="text-md font-semibold mb-2">Employment Type</h3>
        {employmentTypes.map(type => (
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
                const type = availableLocations.includes(filter) ? 'locations' : 'employmentTypes';
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
    <div className="w-full lg:w-96 xl:w-[400px] flex flex-col gap-6 space-y-3 pr-2 overflow-y-auto max-h-[calc(100vh-100px)] no-scrollbar scrollbar-thin">
      <div className="flex flex-col gap-6 lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto lg:pr-2 ">
      {/* Show background refetching indicator */}
      {isFetching && (
        <div className="p-4 bg-yellow-500/10 text-yellow-700 rounded-lg flex items-center gap-2 text-sm sticky top-0 z-10">
          <Loader2 className="h-4 w-4 animate-spin" />
          Refreshing data...
        </div>
      )}
      
      {filteredJobs.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground bg-card rounded-xl border border-dashed">
          <Briefcase className="w-8 h-8 mx-auto mb-2" />
          <p className="font-semibold">No Jobs Match Your Filters</p>
          <p className="text-sm">Adjust your filters to see more openings.</p>
        </div>
      ) : (
        filteredJobs.map(job => (
          <JobCard
            key={job.id}
            title={job.title}
            company={job.companyName || ""}
            location={job.location || ""}
            employmentType={job.employmentType || ""}
            salary={salaryDisplay(job.salaryMin, job.salaryMax, job.salaryCurrency)}
            logo={job.company?.logo || "/logo.png"}
            isActive={selectedJobId === job.id}
            onClick={() => handleJobSelect(job.id)}
          />
        ))
      )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/40 p-4 md:p-8">
      <div className="max-w-7xl mx-auto flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 px-4 py-6 lg:py-10">
        {/* 1. Filter Sidebar */}
        <Drawer isOpen={isOpen} toggleDrawer={toggleDrawer}>
          {renderSidebar()}
        </Drawer>

        {/* 2. Job List */}
        <div className="col-span-1">
          {selectedJob? renderJobList() :(
          <div className="w-full p-8 text-center text-muted-foreground bg-card rounded-xl border border-dashed flex flex-col items-center justify-center h-full">
            <Briefcase className="w-10 h-10 mb-4" />
            <p className="text-lg font-semibold">Select a Job</p>
            <p>Click on a job listing on the left to view details.</p>
          </div>
          )} 
        </div>

        {/* 3. Job Detail */}
        <div className="col-span-1 lg:col-span-1 xl:col-span-1 hidden md:block">
          <JobDetail
            title={selectedJob?.title || ""}
            company={selectedJob?.companyName || ""}
            logo={selectedJob?.company?.logo || "/logo.png"}
            type={selectedJob?.employmentType || ""}
            description={selectedJob?.description || ""}
            onApply={() => router.push(`/jobs/${selectedJobId}/apply`)}
            salary={ selectedJob? salaryDisplay(selectedJob.salaryMin, selectedJob.salaryMax, selectedJob?.salaryCurrency) : ""} 
            location={selectedJob?.location || ''}          />
        </div>
      </div>
    </div>
  );
}