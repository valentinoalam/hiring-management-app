/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { useState, useEffect, useCallback, useMemo } from "react";
import { ArrowLeft, Upload, Calendar, ChevronDown, FileText, X } from "lucide-react";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useApplicationFormFields, useUserProfile } from "@/hooks/queries/application-queries";
import { OtherUserInfo } from "@prisma/client";
import { ApplicationData } from "@/types/job";

// File validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_RESUME_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// Dynamic schema based on AppFormField configuration
const createApplicationSchema = (appFormFields: AppFormField[]) => {
  const schema: Record<string, z.ZodTypeAny> = {};

  appFormFields.forEach((field) => {
    if (field.fieldState !== "off") {
      const fieldConfig = field.field;
      const isRequired = field.fieldState === "mandatory";
      
      let fieldValidator: z.ZodTypeAny;

      switch (fieldConfig.key) {
        case 'email':
          fieldValidator = z.string().email("Invalid email address");
          break;
        case 'phone_number':
          fieldValidator = z.string().regex(/^\+?[\d\s-]+$/, "Invalid phone number");
          break;
        case 'linkedin_url':
          fieldValidator = z.string().url("Must be a valid URL");
          break;
        default:
          fieldValidator = z.string().min(1, `${fieldConfig.label} is required`);
      }

      if (!isRequired) {
        fieldValidator = fieldValidator.optional().or(z.literal(""));
      }

      schema[fieldConfig.key] = fieldValidator;
    }
  });

  // Add required application fields
  schema.resume = z.any().refine(
    (file) => file instanceof File || typeof file === 'string',
    "Resume is required"
  );
  
  schema.coverLetter = z.string().min(50, "Cover letter must be at least 50 characters").optional().or(z.literal(""));
  
  schema.coverLetterFile = z.any().optional();
  
  schema.source = z.string().min(1, "Please specify how you heard about this position");

  return z.object(schema);
};

type ApplicationFormData = z.infer<ReturnType<typeof createApplicationSchema>>;

interface AppFormField {
  id: string;
  fieldState: "mandatory" | "optional" | "off";
  field: {
    id: string;
    key: string;
    label: string;
    fieldType: string;
    options?: string;
  };
}

interface Profile {
  linkedin: string;
  fullName: string;
  gender: string;
  id: string;
  userId: string;
  bio?: string;
  phone?: string;
  location?: string;
  avatarUrl?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  companyName?: string;
  website?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  userInfo: {
    id: string;
    fieldId: string;
    infoFieldAnswer: string;
    field: {
      id: string;
      key: string;
    };
  }[];
}

interface JobApplicationFormProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  onSubmit: (applicationData: ApplicationData) => Promise<void>;
  onCancel: () => void;
  userId: string;
}

export default function JobApplicationForm({
  jobId,
  jobTitle,
  companyName,
  onSubmit,
  onCancel,
  userId,
}: JobApplicationFormProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const [coverLetterMode, setCoverLetterMode] = useState<'text' | 'file'>('text');
  
  const { 
    data: formFieldsData, 
    isLoading: loadingFields, 
    error: fieldsError 
  } = useApplicationFormFields(jobId);
  
  const { 
    data: profileData, 
    isLoading: loadingProfile, 
    error: profileError 
  } = useUserProfile(userId);

  useEffect(() => {
    if (profileData) {
      setProfile(profileData);
      setAvatarPreview(profileData.avatarUrl || "");
    }
  }, [profileData]);

  const isLoading = loadingFields || loadingProfile;
  const error = fieldsError || profileError;

  const appFormFields = useMemo(() => formFieldsData?.formFields || [], [formFieldsData?.formFields]);

  const formSchema = createApplicationSchema(appFormFields);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });



  // Pre-fill form with existing profile data
  useEffect(() => {
    if (profile && appFormFields.length > 0) {
      const fieldValues: Partial<ApplicationFormData> = {};

      appFormFields.forEach((appField: AppFormField) => {
        if (appField.fieldState !== "off") {
          const fieldKey = appField.field.key;
          
          const userInfo = profile.userInfo?.find(
            (info: Partial<OtherUserInfo>) => info.fieldId === appField.field.id
          );
          
          if (userInfo) {
            fieldValues[fieldKey] = userInfo.infoFieldAnswer;
          } else {
            switch (fieldKey) {
              case 'phone_number':
                fieldValues[fieldKey] = profile.phone || "";
                break;
              case 'domicile':
                fieldValues[fieldKey] = profile.location || "";
                break;
              case 'linkedin_url':
                fieldValues[fieldKey] = profile.linkedin || "";
                break;
              case 'full_name':
                fieldValues[fieldKey] = profile.fullName || "";
                break;
              case 'gender':
                fieldValues[fieldKey] = profile.gender || "";
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

      Object.entries(fieldValues).forEach(([key, value]) => {
        setValue(key as keyof ApplicationFormData, value, { 
          shouldValidate: false,
          shouldDirty: false
        });
      });
    }
  }, [profile, appFormFields, setValue]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        alert("Please upload a valid image file (JPG, PNG, or WebP)");
        return;
      }
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        alert("Image size must be less than 5MB");
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleResumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!ACCEPTED_RESUME_TYPES.includes(file.type)) {
        alert("Please upload a PDF or Word document");
        return;
      }
      // Validate file size
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
      // Validate file type
      if (!ACCEPTED_RESUME_TYPES.includes(file.type)) {
        alert("Please upload a PDF or Word document");
        return;
      }
      // Validate file size
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

  const handleFormSubmit = async (formData: ApplicationFormData) => {
    if (!profile) return;

    try {
      // Get cover letter content based on mode
      const coverLetterContent = coverLetterMode === 'text' 
        ? formData.coverLetter 
        : coverLetterFile?.name || '';

      const submissionData = {
        jobId: jobId,
        userId: userId,
        formResponse: formData as unknown as JSON,
        resumeUrl: resumeFile ? URL.createObjectURL(resumeFile) : (profile.resumeUrl || ''),
        coverLetter: coverLetterContent as string,
        source: formData.source as string,
        profileUpdates: {
          phone: formData.phone_number as string || profile.phone,
          location: formData.domicile as string || profile.location,
          linkedin: formData.linkedin_url as string || profile.linkedin,
          avatarUrl: avatarPreview || profile.avatarUrl,
          fullName: formData.full_name as string || profile.fullName,
          gender: formData.gender as string || profile.gender,
          ...(resumeFile && { resumeUrl: URL.createObjectURL(resumeFile) }),
        } as Partial<Profile>,
        userInfoUpdates: appFormFields
          .filter((appField: AppFormField) => appField.fieldState !== "off")
          .map((appField: AppFormField) => {
            const fieldKey = appField.field.key;
            const existingUserInfo = profile.userInfo?.find(
              (info) => info.fieldId === appField.field.id
            );
            
            return {
              id: existingUserInfo?.id,
              fieldId: appField.field.id,
              infoFieldAnswer: formData[fieldKey] as string || "",
            };
          }),
      };

      await onSubmit(submissionData);
    } catch (error) {
      console.error('Error submitting application:', error);
      throw error;
    }
  };

  const renderField = (appField: AppFormField) => {
    const { field, fieldState } = appField;
    const isRequired = fieldState === "mandatory";
    const error = errors[field.key as keyof ApplicationFormData];

    switch (field.key) {
      case 'full_name':
        return (
          <Field key={field.id}>
            <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
              {field.label}
              {isRequired && <span className="text-danger-main">*</span>}
            </FieldLabel>
            <Input
              {...register(field.key as keyof ApplicationFormData)}
              placeholder="Enter your full name"
              className="h-10 border-2 border-neutral-40 bg-neutral-10"
            />
            {error && (
              <FieldDescription className="text-danger-main">
                {error.message}
              </FieldDescription>
            )}
          </Field>
        );

      case 'date_of_birth':
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
                {...register(field.key as keyof ApplicationFormData)}
                className="w-full h-10 pl-12 pr-12 py-2 border-2 border-neutral-40 bg-neutral-10 rounded-lg text-sm leading-6 text-neutral-100 placeholder:text-neutral-60 font-sans focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:border-transparent"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-neutral-100" />
              </div>
            </div>
            {error && (
              <FieldDescription className="text-danger-main">
                {error.message}
              </FieldDescription>
            )}
          </Field>
        );

      case 'gender':
        return (
          <Field key={field.id}>
            <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
              {field.label}
              {isRequired && <span className="text-danger-main">*</span>}
            </FieldLabel>
            <FieldGroup className="flex flex-col sm:flex-row gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="female"
                  {...register(field.key as keyof ApplicationFormData)}
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
                  {...register(field.key as keyof ApplicationFormData)}
                  className="w-6 h-6 border-2 border-neutral-90 rounded-full appearance-none checked:border-8 checked:border-neutral-90 cursor-pointer"
                />
                <span className="text-sm leading-6 text-neutral-90 font-sans">
                  He/him (Male)
                </span>
              </label>
            </FieldGroup>
            {error && (
              <FieldDescription className="text-danger-main">
                {error.message}
              </FieldDescription>
            )}
          </Field>
        );

      case 'domicile':
        return (
          <Field key={field.id}>
            <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
              {field.label}
              {isRequired && <span className="text-danger-main">*</span>}
            </FieldLabel>
            <div className="relative">
              <select
                {...register(field.key as keyof ApplicationFormData)}
                className="w-full h-10 px-4 py-2 border-2 border-neutral-40 bg-neutral-10 rounded-lg text-sm leading-6 text-neutral-60 font-sans appearance-none focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:border-transparent cursor-pointer"
              >
                <option value="">Choose your domicile</option>
                <option value="jakarta">Jakarta</option>
                <option value="bandung">Bandung</option>
                <option value="surabaya">Surabaya</option>
                <option value="yogyakarta">Yogyakarta</option>
                <option value="bali">Bali</option>
                <option value="medan">Medan</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-neutral-100" strokeWidth={1.5} />
              </div>
            </div>
            {error && (
              <FieldDescription className="text-danger-main">
                {error.message}
              </FieldDescription>
            )}
          </Field>
        );

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
                placeholder="81XXXXXXXXX"
                className="flex-1 px-4 text-sm leading-6 text-neutral-100 placeholder:text-neutral-60 font-sans bg-transparent border-none focus:ring-0"
              />
            </div>
            {error && (
              <FieldDescription className="text-danger-main">
                {error.message}
              </FieldDescription>
            )}
          </Field>
        );

      case 'email':
        return (
          <Field key={field.id}>
            <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
              {field.label}
              {isRequired && <span className="text-danger-main">*</span>}
            </FieldLabel>
            <Input
              type="email"
              {...register(field.key as keyof ApplicationFormData)}
              placeholder="Enter your email address"
              className="h-10 border-2 border-neutral-40 bg-neutral-10"
            />
            {error && (
              <FieldDescription className="text-danger-main">
                {error.message}
              </FieldDescription>
            )}
          </Field>
        );

      case 'linkedin_url':
        return (
          <Field key={field.id}>
            <FieldLabel className="text-xs leading-5 text-neutral-90 font-sans">
              {field.label}
              {isRequired && <span className="text-danger-main">*</span>}
            </FieldLabel>
            <Input
              type="url"
              {...register(field.key as keyof ApplicationFormData)}
              placeholder="https://linkedin.com/in/username"
              className="h-10 border-2 border-neutral-40 bg-neutral-10"
            />
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
                placeholder={`Enter your ${field.label.toLowerCase()}`}
                className="min-h-20 border-2 border-neutral-40 bg-neutral-10"
              />
            ) : (
              <Input
                {...register(field.key as keyof ApplicationFormData)}
                placeholder={`Enter your ${field.label.toLowerCase()}`}
                className="h-10 border-2 border-neutral-40 bg-neutral-10"
              />
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-3 text-lg">Loading application form...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-600">
        <h3 className="text-lg font-semibold mb-2">Failed to load application form</h3>
        <p className="text-sm text-muted-foreground">
          {error.message || 'Please try refreshing the page'}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

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

  const visibleFields = appFormFields.filter((field: AppFormField) => field.fieldState !== "off");
  const photoProfileField = appFormFields.find((f: AppFormField) => f.field.key === 'photo_profile');

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
                Apply {jobTitle} at {companyName}
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

              {/* Photo Profile Field */}
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
                    <input
                      type="file"
                      id="avatar"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="avatar"
                      className="inline-flex items-center justify-center gap-1 px-4 py-1 border border-neutral-40 bg-neutral-10 rounded-lg shadow-sm hover:bg-gray-50 transition-colors w-fit cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-neutral-100" strokeWidth={2} />
                      <span className="text-sm font-bold leading-6 text-neutral-100 font-sans">
                        Upload Photo
                      </span>
                    </label>
                    <p className="text-xs text-neutral-60">
                      Max 5MB. Accepted formats: JPG, PNG, WebP
                    </p>
                  </div>
                </FieldSet>
              )}

              {/* Render all visible fields */}
              {visibleFields.map(renderField)}

              {/* Resume Upload Field */}
              <FieldSet>
                <FieldLabel className="text-xs font-bold leading-5 text-neutral-90 font-sans">
                  Resume / CV
                  <span className="text-danger-main">*</span>
                </FieldLabel>
                <div className="flex flex-col gap-3">
                  {resumeFile ? (
                    <div className="flex items-center justify-between p-3 border-2 border-neutral-40 bg-neutral-10 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-neutral-100" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-neutral-100">
                            {resumeFile.name}
                          </span>
                          <span className="text-xs text-neutral-60">
                            {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeResumeFile}
                        className="p-1 hover:bg-neutral-40 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-neutral-100" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="file"
                        id="resume"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="resume"
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-neutral-40 bg-neutral-10 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <Upload className="w-5 h-5 text-neutral-100" strokeWidth={2} />
                        <span className="text-sm font-medium text-neutral-100 font-sans">
                          Upload Resume / CV
                        </span>
                      </label>
                    </>
                  )}
                  <p className="text-xs text-neutral-60">
                    Max 5MB. Accepted formats: PDF, DOC, DOCX
                  </p>
                  {errors.resume && (
                    <FieldDescription className="text-danger-main">
                      {errors.resume.message as string}
                    </FieldDescription>
                  )}
                </div>
              </FieldSet>

              {/* Cover Letter Field */}
              <FieldSet>
                <FieldLabel className="text-xs font-bold leading-5 text-neutral-90 font-sans">
                  Cover Letter
                </FieldLabel>
                
                {/* Toggle between text and file upload */}
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCoverLetterMode('text');
                      setCoverLetterFile(null);
                      setValue('coverLetterFile', undefined);
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      coverLetterMode === 'text'
                        ? 'bg-neutral-100 text-neutral-10'
                        : 'bg-neutral-10 text-neutral-100 border border-neutral-40 hover:bg-gray-50'
                    }`}
                  >
                    Write Text
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCoverLetterMode('file');
                      setValue('coverLetter', '');
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      coverLetterMode === 'file'
                        ? 'bg-neutral-100 text-neutral-10'
                        : 'bg-neutral-10 text-neutral-100 border border-neutral-40 hover:bg-gray-50'
                    }`}
                  >
                    Upload File
                  </button>
                </div>

                {coverLetterMode === 'text' ? (
                  <div className="flex flex-col gap-2">
                    <Textarea
                      {...register('coverLetter')}
                      placeholder="Write your cover letter here... (minimum 50 characters)"
                      className="min-h-32 border-2 border-neutral-40 bg-neutral-10 resize-y"
                      rows={6}
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-neutral-60">
                        {(watch('coverLetter') as string)?.length || 0} characters
                      </p>
                      {errors.coverLetter && (
                        <FieldDescription className="text-danger-main">
                          {errors.coverLetter.message as string}
                        </FieldDescription>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {coverLetterFile ? (
                      <div className="flex items-center justify-between p-3 border-2 border-neutral-40 bg-neutral-10 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-neutral-100" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-neutral-100">
                              {coverLetterFile.name}
                            </span>
                            <span className="text-xs text-neutral-60">
                              {(coverLetterFile.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={removeCoverLetterFile}
                          className="p-1 hover:bg-neutral-40 rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-neutral-100" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          type="file"
                          id="coverLetterFile"
                          accept=".pdf,.doc,.docx"
                          onChange={handleCoverLetterFileChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="coverLetterFile"
                          className="inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-neutral-40 bg-neutral-10 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <Upload className="w-5 h-5 text-neutral-100" strokeWidth={2} />
                          <span className="text-sm font-medium text-neutral-100 font-sans">
                            Upload Cover Letter
                          </span>
                        </label>
                      </>
                    )}
                    <p className="text-xs text-neutral-60">
                      Max 5MB. Accepted formats: PDF, DOC, DOCX
                    </p>
                  </div>
                )}
              </FieldSet>

              {/* Source Field */}
              <FieldSet>
                <FieldLabel className="text-xs font-bold leading-5 text-neutral-90 font-sans">
                  How did you hear about this position?
                  <span className="text-danger-main">*</span>
                </FieldLabel>
                <div className="relative">
                  <select
                    {...register('source')}
                    className="w-full h-10 px-4 py-2 border-2 border-neutral-40 bg-neutral-10 rounded-lg text-sm leading-6 text-neutral-60 font-sans appearance-none focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:border-transparent cursor-pointer"
                  >
                    <option value="">Select source</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="company_website">Company Website</option>
                    <option value="job_board">Job Board (Indeed, Glassdoor, etc.)</option>
                    <option value="referral">Employee Referral</option>
                    <option value="social_media">Social Media</option>
                    <option value="university">University/Career Center</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-neutral-100" strokeWidth={1.5} />
                  </div>
                </div>
                {errors.source && (
                  <FieldDescription className="text-danger-main">
                    {errors.source.message as string}
                  </FieldDescription>
                )}
              </FieldSet>
            </FieldGroup>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-neutral-40">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-neutral-10 hover:bg-primary/90"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}