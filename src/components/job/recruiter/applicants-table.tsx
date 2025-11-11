// applicants-table.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
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
  DragStartEvent,
  DragEndEvent,
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
  GripVertical,
  Linkedin,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ApplicationStatus, Applicant, AppFormField, Candidate } from '@/types/job';

// Constants
const STATUS_COLORS: Record<ApplicationStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800 border-blue-200',
  SHORTLISTED: 'bg-purple-100 text-purple-800 border-purple-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  ACCEPTED: 'bg-green-100 text-green-800 border-green-200',
  WITHDRAWN: 'bg-gray-100 text-gray-800 border-gray-200'
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: 'Pending',
  UNDER_REVIEW: 'Reviewed',
  SHORTLISTED: 'Interview',
  REJECTED: 'Rejected',
  ACCEPTED: 'Hired',
  WITHDRAWN: 'Withdrawn'
};

const STATUS_OPTIONS: (ApplicationStatus | 'ALL')[] = ['ALL', 'PENDING', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED', 'ACCEPTED'];

// Props interface
interface ApplicantsTableProps {
  applicants: Candidate[];
  visibleFields: AppFormField[];
  selectedApplicants: string[];
  statusFilter: ApplicationStatus | 'ALL';
  isFetching?: boolean;
  isUpdatingStatus?: boolean;
  isPerformingBulkAction?: boolean;
  jobTitle?: string;
  totalApplicants?: number;
  onSelectAll: () => void;
  onSelectApplicant: (applicantId: string) => void;
  onStatusChange: (status: ApplicationStatus) => void;
  onBulkAction: (action: string) => void;
  onStatusFilterChange: (status: ApplicationStatus | 'ALL') => void;
}

// Sortable Table Header Component
const SortableTableHeader = ({ header, children }: { 
  header: { column: { id: string }; colSpan?: number }; 
  children: React.ReactNode 
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: header.column.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
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
};

// Presentational components
const ApplicantAvatar = ({ applicant }: { applicant: Applicant }) => (
  <Avatar>
    <AvatarImage src={applicant.avatarUrl} alt={applicant.fullname} />
    <AvatarFallback>{applicant.fullname?.charAt(0)}</AvatarFallback>
  </Avatar>
);

const StatusBadge = ({ status }: { status: ApplicationStatus }) => (
  <Badge variant="outline" className={STATUS_COLORS[status]}>
    {STATUS_LABELS[status]}
  </Badge>
);

const MatchRateIndicator = ({ matchRate }: { matchRate?: number }) => {
  const rate = matchRate || 0;
  return (
    <div className="flex items-center space-x-2">
      <div className="w-16 bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${rate}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-900">
        {rate}%
      </span>
    </div>
  );
};

export default function ApplicantsTable({
  applicants,
  visibleFields,
  selectedApplicants,
  statusFilter,
  isUpdatingStatus = false,
  isPerformingBulkAction = false,
  jobTitle = "this position",
  totalApplicants = 0,
  isFetching,
  onSelectAll,
  onSelectApplicant,
  onStatusChange,
  onBulkAction,
  onStatusFilterChange,
}: ApplicantsTableProps) {
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Column definitions - purely presentational
  const columns = useMemo<ColumnDef<Applicant & { matchRate?: number }>[]>(() => {
    const baseColumns: ColumnDef<Applicant & { matchRate?: number }>[] = [
      {
        id: 'select',
        header: () => (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={applicants.length > 0 && selectedApplicants.length === applicants.length}
              onCheckedChange={onSelectAll}
              aria-label="Select all applicants"
            />
          </div>
        ),
        cell: ({ row }) => {
          const applicant = row.original;
          return (
            <Checkbox
              checked={selectedApplicants.includes(applicant.id)}
              onCheckedChange={() => onSelectApplicant(applicant.id)}
              aria-label={`Select ${applicant.fullname}`}
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
        size: 50,
      },
      {
        id: 'name',
        header: 'NAMA LENGKAP',
        cell: ({ row }) => {
          const applicant = row.original;
          return (
            <div className="flex items-center space-x-3">
              <ApplicantAvatar applicant={applicant} />
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
        id: 'matchRate',
        header: 'MATCH RATE',
        cell: ({ row }) => <MatchRateIndicator matchRate={row.original.matchRate} />,
        size: 150,
      },
    ];

    const infoColumns: ColumnDef<Applicant & { matchRate?: number }>[] = [
      {
        id: 'location',
        header: 'LOCATION',
        accessorKey: 'location',
        cell: ({ getValue }) => (
          <div className="text-sm text-gray-900">
            {getValue() ? String(getValue()) : '-'}
          </div>
        ),
        size: 150,
      },
      {
        id: 'gender',
        header: 'GENDER',
        accessorKey: 'gender',
        cell: ({ getValue }) => (
          <div className="text-sm text-gray-900">
            {getValue() ? String(getValue()) : '-'}
          </div>
        ),
        size: 120,
      },
    ];

    const dynamicColumns: ColumnDef<Applicant & { matchRate?: number }>[] = visibleFields.map((field: { field: { key: string; label: string } }) => ({
      id: `field_${field.field.key}`,
      header: field.field.label.toUpperCase(),
      cell: ({ row }) => {
        const applicant = row.original;
        
        let answer = '-';
        
        if (applicant.userInfo && applicant.userInfo[field.field.key]) {
          answer = applicant.userInfo[field.field.key].answer || '-';
        } else if (applicant[field.field.key as keyof Applicant]) {
          answer = String(applicant[field.field.key as keyof Applicant]) || '-';
        } else if (field.field.key === 'education' && field.field.key in applicant) {
          answer = String(applicant[field.field.key as keyof typeof applicant]);
        } else if (field.field.key === 'experience' && field.field.key in applicant) {
          answer = String(applicant[field.field.key as keyof typeof applicant]);
        } else if (field.field.key === 'skills' && field.field.key in applicant) {
          answer = String(applicant[field.field.key as keyof typeof applicant]);
        }
        
        return (
          <div className="text-sm text-gray-900">
            {answer}
          </div>
        );
      },
      size: 200,
    }));

    const endColumns: ColumnDef<Applicant & { matchRate?: number }>[] = [
      {
        id: 'status',
        header: 'TAHAPAN',
        accessorKey: 'status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
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
  }, [applicants, selectedApplicants, visibleFields, onSelectAll, onSelectApplicant]);

  // Get all column IDs
  const columnIds = useMemo(() => columns.map(col => col.id!), [columns]);
  
  // Column order state - initialize with empty array to avoid hydration issues
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);

  // Update column order when columns change - only after mount
  useEffect(() => {
    setColumnOrder(columnIds);
  }, [columnIds]);

  // Use columnIds as fallback during initial render
  const activeColumnOrder = columnOrder.length > 0 ? columnOrder : columnIds;

  // DnD Sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  // React Table instance
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: applicants,
    columns,
    state: {
      columnOrder: activeColumnOrder,
    },
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
  });

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveColumn(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setColumnOrder((currentOrder) => {
        const oldIndex = currentOrder.indexOf(active.id as string);
        const newIndex = currentOrder.indexOf(over.id as string);
        return arrayMove(currentOrder, oldIndex, newIndex);
      });
    }
    setActiveColumn(null);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Table Header with Bulk Actions */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={applicants.length > 0 && selectedApplicants.length === applicants.length}
                onCheckedChange={onSelectAll}
                aria-label="Select all applicants"
              />
              <span className="text-sm font-medium text-gray-700">
                {selectedApplicants.length} selected
              </span>
            </div>

            {selectedApplicants.length > 0 && (
              <div className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8"
                      disabled={isUpdatingStatus}
                    >
                      {isUpdatingStatus ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                      Change Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {STATUS_OPTIONS.filter(opt => opt !== 'ALL').map(status => (
                      <DropdownMenuItem
                        key={status}
                        onClick={() => onStatusChange(status as ApplicationStatus)}
                      >
                        {STATUS_LABELS[status as ApplicationStatus]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8"
                      disabled={isPerformingBulkAction}
                    >
                      {isPerformingBulkAction ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => onBulkAction('download-resumes')}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Resumes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onBulkAction('send-email')}>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onBulkAction('archive')}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onBulkAction('delete')}
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
              onChange={(e) => onStatusFilterChange(e.target.value as ApplicationStatus | 'ALL')}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>
                  {status === 'ALL' ? 'All Status' : STATUS_LABELS[status as ApplicationStatus]}
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
                    items={activeColumnOrder}
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
                    data-state={selectedApplicants.includes(row.original.id) && "selected"}
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
                        {applicants.length === 0 ? 'No applicants found' : 'No applicants match your filters'}
                      </h3>
                      <p className="text-gray-500 max-w-sm mx-auto">
                        {applicants.length === 0 
                          ? `No applicants have applied for "${jobTitle}" yet.`
                          : `No applicants with status "${statusFilter === 'ALL' ? 'any status' : STATUS_LABELS[statusFilter]}" found.`
                        }
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {isMounted && (
              <DragOverlay>
                {activeColumn ? (
                  <table>
                    <thead>
                      <tr>
                        <TableHead className="bg-blue-50 border border-blue-200 shadow-md">
                          {activeColumn}
                        </TableHead>
                      </tr>
                    </thead>
                  </table>
                ) : null}
              </DragOverlay>
          )}
        </DndContext>
      </div>

      {/* Table Footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {applicants.length} of {totalApplicants} applicants
          </div>
          <div className="text-sm text-gray-500">
            Updated just now
          </div>
        </div>
      </div>
    </div>
  );
}