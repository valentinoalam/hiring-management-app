"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, GripHorizontal } from "lucide-react"

interface Candidate {
  id: string
  full_name: string
  email: string
  phone: string
  gender: string
  linkedin: string
  domicile: string
  applied_at: string
  status: string
}

interface CandidateTableProps {
  candidates: Candidate[]
}

type ColumnKey = keyof Candidate
type SortDirection = "asc" | "desc"

const DEFAULT_COLUMNS: ColumnKey[] = ["full_name", "email", "phone", "gender", "linkedin", "domicile", "applied_at"]

const COLUMN_LABELS: Record<ColumnKey, string> = {
  id: "ID",
  full_name: "Name",
  email: "Email",
  phone: "Phone",
  gender: "Gender",
  linkedin: "LinkedIn",
  domicile: "Domicile",
  applied_at: "Applied Date",
  status: "Status",
}

export default function CandidateTable({ candidates }: CandidateTableProps) {
  const [columns, setColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS)
  const [sortColumn, setSortColumn] = useState<ColumnKey>("applied_at")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [columnWidths, setColumnWidths] = useState<Record<ColumnKey, number>>({
    id: 80,
    full_name: 150,
    email: 200,
    phone: 120,
    gender: 100,
    linkedin: 150,
    domicile: 150,
    applied_at: 130,
    status: 100,
  })
  const [resizingColumn, setResizingColumn] = useState<ColumnKey | null>(null)
  const [draggedColumn, setDraggedColumn] = useState<ColumnKey | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  const ITEMS_PER_PAGE = 10

  // Handle column resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingColumn || !tableRef.current) return

      const rect = tableRef.current.getBoundingClientRect()
      const newWidth = Math.max(80, e.clientX - rect.left - columnWidths[resizingColumn] + 10)

      setColumnWidths((prev) => ({
        ...prev,
        [resizingColumn]: newWidth,
      }))
    }

    const handleMouseUp = () => {
      setResizingColumn(null)
    }

    if (resizingColumn) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [resizingColumn, columnWidths])

  // Handle column reordering
  const handleDragStart = (column: ColumnKey) => {
    setDraggedColumn(column)
  }

  const handleDragOver = (e: React.DragEvent, targetColumn: ColumnKey) => {
    e.preventDefault()
    if (!draggedColumn || draggedColumn === targetColumn) return

    const draggedIndex = columns.indexOf(draggedColumn)
    const targetIndex = columns.indexOf(targetColumn)

    const newColumns = [...columns]
    newColumns.splice(draggedIndex, 1)
    newColumns.splice(targetIndex, 0, draggedColumn)

    setColumns(newColumns)
  }

  const handleDragEnd = () => {
    setDraggedColumn(null)
  }

  // Sorting
  const handleSort = (column: ColumnKey) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  // Sorting logic
  const sortedCandidates = [...candidates].sort((a, b) => {
    const aValue = a[sortColumn]
    const bValue = b[sortColumn]

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    return 0
  })

  // Pagination
  const totalPages = Math.ceil(sortedCandidates.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedCandidates = sortedCandidates.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      reviewed: "default",
      accepted: "default",
      rejected: "destructive",
    }
    return (
      <Badge variant={variants[status] || "secondary"} className="capitalize">
        {status}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatValue = (column: ColumnKey, value: any) => {
    if (column === "applied_at") {
      return formatDate(value)
    }
    if (column === "status") {
      return getStatusBadge(value)
    }
    return value || "N/A"
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div ref={tableRef} className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {columns.map((column) => (
                  <th
                    key={column}
                    draggable
                    onDragStart={() => handleDragStart(column)}
                    onDragOver={(e) => handleDragOver(e, column)}
                    onDragEnd={handleDragEnd}
                    className="relative px-4 py-3 text-left font-semibold text-sm cursor-move hover:bg-muted/70 transition-colors"
                    style={{ width: `${columnWidths[column]}px`, minWidth: `${columnWidths[column]}px` }}
                  >
                    <div className="flex items-center gap-2">
                      <GripHorizontal className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                      <button
                        onClick={() => handleSort(column)}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        {COLUMN_LABELS[column]}
                        {sortColumn === column && (
                          <span className="text-xs">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </button>
                    </div>

                    {/* Resize handle */}
                    <div
                      onMouseDown={() => setResizingColumn(column)}
                      className="absolute right-0 top-0 h-full w-1 bg-border hover:bg-primary cursor-col-resize opacity-0 hover:opacity-100 transition-opacity"
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedCandidates.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                    No candidates found
                  </td>
                </tr>
              ) : (
                paginatedCandidates.map((candidate) => (
                  <tr key={candidate.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    {columns.map((column) => (
                      <td
                        key={`${candidate.id}-${column}`}
                        className="px-4 py-3 text-sm"
                        style={{ width: `${columnWidths[column]}px`, minWidth: `${columnWidths[column]}px` }}
                      >
                        {formatValue(column, candidate[column])}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, sortedCandidates.length)} of{" "}
            {sortedCandidates.length} candidates
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Info */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-900">
          Drag column headers to reorder, drag the right edge to resize. Click headers to sort.
        </p>
      </Card>
    </div>
  )
}
