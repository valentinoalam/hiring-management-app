"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Participant, ParticipantField, ViewMode, FilterState, SortDirection, AgeGroup } from "../types/participant";
import { differenceInYears, parse } from "date-fns";

async function markAttendance(participantName: string, newAttendanceStatus: boolean) {
  try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/itikaf/absensi/${participantName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ check: newAttendanceStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error(error);
    }
}

async function getParticipants() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "/api"}/itikaf/participants`, {
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error("Failed to fetch participants")
  }

  return res.json()
}

interface ParticipantContextProps {
  participants: Participant[];
  isLoading: boolean;
  error: string | null;
  viewMode: ViewMode;
  filterState: FilterState;
  setViewMode: (mode: ViewMode) => void;
  setFilterState: (state: FilterState) => void;
  toggleFieldVisibility: (field: ParticipantField) => void;
  setSearchQuery: (query: string) => void;
  setSortField: (field: ParticipantField) => void;
  setSortDirection: (direction: SortDirection) => void;
  setJenisKelamin: (gender: string) => void;
  setAgeGroup: (ageGroup: AgeGroup) => void;
  setAddressFilter: (address: string) => void;
  toggleAttendance: (participantName: string) => Promise<void>;
  filteredParticipants: Participant[];
  refreshData: () => Promise<void>;
}

const ParticipantContext = createContext<ParticipantContextProps | undefined>(undefined);

export const useParticipants = () => {
  const context = useContext(ParticipantContext);
  if (!context) {
    throw new Error("useParticipants must be used within a ParticipantProvider");
  }
  return context;
};

// Default visible fields
const DEFAULT_VISIBLE_FIELDS: ParticipantField[] = [
  "name",
  "sex",
  "age",
  "phone",
  "bersama",
];

// Local storage keys
const STORAGE_KEY_FILTER_STATE = "itikaf-filter-state";
const STORAGE_KEY_VIEW_MODE = "itikaf-view-mode";

// Default filter state
const DEFAULT_FILTER_STATE: FilterState = {
  visibleFields: DEFAULT_VISIBLE_FIELDS,
  searchQuery: "",
  sortField: "name",
  sortDirection: "asc",
  jenisKelamin: "all",
  ageGroup: "all",
  addressFilter: "",
};

export const ParticipantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state from localStorage or use defaults
  const getSavedFilterState = (): FilterState => {
    try {
      if (typeof window !== 'undefined') {
        const savedState = localStorage.getItem(STORAGE_KEY_FILTER_STATE);
        if (savedState) {
          return JSON.parse(savedState);
        }
      }
      return DEFAULT_FILTER_STATE; // Implement this function to return a default filter state
    } catch (error) {
      console.error("Error loading filter state from localStorage:", error);
      return DEFAULT_FILTER_STATE; // Also return default on error
    }
   };
  

  const getSavedViewMode = (): ViewMode => {
    try {
      if (typeof window !== 'undefined') {
        const savedViewMode = localStorage.getItem(STORAGE_KEY_VIEW_MODE);
        if (savedViewMode && (savedViewMode === "card" || savedViewMode === "table")) {
          return savedViewMode;
        }
      }
    } catch (error) {
      console.error("Error loading view mode from localStorage:", error);
    }
    return "card";
  };

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewModeState] = useState<ViewMode>(getSavedViewMode);
  const [filterState, setFilterStateInternal] = useState<FilterState>(getSavedFilterState);

  // Update localStorage when filterState changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FILTER_STATE, JSON.stringify(filterState));
    } catch (error) {
      console.error("Error saving filter state to localStorage:", error);
    }
  }, [filterState]);

  // Update localStorage when viewMode changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_VIEW_MODE, viewMode);
    } catch (error) {
      console.error("Error saving view mode to localStorage:", error);
    }
  }, [viewMode]);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
  };

  const setFilterState = (state: FilterState) => {
    setFilterStateInternal(state);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getParticipants();
      setParticipants(data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch participants");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleFieldVisibility = (field: ParticipantField) => {
    setFilterStateInternal((prev: FilterState) => {
      if (prev.visibleFields.includes(field)) {
        return {
          ...prev,
          visibleFields: prev.visibleFields.filter((f) => f !== field),
        };
      } else {
        return {
          ...prev,
          visibleFields: [...prev.visibleFields, field],
        };
      }
    });
  };

  const setSearchQuery = (query: string) => {
    setFilterStateInternal((prev: FilterState) => ({
      ...prev,
      searchQuery: query,
    }));
  };

  const setSortField = (field: ParticipantField) => {
    setFilterStateInternal((prev: FilterState) => ({
      ...prev,
      sortField: field,
    }));
  };

  const setSortDirection = (direction: SortDirection) => {
    setFilterStateInternal((prev: FilterState) => ({
      ...prev,
      sortDirection: direction,
    }));
  };

  const setJenisKelamin = (gender: string) => {
    setFilterStateInternal((prev: FilterState) => ({
      ...prev,
      jenisKelamin: gender,
    }));
  };

  const setAgeGroup = (ageGroup: AgeGroup) => {
    setFilterStateInternal((prev: FilterState) => ({
      ...prev,
      ageGroup: ageGroup,
    }));
  };

  const setAddressFilter = (address: string) => {
    setFilterStateInternal((prev: FilterState) => ({
      ...prev,
      addressFilter: address,
    }));
  };

  const toggleAttendance = async (participantName: string) => {
    const participant = participants.find((p) => p.name === participantName);
    if (!participant) return;

    const newAttendanceStatus = !participant.isPresent;
    const success = await markAttendance(participantName, newAttendanceStatus);

    if (success) {
      setParticipants((prev) =>
        prev.map((p) =>
          p.name === participantName ? { ...p, isPresent: newAttendanceStatus } : p
        )
      );
    }
  };

    // Calculate age from tanggal-lahir string
  const getAge = (birthDateStr: string): number => {
    try {
      // Try to parse the date - assuming format is DD-MM-YYYY
      const birthDate = parse(birthDateStr, 'dd-MM-yyyy', new Date());
      return differenceInYears(new Date(), birthDate);
    } catch (error) {
      console.error("Error parsing date:", error);
      return 0;
    }
  };

  // Check if participant falls into selected age group
  const matchesAgeGroup = (participant: Participant): boolean => {
    if (filterState.ageGroup === 'all') return true;
    
    const age = getAge(participant.bod);
    
    switch (filterState.ageGroup) {
      case 'child': return age >= 0 && age <= 12;
      case 'teen': return age >= 13 && age <= 17;
      case 'adult': return age >= 18 && age <= 59;
      case 'senior': return age >= 60;
      default: return true;
    }
  };

  // Filter participants based on all criteria
  const filteredParticipants = participants
    .filter((participant) => {
      // Search query filter
      if (filterState.searchQuery) {
        const searchLower = filterState.searchQuery.toLowerCase();
        
        // Search in participant fields
        const participantMatch = Object.entries(participant).some(([key, value]) => {
          // Skip searching in complex objects
          if (key === 'keluarga' || value === null || typeof value === 'object') return false;
          
          return String(value).toLowerCase().includes(searchLower);
        });
        
        // Search in family members
        const familyMatch = participant.keluarga?.some(member => 
          member.nama.toLowerCase().includes(searchLower) || 
          member.keterangan.toLowerCase().includes(searchLower)
        );
        
        if (!(participantMatch || familyMatch)) return false;
      }
      
      // Gender filter
      if (filterState.jenisKelamin !== 'all' && participant.sex !== filterState.jenisKelamin) {
        return false;
      }
      
      // Age group filter
      if (!matchesAgeGroup(participant)) {
        return false;
      }
      
      // Address filter
      if (filterState.addressFilter) {
        const addressLower = filterState.addressFilter.toLowerCase();
        const ktpMatch = participant.alamat_ktp.toLowerCase().includes(addressLower);
        const domisiliMatch = participant.alamat_domisili.toLowerCase().includes(addressLower);
        
        if (!(ktpMatch || domisiliMatch)) {
          return false;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      const field = filterState.sortField;
      const aValue = a[field];
      const bValue = b[field];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return filterState.sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });


  const refreshData = fetchData;

  const value = {
    participants,
    isLoading,
    error,
    viewMode,
    filterState,
    setViewMode,
    setFilterState,
    toggleFieldVisibility,
    setSearchQuery,
    setSortField,
    setSortDirection,
    setJenisKelamin,
    setAgeGroup,
    setAddressFilter,
    toggleAttendance,
    filteredParticipants,
    refreshData,
  };

  return (
    <ParticipantContext.Provider value={value}>
      {children}
    </ParticipantContext.Provider>
  );
};
