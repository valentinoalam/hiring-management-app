import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { uploadToVercelBlob as uploadFile } from '@/lib/upload';
import { OtherInfo } from '@/types/user';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await auth();
    const { jobId } = await params;
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
      jobId, 
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
          jobId,
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

    return NextResponse.json({
      success: true,
      application: {
        id: result.application.id,
        jobId: result.application.jobId,
        applicantId: result.application.applicantId,
        status: result.application.status,
        applicant: {
          id: userProfile.id,
          userId: session.user.id,  // for invalidation
          fullname: userProfile.fullname,
          email: userProfile.email,
          phone: userProfile.phone,
        },
        job: result.application.job,
      },
      // Include other data if needed
      profile: result.profile,
      updatedFields: result.updatedFields,
    }, { status: 201 });
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
async function processApplication(transformedData: any, userProfile: any) {
  console.log('processApplication - transformedData:', transformedData);
  
  // Add safety check for userInfoUpdates
  if (!transformedData.userInfoUpdates || !Array.isArray(transformedData.userInfoUpdates)) {
    console.warn('userInfoUpdates is not an array, defaulting to empty array');
    transformedData.userInfoUpdates = [];
  }
  return await prisma.$transaction(async (tx) => {
    try {
      console.log('Starting transaction...');
      // 1. Handle file uploads (EXCLUDING cover letter file)
      const fileUploads: Record<string, string> = {};
      
      // Handle avatar file
      const avatarFile = transformedData.files.avatar;
      if (avatarFile && avatarFile.size > 0) {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedMimeTypes.includes(avatarFile.type)) {
          const uploadResult = await uploadFile(avatarFile, {
            folder: 'avatars',
          });
          fileUploads.avatarUrl = uploadResult.url;
        }
      }

      // Handle resume file
      const resumeFile = transformedData.files.resume;
      if (resumeFile && resumeFile.size > 0) {
        const allowedMimeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedMimeTypes.includes(resumeFile.type)) {
          const uploadResult = await uploadFile(resumeFile, {
            folder: 'resumes',
          });
          fileUploads.resumeUrl = uploadResult.url;
        }
      }

      // Handle dynamic field files
      for (const [fieldKey, file] of Object.entries(transformedData.files.dynamic)) {
        if (file instanceof File && file.size > 0) {
          const uploadResult = await uploadFile(file, {
            folder: 'application-files',  
          });
          fileUploads[fieldKey] = uploadResult.url;
        }
      }

      // 2. Handle cover letter file separately (for Application domain)
      let coverLetterFileUrl: string | undefined;
      const coverLetterFile = transformedData.files.coverLetterFile;
      
      if (coverLetterFile && coverLetterFile.size > 0) {
        const allowedMimeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedMimeTypes.includes(coverLetterFile.type)) {
          const uploadResult = await uploadFile(coverLetterFile, {
            folder: 'cover-letters',
          });
          coverLetterFileUrl = uploadResult.url;
        }
      }

      // 3. Merge profile updates with file uploads (EXCLUDING cover letter)
      const finalProfileUpdates = {
        ...transformedData.profileUpdates,
        ...fileUploads,
      };

      // Remove undefined values and check if there are actual updates
      const cleanProfileUpdates: Record<string, unknown> = {};
      Object.keys(finalProfileUpdates).forEach(key => {
        if (finalProfileUpdates[key] !== undefined && finalProfileUpdates[key] !== null) {
          cleanProfileUpdates[key] = finalProfileUpdates[key];
        }
      });

      let updatedProfile = userProfile;

      // Only update if there are actual changes
      if (Object.keys(cleanProfileUpdates).length > 0) {
        const hasRealChanges = Object.keys(cleanProfileUpdates).some(key => {
          const newValue = cleanProfileUpdates[key];
          const currentValue = userProfile[key];
          
          // Handle date comparison
          if (newValue instanceof Date && currentValue instanceof Date) {
            return newValue.getTime() !== currentValue.getTime();
          }
          
          return newValue !== currentValue;
        });

        if (hasRealChanges) {
          updatedProfile = await tx.profile.update({
            where: { id: userProfile.id },
            data: cleanProfileUpdates,
          });
        }
      }
      console.log('Processing userInfoUpdates:', transformedData.userInfoUpdates);
      // 4. Update or create user info records
      for (const userInfoUpdate of transformedData.userInfoUpdates) {
        if (userInfoUpdate.id) {
          await tx.otherUserInfo.update({
            where: { id: userInfoUpdate.id },
            data: { infoFieldAnswer: userInfoUpdate.infoFieldAnswer },
          });
        } else {
          await tx.otherUserInfo.create({
            data: {
              profileId: userProfile.id,
              fieldId: userInfoUpdate.fieldId,
              infoFieldAnswer: userInfoUpdate.infoFieldAnswer,
            },
          });
        }
      }

      // 5. Create application with cover letter logic
      const applicationData = {
        ...transformedData.application,
        applicantId: userProfile.id,
        // Handle cover letter: if file exists, use file URL and set text to undefined
        ...(coverLetterFileUrl 
          ? { 
              coverLetterFileUrl, 
              coverLetter: undefined // or null, depending on your schema
            } 
          : { 
              coverLetter: transformedData.application.coverLetter,
              coverLetterFileUrl: undefined // or null
            }
        )
      };

      const application = await tx.application.create({
        data: applicationData,
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
        where: { id: transformedData.jobId },
        data: {
          applicationsCount: {
            increment: 1,
          },
        },
      });

      return {
        application,
        profile: updatedProfile,
        updatedFields: Object.keys(cleanProfileUpdates),
        coverLetterType: coverLetterFileUrl ? 'file' : 'text', // For debugging
      };
    } catch (err) {
      console.error('Error in processApplication transaction:', err);
      throw err;
    }
  });
}

function transformFormDataToApplicationModel(formData: FormData, jobId: string, userId: string) {
  try {
    // Extract JSON data from FormData with proper validation
    const formDataJsonStr = formData.get('formData') as string | null;
    const profileUpdatesStr = formData.get('profileUpdates') as string | null;
    const userInfoUpdatesStr = formData.get('userInfoUpdates') as string | null;
    
    console.log('Raw FormData values:');
    console.log('formData:', formDataJsonStr?.substring(0, 100) + '...');
    console.log('profileUpdates:', profileUpdatesStr?.substring(0, 100) + '...');
    console.log('userInfoUpdates:', userInfoUpdatesStr?.substring(0, 100) + '...');

    // Validate required fields
    if (!formDataJsonStr) {
      throw new Error('Missing required field: formData');
    }
    if (!profileUpdatesStr) {
      throw new Error('Missing required field: profileUpdates');
    }
    if (!userInfoUpdatesStr) {
      throw new Error('Missing required field: userInfoUpdates');
    }

    let formDataJson, profileUpdates, userInfoUpdates;
    
    try {
      formDataJson = JSON.parse(formDataJsonStr);
    } catch {
      throw new Error('Invalid JSON in formData field');
    }
    
    try {
      profileUpdates = JSON.parse(profileUpdatesStr);
    } catch {
      throw new Error('Invalid JSON in profileUpdates field');
    }
    
    try {
      userInfoUpdates = JSON.parse(userInfoUpdatesStr);
    } catch {
      throw new Error('Invalid JSON in userInfoUpdates field');
    }

    // Extract files with null checks
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

    // Transform for Application model with safe property access
    const applicationData = {
      jobId,
      applicantId: '', // This will be set after we get the profile
      status: 'PENDING' as const,
      formResponse: formDataJson?.formResponse || {},
      coverLetter: formDataJson?.coverLetter || null,
      coverLetterFileUrl: null,
      source: formDataJson?.source || 'direct',
      appliedAt: new Date(),
    };

    // Handle gender transformation safely
    let genderValue = null;
    if (profileUpdates?.gender) {
      if (profileUpdates.gender === "female") genderValue = "WANITA";
      if (profileUpdates.gender === "male") genderValue = "PRIA";
    }

    // Transform for Profile model updates with safe access
    const profileData = {
      fullname: profileUpdates?.fullname || null,
      gender: genderValue,
      dateOfBirth: profileUpdates?.dateOfBirth ? new Date(profileUpdates.dateOfBirth) : null,
      email: profileUpdates?.email || null,
      phone: profileUpdates?.phone || null,
      location: profileUpdates?.location || null,
      avatarUrl: profileUpdates?.avatarUrl || null,
      resumeUrl: profileUpdates?.resumeUrl || null,
      linkedinUrl: profileUpdates?.linkedinUrl || null,
      bio: profileUpdates?.bio || null,
      portfolioUrl: profileUpdates?.portfolioUrl || null,
      companyName: profileUpdates?.companyName || null,
      website: profileUpdates?.website || null,
      githubUrl: profileUpdates?.githubUrl || null,
    };

    // Transform for OtherUserInfo model with safe access
    // Ensure userInfoUpdates is always an array
    const otherUserInfoData = Array.isArray(userInfoUpdates) 
      ? userInfoUpdates.map((update: OtherInfo) => ({
          id: update?.id || undefined,
          profileId: '',
          fieldId: update?.fieldId,
          infoFieldAnswer: update?.infoFieldAnswer || '',
        }))
      : []; // Fallback to empty array if not iterable

    return {
      jobId,
      userId,
      application: applicationData,
      profileUpdates: profileData,
      userInfoUpdates: otherUserInfoData, // ← FIXED: Changed from otherInfoUpdates to userInfoUpdates
      files: {
        avatar: avatarFile,
        resume: resumeFile,
        coverLetterFile: coverLetterFile,
        dynamic: dynamicFiles,
      },
      rawFormData: formDataJson?.formResponse || {},
      source: formDataJson?.source || 'direct',
    };
  } catch (error) {
    console.error('Error in transformFormDataToApplicationModel:', error);
    throw new Error(`Failed to parse form data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
