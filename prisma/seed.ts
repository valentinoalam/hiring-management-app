// prisma/seed.ts
import { PrismaClient, UserRole, JobStatus, EmploymentType, ApplicationStatus } from '@prisma/client';
import type { User, Job } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  await clearDatabase();

  // Create users
  const users = await createUsers();
  console.log(`✅ Created ${users.length} users`);

  // Create profiles for users
  await createProfiles(users);
  console.log(`✅ Created profiles for all users`);

  // Create jobs
  const jobs = await createJobs(users);
  console.log(`✅ Created ${jobs.length} jobs`);

  // Create job configs
  await createJobConfigs(jobs);
  console.log(`✅ Created job configs`);

  // Create applications
  await createApplications(users, jobs);
  console.log(`✅ Created applications`);

  // Create info fields
  await createInfoFields(users);
  console.log(`✅ Created info fields`);

  console.log('🎉 Database seeding completed!');
}

async function clearDatabase() {
  console.log('🧹 Clearing existing data...');
  
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      } catch (error) {
        console.log(`Error clearing ${tablename}:`, error);
      }
    }
  }
}

async function createUsers(): Promise<User[]> {
  const users = [];
  const hashedPassword = await hash('password123', 12);

  // Create recruiters (5 users)
  for (let i = 0; i < 5; i++) {
    const user = await prisma.user.create({
      data: {
        email: `recruiter${i + 1}@careerconnect.com`,
        password: hashedPassword,
        fullName: faker.person.fullName(),
        role: UserRole.RECRUITER,
        createdAt: faker.date.past({ years: 1 }),
      },
    });
    users.push(user);
  }

  // Create applicants (20 users)
  for (let i = 0; i < 20; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email().toLowerCase(),
        password: hashedPassword,
        fullName: faker.person.fullName(),
        role: UserRole.APPLICANT,
        createdAt: faker.date.past({ years: 1 }),
      },
    });
    users.push(user);
  }

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@careerconnect.com',
      password: hashedPassword,
      fullName: 'System Administrator',
      role: UserRole.RECRUITER, // Using RECRUITER as admin for now
      createdAt: faker.date.past({ years: 1 }),
    },
  });
  users.push(adminUser);

  return users;
}

async function createProfiles(users: User[]) {
  for (const user of users) {
    const isRecruiter = user.role === UserRole.RECRUITER;
    
    await prisma.profile.create({
      data: {
        userId: user.id,
        bio: faker.person.bio(),
        phone: faker.phone.number(),
        location: faker.location.city() + ', ' + faker.location.country(),
        avatarUrl: faker.image.avatar(),
        resumeUrl: isRecruiter ? null : faker.internet.url() + '/resume.pdf',
        portfolioUrl: isRecruiter ? null : faker.internet.url(),
        companyName: isRecruiter ? faker.company.name() : null,
        website: isRecruiter ? faker.internet.url() : null,
        createdAt: user.createdAt,
        updatedAt: faker.date.recent({ days: 30 }),
      },
    });
  }
}

async function createJobs(users: User[]): Promise<Job[]> {
  const jobs = [];
  const recruiterUsers = users.filter(user => user.role === UserRole.RECRUITER);

  const jobTitles = [
    'Senior Frontend Developer',
    'Backend Engineer',
    'Full Stack Developer',
    'DevOps Engineer',
    'Product Manager',
    'UX/UI Designer',
    'Data Scientist',
    'Mobile App Developer',
    'QA Engineer',
    'Technical Lead',
    'Software Architect',
    'Cloud Engineer',
    'Security Specialist',
    'Machine Learning Engineer',
    'System Administrator'
  ];

  const employmentTypes = [EmploymentType.FULL_TIME, EmploymentType.PART_TIME, EmploymentType.CONTRACT, EmploymentType.FREELANCE, EmploymentType.INTERNSHIP];
  const departments = ['Engineering', 'Product', 'Design', 'Data Science', 'Operations', 'Marketing'];
  const locations = ['Jakarta, Indonesia', 'Remote', 'Bandung, Indonesia', 'Surabaya, Indonesia', 'Bali, Indonesia', 'Hybrid'];

  for (let i = 0; i < 25; i++) {
    const recruiter = faker.helpers.arrayElement(recruiterUsers);
    const jobTitle = faker.helpers.arrayElement(jobTitles);
    const slug = jobTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + faker.string.alphanumeric(6);

    const salaryMin = faker.number.int({ min: 30000000, max: 80000000 });
    const salaryMax = salaryMin + faker.number.int({ min: 10000000, max: 50000000 });

    const job = await prisma.job.create({
      data: {
        slug,
        recruiterId: recruiter.id,
        title: jobTitle,
        description: faker.lorem.paragraphs(3),
        department: faker.helpers.arrayElement(departments),
        location: faker.helpers.arrayElement(locations),
        salaryMin,
        salaryMax,
        salaryCurrency: 'IDR',
        salaryDisplay: `Rp ${(salaryMin / 1000000).toFixed(1)} - ${(salaryMax / 1000000).toFixed(1)} juta`,
        employmentType: faker.helpers.arrayElement(employmentTypes),
        status: faker.helpers.arrayElement([JobStatus.ACTIVE, JobStatus.ACTIVE, JobStatus.ACTIVE, JobStatus.DRAFT, JobStatus.INACTIVE]), // Weighted towards active
        createdAt: faker.date.past({ years: 0.5 }),
        updatedAt: faker.date.recent({ days: 30 }),
        authorId: recruiter.id,
        listBadge: faker.helpers.arrayElement(['Active', 'New', 'Popular', 'Urgent', null]),
        startedOnText: `Started on ${faker.date.recent({ days: 30 }).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        ctaText: faker.helpers.arrayElement(['Apply Now', 'View Details', 'Quick Apply', 'Learn More']),
      },
    });
    jobs.push(job);
  }

  return jobs;
}

async function createJobConfigs(jobs: Job[]) {
  const formFields = [
    { key: 'full_name', label: 'Full Name', validation: { required: true } },
    { key: 'email', label: 'Email', validation: { required: true } },
    { key: 'phone', label: 'Phone Number', validation: { required: false } },
    { key: 'resume', label: 'Resume', validation: { required: true } },
    { key: 'cover_letter', label: 'Cover Letter', validation: { required: false } },
    { key: 'portfolio', label: 'Portfolio URL', validation: { required: false } },
    { key: 'linkedin', label: 'LinkedIn Profile', validation: { required: false } },
    { key: 'salary_expectation', label: 'Salary Expectation', validation: { required: true } },
  ];

  for (const job of jobs) {
    const sections = [
      {
        title: 'Personal Information',
        fields: formFields.slice(0, 3)
      },
      {
        title: 'Application Materials',
        fields: formFields.slice(3, 6)
      },
      {
        title: 'Additional Information',
        fields: formFields.slice(6)
      }
    ];

    await prisma.jobConfig.create({
      data: {
        jobId: job.id,
        sections: sections,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      },
    });
  }
}

async function createApplications(users: User[], jobs: Job[]) {
  const applicantUsers = users.filter(user => user.role === UserRole.APPLICANT);
  const activeJobs = jobs.filter(job => job.status === JobStatus.ACTIVE);

  const statuses = [ApplicationStatus.PENDING, ApplicationStatus.UNDER_REVIEW, ApplicationStatus.REJECTED, ApplicationStatus.ACCEPTED];

  // Create multiple applications per applicant
  for (const applicant of applicantUsers) {
    const numberOfApplications = faker.number.int({ min: 1, max: 5 });
    const jobsToApply = faker.helpers.arrayElements(activeJobs, numberOfApplications);

    for (const job of jobsToApply) {
      // Get applicant's profile
      const profile = await prisma.profile.findUnique({
        where: { userId: applicant.id }
      });

      if (profile) {
        await prisma.candidate.create({
          data: {
            jobId: job.id,
            jobSeekerId: profile.id,
            status: faker.helpers.arrayElement(statuses),
            appliedAt: faker.date.between({ from: job.createdAt, to: new Date() }),
            createdAt: faker.date.recent({ days: 30 }),
            updatedAt: faker.date.recent({ days: 7 }),
          },
        });
      }
    }
  }
}

async function createInfoFields(users: User[]) {
  const commonFields = [
    { key: 'years_experience', label: 'Years of Experience', type: 'number' },
    { key: 'education_level', label: 'Highest Education', type: 'select' },
    { key: 'skills', label: 'Technical Skills', type: 'text' },
    { key: 'languages', label: 'Languages', type: 'text' },
    { key: 'notice_period', label: 'Notice Period', type: 'select' },
    { key: 'current_salary', label: 'Current Salary', type: 'number' },
    { key: 'expected_salary', label: 'Expected Salary', type: 'number' },
  ];

  const educationLevels = ['High School', 'Bachelor', 'Master', 'PhD'];
  const noticePeriods = ['Immediately', '2 weeks', '1 month', '2 months', '3 months'];

  for (const user of users) {
    const numberOfFields = faker.number.int({ min: 3, max: 7 });
    const selectedFields = faker.helpers.arrayElements(commonFields, numberOfFields);

    for (const field of selectedFields) {
      let value = '';

      switch (field.key) {
        case 'years_experience':
          value = faker.number.int({ min: 1, max: 15 }).toString();
          break;
        case 'education_level':
          value = faker.helpers.arrayElement(educationLevels);
          break;
        case 'skills':
          value = faker.helpers.arrayElements([
            'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'AWS',
            'Docker', 'Kubernetes', 'PostgreSQL', 'MongoDB', 'GraphQL', 'Redis'
          ], faker.number.int({ min: 3, max: 8 })).join(', ');
          break;
        case 'languages':
          value = faker.helpers.arrayElements(['English', 'Indonesian', 'Japanese', 'Chinese', 'Arabic', 'Spanish'], faker.number.int({ min: 1, max: 4 })).join(', ');
          break;
        case 'notice_period':
          value = faker.helpers.arrayElement(noticePeriods);
          break;
        case 'current_salary':
          value = faker.number.int({ min: 30000000, max: 150000000 }).toString();
          break;
        case 'expected_salary':
          value = faker.number.int({ min: 40000000, max: 200000000 }).toString();
          break;
        default:
          value = faker.lorem.words(3);
      }

      await prisma.infoField.create({
        data: {
          userId: user.id,
          key: field.key,
          label: field.label,
          value: value,
          fieldType: field.type,
          displayOrder: faker.number.int({ min: 1, max: 10 }),
          createdAt: faker.date.past({ years: 1 }),
          updatedAt: faker.date.recent({ days: 30 }),
        },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });