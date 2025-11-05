/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  ColumnDef,
  ColumnOrderState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronDown,
  MoreHorizontal,
  Mail,
  Phone,
  Download,
  Eye,
  Archive,
  Trash2,
  Filter,
  Loader2,
  AlertCircle,
  GripVertical,
  Linkedin,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ApplicationStatus, Applicant, ApplicantData } from '@/types/job';
import { useBulkActionApplicants, useJobApplicants, useUpdateApplicantStatus } from '@/hooks/queries/applicant-queries';
import { useApplicationFormFields } from '@/hooks/queries/application-queries';

interface ApplicantsTableProps {
  jobId: string;
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800 border-blue-200',
  SHORTLISTED: 'bg-purple-100 text-purple-800 border-purple-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  ACCEPTED: 'bg-green-100 text-green-800 border-green-200',
  WITHDRAWN: ''
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: 'Pending',
  UNDER_REVIEW: 'Reviewed',
  SHORTLISTED: 'Interview',
  REJECTED: 'Rejected',
  ACCEPTED: 'Hired',
  WITHDRAWN: 'Withdrawn'
};

const MOCK_STATUSES: ApplicationStatus[] = ['PENDING', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED', 'ACCEPTED'];

// Sortable Table Header Component
function SortableTableHeader({ header, children }: { header: { column: { id: string }; colSpan?: number }; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: header.column.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className="relative group cursor-move"
      colSpan={header.colSpan}
    >
      <div className="flex items-center space-x-2">
        <div
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
        >
          <GripVertical className="h-3 w-3 text-gray-400" />
        </div>
        {children}
      </div>
    </TableHead>
  );
}

export default function ApplicantsTable({ jobId }: ApplicantsTableProps) {
  const [selectedApplicants, setSelectedApplicants] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const [applicantDataMap, setApplicantDataMap] = useState<Map<string, ApplicantData>>(new Map());

  // TanStack Query hooks
  const {
    data: applicants = [],
    isLoading: isLoadingApplicants,
    isError: isApplicantsError,
    error: applicantsError,
  } = useJobApplicants(jobId);

  const {
    data: applicationFormFields = [],
    isLoading: isLoadingFormFields,
    isError: isFormFieldsError,
  } = useApplicationFormFields(jobId);

  const updateStatusMutation = useUpdateApplicantStatus(jobId);
  const bulkActionMutation = useBulkActionApplicants();


  // Get visible fields from application form configuration
  const visibleFields = useMemo(() => {
    return applicationFormFields
      .filter((field: { fieldState: string }) => field.fieldState !== 'off')
      .sort((a: { sortOrder?: number }, b: { sortOrder?: number }) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [applicationFormFields]);

  // Filter applicants by status
  const filteredApplicants = useMemo(() => {
    const applicantArray = Array.isArray(applicants) ? applicants : [];
    if (statusFilter === 'ALL') return applicantArray;
    return applicantArray.filter((applicant: Applicant) => applicant.status === statusFilter);
  }, [applicants, statusFilter]);
  
  const handleStatusFilterChange = (status: ApplicationStatus | 'ALL') => {
    setStatusFilter(status);
  };

  // Toggle select all
  const toggleSelectAll = useCallback(() => {
    if (selectedApplicants.length === filteredApplicants.length) {
      setSelectedApplicants([]);
    } else {
      setSelectedApplicants(filteredApplicants.map((applicant: Applicant) => applicant.id));
    }
  },[filteredApplicants, selectedApplicants.length]);

  // Toggle single applicant selection
  const toggleApplicantSelection = (applicantId: string) => {
    setSelectedApplicants(prev =>
      prev.includes(applicantId)
        ? prev.filter(id => id !== applicantId)
        : [...prev, applicantId]
    );
  };

  // Calculate match rate (mock implementation)
  const calculateMatchRate = (applicant: Applicant): number => {
    const hash = applicant.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const baseRate = 70 + (Math.abs(hash) % 30);
    return Math.round(baseRate);
  };

  // Define columns
  const columns = useMemo<ColumnDef<Applicant>[]>(() => {
    // Get applicant's answer for a specific field using ApplicantData
    const getApplicantAnswer = (applicant: Applicant, fieldKey: string): string => {
      // For now, we'll use a mock implementation since we don't have the full ApplicantData
      // In a real implementation, you would fetch the full ApplicantData or store custom field answers
      const applicantData = applicantDataMap.get(applicant.id);
      
      if (applicantData) {
        const userInfo = applicantData.applicant.userInfo?.find(
          (info: any) => info.field.key === fieldKey
        );
        return userInfo?.infoFieldAnswer || '-';
      }
      
      // Mock data for demonstration - replace with actual data fetching
      const mockAnswers: Record<string, string> = {
        'education': 'Bachelor\'s Degree',
        'experience': '3 years',
        'skills': 'JavaScript, React, TypeScript',
        'salary_expectation': '$50,000 - $70,000',
      };
      
      return mockAnswers[fieldKey] || '-';
    };
    const baseColumns: ColumnDef<Applicant>[] = [
      {
        id: 'select',
        header: () => (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={
                filteredApplicants.length > 0 &&
                selectedApplicants.length === filteredApplicants.length
              }
              onCheckedChange={toggleSelectAll}
              aria-label="Select all applicants"
            />
          </div>
        ),
        cell: ({ row }) => {
          const applicant = row.original;
          return (
            <Checkbox
              checked={selectedApplicants.includes(applicant.id)}
              onCheckedChange={() => toggleApplicantSelection(applicant.id)}
              aria-label={`Select ${applicant.fullname}`}
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
        size: 50,
      },
      {
        accessorKey: 'name',
        header: 'NAMA LENGKAP',
        cell: ({ row }) => {
          const applicant = row.original;
          return (
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={applicant.avatarUrl} alt={applicant.fullname} />
                <AvatarFallback>{applicant.fullname.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-gray-900">
                  {applicant.fullname}
                </div>
                <div className="text-sm text-gray-500 flex items-center">
                  <Mail className="h-3 w-3 mr-1" />
                  {applicant.email}
                </div>
                {applicant.phone && (
                  <div className="text-sm text-gray-500 flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    {applicant.phone}
                  </div>
                )}
                {applicant.linkedin && (
                  <div className="text-sm text-blue-500 flex items-center">
                    <Linkedin className="h-3 w-3 mr-1" />
                    LinkedIn
                  </div>
                )}
              </div>
            </div>
          );
        },
        size: 300,
      },
      {
        accessorKey: 'matchRate',
        header: 'MATCH RATE',
        cell: ({ row }) => {
          const applicant = row.original;
          const matchRate = calculateMatchRate(applicant);
          return (
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${matchRate}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900">
                {matchRate}%
              </span>
            </div>
          );
        },
        size: 150,
      },
    ];

    // Add dynamic columns for application form fields
    const dynamicColumns: ColumnDef<Applicant>[] = visibleFields.map((field: { field: { key: string; label: string }; sortOrder?: number }) => ({
      accessorKey: `field_${field.field.key}`,
      header: field.field.label.toUpperCase(),
      cell: ({ row }: { row: { original: Applicant } }) => {
        const applicant = row.original;
        return (
          <div className="text-sm text-gray-900">
            {getApplicantAnswer(applicant, field.field.key)}
          </div>
        );
      },
      size: 200,
    }));

    // Add additional applicant info columns
    const infoColumns: ColumnDef<Applicant>[] = [
      {
        accessorKey: 'location',
        header: 'LOCATION',
        cell: ({ row }) => (
          <div className="text-sm text-gray-900">
            {row.original.location || '-'}
          </div>
        ),
        size: 150,
      },
      {
        accessorKey: 'gender',
        header: 'GENDER',
        cell: ({ row }) => (
          <div className="text-sm text-gray-900">
            {row.original.gender || '-'}
          </div>
        ),
        size: 120,
      },
    ];

    // Add status and actions columns
    const endColumns: ColumnDef<Applicant>[] = [
      {
        accessorKey: 'status',
        header: 'TAHAPAN',
        cell: ({ row }) => {
          const applicant = row.original;
          return (
            <Badge 
              variant="outline" 
              className={STATUS_COLORS[applicant.status]}
            >
              {STATUS_LABELS[applicant.status]}
            </Badge>
          );
        },
        size: 150,
      },
      {
        id: 'actions',
        header: 'ACTIONS',
        cell: ({ row }) => {
          const applicant = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="h-4 w-4 mr-2" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </DropdownMenuItem>
                {applicant.resumeUrl && (
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />
                    Download Resume
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        enableSorting: false,
        enableHiding: false,
        size: 100,
      },
    ];

    return [...baseColumns, ...infoColumns, ...dynamicColumns, ...endColumns];
  }, [visibleFields, applicantDataMap, filteredApplicants.length, selectedApplicants, toggleSelectAll]);

  // Initialize column order
  const initializedColumnOrder = useMemo(() => {
    if (columnOrder.length === 0) {
      return columns.map(column => column.id as string);
    }
    return columnOrder;
  }, [columnOrder, columns]);

  // @non-memoized
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredApplicants,
    columns,
    state: {
      columnOrder: initializedColumnOrder,
    },
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
  });

  // DnD Sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  // Handle drag start
  const handleDragStart = (event: any) => {
    setActiveColumn(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setColumnOrder((columnOrder) => {
        const oldIndex = columnOrder.indexOf(active.id);
        const newIndex = columnOrder.indexOf(over.id);

        return arrayMove(columnOrder, oldIndex, newIndex);
      });
    }

    setActiveColumn(null);
  };

  // Handle status change for selected applicants
  const handleStatusChange = (newStatus: ApplicationStatus) => {
    updateStatusMutation.mutate({
      jobId,
      applicantIds: selectedApplicants,
      status: newStatus,
    });
    setSelectedApplicants([]);
  };

  // Handle bulk actions
  const handleBulkAction = (action: string) => {
    bulkActionMutation.mutate({
      applicantIds: selectedApplicants,
      action,
    });
    setSelectedApplicants([]);
  };

  // Loading state
  if (isLoadingApplicants || isLoadingFormFields) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading applicants data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isApplicantsError || isFormFieldsError) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-red-600">
          <AlertCircle className="h-8 w-8 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load applicants</h3>
          <p className="text-sm text-gray-600 max-w-md">
            {applicantsError?.message || 'Unable to load applicant data. Please try again later.'}
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Table Header with Bulk Actions */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={
                  filteredApplicants.length > 0 &&
                  selectedApplicants.length === filteredApplicants.length
                }
                onCheckedChange={toggleSelectAll}
                aria-label="Select all applicants"
              />
              <span className="text-sm font-medium text-gray-700">
                {selectedApplicants.length} selected
              </span>
            </div>

            {selectedApplicants.length > 0 && (
              <div className="flex items-center space-x-2">
                {/* Status Change Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8"
                      disabled={updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                      Change Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {MOCK_STATUSES.map(status => (
                      <DropdownMenuItem
                        key={status}
                        onClick={() => handleStatusChange(status)}
                      >
                        {STATUS_LABELS[status]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Bulk Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8"
                      disabled={bulkActionMutation.isPending}
                    >
                      {bulkActionMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => handleBulkAction('download-resumes')}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Resumes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('send-email')}>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('archive')}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleBulkAction('delete')}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | 'ALL')}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Status</option>
              {MOCK_STATUSES.map(status => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table with DnD */}
      <div className="overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  <SortableContext
                    items={initializedColumnOrder}
                    strategy={horizontalListSortingStrategy}
                  >
                    {headerGroup.headers.map((header) => (
                      <SortableTableHeader key={header.id} header={header}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </SortableTableHeader>
                    ))}
                  </SortableContext>
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <Mail className="h-12 w-12 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {(Array.isArray(applicants) ? applicants.length : 0) === 0 ? 'No applicants found' : 'No applicants match your filters'}
                      </h3>
                      <p className="text-gray-500 max-w-sm mx-auto">
                        {(Array.isArray(applicants) ? applicants.length : 0) === 0 
                          ? "No applicants have applied for this job yet."
                          : `No applicants with status "${STATUS_LABELS[statusFilter as ApplicationStatus]}" found.`
                        }
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <DragOverlay>
            {activeColumn ? (
              <TableHead className="bg-blue-50 border border-blue-200 shadow-md">
                {activeColumn}
              </TableHead>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Table Footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {filteredApplicants.length} of {Array.isArray(applicants) ? applicants.length : 0} applicants
          </div>
          <div className="text-sm text-gray-500">
            Updated just now
          </div>
        </div>
      </div>
    </div>
  );
}