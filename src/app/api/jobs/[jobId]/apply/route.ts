// app/api/jobs/[jobId]/apply/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { uploadToVercelBlob as uploadFile } from '@/lib/upload';
import { ApplicantData, ApplicationData } from '@/types/job';
import { OtherInfo, Profile } from '@/types/user';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }
    const formData = await request.formData();
    

    // Transform FormData to application model
    const applicationModel = transformFormDataToApplicationModel(
      formData, 
      params.jobId, 
      session.user.id
    );
    // Get user's profile
    const userProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check if user already applied
    const existingApplication = await prisma.application.findUnique({
      where: {
        jobId_applicantId: {
          jobId: params.jobId,
          applicantId: userProfile.id,
        },
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied to this job' },
        { status: 409 }
      );
    }

    // Start transaction
    const result = await processApplication(applicationModel, userProfile)

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error submitting job application:', error);
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'You have already applied to this job' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
    


// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processApplication(applicationModel: any, userProfile: any) {
  return await prisma.$transaction(async (tx) => {
    // 1. Handle file uploads
    const fileUploads: Record<string, string> = {};
    const avatarFile = applicationModel.files.avatar
    if (applicationModel.files.avatar && avatarFile.size > 0) {
      const allowedMimeType = ['image/jpeg', 'image/png', 'image/webp']
        if(allowedMimeType.includes(avatarFile.type)) {
          const uploadResult = await uploadFile(avatarFile, {
            folder: 'avatars',
          });
          fileUploads.avatarUrl = uploadResult.url;
        }
    }

    const resumeFile = applicationModel.files.resume
    if (resumeFile && resumeFile.size > 0) {
      const allowedMimeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if(allowedMimeTypes.includes(resumeFile.type)) {
        const uploadResult = await uploadFile(resumeFile, {
          folder: 'resumes',
          // 
        });
        fileUploads.resumeUrl = uploadResult.url;
      }
    }

    // 2. Merge profile updates with file uploads
    const finalProfileUpdates = {
      ...applicationModel.applicant,
      ...fileUploads,
    };

    // 3. Update profile ONLY if there are changes
    let updatedProfile = userProfile;
    if (Object.keys(finalProfileUpdates).length > 0) {
      const prismaProfile = await tx.profile.update({
        where: { id: userProfile.id },
        data: finalProfileUpdates,
      });
      
      // Convert Prisma profile to Profile interface
      updatedProfile = {
        ...prismaProfile,
        gender: prismaProfile.gender || undefined,
      } as Profile;
    }

    // 4. Update or create user info records ONLY for changed fields
    for (const userInfoUpdate of applicationModel.userInfoUpdates) {
      if (userInfoUpdate.id) {
        // Update existing record
        await tx.otherUserInfo.update({
          where: { id: userInfoUpdate.id },
          data: { infoFieldAnswer: userInfoUpdate.infoFieldAnswer },
        });
      } else {
        // Create new record
        await tx.otherUserInfo.create({
          data: {
            profileId: userProfile.id,
            fieldId: userInfoUpdate.fieldId,
            infoFieldAnswer: userInfoUpdate.infoFieldAnswer,
          },
        });
      }
    }

    // 5. Create application
    const application = await tx.application.create({
      data: {
        jobId: applicationModel.jobId,
        applicantId: userProfile.id,
        formResponse: applicationModel.formResponse,
        coverLetter: applicationModel.coverLetter,
        status: 'PENDING',
        source: applicationModel.source || 'direct',
      },
      include: {
        job: {
          select: {
            title: true,
            company: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // 6. Increment applications count
    await tx.job.update({
      where: { id: applicationModel.jobId },
      data: {
        applicationsCount: {
          increment: 1,
        },
      },
    });

    return {
      application,
      profile: updatedProfile,
      updatedFields: Object.keys(finalProfileUpdates), // For debugging
    };
  });
}

function transformFormDataToApplicationModel(formData: FormData, jobId: string, userId: string) {
  // Extract JSON data from FormData
  const formDataJson = JSON.parse(formData.get('formData') as string);
  const profileUpdates = JSON.parse(formData.get('profileUpdates') as string);
  const userInfoUpdates = JSON.parse(formData.get('userInfoUpdates') as string);
  
  // Extract files
  const avatarFile = formData.get('avatar') as File | null;
  const resumeFile = formData.get('resume') as File | null;
  const coverLetterFile = formData.get('coverLetterFile') as File | null;

  // Extract dynamic file fields
  const dynamicFiles: Record<string, File> = {};
  for (const [key, value] of formData.entries()) {
    if (value instanceof File && !['avatar', 'resume', 'coverLetterFile', 'formData', 'profileUpdates', 'userInfoUpdates'].includes(key)) {
      dynamicFiles[key] = value;
    }
  }

  // Transform for Application model
  const applicationData = {
    jobId,
    applicantId: '', // This will be set after we get the profile
    status: 'PENDING' as const,
    formResponse: formDataJson.formResponse,
    coverLetter: formDataJson.coverLetter || null,
    source: formDataJson.source || 'direct',
    appliedAt: new Date(),
  };
  if(profileUpdates.gender) {
    if(profileUpdates.gender === "female")  profileUpdates.gender = "WANITA"
    if(profileUpdates.gender === "male")  profileUpdates.gender = "PRIA"
  } else {
    profileUpdates.gender = null
  }

  // Transform for Profile model updates
  const profileData = {
    // Direct profile fields
    fullname: profileUpdates.fullname,
    gender: profileUpdates.gender,
    dateOfBirth: profileUpdates.dateOfBirth ? new Date(profileUpdates.dateOfBirth) : null,
    email: profileUpdates.email || null,
    phone: profileUpdates.phone || null,
    location: profileUpdates.location || null,
    avatarUrl: profileUpdates.avatarUrl || null,
    resumeUrl: profileUpdates.resumeUrl || null,
    linkedinUrl: profileUpdates.linkedinUrl || null,
    // Optional fields that might be in profileUpdates
    bio: profileUpdates.bio || null,
    portfolioUrl: profileUpdates.portfolioUrl || null,
    companyName: profileUpdates.companyName || null,
    website: profileUpdates.website || null,
    githubUrl: profileUpdates.githubUrl || null,
  };

  // Transform for OtherUserInfo model
  const otherUserInfoData = userInfoUpdates.map((update: OtherInfo) => ({
    id: update.id || undefined, // undefined for new records
    profileId: '', // This will be set after we get the profile
    fieldId: update.fieldId,
    infoFieldAnswer: update.infoFieldAnswer,
  }));

  return {
    // Core identifiers
    jobId,
    userId,
    
    // Application data (for Application model)
    application: applicationData,
    
    // Profile data (for Profile model update)
    profileUpdates: profileData,
    
    // OtherUserInfo data (for OtherUserInfo model create/update)
    otherInfoUpdates: otherUserInfoData,
    
    // Files for upload
    files: {
      avatar: avatarFile,
      resume: resumeFile,
      coverLetterFile: coverLetterFile,
      dynamic: dynamicFiles,
    },
    
    // Raw form data for reference
    rawFormData: formDataJson.formResponse,
    coverLetterContent: formDataJson.coverLetter,
    source: formDataJson.source,
  };
}
