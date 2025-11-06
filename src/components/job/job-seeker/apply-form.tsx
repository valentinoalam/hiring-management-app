/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { useState, useEffect, useMemo, useRef } from "react";
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
import { Card } from "@/components/ui/card";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { OtherInfo, OtherInfoData, Profile, ProfileData, ProfileOtherInfo, transformProfileUserInfo } from "@/types/user";
import { AppFormField, ApplicantData, ApplicationData, Job } from "@/types/job";
import Image from "next/image";
import React from "react";
import { useRouter } from "next/navigation";

// File validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
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

// Dynamic schema based on AppFormField configuration
const createApplicationSchema = (appFormFields: AppFormField[]) => {
  const schema: Record<string, z.ZodTypeAny> = {};

  // Sort fields by sortOrder first
  const sortedFields = [...appFormFields]
    .filter(field => field.fieldState !== 'off')
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  sortedFields.forEach((field) => {
    const { field: fieldConfig, fieldState } = field;
    const isRequired = fieldState === 'mandatory';

    // Create base validator based on field type
    let fieldValidator: z.ZodTypeAny;

    switch (fieldConfig.fieldType) {
      case 'email':
        fieldValidator = z.string().email("Invalid email address");
        break;
      case 'url':
        fieldValidator = z.string().url("Must be a valid URL");
        break;
      case 'number':
        fieldValidator = z.number().or(z.string().transform(val => Number(val)));
        // Add validation from field.validation
        if (fieldConfig.validation?.min !== undefined) {
          fieldValidator = fieldValidator.refine(
            val => Number(val) >= fieldConfig.validation!.min!,
            `Must be at least ${fieldConfig.validation.min}`
          );
        }
        if (fieldConfig.validation?.max !== undefined) {
          fieldValidator = fieldValidator.refine(
            (val: unknown) => Number(val) <= fieldConfig.validation!.max!,
            `Must be at most ${fieldConfig.validation.max}`
          );
        }
        break;
      case 'date':
        fieldValidator = z.string();
        // Add date validation
        if (fieldConfig.validation?.minDate) {
          fieldValidator = fieldValidator.refine(
            (date: unknown) => new Date(String(date)) >= new Date(fieldConfig.validation!.minDate!),
            `Date must be after ${fieldConfig.validation.minDate}`
          );
        }
        if (fieldConfig.validation?.maxDate) {
          fieldValidator = fieldValidator.refine(
            (date: unknown) => new Date(String(date)) <= new Date(fieldConfig.validation!.maxDate!),
            `Date must be before ${fieldConfig.validation.maxDate}`
          );
        }
        break;
      case 'file':
        // File field validation
        fieldValidator = z.instanceof(File)
          .refine(file => file.size <= MAX_FILE_SIZE, `File must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`);
        
        // Add file type validation if specified
        if (fieldConfig.validation?.fileTypes && fieldConfig.validation.fileTypes.length > 0) {
          fieldValidator = fieldValidator.refine(
            (file: unknown) => fieldConfig.validation!.fileTypes!.includes((file as File).type),
            `File must be one of: ${fieldConfig.validation.fileTypes.join(', ')}`
          );
        }
        
        // Make optional if not required
        if (!isRequired) {
          fieldValidator = fieldValidator.optional().or(z.literal(undefined));
        }
        break;
      case 'checkbox':
        fieldValidator = z.boolean().or(z.literal('on'));
        break;
      case 'radio':
      case 'select':
        fieldValidator = z.string();
        break;
      case 'textarea':
        fieldValidator = z.string();
        break;
      default: // text, phone, etc.
        fieldValidator = z.string();
    }

    // For string-based fields, add string-specific validations
    if (!['file', 'checkbox'].includes(fieldConfig.fieldType)) {
      if (isRequired) {
        fieldValidator = (fieldValidator as z.ZodString).min(1, `${fieldConfig.label} is required`);
      }
      
      // Add phone number validation for phone fields
      if (fieldConfig.key === 'phone_number') {
        fieldValidator = (fieldValidator as z.ZodString).regex(/^\+?[\d\s-()]+$/, "Invalid phone number format");
      }
    }

    // Handle required/optional for non-file fields
    if (!isRequired && fieldConfig.fieldType !== 'file') {
      if (fieldValidator instanceof z.ZodString) {
        fieldValidator = fieldValidator.optional().or(z.literal(''));
      } else {
        fieldValidator = fieldValidator.optional();
      }
    }

    schema[fieldConfig.key] = fieldValidator;
  });

  // Add fixed application fields (resume, cover letter, source)
  schema.resume = z.instanceof(File, { message: "Resume is required" })
    .refine(file => file.size <= MAX_FILE_SIZE, "Resume must be less than 5MB")
    .refine(file => ACCEPTED_RESUME_TYPES.includes(file.type), "Resume must be PDF or Word document");

  schema.coverLetter = z.string().min(1, "Cover letter is required").optional().or(z.literal(''));
  
  schema.coverLetterFile = z.instanceof(File)
    .refine(file => file.size <= MAX_FILE_SIZE, "Cover letter file must be less than 5MB")
    .refine(file => ACCEPTED_RESUME_TYPES.includes(file.type), "Cover letter must be PDF or Word document")
    .optional()
    .or(z.literal(undefined));

  schema.source = z.string().min(1, "Please specify how you heard about this position");

  return z.object(schema);
};

type ApplicationFormData = z.infer<ReturnType<typeof createApplicationSchema>>;

interface JobApplicationFormProps {
  job: Job;
  appFormFields: AppFormField[];
  userProfile: Profile | null | undefined;
  onSubmit: (applicationData: FormData) => Promise<unknown>;
  onCancel: () => void;
}

// Gesture Profile Capture Component
function GestureProfileCapture({ 
  onSave, 
  onClose 
}: { 
  onSave?: (imageData: string) => void; 
  onClose?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [message, setMessage] = useState<string>("");

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setMessage("Show your hand to capture profile picture");
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setMessage("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext("2d");
    if (context) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      const imageData = canvasRef.current.toDataURL("image/jpeg");
      setCapturedImage(imageData);
      setMessage("✓ Photo captured! Review and save.");
      stopCamera();
    }
  };

  const handleSave = () => {
    if (capturedImage && onSave) {
      onSave(capturedImage);
      setMessage("✓ Profile picture saved!");
    }
  };

  const handleReset = () => {
    setCapturedImage(null);
    setMessage("");
    startCamera();
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Capture Profile Picture</h2>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden mb-4">
        {!capturedImage ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover" 
          />
        ) : (
          <Image 
            width={300} 
            height={300}
            src={capturedImage || "/placeholder.svg"}
            alt="Captured profile"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {message && <p className="text-center text-sm font-medium mb-4 text-blue-600">{message}</p>}

      <div className="flex gap-3">
        {!cameraActive && !capturedImage ? (
          <Button onClick={startCamera} className="flex-1 gap-2">
            <Camera className="w-4 h-4" />
            Start Camera
          </Button>
        ) : cameraActive ? (
          <>
            <Button onClick={stopCamera} variant="outline" className="flex-1 gap-2">
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button onClick={capturePhoto} className="flex-1 gap-2">
              <Camera className="w-4 h-4" />
              Capture
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleReset} variant="outline" className="flex-1 gap-2">
              <X className="w-4 h-4" />
              Retake
            </Button>
            <Button onClick={handleSave} className="flex-1 gap-2">
              <Upload className="w-4 h-4" />
              Save
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

export default function JobApplicationForm({
  job,
  appFormFields,
  userProfile,
  onSubmit,
  onCancel
}: JobApplicationFormProps) {
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const [coverLetterMode, setCoverLetterMode] = useState<'text' | 'file'>('text');
  const [showGestureCapture, setShowGestureCapture] = useState(false);
  const router = useRouter();
  
  const profile = userProfile;
  
  // Set initial avatar preview when profile loads
  React.useEffect(() => {
    if (userProfile?.avatarUrl && !avatarPreview) {
      setAvatarPreview(userProfile.avatarUrl);
    }
  }, [userProfile?.avatarUrl, avatarPreview]);

  const formSchema = createApplicationSchema(appFormFields);
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });
  const formValues = useWatch({ control });
  // Pre-fill form with existing profile data
  useEffect(() => {
    if (profile && appFormFields.length > 0) {
      const fieldValues: Partial<ApplicationFormData> = {};

      // Transform profile.otherInfo if it's in array format
      const transformedOtherInfo = profile.otherInfo && Array.isArray(profile.otherInfo) 
        ? transformProfileUserInfo(profile.otherInfo as OtherInfoData[])
        : (profile.otherInfo as OtherInfo | undefined);

      appFormFields.forEach((appField: AppFormField) => {
        if (appField.fieldState !== "off") {
          const fieldKey = appField.field.key;
          
          // Try to get value from transformed otherInfo first
          if (transformedOtherInfo && transformedOtherInfo[fieldKey]) {
            fieldValues[fieldKey] = transformedOtherInfo[fieldKey].answer;
          } else {
            // Fall back to direct profile properties
            switch (fieldKey) {
              case 'phone_number':
                fieldValues[fieldKey] = profile.phone || "";
                break;
              case 'domicile':
                fieldValues[fieldKey] = profile.location || "";
                break;
              case 'linkedin_url':
                fieldValues[fieldKey] = profile.linkedinUrl || "";
                break;
              case 'full_name':
                fieldValues[fieldKey] = profile.fullname || "";
                break;
              case 'gender':
                // You might need to map this based on your data structure
                fieldValues[fieldKey] = ""; // Add gender logic if available
                break;
              case 'photo_profile':
                // Handle photo profile separately
                if (profile.avatarUrl) {
                  setAvatarPreview(profile.avatarUrl);
                }
                break;
              default:
                fieldValues[fieldKey] = "";
            }
          }
        }
      });

      // Set resume if available
      if (profile.resumeUrl) {
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
    }
  }, [profile, appFormFields, setValue]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        alert("Please upload a valid image file (JPG, PNG, or WebP)");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        alert("Image size must be less than 5MB");
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      setAvatarFile(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleGestureCaptureSave = (imageData: string) => {
    setAvatarPreview(imageData);
    setShowGestureCapture(false);
  };

  const handleResumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!ACCEPTED_RESUME_TYPES.includes(file.type)) {
        alert("Please upload a PDF or Word document");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        alert("Resume file size must be less than 5MB");
        return;
      }
      setResumeFile(file);
      setValue('resume', file, { shouldValidate: true });
    }
  };

  const handleCoverLetterFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!ACCEPTED_RESUME_TYPES.includes(file.type)) {
        alert("Please upload a PDF or Word document");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        alert("Cover letter file size must be less than 5MB");
        return;
      }
      setCoverLetterFile(file);
      setValue('coverLetterFile', file, { shouldValidate: true });
      setValue('coverLetter', '', { shouldValidate: false });
    }
  };

  const removeResumeFile = () => {
    setResumeFile(null);
    setValue('resume', '', { shouldValidate: true });
  };

  const removeCoverLetterFile = () => {
    setCoverLetterFile(null);
    setValue('coverLetterFile', undefined, { shouldValidate: true });
  };

  const prepareFormData = (formData: ApplicationFormData): FormData => {
    const submitFormData = new FormData();

    // 1. Add files
    const coverLetterContent = coverLetterMode === "text"
      ? formData.coverLetter
      : coverLetterFile?.name || "";
    if (avatarFile) submitFormData.append('avatar', avatarFile);
    if (resumeFile) submitFormData.append('resume', resumeFile);
    if (coverLetterFile && coverLetterMode === 'file') {
      submitFormData.append('coverLetterFile', coverLetterFile);
    }

    // 2. Add dynamic file fields from appFormFields
    appFormFields
      .filter(field => field.field.fieldType === 'file' && field.fieldState !== 'off')
      .forEach(field => {
        const file = formData[field.field.key as keyof ApplicationFormData];
        if (file instanceof File) {
          submitFormData.append(`field_${field.field.id}`, file);
        }
      });

    // 3. Add structured data as JSON strings
    const profileUpdates: Partial<ProfileData> = {
        phone: formData.phone_number as string || profile?.phone,
        location: formData.domicile as string || profile?.location,
        linkedinUrl: formData.linkedin_url as string || profile?.linkedinUrl,
        fullname: formData.full_name as string || profile?.fullname,
        // Handle avatar - if new avatar was captured/uploaded
        ...(avatarPreview && avatarPreview !== profile?.avatarUrl && { avatarUrl: avatarPreview }),
      };

    // Transform current otherInfo for updates
    const otherInfoUpdates = appFormFields
      .filter((appField: AppFormField) => appField.fieldState !== "off")
      .map((appField: AppFormField) => {
        const fieldKey = appField.field.key;
        const currentValue = formData[fieldKey as keyof ApplicationFormData];
        
        // Find existing record ID if it exists
        let existingId: string | undefined;
        if (profile?.otherInfo && Array.isArray(profile.otherInfo)) {
          const existingInfo = (profile.otherInfo as unknown as OtherInfoData[]).find(
            (info: OtherInfoData) => info.field.key === appField.field.id
          );
          existingId = existingInfo?.id;
        }

        return {
          id: existingId,
          fieldId: appField.field.id,
          infoFieldAnswer: typeof currentValue === 'string' ? currentValue : String(currentValue),
        };
      });

    submitFormData.append('profileUpdates', JSON.stringify(profileUpdates));
    submitFormData.append('userInfoUpdates', JSON.stringify(otherInfoUpdates));
    submitFormData.append('formResponse', JSON.stringify(formData));
    submitFormData.append('coverLetter', String(coverLetterContent));
    submitFormData.append('source', String(formData.source) || 'direct');

    return submitFormData;
  };

  const handleFormSubmit = async (formData: ApplicationFormData) => {
    if (!profile) return;

    try {
      const formDataToSubmit = prepareFormData(formData);
      await onSubmit(formDataToSubmit);
      router.push('/jobs/success');
    } catch (error) {
      console.error('Application submission error:', error);
      throw error;
    }
  };
  const renderFormField = (appField: AppFormField) => {
    const { field, fieldState } = appField;
    const isRequired = fieldState === 'mandatory';
    const error = errors[field.key as keyof ApplicationFormData];

    const commonProps = {
      ...register(field.key as keyof ApplicationFormData),
      className: "h-10 border-2 border-neutral-40 bg-neutral-10 rounded-lg px-4 text-sm leading-6 text-neutral-100 placeholder:text-neutral-60 font-sans focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:border-transparent",
      placeholder: field.placeholder || `Enter your ${field.label.toLowerCase()}`,
    };

    switch (field.fieldType) {
      case 'text':
      case 'email':
      case 'url':
        return (
          <Field key={field.id}>
            <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
              {field.label}
              {isRequired && <span className="text-danger-main">*</span>}
            </FieldLabel>
            <Input
              type={field.fieldType}
              {...commonProps}
            />
            {field.description && (
              <FieldDescription className="text-xs text-neutral-60 mt-1">
                {field.description}
              </FieldDescription>
            )}
            {error && (
              <FieldDescription className="text-danger-main">
                {error.message}
              </FieldDescription>
            )}
          </Field>
        );

      case 'textarea':
        return (
          <Field key={field.id}>
            <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
              {field.label}
              {isRequired && <span className="text-danger-main">*</span>}
            </FieldLabel>
            <Textarea
              {...commonProps}
              className="min-h-20 border-2 border-neutral-40 bg-neutral-10 resize-y"
              rows={4}
            />
            {field.description && (
              <FieldDescription className="text-xs text-neutral-60 mt-1">
                {field.description}
              </FieldDescription>
            )}
            {error && (
              <FieldDescription className="text-danger-main">
                {error.message}
              </FieldDescription>
            )}
          </Field>
        );

      case 'number':
        return (
          <Field key={field.id}>
            <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
              {field.label}
              {isRequired && <span className="text-danger-main">*</span>}
            </FieldLabel>
            <Input
              type="number"
              {...commonProps}
              min={field.validation?.min}
              max={field.validation?.max}
            />
            {field.description && (
              <FieldDescription className="text-xs text-neutral-60 mt-1">
                {field.description}
              </FieldDescription>
            )}
            {error && (
              <FieldDescription className="text-danger-main">
                {error.message}
              </FieldDescription>
            )}
          </Field>
        );

      case 'select':
        return (
          <Field key={field.id}>
            <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
              {field.label}
              {isRequired && <span className="text-danger-main">*</span>}
            </FieldLabel>
            <div className="relative">
              <select
                {...commonProps}
                className="w-full h-10 px-4 py-2 border-2 border-neutral-40 bg-neutral-10 rounded-lg text-sm leading-6 text-neutral-60 font-sans appearance-none focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:border-transparent cursor-pointer"
              >
                <option value="">Select an option</option>
                {field.options?.split(',').map((option: string) => (
                  <option key={option.trim()} value={option.trim()}>
                    {option.trim()}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-neutral-100" strokeWidth={1.5} />
              </div>
            </div>
            {field.description && (
              <FieldDescription className="text-xs text-neutral-60 mt-1">
                {field.description}
              </FieldDescription>
            )}
            {error && (
              <FieldDescription className="text-danger-main">
                {error.message}
              </FieldDescription>
            )}
          </Field>
        );

      case 'date':
        return (
          <Field key={field.id}>
            <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
              {field.label}
              {isRequired && <span className="text-danger-main">*</span>}
            </FieldLabel>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Calendar className="w-4 h-4 text-neutral-100" />
              </div>
              <Input
                type="date"
                {...commonProps}
                className="w-full h-10 pl-12 pr-12 py-2 border-2 border-neutral-40 bg-neutral-10 rounded-lg text-sm leading-6 text-neutral-100 placeholder:text-neutral-60 font-sans focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:border-transparent"
                min={field.validation?.minDate}
                max={field.validation?.maxDate}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-neutral-100" />
              </div>
            </div>
            {field.description && (
              <FieldDescription className="text-xs text-neutral-60 mt-1">
                {field.description}
              </FieldDescription>
            )}
            {error && (
              <FieldDescription className="text-danger-main">
                {error.message}
              </FieldDescription>
            )}
          </Field>
        );

      case 'radio':
        return (
          <Field key={field.id}>
            <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
              {field.label}
              {isRequired && <span className="text-danger-main">*</span>}
            </FieldLabel>
            <FieldGroup className="flex flex-col gap-3">
              {field.options?.split(',').map((option: string) => (
                <label key={option.trim()} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value={option.trim()}
                    {...register(field.key as keyof ApplicationFormData)}
                    className="w-6 h-6 border-2 border-neutral-90 rounded-full appearance-none checked:border-8 checked:border-neutral-90 cursor-pointer"
                  />
                  <span className="text-sm leading-6 text-neutral-90 font-sans">
                    {option.trim()}
                  </span>
                </label>
              ))}
            </FieldGroup>
            {field.description && (
              <FieldDescription className="text-xs text-neutral-60 mt-1">
                {field.description}
              </FieldDescription>
            )}
            {error && (
              <FieldDescription className="text-danger-main">
                {error.message}
              </FieldDescription>
            )}
          </Field>
        );

      case 'checkbox':
        return (
          <Field key={field.id}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register(field.key as keyof ApplicationFormData)}
                className="w-6 h-6 border-2 border-neutral-90 rounded checked:bg-neutral-90 cursor-pointer"
              />
              <span className="text-sm leading-6 text-neutral-90 font-sans">
                {field.label}
                {isRequired && <span className="text-danger-main">*</span>}
              </span>
            </label>
            {field.description && (
              <FieldDescription className="text-xs text-neutral-60 mt-1 ml-8">
                {field.description}
              </FieldDescription>
            )}
            {error && (
              <FieldDescription className="text-danger-main">
                {error.message}
              </FieldDescription>
            )}
          </Field>
        );

      // Special field types with custom UI
      case 'phone_number':
        return (
          <Field key={field.id}>
            <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
              {field.label}
              {isRequired && <span className="text-danger-main">*</span>}
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
                {...register(field.key as keyof ApplicationFormData)}
                placeholder={field.placeholder || "81XXXXXXXXX"}
                className="flex-1 px-4 text-sm leading-6 text-neutral-100 placeholder:text-neutral-60 font-sans bg-transparent border-none focus:ring-0"
              />
            </div>
            {field.description && (
              <FieldDescription className="text-xs text-neutral-60 mt-1">
                {field.description}
              </FieldDescription>
            )}
            {error && (
              <FieldDescription className="text-danger-main">
                {error.message}
              </FieldDescription>
            )}
          </Field>
        );

      case 'file':
        return (
          <Field key={field.id}>
            <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
              {field.label}
              {isRequired && <span className="text-danger-main">*</span>}
            </FieldLabel>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                id={field.key}
                accept={field.validation?.fileTypes?.join(',')}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Validate file size
                    if (file.size > MAX_FILE_SIZE) {
                      alert(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`);
                      e.target.value = '';
                      return;
                    }
                    
                    // Validate file type if specified
                    if (field.validation?.fileTypes && field.validation.fileTypes.length > 0) {
                      if (!field.validation.fileTypes.includes(file.type)) {
                        alert(`File must be one of: ${field.validation.fileTypes.join(', ')}`);
                        e.target.value = '';
                        return;
                      }
                    }
                    
                    setValue(field.key as keyof ApplicationFormData, file, { shouldValidate: true });
                  }
                }}
                className="hidden"
              />
              <label
                htmlFor={field.key}
                className="flex items-center gap-2 px-4 py-2 border border-neutral-40 bg-neutral-10 rounded-lg text-sm leading-6 text-neutral-90 font-sans cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload {field.label}
              </label>
              
              {/* File info display */}
              {formValues[field.key as keyof ApplicationFormData] instanceof File && (
                <div className="flex items-center gap-2 p-3 border border-neutral-40 bg-neutral-10 rounded-lg">
                  <FileText className="w-5 h-5 text-neutral-100" />
                  <span className="flex-1 text-sm leading-6 text-neutral-90 font-sans">
                    {(formValues[field.key as keyof ApplicationFormData] as File).name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setValue(field.key as keyof ApplicationFormData, '' as never, { shouldValidate: true });
                      const fileInput = document.getElementById(field.key) as HTMLInputElement;
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
                {field.validation?.fileTypes && (
                  <p>Accepted types: {field.validation.fileTypes.join(', ')}</p>
                )}
              </div>
            </div>
            {field.description && (
              <FieldDescription className="text-xs text-neutral-60 mt-1">
                {field.description}
              </FieldDescription>
            )}
            {error && (
              <FieldDescription className="text-danger-main">
                {error.message}
              </FieldDescription>
            )}
          </Field>
        );
      default:
        return (
          <Field key={field.id}>
            <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
              {field.label}
              {isRequired && <span className="text-danger-main">*</span>}
            </FieldLabel>
            {field.fieldType === 'textarea' ? (
              <Textarea
                {...register(field.key as keyof ApplicationFormData)}
                placeholder={field.placeholder || `Enter your ${field.label.toLowerCase()}`}
                className="min-h-20 border-2 border-neutral-40 bg-neutral-10"
              />
            ) : (
              <Input
                {...register(field.key as keyof ApplicationFormData)}
                placeholder={field.placeholder || `Enter your ${field.label.toLowerCase()}`}
                className="h-10 border-2 border-neutral-40 bg-neutral-10"
              />
            )}
            {field.description && (
              <FieldDescription className="text-xs text-neutral-60 mt-1">
                {field.description}
              </FieldDescription>
            )}
            {error && (
              <FieldDescription className="text-danger-main">
                {error.message}
              </FieldDescription>
            )}
          </Field>
        );
    }
  };

  if (appFormFields.length === 0) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-semibold mb-2">No application form available</h3>
        <p className="text-sm text-muted-foreground">
          This job is not currently accepting applications.
        </p>
      </div>
    );
  }

  const visibleFields = appFormFields
    .filter((field: AppFormField) => field.fieldState !== "off")
    .sort((a: AppFormField, b: AppFormField) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const photoProfileField = appFormFields.find((f: AppFormField) => f.field.key === 'photo_profile');

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
          <header className="flex items-start gap-4">
            <button
              onClick={onCancel}
              className="flex items-center justify-center p-1 border border-neutral-40 bg-neutral-10 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
              aria-label="Go back"
              type="button"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-100" strokeWidth={2} />
            </button>
            <div className="flex-1 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <h1 className="text-lg font-bold leading-7 text-neutral-100 font-sans">
                Apply {job.title} at {job?.company?.name}
              </h1>
              <div className="flex items-center gap-3">
                <div className="flex items-start gap-2 text-sm leading-6 text-neutral-90 font-sans">
                  <span className="text-blue-500">ℹ️</span>
                  <span className="whitespace-nowrap">This field required to fill</span>
                </div>
              </div>
            </div>
          </header>

          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <FieldGroup className="flex flex-col gap-4">
              <p className="text-xs font-bold leading-5 text-danger-main font-sans">
                * Required
              </p>

              {/* Photo Profile Field with Gesture Capture */}
              {photoProfileField && photoProfileField.fieldState !== 'off' && (
                <FieldSet>
                  <FieldLabel className="text-xs font-bold leading-5 text-neutral-90 font-sans">
                    Photo Profile
                    {photoProfileField.fieldState === 'mandatory' && <span className="text-danger-main">*</span>}
                  </FieldLabel>
                  <div className="flex flex-col gap-2">
                    <div
                      className="w-32 h-32 rounded-2xl bg-cover bg-center border-2 border-neutral-40"
                      style={{
                        backgroundImage: avatarPreview 
                          ? `url(${avatarPreview})`
                          : "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 128 128%22%3E%3Ccircle cx=%2264%22 cy=%2264%22 r=%2264%22 fill=%22%23B8E6E6%22/%3E%3Cpath d=%22M64 70c-11 0-20-9-20-20s9-20 20-20 20 9 20 20-9 20-20 20z%22 fill=%22%23666%22/%3E%3Cpath d=%22M30 110c0-20 15-35 34-35s34 15 34 35%22 fill=%22%23047C7C%22/%3E%3C/svg%3E')",
                      }}
                    />
                    <div className="flex gap-2">
                      <input
                        type="file"
                        id="avatar"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="avatar"
                        className="flex items-center gap-2 px-4 py-2 border border-neutral-40 bg-neutral-10 rounded-lg text-sm leading-6 text-neutral-90 font-sans cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Photo
                      </label>
                      <Button
                        type="button"
                        onClick={() => setShowGestureCapture(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-neutral-40 bg-neutral-10 rounded-lg text-sm leading-6 text-neutral-90 font-sans cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                        Take Photo
                      </Button>
                    </div>
                  </div>
                </FieldSet>
              )}

              {/* Dynamic Form Fields */}
              {visibleFields
                .filter((field: AppFormField) => field.field.key !== 'photo_profile')
                .sort((a: AppFormField, b: AppFormField) => (a.sortOrder || 0) - (b.sortOrder || 0))
                .map((appField: AppFormField) => renderFormField(appField))}

              {/* Resume Upload */}
              <Field>
                <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
                  Resume
                  <span className="text-danger-main">*</span>
                </FieldLabel>
                <div className="flex flex-col gap-2">
                  {!resumeFile && !profile?.resumeUrl ? (
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
                        Upload Resume
                      </label>
                      <p className="text-xs text-neutral-60">
                        Accepted file types: PDF, DOC, DOCX (Max 5MB)
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 border border-neutral-40 bg-neutral-10 rounded-lg">
                      <FileText className="w-5 h-5 text-neutral-100" />
                      <span className="flex-1 text-sm leading-6 text-neutral-90 font-sans">
                        {resumeFile ? resumeFile.name : 'Resume from profile'}
                      </span>
                      <button
                        type="button"
                        onClick={removeResumeFile}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <X className="w-4 h-4 text-neutral-100" />
                      </button>
                    </div>
                  )}
                </div>
                {errors.resume && (
                  <FieldDescription className="text-danger-main">
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
                  <FieldDescription className="text-danger-main">
                    {errors.coverLetter.message}
                  </FieldDescription>
                )}
              </Field>

              {/* Source */}
              <Field>
                <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
                  How did you hear about this position?
                  <span className="text-danger-main">*</span>
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
                  <FieldDescription className="text-danger-main">
                    {errors.source.message}
                  </FieldDescription>
                )}
              </Field>

              {/* Submit Button */}
              <div className="flex justify-end mt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting || !isValid}
                  className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </div>
      </div>
    </div>
  );
}