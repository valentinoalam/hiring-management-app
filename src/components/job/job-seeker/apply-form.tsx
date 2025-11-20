/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Upload, Calendar, ChevronDown, FileText, X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { OtherInfo, OtherInfoData, Profile, ProfileData, transformProfileUserInfo } from "@/types/user";
import { AppFormField, Job } from "@/types/job";
import Image from "next/image";
import React from "react";
import { GestureProfileCapture } from "@/components/custom-ui/gesture-profile-capture";
import PhoneInput from "@/components/custom-ui/phone-input";
import { WilayahAutocomplete } from "@/components/custom-ui/domicile-input";
import { useToast } from "@/hooks/use-toast";

// File validation constants
const MEGABYTE = 1024 * 1024;
const MAX_FILE_SIZE = 5 * MEGABYTE; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg", 
  "image/jpg", 
  "image/png", 
  "image/webp"
];
const ACCEPTED_RESUME_TYPES = [
  "application/pdf", 
  "application/msword", 
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

const COMMON_PROFILE_FIELDS = [
  'full_name',
  'email',
  'phone_number',
  'date_of_birth',
  'gender',
  'domicile',
  'linkedin_url',
  'photo_profile',
  'coverLetter'
];

// ============================================================================
// SCHEMA Initialization
// ============================================================================
const createApplicationSchema = (appFormFields: AppFormField[]) => {
  const schema: Record<string, z.ZodTypeAny> = {};
  schema.avatar = z.instanceof(File)
    .refine(file => file.size <= MAX_FILE_SIZE, `Avatar must be less than ${MAX_FILE_SIZE / MEGABYTE}MB`)
    .refine(file => ACCEPTED_IMAGE_TYPES.includes(file.type), "Avatar must be JPG, PNG, or WebP")
    .optional()
    .or(z.literal(undefined));
    
  // 1. Filter and sort fields
  const sortedFields = [...appFormFields]
    .filter(field => field.fieldState !== 'off')
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  sortedFields.forEach((field) => {
    const { fieldState } = field;
    const isRequired = fieldState === 'mandatory';

    let fieldValidator: z.ZodTypeAny;
    const fieldLabel = field.label || field.key;

    // 2. Create base validator based on field type
    switch (field.fieldType) {
      case 'email':
        fieldValidator = z.email("Invalid email address");
        break;

      case 'url':
        fieldValidator = z.url("Must be a valid URL");
        break;

      case 'number':
        // Handle input as string or number, ensure final output is a number (pipe)
        let baseNumberSchema = z.union([
          z.number({ message: "Must be a valid number" }),
          z.string()
            .regex(/^-?\d+(\.\d+)?$/, "Invalid number format")
            .transform(val => Number(val))
        ]).pipe(z.number());
        
        // Apply min/max constraints using .refine on the resulting number
        if (field.validation?.min !== undefined) {
          baseNumberSchema = baseNumberSchema.refine(
            (val: number) => val >= field.validation!.min!,
            `Must be at least ${field.validation.min}`
          );
        }
        if (field.validation?.max !== undefined) {
          baseNumberSchema = baseNumberSchema.refine(
            (val: number) => val <= field.validation!.max!,
            `Must be at most ${field.validation.max}`
          );
        }
        fieldValidator = baseNumberSchema;
        break;

      case 'date':
        // Enforce ISO string format and apply date validation (string comparison works for ISO)
        fieldValidator = z.iso.datetime({ message: "Invalid date format (expected ISO string)" });
        
        if (field.validation?.minDate) {
          fieldValidator = fieldValidator.refine(
            (date: unknown) => typeof date === 'string' && date >= field.validation!.minDate!,
            `Date must be on or after ${field.validation.minDate}`
          );
        }
        if (field.validation?.maxDate) {
          fieldValidator = fieldValidator.refine(
            (date: unknown) => typeof date === 'string' && date <= field.validation!.maxDate!,
            `Date must be on or before ${field.validation.maxDate}`
          );
        }
        break;

      case 'file':
        // Use z.instanceof(File) and include file validations
        fieldValidator = z.instanceof(File, { message: `${fieldLabel} is required` })
          .refine(file => file.size <= MAX_FILE_SIZE, `File must be less than ${MAX_FILE_SIZE / MEGABYTE}MB`);

        if (field.validation?.fileTypes && field.validation.fileTypes.length > 0) {
          fieldValidator = fieldValidator.refine(
            (file: unknown) => field.validation!.fileTypes!.includes((file as File).type),
            `File must be one of: ${field.validation.fileTypes.join(', ')}`
          );
        }
        // Note: isRequired logic for file is handled below, outside the switch.
        break;

      case 'checkbox':
        // Checkboxes should validate for true or the string 'on'
        fieldValidator = z.boolean().or(z.literal('on'));
        break;

      case 'radio':
      case 'select':
      case 'textarea':
      case 'string': // Catch-all for basic string types
      case 'text':
      default:
        // All other fields default to a string
        fieldValidator = z.string()
        .max(10000, `${fieldLabel} must be less than 10000 characters`); // Add reasonable limit;
        break;

    }

    // 3. Apply Required/Optional Logic (Consolidated)
    if (isRequired) {
      if (field.fieldType === 'checkbox') {
        // Mandatory checkbox must be true/on
        fieldValidator = fieldValidator.refine(
          val => val === true || val === 'on',
          `${fieldLabel} must be checked`
        );
      } else if (fieldValidator instanceof z.ZodString) {
        // Mandatory strings must have content
        fieldValidator = fieldValidator.min(1, `${fieldLabel} is required`);
      }
      // Note: File fields are inherently required here due to z.instanceof(File, { message: ... })
      // and only become optional if !isRequired is true.
    } else {
      // Handle optional fields
      if (field.fieldType === 'file') {
        // Optional file fields can be undefined
        fieldValidator = fieldValidator.optional().or(z.literal(undefined));
      } else if (fieldValidator instanceof z.ZodString) {
        // Optional strings accept undefined (optional) or empty string
        fieldValidator = fieldValidator.optional().or(z.literal(''));
      } else {
        // Other types (number, date, checkbox, etc.) just become optional
        fieldValidator = fieldValidator.optional();
      }
    }
    
    // 4. Apply Final Specific Validations (e.g., regex)
    if (field.key === 'phone_number' && fieldValidator instanceof z.ZodString) {
      // Re-apply a strict regex, but only to the ZodString branch
      fieldValidator = fieldValidator.regex(/^\+?[\d\s-()]+$/, "Invalid phone number format");
    }

    schema[field.key] = fieldValidator;
  });

 
  schema.resume = z.instanceof(File, { message: "Resume is required" })
    .refine(file => file.size <= MAX_FILE_SIZE, `Resume must be less than ${MAX_FILE_SIZE / MEGABYTE}MB`)
    .refine(file => ACCEPTED_RESUME_TYPES.includes(file.type), "Resume must be PDF or Word document");

  schema.coverLetter = z.string()
  .max(15000, "Cover letter must be less than 15000 characters")
  .optional()
  .or(z.literal(''));
  schema.coverLetterFile = z.instanceof(File) // File input
    .refine(file => file.size <= MAX_FILE_SIZE, `Cover letter file must be less than ${MAX_FILE_SIZE / MEGABYTE}MB`)
    .refine(file => ACCEPTED_RESUME_TYPES.includes(file.type), "Cover letter must be PDF or Word document")
    .optional()
    .or(z.literal(undefined));

  schema.source = z.string().min(1, "Please specify how you heard about this position");

  return z.object(schema);
};

type ApplicationFormData = z.infer<ReturnType<typeof createApplicationSchema>>;

// ============================================================================
// TYPES
// ============================================================================

interface JobApplicationFormProps {
  job: Job;
  appFormFields: AppFormField[];
  userProfile: Profile | null | undefined;
  isSending: boolean;
  submitError: Error | null;
  onSubmit: (applicationData: FormData) => Promise<unknown>;
  onCancel: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function JobApplicationForm({
  job,
  appFormFields,
  userProfile,
  isSending,
  submitError,    
  onSubmit,
  onCancel
}: JobApplicationFormProps) {
  const toast = useToast()
  // ========== State Management ==========
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const [coverLetterMode, setCoverLetterMode] = useState<'text' | 'file'>('text');
  const [showGestureCapture, setShowGestureCapture] = useState(false);
  
  const profile = userProfile;
  const [resumeUrl, setResumeUrl] = useState<string | undefined>(profile?.resumeUrl);
  // ========== Helper Functions ==========
  
  /**
   * Extract date of birth from profile's otherInfo
   */
  const getProfileDateOfBirth = useCallback((): string | undefined => {
    if (profile?.otherInfo && Array.isArray(profile.otherInfo)) {
      const dobInfo = (profile.otherInfo as unknown as OtherInfoData[]).find(
        (info: OtherInfoData) => info.field.key === 'date_of_birth'
      );
      return dobInfo?.infoFieldAnswer;
    }
    return undefined;
  }, [profile]);

  /**
   * Check if a field is a common profile field
   * These fields are already rendered in the fixed profile section
   */
  const isCommonProfileField = useCallback((fieldKey: string): boolean => {
    return COMMON_PROFILE_FIELDS.includes(fieldKey);
  }, []);

  /**
   * Get value from profile for a specific field key
   * Maps profile properties to form field keys
   */
  const getProfileFieldValue = useCallback((fieldKey: string, transformedOtherInfo?: OtherInfo): string => {
    // First, check transformed otherInfo
    if (transformedOtherInfo && transformedOtherInfo[fieldKey]) {
      return transformedOtherInfo[fieldKey].answer || "";
    }

    // Then check direct profile properties
    const fieldMapping: Record<string, string | undefined> = {
      'phone_number': profile?.phone,
      'domicile': profile?.location,
      'linkedin_url': profile?.linkedinUrl,
      'full_name': profile?.fullname,
      'email': profile?.email,
      'gender': profile?.gender,
      'date_of_birth': getProfileDateOfBirth(),
    };

    return fieldMapping[fieldKey] || "";
  }, [profile, getProfileDateOfBirth]);
  
  // ========== Form Setup ==========
  
  const formSchema = createApplicationSchema(appFormFields);
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    control,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });
  const formValues = useWatch({ control });

  // ========== Effects ==========
  
  /**
   * Set initial avatar preview from profile
   */
  React.useEffect(() => {
    if (userProfile?.avatarUrl) {
      setAvatarPreview(userProfile.avatarUrl);
    }
  }, [userProfile?.avatarUrl]);
  /**
   * Pre-fill form with existing profile data
   * This is the critical mapping logic
   */
  useEffect(() => {
    if (!profile || appFormFields.length === 0) return;

    const fieldValues: Partial<ApplicationFormData> = {};

    // Transform profile.otherInfo if it's in array format
    const transformedOtherInfo = profile.otherInfo && Array.isArray(profile.otherInfo) 
      ? transformProfileUserInfo(profile.otherInfo as OtherInfoData[])
      : (profile.otherInfo as OtherInfo | undefined);

    // Map each field to profile data
    appFormFields.forEach((appField: AppFormField) => {
      if (appField.fieldState === "off") return;

      const fieldKey = appField.key;
      
      // Special handling for photo_profile
      if (fieldKey === 'photo_profile') {
        if (profile.avatarUrl) {
          setAvatarPreview(profile.avatarUrl);
        }
        return;
      }

      // Get value from profile
      fieldValues[fieldKey] = getProfileFieldValue(fieldKey, transformedOtherInfo);
    });

    // Set resume if available
    if (profile.resumeUrl) {
      // Note: This is setting a URL string, not a File object
      // This might cause validation issues since schema expects File
      setValue('resume', profile.resumeUrl, { shouldValidate: false });
    }

    // Set all field values
    Object.entries(fieldValues).forEach(([key, value]) => {
      if (value !== undefined) {
        setValue(key as keyof ApplicationFormData, value, { 
          shouldValidate: false,
          shouldDirty: false
        });
      }
    });
  }, [profile, appFormFields, setValue, getProfileFieldValue]);

  // ========== File Handlers ==========
  if(submitError) toast.failed("Failed to submit application")
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setError('avatar', {
          type: 'manual',
          message: 'Please upload a valid image file (JPG, PNG, or WebP)'
        });
        event.target.value = '';
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError('avatar', {
          type: 'manual', 
          message: 'Image size must be less than 5MB'
        });
        event.target.value = '';
        return;
      }
      
      // Clear any previous errors
      clearErrors('avatar');
      
      const previewUrl = URL.createObjectURL(file);
      setAvatarFile(file);
      setAvatarPreview(previewUrl);
      setValue('avatar', file, { shouldValidate: true });
    }
  };

  const handleGestureCaptureSave = (imageData: string) => {
    setAvatarPreview(imageData);
    setShowGestureCapture(false);
  };

  const handleResumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setResumeFile(file);
      setValue('resume', file, { shouldValidate: true });
    }
  };

  const handleCoverLetterFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCoverLetterFile(file);
      setValue('coverLetterFile', file, { shouldValidate: true });
      setValue('coverLetter', '', { shouldValidate: false });
    }
  };

  const removeResumeFile = () => {
    setResumeFile(null);
    setResumeUrl(undefined);
    setValue('resume', '', { shouldValidate: true });
  };

  const removeCoverLetterFile = () => {
    setCoverLetterFile(null);
    setValue('coverLetterFile', undefined, { shouldValidate: true });
  };

  // ========== Form Submission ==========
  
  /**
   * Prepare FormData for API submission
   * Organizes data into: files, profileUpdates, userInfoUpdates, formData
   */
  const prepareFormData = (formData: ApplicationFormData): FormData => {
    const submitFormData = new FormData();

    // 1. Add file uploads
    if (avatarFile) submitFormData.append('avatar', avatarFile);
    
    // Only append resume file if it's a new upload (File object)
    if (resumeFile) {
      submitFormData.append('resume', resumeFile);
    } else if (resumeUrl && typeof formData.resume === 'string') {
      // If using existing resume, include the URL in formData JSON instead
      // This will be handled in the formDataJson below
    }
    
    if (coverLetterFile && coverLetterMode === 'file') {
      submitFormData.append('coverLetterFile', coverLetterFile);
    }

    // 2. Add dynamic file fields from appFormFields
    appFormFields
      .filter(field => field.fieldType === 'file' && field.fieldState !== 'off')
      .forEach(field => {
        const file = formData[field.key as keyof ApplicationFormData];
        if (file instanceof File) {
          submitFormData.append(`field_${field.id}`, file);
        }
      });

    // 3. Prepare profileUpdates (only include changed fields)
    const profileUpdates: Partial<ProfileData> = {};
    
    if (formData.full_name !== profile?.fullname) {
      profileUpdates.fullname = formData.full_name as string;
    }
    
    if (formData.phone_number !== profile?.phone) {
      profileUpdates.phone = formData.phone_number as string;
    }
    
    if (formData.domicile !== profile?.location) {
      profileUpdates.location = formData.domicile as string;
    }
    
    if (formData.email !== profile?.email) {
      profileUpdates.email = formData.email as string;
    }
    
    if (formData.linkedin_url !== profile?.linkedinUrl) {
      profileUpdates.linkedinUrl = formData.linkedin_url as string;
    }
    
    if (formData.date_of_birth !== getProfileDateOfBirth()) {
      profileUpdates.dateOfBirth = formData.date_of_birth as Date;
    }
    
    if (formData.gender !== profile?.gender) {
      profileUpdates.gender = formData.gender as string;
    }
    
    if (avatarPreview && avatarPreview !== profile?.avatarUrl) {
      profileUpdates.avatarUrl = avatarPreview;
    }

    // 4. Prepare userInfoUpdates (only include changed fields)
    const otherInfoUpdates = appFormFields
      .filter((appField: AppFormField) => appField.fieldState !== "off")
      .map((appField: AppFormField) => {
        const fieldKey = appField.key;
        const currentValue = formData[fieldKey as keyof ApplicationFormData];
        
        // Find existing record
        let existingId: string | undefined;
        let existingValue: string | undefined;
        
        if (profile?.otherInfo && Array.isArray(profile.otherInfo)) {
          const existingInfo = (profile.otherInfo as unknown as OtherInfoData[]).find(
            (info: OtherInfoData) => info.field.key === appField.id
          );
          existingId = existingInfo?.id;
          existingValue = existingInfo?.infoFieldAnswer;
        }

        // Only include if value changed
        if (String(currentValue) !== existingValue) {
          return {
            id: existingId,
            fieldId: appField.id,
            infoFieldAnswer: typeof currentValue === 'string' ? currentValue : String(currentValue),
          };
        }
        
        return null;
      })
      .filter(Boolean);

    // 5. Prepare application formData
    const coverLetterContent = coverLetterMode === "text"
      ? formData.coverLetter
      : coverLetterFile?.name || "";

    // Serialize all form responses to handle long text and complex data
    const serializedFormResponse: Record<string, unknown> = {};

    // Serialize each form field value
    Object.entries(formData).forEach(([key, value]) => {
      // Skip files and already handled fields
      if (
        key === 'resume' || 
        key === 'coverLetterFile' || 
        key === 'coverLetter' || 
        key === 'source' ||
        value instanceof File
      ) {
        return;
      }
      
      // Handle different data types
      if (typeof value === 'string' && value.length > 1000) {
        // Mark long text for special handling if needed
        serializedFormResponse[key] = value;
      } else if (value instanceof Date) {
        serializedFormResponse[key] = value.toISOString();
      } else {
        serializedFormResponse[key] = value;
      }
    });

    const formDataJson = {
      formResponse: formData,
      coverLetter: coverLetterContent,
      source: formData.source || 'direct',
      // Include existing resume URL if not uploading new file
      ...(typeof formData.resume === 'string' && !resumeFile ? { resumeUrl: formData.resume } : {})
    };

    // 6. Append JSON data
    submitFormData.append('formData', JSON.stringify(formDataJson));
    submitFormData.append('profileUpdates', JSON.stringify(profileUpdates));
    submitFormData.append('userInfoUpdates', JSON.stringify(otherInfoUpdates));

    // Debug logging
    console.log('=== FormData being sent to API ===');
    for (const [key, value] of submitFormData.entries()) {
      if (value instanceof File) {
        console.log(`📎 ${key}:`, value.name, `(${value.size} bytes)`);
      } else {
        console.log(`📋 ${key}:`, value);
      }
    }

    return submitFormData;
  };

  const handleFormSubmit = async (formData: ApplicationFormData) => {
    if (!profile) return;

    try {
      const formDataToSubmit = prepareFormData(formData);
      await onSubmit(formDataToSubmit);
    } catch (error) {
      console.error('Application submission error:', error);
      throw error;
    }
  };

  // ========== Render Field Functions ==========
  
  const renderFormField = (appField: AppFormField) => {
    const { fieldState } = appField;
    const isRequired = fieldState === 'mandatory';
    const error = errors[appField.key as keyof ApplicationFormData];

    const commonProps = {
      ...register(appField.key as keyof ApplicationFormData),
      className: "h-10 border-2 border-neutral-40 bg-neutral-10 rounded-lg px-4 text-sm leading-6 text-neutral-100 placeholder:text-neutral-60 font-sans focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:border-transparent",
      placeholder: appField.placeholder || `Enter your ${appField.label.toLowerCase()}`,
    };

    switch (appField.fieldType) {
      case 'text':
      case 'email':
      case 'url':
        return (
          <Field key={appField.id}>
            <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
              {appField.label}
              {isRequired && <span className="text-danger">*</span>}
            </FieldLabel>
            <Input
              type={appField.fieldType}
              {...commonProps}
            />
            {appField.description && (
              <FieldDescription className="text-xs text-neutral-60 mt-1">
                {appField.description}
              </FieldDescription>
            )}
            {error && (
              <FieldDescription className="text-danger">
                {error.message}
              </FieldDescription>
            )}
          </Field>
        );

      case 'textarea':
        return (
          <Field key={appField.id}>
            <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
              {appField.label}
              {isRequired && <span className="text-danger">*</span>}
            </FieldLabel>
            <Textarea
              {...commonProps}
              className="min-h-20 border-2 border-neutral-40 bg-neutral-10 resize-y"
              rows={4}
            />
            {appField.description && (
              <FieldDescription className="text-xs text-neutral-60 mt-1">
                {appField.description}
              </FieldDescription>
            )}
            {error && (
              <FieldDescription className="text-danger">
                {error.message}
              </FieldDescription>
            )}
          </Field>
        );

      case 'number':
        return (
          <Field key={appField.id}>
            <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
              {appField.label}
              {isRequired && <span className="text-danger">*</span>}
            </FieldLabel>
            <Input
              type="number"
              {...commonProps}
              min={appField.validation?.min}
              max={appField.validation?.max}
            />
            {appField.description && (
              <FieldDescription className="text-xs text-neutral-60 mt-1">
                {appField.description}
              </FieldDescription>
            )}
            {error && (
              <FieldDescription className="text-danger">
                {error.message}
              </FieldDescription>
            )}
          </Field>
        );

      case 'select':
        return (
          <Field key={appField.id}>
            <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
              {appField.label}
              {isRequired && <span className="text-danger">*</span>}
            </FieldLabel>
            <div className="relative">
              <select
                {...commonProps}
                className="w-full h-10 px-4 py-2 border-2 border-neutral-40 bg-neutral-10 rounded-lg text-sm leading-6 text-neutral-60 font-sans appearance-none focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:border-transparent cursor-pointer"
              >
                <option value="">Select an option</option>
                {appField.options?.split(',').map((option: string) => (
                  <option key={option.trim()} value={option.trim()}>
                    {option.trim()}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-neutral-100" strokeWidth={1.5} />
              </div>
            </div>
            {appField.description && (
              <FieldDescription className="text-xs text-neutral-60 mt-1">
                {appField.description}
              </FieldDescription>
            )}
            {error && (
              <FieldDescription className="text-danger">
                {error.message}
              </FieldDescription>
            )}
          </Field>
        );

      case 'date':
        return (
          <Field key={appField.id}>
            <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
              {appField.label}
              {isRequired && <span className="text-danger">*</span>}
            </FieldLabel>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Calendar className="w-4 h-4 text-neutral-100" />
              </div>
              <Input
                type="date"
                {...commonProps}
                className="w-full h-10 pl-12 pr-12 py-2 border-2 border-neutral-40 bg-neutral-10 rounded-lg text-sm leading-6 text-neutral-100 placeholder:text-neutral-60 font-sans focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:border-transparent"
                min={appField.validation?.minDate}
                max={appField.validation?.maxDate}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-neutral-100" />
              </div>
            </div>
            {appField.description && (
              <FieldDescription className="text-xs text-neutral-60 mt-1">
                {appField.description}
              </FieldDescription>
            )}
            {error && (
              <FieldDescription className="text-danger">
                {error.message}
              </FieldDescription>
            )}
          </Field>
        );

      case 'radio':
        return (
          <Field key={appField.id}>
            <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
              {appField.label}
              {isRequired && <span className="text-danger">*</span>}
            </FieldLabel>
            <FieldGroup className="flex flex-col gap-3">
              {appField.options?.split(',').map((option: string) => (
                <label key={option.trim()} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value={option.trim()}
                    {...register(appField.key as keyof ApplicationFormData)}
                    className="w-6 h-6 border-2 border-neutral-90 rounded-full appearance-none checked:border-8 checked:border-neutral-90 cursor-pointer"
                  />
                  <span className="text-sm leading-6 text-neutral-90 font-sans">
                    {option.trim()}
                  </span>
                </label>
              ))}
            </FieldGroup>
            {appField.description && (
              <FieldDescription className="text-xs text-neutral-60 mt-1">
                {appField.description}
              </FieldDescription>
            )}
            {error && (
              <FieldDescription className="text-danger">
                {error.message}
              </FieldDescription>
            )}
          </Field>
        );

      case 'checkbox':
        return (
          <Field key={appField.id}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register(appField.key as keyof ApplicationFormData)}
                className="w-6 h-6 border-2 border-neutral-90 rounded checked:bg-neutral-90 cursor-pointer"
              />
              <span className="text-sm leading-6 text-neutral-90 font-sans">
                {appField.label}
                {isRequired && <span className="text-danger">*</span>}
              </span>
            </label>
            {appField.description && (
              <FieldDescription className="text-xs text-neutral-60 mt-1 ml-8">
                {appField.description}
              </FieldDescription>
            )}
            {error && (
              <FieldDescription className="text-danger">
                {error.message}
              </FieldDescription>
            )}
          </Field>
        );

      // Special field types with custom UI
      case 'phone_number':
        return (
          <Field key={appField.id}>
            <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
              {appField.label}
              {isRequired && <span className="text-danger">*</span>}
            </FieldLabel>
            <div className="flex h-10 border-2 border-neutral-40 bg-neutral-10 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-neutral-100 focus-within:border-transparent">
              <div className="flex items-center gap-1 px-4 border-r border-neutral-40">
                <div className="w-4 h-4 rounded-full overflow-hidden bg-gray-200 shrink-0">
                  <svg viewBox="0 0 16 16" className="w-full h-full">
                    <rect width="16" height="5.33" fill="#CE1126" />
                    <rect y="10.67" width="16" height="5.33" fill="#CE1126" />
                    <rect y="5.33" width="16" height="5.33" fill="#FFF" />
                  </svg>
                </div>
                <ChevronDown className="w-4 h-4 text-neutral-100" strokeWidth={1.5} />
              </div>
              <span className="flex items-center px-3 text-sm leading-6 text-neutral-90 font-sans border-r border-neutral-40">
                +62
              </span>
              <Input
                type="tel"
                {...register(appField.key as keyof ApplicationFormData)}
                placeholder={appField.placeholder || "81XXXXXXXXX"}
                className="flex-1 px-4 text-sm leading-6 text-neutral-100 placeholder:text-neutral-60 font-sans bg-transparent border-none focus:ring-0"
              />
            </div>
            {appField.description && (
              <FieldDescription className="text-xs text-neutral-60 mt-1">
                {appField.description}
              </FieldDescription>
            )}
            {error && (
              <FieldDescription className="text-danger">
                {error.message}
              </FieldDescription>
            )}
          </Field>
        );

      case 'file':
        return (
          <Field key={appField.id}>
            <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
              {appField.label}
              {isRequired && <span className="text-danger">*</span>}
            </FieldLabel>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                id={appField.key}
                accept={appField.validation?.fileTypes?.join(',')}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setValue(appField.key as keyof ApplicationFormData, file, { shouldValidate: true });
                  }
                }}
                className="hidden"
              />
              <label
                htmlFor={appField.key}
                className="flex items-center gap-2 px-4 py-2 border border-neutral-40 bg-neutral-10 rounded-lg text-sm leading-6 text-neutral-90 font-sans cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload {appField.label}
              </label>
              
              {/* File info display */}
              {formValues[appField.key as keyof ApplicationFormData] instanceof File && (
                <div className="flex items-center gap-2 p-3 border border-neutral-40 bg-neutral-10 rounded-lg">
                  <FileText className="w-5 h-5 text-neutral-100" />
                  <span className="flex-1 text-sm leading-6 text-neutral-90 font-sans">
                    {(formValues[appField.key as keyof ApplicationFormData] as File).name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setValue(appField.key as keyof ApplicationFormData, '' as never, { shouldValidate: true });
                      const fileInput = document.getElementById(appField.key) as HTMLInputElement;
                      if (fileInput) fileInput.value = '';
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-4 h-4 text-neutral-100" />
                  </button>
                </div>
              )}
              
              {/* Help text */}
              <div className="text-xs text-neutral-60">
                <p>Maximum file size: {MAX_FILE_SIZE / 1024 / 1024}MB</p>
                {appField.validation?.fileTypes && (
                  <p>Accepted types: {appField.validation.fileTypes.join(', ')}</p>
                )}
              </div>
            </div>
            {appField.description && (
              <FieldDescription className="text-xs text-neutral-60 mt-1">
                {appField.description}
              </FieldDescription>
            )}
            {error && (
              <FieldDescription className="text-danger">
                {error.message}
              </FieldDescription>
            )}
          </Field>
        );
      default:
        return (
          <Field key={appField.id}>
            <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
              {appField.label}
              {isRequired && <span className="text-danger">*</span>}
            </FieldLabel>
            {appField.fieldType === 'textarea' ? (
              <Textarea
                {...register(appField.key as keyof ApplicationFormData)}
                placeholder={appField.placeholder || `Enter your ${appField.label.toLowerCase()}`}
                className="min-h-20 border-2 border-neutral-40 bg-neutral-10"
              />
            ) : (
              <Input
                {...register(appField.key as keyof ApplicationFormData)}
                placeholder={appField.placeholder || `Enter your ${appField.label.toLowerCase()}`}
                className="h-10 border-2 border-neutral-40 bg-neutral-10"
              />
            )}
            {appField.description && (
              <FieldDescription className="text-xs text-neutral-60 mt-1">
                {appField.description}
              </FieldDescription>
            )}
            {error && (
              <FieldDescription className="text-danger">
                {error.message}
              </FieldDescription>
            )}
          </Field>
        );
    }
  };

  // if (appFormFields.length === 0) {
  //   return (
  //     <div className="text-center p-8">
  //       <h3 className="text-lg font-semibold mb-2">No application form available</h3>
  //       <p className="text-sm text-muted-foreground">
  //         This job is not currently accepting applications.
  //       </p>
  //     </div>
  //   );
  // }

  const visibleFields = appFormFields
    .filter((field: AppFormField) => {
      return field.fieldState !== "off" && !isCommonProfileField(field.key);
    })
    .sort((a: AppFormField, b: AppFormField) => (a.sortOrder || 0) - (b.sortOrder || 0));

  if (showGestureCapture) {
    return (
      <div className="min-h-screen bg-neutral-10 flex items-center justify-center p-4">
        <GestureProfileCapture
          onSave={handleGestureCaptureSave}
          onClose={() => setShowGestureCapture(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-10 flex items-center justify-center p-4 sm:p-6 md:p-10">
      <div className="w-full max-w-[700px] border border-neutral-40 bg-neutral-10 rounded-none shadow-sm">
        <div className="p-6 sm:p-8 md:p-10 flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <Button
              onClick={onCancel}
              className="flex items-center justify-center p-1 border border-neutral-40 bg-neutral-10 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
              aria-label="Go back"
              type="button"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-100" strokeWidth={2} />
            </Button>
            <div className="flex-1 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <h1 className="text-lg font-bold leading-7 text-neutral-100 font-sans">
                Apply {job.title} at {job?.company?.name}
              </h1>
              <div className="flex items-center gap-3">
                <div className="flex items-start gap-2 text-sm leading-6 text-neutral-90 font-sans">
                  <span className="text-secondary-foreground">ℹ️</span>
                  <span className="whitespace-nowrap">This field required to fill</span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <FieldGroup className="flex flex-col gap-4">
              <p className="text-xs font-bold leading-5 text-danger font-sans">
                * Required
              </p>

              {/* Photo Profile Field with Gesture Capture */}
              <FieldSet>
                <FieldLabel className="text-s font-bold leading-5 text-neutral-90 font-sans">
                  Photo Profile
                <span className="text-danger">*</span>
                </FieldLabel>
                <div className="flex flex-col gap-2">
                  <div className="w-32 h-32 rounded-full bg-cover bg-center">
                    <Image width={128} height={128} className="object-cover object-center" src={avatarPreview? avatarPreview : "/Avatar.svg"} alt={"avatar"} />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => setShowGestureCapture(true)}
                      className="flex gap-2 px-4 py-1 border-2 items-normal content-center border-neutral-40 bg-neutral-10 rounded-xl text-sm font-bold shadow-xl leading-6 text-neutral-100 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <Camera className="size-5 stroke-3 font-bold" />
                      <b>Take a Picture</b>
                    </Button>
                  </div>
                </div>
              </FieldSet>
  
              {/* Profile Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <Field>
                  <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
                    Full Name
                    <span className="text-danger-main">*</span>
                  </FieldLabel>
                  <Input
                    type="text"
                    {...register('full_name')}
                    placeholder="Enter your full name"
                    className="h-10 border-2 border-neutral-40 bg-neutral-10 rounded-lg px-4 text-sm leading-6 text-neutral-100 placeholder:text-neutral-60 font-sans focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:border-transparent"
                  />
                  {errors.full_name && (
                    <FieldDescription className="text-danger-main">
                      {errors.full_name.message}
                    </FieldDescription>
                  )}
                </Field>

                {/* Email */}
                <Field>
                  <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
                    Email
                    <span className="text-danger-main">*</span>
                  </FieldLabel>
                  <Input
                    type="email"
                    {...register('email')}
                    placeholder="Enter your email address"
                    className="h-10 border-2 border-neutral-40 bg-neutral-10 rounded-lg px-4 text-sm leading-6 text-neutral-100 placeholder:text-neutral-60 font-sans focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:border-transparent"
                  />
                  {errors.email && (
                    <FieldDescription className="text-danger-main">
                      {errors.email.message}
                    </FieldDescription>
                  )}
                </Field>

                {/* Phone Number */}
                <Field>
                  <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
                    Phone Number
                    <span className="text-danger-main">*</span>
                  </FieldLabel>
                  <PhoneInput {...register('phone_number')} />
                  {errors.phone_number && (
                    <FieldDescription className="text-danger-main">
                      {errors.phone_number.message}
                    </FieldDescription>
                  )}
                </Field>

                {/* Date of Birth */}
                <Field>
                  <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
                    Date of Birth
                    <span className="text-danger-main">*</span>
                  </FieldLabel>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Calendar className="w-4 h-4 text-neutral-100" />
                    </div>
                    <Input
                      type="date"
                      {...register('date_of_birth')}
                      className="w-full h-10 pl-12 pr-12 py-2 border-2 border-neutral-40 bg-neutral-10 rounded-lg text-sm leading-6 text-neutral-100 placeholder:text-neutral-60 font-sans focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:border-transparent"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronDown className="w-4 h-4 text-neutral-100" />
                    </div>
                  </div>
                  {errors.date_of_birth && (
                    <FieldDescription className="text-danger-main">
                      {errors.date_of_birth.message}
                    </FieldDescription>
                  )}
                </Field>

                {/* Gender */}
                <Field>
                  <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
                    Gender
                    <span className="text-danger-main">*</span>
                  </FieldLabel>
                  <FieldGroup className="flex flex-col sm:flex-row gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="female"
                        {...register('gender')}
                        className="w-6 h-6 border-2 border-neutral-90 rounded-full appearance-none checked:border-8 checked:border-neutral-90 cursor-pointer"
                      />
                      <span className="text-sm leading-6 text-neutral-90 font-sans">
                        She/her (Female)
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="male"
                        {...register('gender')}
                        className="w-6 h-6 border-2 border-neutral-90 rounded-full appearance-none checked:border-8 checked:border-neutral-90 cursor-pointer"
                      />
                      <span className="text-sm leading-6 text-neutral-90 font-sans">
                        He/him (Male)
                      </span>
                    </label>
                  </FieldGroup>
                  {errors.gender && (
                    <FieldDescription className="text-danger-main">
                      {errors.gender.message}
                    </FieldDescription>
                  )}
                </Field>

                {/* Domicile */}
                <Controller
                  name="domicile"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
                        Domicile
                        <span className="text-danger-main">*</span>
                      </FieldLabel>
                      <WilayahAutocomplete
                        value={field.value as string}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Pilih domisili..."
                      />
                      {errors.domicile && (
                        <FieldDescription className="text-danger-main">
                          {errors.domicile.message}
                        </FieldDescription>
                      )}
                    </Field>
                  )}
                />
                

                {/* LinkedIn URL */}
                <Field className="md:col-span-2">
                  <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
                    LinkedIn Profile URL
                    <span className="text-danger-main">*</span>
                  </FieldLabel>
                  <Input
                    type="url"
                    {...register('linkedin_url')}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="h-10 border-2 border-neutral-40 bg-neutral-10 rounded-lg px-4 text-sm leading-6 text-neutral-100 placeholder:text-neutral-60 font-sans focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:border-transparent"
                  />
                  {errors.linkedin_url && (
                    <FieldDescription className="text-danger-main">
                      {errors.linkedin_url.message}
                    </FieldDescription>
                  )}
                </Field>
              </div>
              {/* Dynamic Form Fields */}
              {visibleFields.length > 0 && visibleFields
                .filter((field: AppFormField) => field.key !== 'photo_profile')
                .sort((a: AppFormField, b: AppFormField) => (a.sortOrder || 0) - (b.sortOrder || 0))
                .map((appField: AppFormField) => renderFormField(appField))}

              {/* Resume Upload */}
              <Field>
                <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
                  Resume
                  <span className="text-danger">*</span>
                </FieldLabel>
                <div className="flex flex-col gap-2">
                  {/* Show current resume from profile with option to replace */}
                  {resumeUrl && !resumeFile ? (
                    <div className="flex flex-col gap-3 p-4 border border-neutral-40 bg-neutral-10 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-neutral-100" />
                        <span className="flex-1 text-sm leading-6 text-neutral-90 font-sans">
                          {resumeUrl}
                        </span>
                        <button
                          type="button"
                          onClick={removeResumeFile}
                          className="p-1 hover:bg-gray-100 rounded"
                          aria-label="Remove current resume"
                        >
                          <X className="w-4 h-4 text-neutral-100" />
                        </button>
                      </div>
                      
                      {/* Option to upload new resume */}
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          id="resume"
                          accept=".pdf,.doc,.docx"
                          onChange={handleResumeChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="resume"
                          className="flex items-center gap-2 px-4 py-2 border border-neutral-40 bg-white rounded-lg text-sm leading-6 text-neutral-90 font-sans cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <Upload className="w-4 h-4" />
                          Upload New Resume (Replace Current)
                        </label>
                        <p className="text-xs text-neutral-60">
                          Upload a new file to replace your current resume
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* No resume or new resume uploaded */
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        id="resume"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="resume"
                        className="flex items-center gap-2 px-4 py-2 border border-neutral-40 bg-neutral-10 rounded-lg text-sm leading-6 text-neutral-90 font-sans cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        {profile?.resumeUrl ? 'Upload New Resume' : 'Upload Resume'}
                      </label>
                      <p className="text-xs text-neutral-60">
                        Accepted file types: PDF, DOC, DOCX (Max 5MB)
                      </p>
                    </div>
                  )}
                  
                  {/* Show newly uploaded resume file */}
                  {resumeFile && (
                    <div className="flex items-center gap-2 p-3 border border-neutral-40 bg-neutral-10 rounded-lg">
                      <FileText className="w-5 h-5 text-neutral-100" />
                      <span className="flex-1 text-sm leading-6 text-neutral-90 font-sans">
                        {resumeFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={removeResumeFile}
                        className="p-1 hover:bg-gray-100 rounded"
                        aria-label="Remove uploaded resume"
                      >
                        <X className="w-4 h-4 text-neutral-100" />
                      </button>
                    </div>
                  )}
                </div>
                {errors.resume && (
                  <FieldDescription className="text-danger">
                    {errors.resume.message}
                  </FieldDescription>
                )}
              </Field>

              {/* Cover Letter */}
              <Field>
                <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
                  Cover Letter
                </FieldLabel>
                
                {/* Cover Letter Mode Toggle */}
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="text"
                      checked={coverLetterMode === 'text'}
                      onChange={() => {
                        setCoverLetterMode('text');
                        setCoverLetterFile(null);
                        setValue('coverLetterFile', undefined, { shouldValidate: true });
                      }}
                      className="w-6 h-6 border-2 border-neutral-90 rounded-full appearance-none checked:border-8 checked:border-neutral-90 cursor-pointer"
                    />
                    <span className="text-sm leading-6 text-neutral-90 font-sans">
                      Write Cover Letter
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="file"
                      checked={coverLetterMode === 'file'}
                      onChange={() => {
                        setCoverLetterMode('file');
                        setValue('coverLetter', '', { shouldValidate: true });
                      }}
                      className="w-6 h-6 border-2 border-neutral-90 rounded-full appearance-none checked:border-8 checked:border-neutral-90 cursor-pointer"
                    />
                    <span className="text-sm leading-6 text-neutral-90 font-sans">
                      Upload Cover Letter
                    </span>
                  </label>
                </div>

                {coverLetterMode === 'text' ? (
                  <Textarea
                    {...register('coverLetter')}
                    placeholder="Write your cover letter here..."
                    className="min-h-32 border-2 border-neutral-40 bg-neutral-10 resize-y"
                    rows={6}
                  />
                ) : (
                  <div className="flex flex-col gap-2">
                    {!coverLetterFile ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          id="coverLetterFile"
                          accept=".pdf,.doc,.docx"
                          onChange={handleCoverLetterFileChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="coverLetterFile"
                          className="flex items-center gap-2 px-4 py-2 border border-neutral-40 bg-neutral-10 rounded-lg text-sm leading-6 text-neutral-90 font-sans cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          Upload Cover Letter
                        </label>
                        <p className="text-xs text-neutral-60">
                          Accepted file types: PDF, DOC, DOCX (Max 5MB)
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 border border-neutral-40 bg-neutral-10 rounded-lg">
                        <FileText className="w-5 h-5 text-neutral-100" />
                        <span className="flex-1 text-sm leading-6 text-neutral-90 font-sans">
                          {coverLetterFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={removeCoverLetterFile}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <X className="w-4 h-4 text-neutral-100" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {errors.coverLetter && (
                  <FieldDescription className="text-danger">
                    {errors.coverLetter.message}
                  </FieldDescription>
                )}
              </Field>

              {/* Source */}
              <Field>
                <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
                  How did you hear about this position?
                  <span className="text-danger">*</span>
                </FieldLabel>
                <div className="relative">
                  <select
                    {...register('source')}
                    className="w-full h-10 px-4 py-2 border-2 border-neutral-40 bg-neutral-10 rounded-lg text-sm leading-6 text-neutral-60 font-sans appearance-none focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:border-transparent cursor-pointer"
                  >
                    <option value="">Select an option</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="job-board">Job Board</option>
                    <option value="company-website">Company Website</option>
                    <option value="referral">Referral</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-neutral-100" strokeWidth={1.5} />
                  </div>
                </div>
                {errors.source && (
                  <FieldDescription className="text-danger">
                    {errors.source.message}
                  </FieldDescription>
                )}
              </Field>

              <div className="flex flex-col gap-4 mt-6">
                {/* Compact submission error */}
                {submitError && !isSubmitting && !isSending && (
                  <div className="flex items-center gap-3 p-3 border border-red-300 bg-red-50 rounded-lg">
                    <svg className="w-4 h-4 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-red-700 flex-1">
                      {submitError.message}
                    </span>
                  </div>
                )}
                {/* Submit Button */}
                <div className="flex justify-end mt-6">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !isValid}
                    className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting || isSending ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </div>
            </FieldGroup>
          </form>
        </div>
      </div>
    </div>
  );
}