import { faker } from "@faker-js/faker";
import { hash } from "bcryptjs";
import { PrismaPg } from '@prisma/adapter-pg' // Install your adapter
import { Pool } from 'pg' 
import { PrismaClient, Prisma, User, InfoField, Job } from "@/generated/prisma/client";
import { UserRole, EmploymentType, JobStatus, ApplicationStatus } from "@/generated/prisma/client";


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({adapter});

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear existing data
  await clearDatabase();

  // Create users
  const users = await createUsers();
  console.log(`✅ Created ${users.length} users`);

  // Create companies
  const companies = await createCompanies(users);
  console.log(`✅ Created ${companies.length} companies`);

  // Create profiles for users
  await createProfiles(users);
  console.log(`✅ Created profiles for all users`);

  // Create job configs
  await createBasicInfofield();
  console.log(`✅ Created job configs`);

  // Create jobs
  const jobs = await createJobs(users);
  console.log(`✅ Created ${jobs.length} jobs`);

  // Create applications
  await createApplications(users, jobs);
  console.log(`✅ Created applications`);

  // Create info fields
  await createInfoFields(users);
  console.log(`✅ Created info fields`);

  console.log("🎉 Database seeding completed!");
}

async function clearDatabase() {
  console.log("🧹 Clearing existing data...");

  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  for (const { tablename } of tablenames) {
    if (tablename !== "_prisma_migrations") {
      try {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "public"."${tablename}" CASCADE;`
        );
      } catch (error) {
        console.log(`Error clearing ${tablename}:`, error);
      }
    }
  }
}

async function createUsers(): Promise<User[]> {
  const users = [];
  const hashedPassword = await hash("password123", 12);

  // Create recruiters (8 users)
  for (let i = 0; i < 8; i++) {
    const user = await prisma.user.create({
      data: {
        email: `recruiter${i + 1}@careerconnect.com`,
        password: hashedPassword,
        name: faker.person.firstName(),
        role: UserRole.RECRUITER,
        createdAt: faker.date.past({ years: 1 }),
      },
    });
    users.push(user);
  }

  // Create applicants (25 users)
  for (let i = 0; i < 25; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email().toLowerCase(),
        password: hashedPassword,
        name: faker.person.firstName(),
        role: UserRole.APPLICANT,
        createdAt: faker.date.past({ years: 1 }),
      },
    });
    users.push(user);
  }

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: "system@careerconnect.com",
      password: hashedPassword,
      name: "System Administrator",
      role: UserRole.RECRUITER,
      createdAt: faker.date.past({ years: 1 }),
    },
  });

  await prisma.profile.create({
    data: {
      userId: adminUser.id,
      fullname: faker.person.fullName(),
      bio: "System administrator for CareerConnect platform",
      phone: faker.phone.number(),
      location: "Jakarta, Indonesia",
      avatarUrl: faker.image.avatar(),
      resumeUrl: undefined,
      portfolioUrl: undefined,
      companyName: "CareerConnect",
      website: "https://careerconnect.com",
      linkedinUrl: "https://linkedin.com/company/careerconnect",
      githubUrl: undefined,
      createdAt: adminUser.createdAt,
      updatedAt: new Date(),
    },
  });
  users.push(adminUser);

  return users;
}

async function createBasicInfofield() {
  const infoFields = [
    {
      key: "full_name",
      label: "Full Name",
      fieldType: "text",
      displayOrder: 1,
    },
    {
      key: "photo_profile",
      label: "Photo Profile",
      fieldType: "text",
      displayOrder: 2,
    },
    { key: "gender", label: "Gender", fieldType: "select", displayOrder: 3 },
    { key: "domicile", label: "Domicile", fieldType: "text", displayOrder: 4 },
    { key: "email", label: "Email", fieldType: "text", displayOrder: 5 },
    {
      key: "phone_number",
      label: "Phone Number",
      fieldType: "text",
      displayOrder: 6,
    },
    {
      key: "linkedin_url",
      label: "LinkedIn URL",
      fieldType: "text",
      displayOrder: 7,
    },
    {
      key: "date_of_birth",
      label: "Date of Birth",
      fieldType: "date",
      displayOrder: 8,
    },
    {
      key: "years_experience",
      label: "Years of Experience",
      fieldType: "number",
      displayOrder: 9,
    },
    { key: "skills", label: "Skills", fieldType: "textarea", displayOrder: 10 },
    {
      key: "education",
      label: "Education",
      fieldType: "textarea",
      displayOrder: 11,
    },
    {
      key: "cover_letter",
      label: "Cover Letter",
      fieldType: "textarea",
      displayOrder: 12,
    },
    {
      key: "portfolio_url",
      label: "Portfolio URL",
      fieldType: "text",
      displayOrder: 13,
    },
    { key: "resume", label: "Resume", fieldType: "text", displayOrder: 14 },
  ];
  // Get system user for InfoField ownership
  const systemUser = await prisma.user.findFirst({
    where: { email: "system@careerconnect.com" },
  });
  if (!systemUser) {
    console.error("System user not found.");
    return;
  }
  for (const field of infoFields) {
    const infoField = await prisma.infoField.upsert({
      where: { key: field.key },
      update: {
        label: field.label,
        fieldType: field.fieldType,
        displayOrder: field.displayOrder,
      },
      create: {
        key: field.key,
        label: field.label,
        fieldType: field.fieldType,
        displayOrder: field.displayOrder,
        authorId: systemUser?.id,
      },
    });
    console.log(
      `Upserted InfoField with key: ${infoField.key} (ID: ${infoField.id})`
    );
  }
}

type CompanyWithRecruiters = Prisma.CompanyGetPayload<{
  include: {
    recruiter: true;
  };
}>;
async function createCompanies(
  users: User[]
): Promise<CompanyWithRecruiters[]> {
  const companies = [];
  const recruiterUsers = users.filter(
    (user) => user.role === UserRole.RECRUITER
  );

  const companyNames = [
    "TechNova Solutions",
    "Digital Innovation Labs",
    "CloudSphere Technologies",
    "DataDriven Insights",
    "FutureWorks Inc.",
    "CodeCraft Studios",
    "AI Ventures",
    "CyberSecure Systems",
    "MobileFirst Apps",
    "WebScale Enterprises",
    "BlockChain Innovations",
    "IoT Pioneers",
    "VR Experience Labs",
    "Quantum Computing Corp",
    "GreenTech Solutions",
  ];

  const industries = [
    "Technology",
    "Software Development",
    "Artificial Intelligence",
    "FinTech",
    "Healthcare Technology",
    "E-commerce",
    "Education Technology",
    "Cybersecurity",
    "Cloud Computing",
    "Mobile Applications",
  ];

  const companySizes = [
    "1-10",
    "11-50",
    "51-200",
    "201-500",
    "501-1000",
    "1000+",
  ];

  // First, create profiles for all recruiters if they don't exist
  for (const recruiter of recruiterUsers) {
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: recruiter.id },
    });

    if (!existingProfile) {
      await prisma.profile.create({
        data: {
          userId: recruiter.id,
          fullname: recruiter.name? recruiter.name + faker.person.lastName() : faker.person.fullName(),
          bio: faker.person.bio(),
          phone: faker.phone.number(),
          location: faker.location.city() + ", " + faker.location.country(),
          avatarUrl: faker.image.avatar(),
          companyName: faker.company.name(),
          website: faker.internet.url(),
          linkedinUrl: `https://linkedin.com/in/${recruiter.name
            .toLowerCase()
            .replace(/\s+/g, "")}`,
          createdAt: recruiter.createdAt,
          updatedAt: faker.date.recent({ days: 30 }),
        },
      });
    }
  }
  for (let i = 0; i < companyNames.length; i++) {
    // Assign companies to recruiters in round-robin fashion
    const recruiter = recruiterUsers[i % recruiterUsers.length];
    // Get the recruiter's profile
    const recruiterProfile = await prisma.profile.findUnique({
      where: { userId: recruiter.id },
    });

    if (!recruiterProfile) {
      console.warn(
        `No profile found for recruiter ${recruiter.id}, skipping company creation`
      );
      continue;
    }

    const company = await prisma.company.create({
      data: {
        name: companyNames[i],
        description:
          faker.company.catchPhrase() + ". " + faker.lorem.paragraph(),
        website: faker.internet.url(),
        logo: faker.image.urlLoremFlickr({ category: "business" }),
        industry: faker.helpers.arrayElement(industries),
        size: faker.helpers.arrayElement(companySizes),
        createdAt: faker.date.past({ years: 2 }),
        updatedAt: faker.date.recent({ days: 60 }),
        recruiter: {
          connect: {
            id: recruiterProfile.id,
          },
        },
      },
      include: {
        recruiter: true,
      },
    });
    companies.push(company);
  }

  return companies;
}

async function createProfiles(users: User[]) {
  const applicantUsers = users.filter(
    (user) => user.role === UserRole.APPLICANT
  );

  // Create profiles for applicants
  for (const applicant of applicantUsers) {
    await prisma.profile.create({
      data: {
        userId: applicant.id,
        fullname: applicant.name? applicant.name + faker.person.lastName() : faker.person.fullName(),
        bio: faker.person.bio(),
        phone: faker.phone.number(),
        location: faker.location.city() + ", " + faker.location.country(),
        avatarUrl: faker.image.avatar(),
        resumeUrl: faker.internet.url() + "/resume.pdf",
        portfolioUrl: faker.internet.url(),
        website:
          Math.floor(Math.random() * 2) === 1
            ? faker.internet.url()
            : undefined,
        linkedinUrl: `https://linkedin.com/in/${applicant.name
          .toLowerCase()
          .replace(/\s+/g, "")}`,
        githubUrl: `https://github.com/${applicant.name
          .toLowerCase()
          .replace(/\s+/g, "")}`,
        createdAt: applicant.createdAt,
        updatedAt: faker.date.recent({ days: 30 }),
      },
    });
  }
}

async function createJobs(users: User[]): Promise<Job[]> {
  const [companies, infoFields] = await Promise.all([
        prisma.company.findMany({ include: { recruiter: true } }),
        prisma.infoField.findMany(),
    ]);

  const jobTitles = [
    "Senior Frontend Developer",
    "Backend Engineer",
    "Full Stack Developer",
    "DevOps Engineer",
    "Product Manager",
    "UX/UI Designer",
    "Data Scientist",
    "Mobile App Developer",
    "QA Engineer",
    "Technical Lead",
    "Software Architect",
    "Cloud Engineer",
    "Security Specialist",
    "Machine Learning Engineer",
    "System Administrator",
    "Data Analyst",
    "Business Analyst",
    "Project Manager",
    "Scrum Master",
    "Frontend Developer",
    "Backend Developer",
    "iOS Developer",
    "Android Developer",
  ];

  const employmentTypes = Object.values(EmploymentType);
  const departments = [
    "Engineering",
    "Product",
    "Design",
    "Data Science",
    "Operations",
    "Marketing",
    "Sales",
    "HR",
  ];
  const locations = [
    "Jakarta, Indonesia",
    "Remote",
    "Bandung, Indonesia",
    "Surabaya, Indonesia",
    "Bali, Indonesia",
    "Hybrid",
  ];
  const remotePolicies = ["onsite", "remote", "hybrid"];
  const recruiterUsers = users.filter(
    (user) => user.role === UserRole.RECRUITER
  );
  // Filter out system fields that shouldn't be in job applications
  const applicableInfoFields = infoFields.filter(
    (field: InfoField) =>
      !field.key.includes("photo_profile") && !field.key.includes("resume") // Exclude resume as it's handled separately
  );

  if (applicableInfoFields.length === 0) {
    console.warn(
      "❌ No applicable info fields found! Creating jobs without application form fields."
    );
  }
  const jobCreationPromises = Array.from({ length: 35 }).map(async (_, i) => {
    const recruiter = faker.helpers.arrayElement(recruiterUsers);
    const jobTitle = faker.helpers.arrayElement(jobTitles);
    const slug =
      jobTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
      "-" +
      faker.string.alphanumeric(6);

    // Find company related to this recruiter
    let company: CompanyWithRecruiters | null =
      companies.find((company: CompanyWithRecruiters) =>
        company.recruiter?.some(
          (profile: { id: string }) => profile.id === recruiter.id
        )
      ) || null;
    if (!company && recruiter) {
      const staff = await prisma.profile.findUnique({
        where: { userId: recruiter.id },
      });
      if(staff && staff.companyId)
        company = await prisma.company.findUnique({
          where: { id: staff.companyId! },
          include: { recruiter: true },
        });
    }

    const salaryMin = faker.number.int({ min: 30000000, max: 80000000 });
    const salaryMax =
      salaryMin + faker.number.int({ min: 10000000, max: 50000000 });

    // Create dynamic application form configuration
    let applicationFormFields: Array<{
      fieldId: string;
      fieldState: string;
      sortOrder: number;
    }> = [];

    if (applicableInfoFields.length > 0) {
      // Create dynamic application form configuration
      const minFields = Math.max(3, Math.min(5, applicableInfoFields.length)); // Ensure at least 3 fields if available
      const maxFields = Math.min(10, applicableInfoFields.length);
      const numberOfFormFields = faker.number.int({ min: minFields, max: maxFields });
      
      const selectedFields: InfoField[] = faker.helpers.arrayElements(applicableInfoFields, numberOfFormFields);
      
      applicationFormFields = selectedFields.map((field, index) => ({
        fieldId: field.id,
        fieldState: faker.helpers.arrayElement(['mandatory', 'optional', 'off']),
        sortOrder: index,
      }));

      // Ensure at least some fields are mandatory - WITH PROPER VALIDATION
      const mandatoryFields = applicationFormFields.filter(f => f.fieldState === 'mandatory');
      if (mandatoryFields.length === 0 && applicationFormFields.length > 0) {
        // Pick a random field and make it mandatory
        const randomIndex = faker.number.int({ min: 0, max: applicationFormFields.length - 1 });
        applicationFormFields[randomIndex].fieldState = 'mandatory';
      }
    } else {
      console.warn(`Job ${i + 1}: No applicable info fields available for application form`);
    }

    const jobData = {
      slug,
      authorId: recruiter.id,
      title: jobTitle,
      description: faker.lorem.paragraphs(faker.number.int({ min: 2, max: 4 })),
      department: faker.helpers.arrayElement(departments),
      location: faker.helpers.arrayElement(locations),
      remotePolicy: faker.helpers.arrayElement(remotePolicies),
      salaryMin: new Prisma.Decimal(salaryMin),
      salaryMax: new Prisma.Decimal(salaryMax),
      salaryCurrency: 'IDR',
      salaryDisplay: `Rp ${(salaryMin / 1000000).toFixed(1)} - ${(salaryMax / 1000000).toFixed(1)} juta`,
      employmentType: faker.helpers.arrayElement(employmentTypes),
      experienceLevel: faker.helpers.arrayElement(['entry', 'mid', 'senior', 'executive']),
      educationLevel: faker.helpers.arrayElement(['high_school', 'bachelor', 'master', 'phd']),
      status: faker.helpers.arrayElement(Object.values(JobStatus)),
      numberOfCandidates: faker.number.int({ min: 1, max: 10 }),
      sections: {
        company: {
          name: company?.name || 'Our Company',
          description: company?.description || faker.company.catchPhrase(),
        },
        requirements: {
          minExperience: faker.number.int({ min: 0, max: 5 }),
          skills: faker.helpers.arrayElements([
            'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java',
            'AWS', 'Docker', 'PostgreSQL', 'MongoDB'
          ], 3),
        },
      },
      settings: {
        autoReject: faker.datatype.boolean(),
        requireCoverLetter: faker.datatype.boolean(),
        notificationEmails: [recruiter.email],
      },
      requirements: {
        skills: faker.helpers.arrayElements([
          'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js',
          'Python', 'Java', 'C#', 'Go', 'Rust'
        ], faker.number.int({ min: 3, max: 6 })),
        education: faker.helpers.arrayElement(['bachelor', 'master', 'phd']),
        experience: faker.number.int({ min: 0, max: 5 }),
      },
      companyId: company?.id || "",
      listBadge: faker.helpers.arrayElement(['Active', 'New', 'Popular', 'Urgent', 'Featured', null]),
      startedOnText: `Started on ${faker.date.recent({ days: 30 }).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      ctaText: faker.helpers.arrayElement(['Apply Now', 'View Details', 'Quick Apply', 'Learn More']),
      expiresAt: faker.date.future({ years: 1 }),
    };

    return await prisma.job.create({
      data: {
        ...jobData, 
        applicationFormFields: {
          create: applicationFormFields.filter(field => field.fieldState !== 'off'),
        },
      }
    });
  })
  const createdJobs = await Promise.all(jobCreationPromises);
  console.log(`✅ Successfully created ${createdJobs.length} jobs in parallel.`);
  return createdJobs;
}

async function createApplications(users: User[], jobs: Job[]) {
  const applicantUsers = users.filter(
    (user) => user.role === UserRole.APPLICANT
  );
  const activeJobs = jobs.filter((job) => job.status === JobStatus.ACTIVE);

  const statuses = [
    ApplicationStatus.PENDING,
    ApplicationStatus.PENDING,
    ApplicationStatus.PENDING, // Weighted towards pending
    ApplicationStatus.UNDER_REVIEW,
    ApplicationStatus.REJECTED,
    ApplicationStatus.ACCEPTED,
  ];

  // Create multiple applications per applicant
  for (const applicant of applicantUsers) {
    const numberOfApplications = faker.number.int({ min: 1, max: 8 });
    const jobsToApply = faker.helpers.arrayElements(
      activeJobs,
      numberOfApplications
    );

    for (const job of jobsToApply) {
      const profile = await prisma.profile.findUnique({
        where: { userId: applicant.id },
      });

      if (profile) {
        // Get job's application form fields to structure form response
        const jobWithFields = await prisma.job.findUnique({
          where: { id: job.id },
          include: {
            applicationFormFields: {
              include: {
                field: true,
              },
            },
          },
        });

        const formResponse: Record<string, string> = {};
        if (jobWithFields?.applicationFormFields) {
          for (const appField of jobWithFields.applicationFormFields) {
            if (appField.fieldState !== "off") {
              // Generate realistic form responses based on field type
              switch (appField.field.key) {
                case "full_name":
                  formResponse[appField.field.key] = applicant.name;
                  break;
                case "email":
                  formResponse[appField.field.key] = applicant.email;
                  break;
                case "phone_number":
                  formResponse[appField.field.key] = profile.phone || "";
                  break;
                case "linkedin_url":
                  formResponse[appField.field.key] = profile.linkedinUrl || "";
                  break;
                case "years_experience":
                  formResponse[appField.field.key] = faker.number
                    .int({ min: 0, max: 15 })
                    .toString();
                  break;
                case "skills":
                  formResponse[appField.field.key] = faker.helpers
                    .arrayElements(
                      [
                        "JavaScript",
                        "TypeScript",
                        "React",
                        "Node.js",
                        "Python",
                        "Java",
                      ],
                      3
                    )
                    .join(", ");
                  break;
                case "cover_letter":
                  formResponse[appField.field.key] = faker.lorem.paragraphs(2);
                  break;
                default:
                  formResponse[appField.field.key] = faker.lorem.words(3);
              }
            }
          }
        }

        await prisma.application.create({
          data: {
            jobId: job.id,
            applicantId: profile.id,
            status: faker.helpers.arrayElement(statuses),
            formResponse,
            coverLetter: faker.lorem.paragraphs(
              faker.number.int({ min: 1, max: 3 })
            ),
            source: faker.helpers.arrayElement([
              "direct",
              "linkedin",
              "referral",
              "job_board",
            ]),
            appliedAt: faker.date.between({
              from: job.createdAt,
              to: new Date(),
            }),
            viewedAt: faker.datatype.boolean()
              ? faker.date.recent({ days: 7 })
              : null,
            statusUpdatedAt: faker.date.recent({ days: 14 }),
          },
        });
      }
    }
  }
}

async function createInfoFields(users: User[]) {
  const commonFields = [
    {
      key: "years_experience",
      label: "Years of Experience",
      fieldType: "number",
      displayOrder: 15,
    },
    {
      key: "education_level",
      label: "Highest Education",
      fieldType: "select",
      displayOrder: 16,
    },
    {
      key: "skills",
      label: "Technical Skills",
      fieldType: "textarea",
      displayOrder: 17,
    },
    {
      key: "languages",
      label: "Languages",
      fieldType: "text",
      displayOrder: 18,
    },
    {
      key: "notice_period",
      label: "Notice Period",
      fieldType: "select",
      displayOrder: 19,
    },
    {
      key: "current_salary",
      label: "Current Salary",
      fieldType: "number",
      displayOrder: 20,
    },
    {
      key: "expected_salary",
      label: "Expected Salary",
      fieldType: "number",
      displayOrder: 21,
    },
    {
      key: "certifications",
      label: "Certifications",
      fieldType: "textarea",
      displayOrder: 22,
    },
    {
      key: "projects",
      label: "Notable Projects",
      fieldType: "textarea",
      displayOrder: 23,
    },
  ];

  // Get system user for InfoField ownership
  const systemUser = await prisma.user.findFirst({
    where: { email: "system@careerconnect.com" },
  });

  if (!systemUser) {
    console.error("System user not found for InfoField creation");
    return;
  }

  // Ensure all required InfoFields exist
  for (const field of commonFields) {
    await prisma.infoField.upsert({
      where: { key: field.key },
      update: {
        label: field.label,
        fieldType: field.fieldType,
        displayOrder: field.displayOrder,
      },
      create: {
        key: field.key,
        label: field.label,
        fieldType: field.fieldType,
        displayOrder: field.displayOrder,
        authorId: systemUser.id,
      },
    });
  }

  // Get all info fields after ensuring they exist
  const existingInfoFields = await prisma.infoField.findMany();
  const infoFieldMap = new Map(
    existingInfoFields.map((field: InfoField) => [field.key, field])
  );

  // ... rest of the function remains the same as the first solution
  for (const user of users) {
    if (user.role === UserRole.APPLICANT) {
      const userProfile = await prisma.profile.findUnique({
        where: { userId: user.id },
      });

      if (!userProfile) {
        console.warn(
          `No profile found for user ${user.id} (${user.email}), skipping OtherUserInfo creation`
        );
        continue;
      }

      const numberOfFields = faker.number.int({ min: 4, max: 8 });
      const selectedFields = faker.helpers.arrayElements(
        commonFields,
        numberOfFields
      );

      for (const field of selectedFields) {
        const infoField = infoFieldMap.get(field.key);
        if (!infoField) {
          console.warn(
            `InfoField '${field.key}' not found for user ${user.email}, skipping`
          );
          continue;
        }

        // ... value generation logic
        const value = "";
        // ... (same switch case logic as above)

        try {
          await prisma.otherUserInfo.create({
            data: {
              profileId: userProfile.id,
              fieldId: infoField.id,
              infoFieldAnswer: value,
            },
          });
        } catch (error) {
          console.error(
            `Failed to create OtherUserInfo for user ${user.email}, field ${field.key}:`,
            error
          );
        }
      }
    }
  }
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });