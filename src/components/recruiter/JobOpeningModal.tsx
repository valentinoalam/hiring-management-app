
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";

// Zod validation schema based on your updated Prisma schema
const jobFormSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  description: z.string().min(1, "Job description is required").nullable(),
  department: z.string().optional(),
  location: z.string().optional(),
  remotePolicy: z.enum(["onsite", "remote", "hybrid"]).default("onsite").optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]).optional(),
  experienceLevel: z.enum(["entry", "mid", "senior", "executive"]).optional(),
  educationLevel: z.enum(["high_school", "bachelor", "master", "phd"]).optional(),
  salaryMin: z.string().min(1, "Minimum salary is required"),
  salaryMax: z.string().min(1, "Maximum salary is required"),
  salaryCurrency: z.string().default("IDR").optional(),
  salaryDisplay: z.string().optional(),
  numberOfCandidates: z.number().min(1, "Number of candidates is required"),
  sections: z.any().optional(),
  settings: z.any().optional(),
  requirements: z.any().optional(),
  applicationFormFields: z.array(z.object({
    fieldId: z.string(),
    label: z.string(),
    fieldState: z.enum(["mandatory", "optional", "off"]),
  })),
});

type JobFormData = z.infer<typeof jobFormSchema>;

interface InfoField {
  id: string;
  key: string;
  label: string;
  fieldType?: string;
  options?: string;
}

interface JobOpeningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: JobFormData) => void;
}

// Default profile fields based on your InfoField model
const defaultProfileFields: InfoField[] = [
  { id: "1", key: "full_name", label: "Full name", fieldType: "text" },
  { id: "2", key: "photo_profile", label: "Photo Profile", fieldType: "text" },
  { id: "3", key: "gender", label: "Gender", fieldType: "select" },
  { id: "4", key: "domicile", label: "Domicile", fieldType: "text" },
  { id: "5", key: "email", label: "Email", fieldType: "text" },
  { id: "6", key: "phone_number", label: "Phone number", fieldType: "text" },
  { id: "7", key: "linkedin_url", label: "LinkedIn URL", fieldType: "text" },
  { id: "8", key: "date_of_birth", label: "Date of birth", fieldType: "text" },
];

const fieldStateOptions = ["mandatory", "optional", "off"] as const;

export function JobOpeningModal({
  open,
  onOpenChange,
  onSubmit,
}: JobOpeningModalProps) {
  const form = useForm<JobFormData>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      employmentType: undefined,
      description: "",
      location: "",
      remotePolicy: "onsite",
      salaryCurrency: "IDR",
      numberOfCandidates: 1,
      applicationFormFields: defaultProfileFields.map(field => ({
        fieldId: field.id,
        label: field.label,
        fieldState: "mandatory" as const,
      })),
    },
  });

  const handleSubmit = (data: JobFormData) => {
    // Prepare sections data for JSON storage
    const sectionsData = {
      profile: {
        title: "Profile Information",
        description: "Candidate profile details",
        fields: data.applicationFormFields.map(field => ({
          key: defaultProfileFields.find(f => f.id === field.fieldId)?.key,
          type: "text", // You can map this based on your fieldType
          validation: field.fieldState === "mandatory" ? "required" : "optional",
          state: field.fieldState
        }))
      }
    };

    const submitData = {
      ...data,
      sections: sectionsData,
      settings: {
        requireCoverLetter: true,
        autoReject: false,
      },
      requirements: {
        minExperience: data.experienceLevel,
        education: data.educationLevel,
      }
    };

    onSubmit?.(submitData);
    form.reset();
  };

  const updateFieldState = (index: number, fieldState: "mandatory" | "optional" | "off") => {
    const currentFields = form.getValues("applicationFormFields");
    const updatedFields = [...currentFields];
    updatedFields[index] = { ...updatedFields[index], fieldState };
    form.setValue("applicationFormFields", updatedFields);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl no-scrollbar [&>button]:hidden">
        {/* Header */}
        <DialogHeader className="sticky top-0 flex flex-row items-center justify-between p-6 border-b border-neutral-40 bg-neutral-10">
          <DialogTitle className="text-xl font-bold text-neutral-100">Job Opening</DialogTitle>
          <DialogClose className="text-neutral-90 hover:text-neutral-100">
            <X className="w-6 h-6" />
          </DialogClose>
        </DialogHeader>

        {/* Content */}
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="p-6">
            <FieldGroup>
              {/* Basic Job Information */}
              <FieldSet>
                <FieldLegend>Job Information</FieldLegend>
                <FieldDescription>
                  Basic details about the job position
                </FieldDescription>
                
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="job-title">
                      Job Title<span className="text-danger-main">*</span>
                    </FieldLabel>
                    <Input
                      id="job-title"
                      placeholder="Ex. Front End Engineer"
                      {...form.register("title")}
                      className="w-full h-10 border-2 border-neutral-40 bg-neutral-10"
                    />
                    {form.formState.errors.title && (
                      <FieldDescription className="text-danger-main">
                        {form.formState.errors.title.message}
                      </FieldDescription>
                    )}
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="employment-type">
                        Employment Type<span className="text-danger-main">*</span>
                      </FieldLabel>
                      <Select 
                        onValueChange={(value: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP") => 
                          form.setValue("employmentType", value)
                        }

                      >
                        <SelectTrigger id="employment-type" className="border-2 border-neutral-40 bg-neutral-10">
                          <SelectValue placeholder="Select employment type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FULL_TIME">Full Time</SelectItem>
                          <SelectItem value="PART_TIME">Part Time</SelectItem>
                          <SelectItem value="CONTRACT">Contract</SelectItem>
                          <SelectItem value="INTERNSHIP">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="remote-policy">
                        Work Location Type
                      </FieldLabel>
                      <Select 
                        onValueChange={(value: "onsite" | "remote" | "hybrid") => 
                          form.setValue("remotePolicy", value)
                        }

                      >
                        <SelectTrigger id="remote-policy" className="border-2 border-neutral-40 bg-neutral-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="onsite">On-site</SelectItem>
                          <SelectItem value="remote">Remote</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="location">
                        Location
                      </FieldLabel>
                      <Input
                        id="location"
                        placeholder="Ex. Jakarta, Indonesia"
                        {...form.register("location")}
                        className="border-2 border-neutral-40 bg-neutral-10"
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="department">
                        Department
                      </FieldLabel>
                      <Input
                        id="department"
                        placeholder="Ex. Engineering"
                        {...form.register("department")}
                        className="border-2 border-neutral-40 bg-neutral-10"
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="experience-level">
                        Experience Level
                      </FieldLabel>
                      <Select 
                        onValueChange={(value: "entry" | "mid" | "senior" | "executive") => 
                          form.setValue("experienceLevel", value)
                        }
                      >
                        <SelectTrigger id="experience-level" className="border-2 border-neutral-40 bg-neutral-10">
                          <SelectValue placeholder="Select experience level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entry">Entry Level</SelectItem>
                          <SelectItem value="mid">Mid Level</SelectItem>
                          <SelectItem value="senior">Senior Level</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="education-level">
                        Education Level
                      </FieldLabel>
                      <Select 
                        onValueChange={(value: "high_school" | "bachelor" | "master" | "phd") => 
                          form.setValue("educationLevel", value)
                        }
                      >
                        <SelectTrigger id="education-level" className="border-2 border-neutral-40 bg-neutral-10">
                          <SelectValue placeholder="Select education level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high_school">High School</SelectItem>
                          <SelectItem value="bachelor">Bachelor&apos;s Degree</SelectItem>
                          <SelectItem value="master">Master&apos;s Degree</SelectItem>
                          <SelectItem value="phd">PhD</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                </FieldGroup>
              </FieldSet>

              <FieldSeparator />

              {/* Job Description */}
              <FieldSet>
                <FieldLegend>Job Description</FieldLegend>
                <FieldDescription>
                  Describe the job responsibilities and requirements
                </FieldDescription>
                
                <Field>
                  <FieldLabel htmlFor="job-description">
                    Description<span className="text-danger-main">*</span>
                  </FieldLabel>
                  <Textarea
                    id="job-description"
                    placeholder="Ex. Describe the job responsibilities and requirements"
                    {...form.register("description")}
                    className="min-h-24 border-2 border-neutral-40 bg-neutral-10 resize-none"
                  />
                  {form.formState.errors.description && (
                    <FieldDescription className="text-danger-main">
                      {form.formState.errors.description.message}
                    </FieldDescription>
                  )}
                </Field>
              </FieldSet>

              <FieldSeparator />

              {/* Candidate Requirements */}
              <FieldSet>
                <FieldLegend>Candidate Requirements</FieldLegend>
                
                <Field>
                  <FieldLabel htmlFor="number-of-candidates">
                    Number of Candidates Needed<span className="text-danger-main">*</span>
                  </FieldLabel>
                  <Input
                    id="number-of-candidates"
                    type="number"
                    placeholder="Ex. 2"
                    {...form.register("numberOfCandidates", { valueAsNumber: true })}
                    className="border-2 border-neutral-40 bg-neutral-10"
                  />
                  {form.formState.errors.numberOfCandidates && (
                    <FieldDescription className="text-danger-main">
                      {form.formState.errors.numberOfCandidates.message}
                    </FieldDescription>
                  )}
                </Field>
              </FieldSet>

              <FieldSeparator />

              {/* Salary Information */}
              <FieldSet>
                <FieldLegend>Salary Information</FieldLegend>
                <FieldDescription>
                  Estimated salary range for this position
                </FieldDescription>
                
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="min-salary">
                      Minimum Estimated Salary
                    </FieldLabel>
                    <div className="h-10 px-4 py-2 border-2 border-neutral-40 bg-neutral-10 rounded-lg flex items-center gap-2">
                      <span className="text-sm font-bold text-neutral-90">Rp</span>
                      <Input
                        id="min-salary"
                        type="text"
                        placeholder="7.000.000"
                        {...form.register("salaryMin")}
                        className="flex-1 bg-transparent border-none focus:ring-0 p-0"
                      />
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="max-salary">
                      Maximum Estimated Salary
                    </FieldLabel>
                    <div className="h-10 px-4 py-2 border-2 border-neutral-40 bg-neutral-10 rounded-lg flex items-center gap-2">
                      <span className="text-sm font-bold text-neutral-90">Rp</span>
                      <Input
                        id="max-salary"
                        type="text"
                        placeholder="8.000.000"
                        {...form.register("salaryMax")}
                        className="flex-1 bg-transparent border-none focus:ring-0 p-0"
                      />
                    </div>
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="salary-display">
                    Salary Display Text (Optional)
                  </FieldLabel>
                  <Input
                    id="salary-display"
                    placeholder="Ex. Competitive salary based on experience"
                    {...form.register("salaryDisplay")}
                    className="border-2 border-neutral-40 bg-neutral-10"
                  />
                  <FieldDescription>
                    This text will be displayed to candidates instead of the exact salary range
                  </FieldDescription>
                </Field>
              </FieldSet>

              <FieldSeparator />

              {/* Application Form Configuration */}
              <FieldSet>
                <FieldLegend>Application Form Configuration</FieldLegend>
                <FieldDescription>
                  Configure which profile fields are required for applicants
                </FieldDescription>
                
                <FieldGroup className="space-y-4 p-4 border border-neutral-30 rounded-lg bg-neutral-10">
                  {defaultProfileFields.map((field, index) => (
                    <Field key={field.id} orientation="horizontal" className="items-center justify-between py-2 border-b border-neutral-40 last:border-b-0">
                      <FieldLabel className="text-sm text-neutral-90 mb-0">
                        {field.label}
                      </FieldLabel>
                      <div className="flex gap-2">
                        {fieldStateOptions.map((state) => {
                          const currentFields = form.getValues("applicationFormFields");
                          const currentState = currentFields[index]?.fieldState;

                          return (
                            <button
                              key={state}
                              type="button"
                              onClick={() => updateFieldState(index, state)}
                              className={cn(
                                "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                                currentState === state
                                  ? state === "mandatory"
                                    ? "border-primary bg-neutral-10 text-primary"
                                    : "border-neutral-40 bg-neutral-30 text-neutral-60"
                                  : "border-neutral-40 bg-neutral-10 text-neutral-90 hover:bg-neutral-30"
                              )}
                            >
                              {state.charAt(0).toUpperCase() + state.slice(1)}
                            </button>
                          );
                        })}
                      </div>
                    </Field>
                  ))}
                </FieldGroup>
              </FieldSet>
            </FieldGroup>
          </div>

          {/* Footer */}
          <DialogFooter className="sticky bottom-0 flex justify-end gap-3 p-6 border-t border-neutral-40 bg-neutral-10">
            <Button
              type="submit"
              disabled={!form.formState.isValid}
              className={cn(
                "px-4 py-2 h-10 rounded-lg font-bold text-sm",
                form.formState.isValid
                  ? "bg-primary text-neutral-10 hover:bg-primary/90"
                  : "bg-neutral-30 text-neutral-60 cursor-not-allowed"
              )}
            >
              Publish Job
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}