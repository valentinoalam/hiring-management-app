// components/ApplicationFormConfig.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, GripVertical, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfoField {
  id: string;
  key: string;
  label: string;
  fieldType?: string;
  options?: string;
  displayOrder?: number;
}

interface FormField {
  fieldId: string;
  label: string;
  fieldState: 'mandatory' | 'optional' | 'off';
  sortOrder: number;
}

interface ApplicationFormConfigProps {
  value: FormField[];
  onChange: (fields: FormField[]) => void;
  onFieldsChange?: (fields: InfoField[]) => void;
}

// Sortable field item component
function SortableFieldItem({ 
  field, 
  infoField,
  onFieldStateChange,
  onRemove,
  isCustom = false 
}: {
  field: FormField;
  infoField: InfoField;
  onFieldStateChange: (fieldId: string, state: 'mandatory' | 'optional' | 'off') => void;
  onRemove?: (fieldId: string) => void;
  isCustom?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.fieldId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center justify-between p-3 border border-neutral-30 rounded-lg bg-neutral-10',
        isDragging && 'opacity-50 shadow-lg',
        field.fieldState === 'off' && 'opacity-60'
      )}
    >
      <div className="flex items-center gap-3 flex-1">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-neutral-60 hover:text-neutral-90"
        >
          <GripVertical className="w-4 h-4" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-90">
              {infoField?.label || field.label}
            </span>
            {isCustom && (
              <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                Custom
              </span>
            )}
            {field.fieldState === 'off' && (
              <span className="px-2 py-1 text-xs bg-neutral-30 text-neutral-60 rounded-full">
                Hidden
              </span>
            )}
          </div>
          {infoField?.fieldType && (
            <div className="text-xs text-neutral-60 mt-1">
              Type: {infoField.fieldType}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={field.fieldState}
          onValueChange={(value: 'mandatory' | 'optional' | 'off') => 
            onFieldStateChange(field.fieldId, value)
          }
        >
          <SelectTrigger className="w-28 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mandatory">Required</SelectItem>
            <SelectItem value="optional">Optional</SelectItem>
            <SelectItem value="off">Hidden</SelectItem>
          </SelectContent>
        </Select>

        {isCustom && onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(field.fieldId)}
            className="h-8 w-8 p-0 text-danger-main hover:text-danger-dark hover:bg-danger-light"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Add new field form component
function AddFieldForm({ 
  onAddField,
  onCancel 
}: {
  onAddField: (field: Omit<InfoField, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    key: '',
    label: '',
    fieldType: 'text' as 'text' | 'textarea' | 'select' | 'number',
    options: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.key.trim() || !formData.label.trim()) {
      return;
    }

    onAddField({
      key: formData.key.trim().toLowerCase().replace(/\s+/g, '_'),
      label: formData.label.trim(),
      fieldType: formData.fieldType,
      options: formData.fieldType === 'select' ? formData.options : undefined,
    });

    setFormData({ key: '', label: '', fieldType: 'text', options: '' });
  };

  return (
    <div className="p-4 border border-neutral-30 rounded-lg bg-neutral-5">
      <h4 className="font-medium text-neutral-90 mb-3">Add Custom Field</h4>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel className="text-xs">Field Key</FieldLabel>
            <Input
              value={formData.key}
              onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
              placeholder="e.g., years_experience"
              className="h-8 text-sm"
              required
            />
          </Field>

          <Field>
            <FieldLabel className="text-xs">Field Label</FieldLabel>
            <Input
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              placeholder="e.g., Years of Experience"
              className="h-8 text-sm"
              required
            />
          </Field>
        </div>

        <Field>
          <FieldLabel className="text-xs">Field Type</FieldLabel>
          <Select
            value={formData.fieldType}
            onValueChange={(value: string) => 
              setFormData(prev => ({ ...prev, fieldType: value as 'text' | 'textarea' | 'select' | 'number' }))
            }
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="textarea">Text Area</SelectItem>
              <SelectItem value="select">Select</SelectItem>
              <SelectItem value="number">Number</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        {formData.fieldType === 'select' && (
          <Field>
            <FieldLabel className="text-xs">Options (comma-separated)</FieldLabel>
            <Input
              value={formData.options}
              onChange={(e) => setFormData(prev => ({ ...prev, options: e.target.value }))}
              placeholder="e.g., Option 1, Option 2, Option 3"
              className="h-8 text-sm"
            />
            <FieldDescription className="text-xs">
              Separate options with commas
            </FieldDescription>
          </Field>
        )}

        <div className="flex gap-2 pt-2">
          <Button type="submit" size="sm" className="h-8">
            <Plus className="w-4 h-4 mr-1" />
            Add Field
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-8" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export function ApplicationFormConfig({ 
  value, 
  onChange,
  onFieldsChange 
}: ApplicationFormConfigProps) {
  const [infoFields, setInfoFields] = useState<InfoField[]>([]);
  const [customFields, setCustomFields] = useState<InfoField[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch info fields on mount
  useEffect(() => {
    const fetchInfoFields = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/info-fields');
        if (response.ok) {
          const fields = await response.json();
          setInfoFields(fields);
          
          // Initialize form fields if empty
          if (value.length === 0) {
            const initialFields = fields.map((field: InfoField, index: number) => ({
              fieldId: field.id,
              label: field.label,
              fieldState: 'mandatory' as const,
              sortOrder: index,
            }));
            onChange(initialFields);
          }
        }
      } catch (error) {
        console.error('Failed to fetch info fields:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInfoFields();
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = value.findIndex(field => field.fieldId === active.id);
      const newIndex = value.findIndex(field => field.fieldId === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedFields = arrayMove(value, oldIndex, newIndex).map((field, index) => ({
          ...field,
          sortOrder: index,
        }));
        onChange(reorderedFields);
      }
    }
  };

  const handleFieldStateChange = (fieldId: string, state: 'mandatory' | 'optional' | 'off') => {
    const updatedFields = value.map(field =>
      field.fieldId === fieldId ? { ...field, fieldState: state } : field
    );
    onChange(updatedFields);
  };

  const handleAddCustomField = async (newFieldData: Omit<InfoField, 'id'>) => {
    try {
      const response = await fetch('/api/info-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFieldData),
      });

      if (response.ok) {
        const createdField = await response.json();
        
        // Add to custom fields
        setCustomFields(prev => [...prev, createdField]);
        
        // Add to form configuration
        const newFormField: FormField = {
          fieldId: createdField.id,
          label: createdField.label,
          fieldState: 'optional',
          sortOrder: value.length,
        };
        
        onChange([...value, newFormField]);
        setShowAddForm(false);
        
        // Notify parent about fields change
        onFieldsChange?.([...infoFields, createdField]);
      } else {
        const error = await response.json();
        console.error('Failed to create field:', error);
      }
    } catch (error) {
      console.error('Error creating custom field:', error);
    }
  };

  const handleRemoveCustomField = (fieldId: string) => {
    // Remove from form configuration
    const updatedFields = value.filter(field => field.fieldId !== fieldId);
    onChange(updatedFields);
    
    // Remove from custom fields
    setCustomFields(prev => prev.filter(field => field.id !== fieldId));
  };

  const getFieldInfo = (fieldId: string): InfoField | undefined => {
    return [...infoFields, ...customFields].find(f => f.id === fieldId);
  };

  if (loading) {
    return (
      <FieldSet>
        <FieldLegend>Application Form Configuration</FieldLegend>
        <div className="p-4 text-center text-neutral-60">
          Loading form fields...
        </div>
      </FieldSet>
    );
  }

  const activeFields = value.filter(field => field.fieldState !== 'off');

  return (
    <FieldSet>
      <FieldLegend>Application Form Configuration</FieldLegend>
      <FieldDescription>
        Drag and drop to reorder fields, and configure which fields are required for applicants.
        {activeFields.length > 0 && (
          <span className="block mt-1 text-sm">
            <strong>Preview order:</strong> {activeFields.map(field => {
              const fieldInfo = getFieldInfo(field.fieldId);
              return fieldInfo?.label || field.label;
            }).join(' → ')}
          </span>
        )}
      </FieldDescription>

      <FieldGroup className="space-y-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={value.map(f => f.fieldId)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {value.map((field) => {
                const fieldInfo = getFieldInfo(field.fieldId);
                const isCustom = customFields.some(f => f.id === field.fieldId);
                
                return (
                  <SortableFieldItem
                    key={field.fieldId}
                    field={field}
                    infoField={fieldInfo!}
                    onFieldStateChange={handleFieldStateChange}
                    onRemove={isCustom ? handleRemoveCustomField : undefined}
                    isCustom={isCustom}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>

        {showAddForm ? (
          <AddFieldForm
            onAddField={handleAddCustomField}
            onCancel={() => setShowAddForm(false)}
          />
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAddForm(true)}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Field
          </Button>
        )}
      </FieldGroup>
    </FieldSet>
  );
}