"use client"

import { create } from "zustand"

interface UIState {
  // Job filters
  jobSearchTerm: string
  jobStatusFilter: string
  jobDepartmentFilter: string
  jobEmploymentTypeFilter: string
  jobSortBy: "newest" | "oldest"
  showCreateJobModal: boolean

  // Candidate table state
  candidateSearchTerm: string
  candidateStatusFilter: string
  candidateSortBy: string
  candidatePage: number
  candidatePageSize: number
  candidateColumnOrder: string[]
  candidateColumnWidths: Record<string, number>

  // Setters for job filters
  setJobSearchTerm: (term: string) => void
  setJobStatusFilter: (status: string) => void
  setJobDepartmentFilter: (dept: string) => void
  setJobEmploymentTypeFilter: (type: string) => void
  setJobSortBy: (sort: "newest" | "oldest") => void
  setShowCreateJobModal: (show: boolean) => void

  // Setters for candidate table
  setCandidateSearchTerm: (term: string) => void
  setCandidateStatusFilter: (status: string) => void
  setCandidateSortBy: (sort: string) => void
  setCandidatePage: (page: number) => void
  setCandidatePageSize: (size: number) => void
  setCandidateColumnOrder: (order: string[]) => void
  setCandidateColumnWidth: (column: string, width: number) => void

  // Reset
  resetJobFilters: () => void
  resetCandidateFilters: () => void
}

export const useUIStore = create<UIState>((set) => ({
  // Job filters
  jobSearchTerm: "",
  jobStatusFilter: "all",
  jobDepartmentFilter: "all",
  jobEmploymentTypeFilter: "all",
  jobSortBy: "newest",
  showCreateJobModal: false,

  // Candidate table state
  candidateSearchTerm: "",
  candidateStatusFilter: "all",
  candidateSortBy: "applied_date",
  candidatePage: 1,
  candidatePageSize: 10,
  candidateColumnOrder: ["name", "email", "phone", "gender", "linkedin", "location", "applied_date", "status"],
  candidateColumnWidths: {
    name: 150,
    email: 200,
    phone: 130,
    gender: 100,
    linkedin: 150,
    location: 150,
    applied_date: 130,
    status: 120,
  },

  // Job filter setters
  setJobSearchTerm: (term) => set({ jobSearchTerm: term }),
  setJobStatusFilter: (status) => set({ jobStatusFilter: status }),
  setJobDepartmentFilter: (dept) => set({ jobDepartmentFilter: dept }),
  setJobEmploymentTypeFilter: (type) => set({ jobEmploymentTypeFilter: type }),
  setJobSortBy: (sort) => set({ jobSortBy: sort }),
  setShowCreateJobModal: (show) => set({ showCreateJobModal: show }),

  // Candidate table setters
  setCandidateSearchTerm: (term) => set({ candidateSearchTerm: term }),
  setCandidateStatusFilter: (status) => set({ candidateStatusFilter: status }),
  setCandidateSortBy: (sort) => set({ candidateSortBy: sort }),
  setCandidatePage: (page) => set({ candidatePage: page }),
  setCandidatePageSize: (size) => set({ candidatePageSize: size }),
  setCandidateColumnOrder: (order) => set({ candidateColumnOrder: order }),
  setCandidateColumnWidth: (column, width) =>
    set((state) => ({
      candidateColumnWidths: {
        ...state.candidateColumnWidths,
        [column]: width,
      },
    })),

  // Reset
  resetJobFilters: () =>
    set({
      jobSearchTerm: "",
      jobStatusFilter: "all",
      jobDepartmentFilter: "all",
      jobEmploymentTypeFilter: "all",
      jobSortBy: "newest",
    }),
  resetCandidateFilters: () =>
    set({
      candidateSearchTerm: "",
      candidateStatusFilter: "all",
      candidateSortBy: "applied_date",
      candidatePage: 1,
    }),
}))
