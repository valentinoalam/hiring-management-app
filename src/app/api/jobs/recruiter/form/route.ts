// app/api/jobs/[id]/application-form/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    // Get the job with its application form fields
    const job = await prisma.job.findUnique({
      where: { 
        id: jobId,
        status: "ACTIVE" // Only return form for active jobs
      },
      include: {
        applicationFormFields: {
          where: {
            fieldState: { in: ["mandatory", "optional"] } // Only include enabled fields
          },
          include: {
            field: {
              select: {
                id: true,
                key: true,
                label: true,
                fieldType: true,
                // placeholder: true,
                // description: true,
                options: true, // For select/dropdown fields
                // validation: true, // Validation rules
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Transform the response to make it easier for the frontend
    const formFields = job.applicationFormFields.map(appField => ({
      id: appField.field.id,
      key: appField.field.key,
      label: appField.field.label,
      fieldType: appField.field.fieldType,
      fieldState: appField.fieldState, // "mandatory" or "optional"
      // placeholder: appField.field.placeholder,
      // description: appField.field.description,
      options: appField.field.options, // For select fields
      // validation: appField.field.validation,
      sortOrder: appField.sortOrder,
    }));

    const response = {
      job: {
        id: job.id,
        title: job.title,
        company: job.company,
      },
      formFields,
      // Add form configuration
      formConfig: {
        allowMultipleApplications: false, // Could be configurable per job
        resumeRequired: formFields.some(field => field.key === "resume" && field.fieldState === "mandatory"),
        coverLetterRequired: formFields.some(field => field.key === "coverLetter" && field.fieldState === "mandatory"),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[APPLICATION_FORM] Error fetching application form:", error);
    return NextResponse.json(
      { error: "Failed to fetch application form" },
      { status: 500 }
    );
  }
}