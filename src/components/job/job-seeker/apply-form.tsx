/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Upload, Calendar, ChevronDown } from "lucide-react";
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
import { Application, OtherUserInfo } from "@prisma/client";

// Dynamic schema based on AppFormField configuration
const createApplicationSchema = (appFormFields: AppFormField[]) => {
  const schema: Record<string, z.ZodString | z.ZodOptional<z.ZodString>> = {};

  appFormFields.forEach((field) => {
    if (field.fieldState !== "off") {
      const fieldConfig = field.field;
      const isRequired = field.fieldState === "mandatory";
      
      // Create base validator based on field type
      let fieldValidator: z.ZodTypeAny;

      switch (fieldConfig.key) {
        case 'email':
          fieldValidator = z.email("Invalid email address");
          break;
        case 'phone_number':
          fieldValidator = z.string().regex(/^\+?[\d\s-]+$/, "Invalid phone number");
          break;
        case 'linkedin_url':
          fieldValidator = z.url("Must be a valid URL");
          break;
        default:
          fieldValidator = z.string().min(1, `${fieldConfig.label} is required`);
      }

      // Apply required/optional at the end
      if (!isRequired) {
        fieldValidator = fieldValidator.optional();
      }

      schema[fieldConfig.key] = fieldValidator as z.ZodString | z.ZodOptional<z.ZodString>;
    }
  });

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
  onSubmit: (applicationData: {
    formResponse: JSON;
    profileUpdates: Partial<Profile>;
    userInfoUpdates: Array<{
      id?: string; // existing userInfo id for updates
      fieldId: string;
      infoFieldAnswer: string;
    }>;
  }) => Promise<void>;
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
  // const [appFormFields, setAppFormFields] = useState<AppFormField[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatarUrl || "");
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
    }
  }, [profileData]);// Combined loading state
  const isLoading = loadingFields || loadingProfile;
  const error = fieldsError || profileError;

  // Extract form fields from the response
  const appFormFields = formFieldsData?.formFields || [];

  // Create form with dynamic schema
  const formSchema = createApplicationSchema(appFormFields);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange', // Validate on change for better UX
  });

  // Watch form values for real-time validation
  const formValues = watch();
  // Pre-fill form with existing profile data when both profile and form fields are loaded
  useEffect(() => {
    if (profile && appFormFields.length > 0) {
      const fieldValues: ApplicationFormData = {};

      appFormFields.forEach((appField: AppFormField) => {
        if (appField.fieldState !== "off") {
          const fieldKey = appField.field.key;
          
          // Try to get value from userInfo first (OtherUserInfo records)
          const userInfo = profile.userInfo?.find(
            (info: Partial<OtherUserInfo>) => info.fieldId === appField.field.id
          );
          
          if (userInfo) {
            fieldValues[fieldKey] = userInfo.infoFieldAnswer;
          } else {
            // Fallback to direct profile fields
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
              case 'email':
                // Email typically comes from User model, not Profile
                fieldValues[fieldKey] = "";
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

      // Set all values at once
      Object.entries(fieldValues).forEach(([key, value]) => {
        setValue(key as keyof ApplicationFormData, value, { 
          shouldValidate: false, // Don't validate on initial set
          shouldDirty: false     // Don't mark as dirty
        });
      });

      // Set avatar preview
      if (profile.avatarUrl) {
        setAvatarPreview(profile.avatarUrl);
      }
    }
  }, [profile, appFormFields, setValue]);

  // Handle file uploads (avatar, resume, etc.)
  const handleFileChange = (fieldName: string, file: File | null) => {
    setValue(fieldName, file ? file.name : undefined);
    
    if (fieldName === 'avatar' && file) {
      // Create preview for avatar
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (formData: ApplicationFormData) => {
    if (!profile) return;

    try {
      // Prepare data for submission
      const submissionData = {
        // 1. Form response for Application model
        formResponse: formData as unknown as JSON,
        
        // 2. Profile updates
        profileUpdates: {
          phone: formData.phone_number as string || profile.phone,
          location: formData.domicile as string || profile.location,
          linkedin: formData.linkedin_url as string || profile.linkedin,
          avatarUrl: avatarPreview || profile.avatarUrl,
          fullName: formData.full_name as string || profile.fullName,
          gender: formData.gender as string || profile.gender,
          // Add resume if uploaded
          ...(formData.resume && { resumeUrl: formData.resume as string }),
        } as Partial<Profile>,
        
        // 3. UserInfo updates (for OtherUserInfo records)
        userInfoUpdates: appFormFields
          .filter((appField: AppFormField) => appField.fieldState !== "off")
          .map((appField: AppFormField) => {
            const fieldKey = appField.field.key;
            const existingUserInfo = profile.userInfo?.find(
              (info) => info.fieldId === appField.field.id
            );
            
            return {
              id: existingUserInfo?.id, // for updates
              fieldId: appField.field.id,
              infoFieldAnswer: formData[fieldKey] as string || "",
            };
          }),
      };

      await onSubmit(submissionData);
    } catch (error) {
      console.error('Error submitting application:', error);
      throw error; // Re-throw to let parent component handle
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
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
                type="text"
                {...register(field.key as keyof ApplicationFormData)}
                placeholder="Select date of birth"
                onFocus={(e) => e.target.type = 'date'}
                onBlur={(e) => e.target.type = 'text'}
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
        // Handle custom fields
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


  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-3 text-lg">Loading application form...</span>
      </div>
    );
  }

  // Render error state
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

  // Render empty state if no form fields
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

  const visibleFields = appFormFields.filter((field: AppFormField ) => field.fieldState !== "off");
  const photoProfileField = appFormFields.find((f: AppFormField ) => f.field.key === 'photo_profile');

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

              {/* Photo Profile Field - Only show if not off */}
              {photoProfileField && photoProfileField.fieldState !== 'off' && (
                <FieldSet>
                  <FieldLabel className="text-xs font-bold leading-5 text-neutral-90 font-sans">
                    Photo Profile
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
                        Take a Picture
                      </span>
                    </label>
                  </div>
                </FieldSet>
              )}

              {/* Render all visible fields */}
              {visibleFields.map(renderField)}
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