"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trash2, GripVertical } from "lucide-react"

interface FormField {
  id: string
  field_name: string
  field_type: string
  field_state: "mandatory" | "optional" | "off"
  display_order: number
}

const DEFAULT_FIELDS = [
  { name: "Full Name", type: "text" },
  { name: "Email", type: "email" },
  { name: "Phone", type: "tel" },
  { name: "LinkedIn", type: "url" },
  { name: "Domicile", type: "text" },
  { name: "Gender", type: "select" },
  { name: "Cover Letter", type: "textarea" },
  { name: "Resume", type: "file" },
]

interface FormFieldBuilderProps {
  jobId: string
}

export default function FormFieldBuilder({ jobId }: FormFieldBuilderProps) {
  const [fields, setFields] = useState<FormField[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchFields()
  }, [jobId])

  const fetchFields = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("application_form_fields")
        .select("*")
        .eq("job_id", jobId)
        .order("display_order", { ascending: true })

      if (error) throw error

      if (data && data.length > 0) {
        setFields(data)
      } else {
        // Initialize with default fields
        const defaultFields = DEFAULT_FIELDS.map((field, index) => ({
          id: `temp-${index}`,
          field_name: field.name,
          field_type: field.type,
          field_state: index < 3 ? ("mandatory" as const) : ("optional" as const),
          display_order: index,
        }))
        setFields(defaultFields)
      }
    } catch (error) {
      console.error("Error fetching fields:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFieldStateChange = (fieldId: string, newState: "mandatory" | "optional" | "off") => {
    setFields(fields.map((f) => (f.id === fieldId ? { ...f, field_state: newState } : f)))
  }

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId))
  }

  const handleSaveConfiguration = async () => {
    try {
      setSaving(true)

      // Delete existing fields
      await supabase.from("application_form_fields").delete().eq("job_id", jobId)

      // Insert new fields
      const fieldsToInsert = fields
        .filter((f) => f.field_state !== "off")
        .map((f, index) => ({
          job_id: jobId,
          field_name: f.field_name,
          field_type: f.field_type,
          field_state: f.field_state,
          display_order: index,
        }))

      if (fieldsToInsert.length > 0) {
        const { error } = await supabase.from("application_form_fields").insert(fieldsToInsert)
        if (error) throw error
      }

      // Refresh fields
      await fetchFields()
    } catch (error) {
      console.error("Error saving configuration:", error)
    } finally {
      setSaving(false)
    }
  }

  const getStateColor = (state: string) => {
    switch (state) {
      case "mandatory":
        return "bg-red-100 text-red-800"
      case "optional":
        return "bg-blue-100 text-blue-800"
      case "off":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Configure Application Form Fields</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Set each field as Mandatory (required), Optional (can skip), or Off (not shown). Drag to reorder fields.
        </p>

        <div className="space-y-3">
          {fields.map((field) => (
            <div
              key={field.id}
              className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />

              <div className="flex-1">
                <p className="font-medium">{field.field_name}</p>
                <p className="text-sm text-muted-foreground">{field.field_type}</p>
              </div>

              <Select
                value={field.field_state}
                onValueChange={(value) => handleFieldStateChange(field.id, value as "mandatory" | "optional" | "off")}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mandatory">Mandatory</SelectItem>
                  <SelectItem value="optional">Optional</SelectItem>
                  <SelectItem value="off">Off</SelectItem>
                </SelectContent>
              </Select>

              <Badge className={getStateColor(field.field_state)} variant="outline">
                {field.field_state}
              </Badge>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteField(field.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-6 border-t border-border mt-6">
          <Button variant="outline" onClick={fetchFields} disabled={saving}>
            Reset
          </Button>
          <Button onClick={handleSaveConfiguration} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Configuration
          </Button>
        </div>
      </Card>

      <Card className="p-6 bg-blue-50 border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">Preview</h4>
        <p className="text-sm text-blue-800">
          Applicants will see {fields.filter((f) => f.field_state !== "off").length} fields in their application form.
        </p>
      </Card>
    </div>
  )
}
