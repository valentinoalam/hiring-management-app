// app/api/jobs/[jobId]/apply/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { uploadToVercelBlob as uploadFile } from '@/lib/upload';

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
    
    // Extract files
    const avatarFile = formData.get('avatar') as File | null;
    const resumeFile = formData.get('resume') as File | null;
    const coverLetterFile = formData.get('coverLetterFile') as File | null;
    
    // Extract JSON data
    const formResponse = JSON.parse(formData.get('formResponse') as string);
    const profileUpdates = JSON.parse(formData.get('profileUpdates') as string);
    const userInfoUpdates = JSON.parse(formData.get('userInfoUpdates') as string);

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
    const result = await prisma.$transaction(async (tx) => {
      // 1. Handle file uploads
      const fileUploads: { avatarUrl?: string; resumeUrl?: string } = {};
      
      if (avatarFile && avatarFile.size > 0) {
        const allowedMimeType = ['image/jpeg', 'image/png', 'image/webp']
        if(allowedMimeType.includes(avatarFile.type)) {
          const uploadResult = await uploadFile(avatarFile, {
            folder: 'avatars',
          });
          fileUploads.avatarUrl = uploadResult.url;
        }
      }

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

      // 2. Update profile with file URLs
      const updatedProfile = await tx.profile.update({
        where: { id: userProfile.id },
        data: {
          ...profileUpdates,
          ...fileUploads,
        },
      });

      // 3. Update or create user info records
      for (const userInfoUpdate of userInfoUpdates) {
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

      // 4. Create application
      const application = await tx.application.create({
        data: {
          jobId: params.jobId,
          applicantId: userProfile.id,
          formResponse: formResponse,
          coverLetter: formResponse.cover_letter || null,
          status: 'PENDING',
          source: formResponse.source || 'direct',
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

      // 5. Increment applications count
      await tx.job.update({
        where: { id: params.jobId },
        data: {
          applicationsCount: {
            increment: 1,
          },
        },
      });

      return {
        application,
        profile: updatedProfile,
        fileUploads,
      };
    });

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
    
//     const body = await request.json();
//     const { formResponse, profileUpdates, userInfoUpdates, fileData } = body;

//     // Process file uploads before transaction
//     if (fileData?.avatar) {
//       const avatarUrl = await uploadFile(fileData.avatar);
//       profileUpdates.avatarUrl = avatarUrl;
//     }

//     if (fileData?.resume) {
//       const resumeUrl = await uploadFile(fileData.resume);
//       profileUpdates.resumeUrl = resumeUrl;
//     }
    
//     if (!params.jobId) {
//       return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
//     }

//     if (!formResponse || !profileUpdates || !userInfoUpdates) {
//       return NextResponse.json(
//         { error: 'Missing required application data' },
//         { status: 400 }
//       );
//     }
//     // Get user's profile
//     const userProfile = await prisma.profile.findUnique({
//       where: { userId: session.user.id },
//     });

//     if (!userProfile) {
//       return NextResponse.json(
//         { error: 'User profile not found' },
//         { status: 404 }
//       );
//     }

//     // Check if user already applied to this job
//     const existingApplication = await prisma.application.findUnique({
//       where: {
//         jobId_applicantId: {
//           jobId: params.jobId,
//           applicantId: userProfile.id,
//         },
//       },
//     });

//     if (existingApplication) {
//       return NextResponse.json(
//         { error: 'You have already applied to this job' },
//         { status: 409 }
//       );
//     }

//     // Start a transaction to handle all operations
//     const result = await prisma.$transaction(async (tx) => {
//       // 1. Update profile
//       const updatedProfile = await tx.profile.update({
//         where: { id: userProfile.id },
//         data: profileUpdates,
//       });

//       // 2. Update or create user info records
//       for (const userInfoUpdate of userInfoUpdates) {
//         if (userInfoUpdate.id) {
//           // Update existing record
//           await tx.otherUserInfo.update({
//             where: { id: userInfoUpdate.id },
//             data: { infoFieldAnswer: userInfoUpdate.infoFieldAnswer },
//           });
//         } else {
//           // Create new record
//           await tx.otherUserInfo.create({
//             data: {
//               profileId: userProfile.id,
//               fieldId: userInfoUpdate.fieldId,
//               infoFieldAnswer: userInfoUpdate.infoFieldAnswer,
//             },
//           });
//         }
//       }

//       // 3. Create application
//       const application = await tx.application.create({
//         data: {
//           jobId: params.jobId,
//           applicantId: userProfile.id,
//           formResponse: formResponse,
//           coverLetter: formResponse.cover_letter || null,
//           status: 'PENDING',
//           source: 'direct',
//         },
//         include: {
//           job: {
//             select: {
//               title: true,
//               company: {
//                 select: {
//                   name: true,
//                 },
//               },
//             },
//           },
//         },
//       });

//       // 4. Increment applications count on job
//       await tx.job.update({
//         where: { id: params.jobId },
//         data: {
//           applicationsCount: {
//             increment: 1,
//           },
//         },
//       });

//       return {
//         application,
//         profile: updatedProfile,
//       };
//     });

//     return NextResponse.json(result, { status: 201 });
//   } catch (error) {
//     console.error('Error submitting job application:', error);
    
//     if (error instanceof Error && error.message.includes('Unique constraint')) {
//       return NextResponse.json(
//         { error: 'You have already applied to this job' },
//         { status: 409 }
//       );
//     }

//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }