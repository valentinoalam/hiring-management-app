import { Applicant, AppFormField } from '@/types/job.js';

export const mockApplicants: (Applicant & { matchRate?: number })[] = [
  {
    id: '1',
    applicantId: '1',
    jobId: 'job-1',
    fullname: 'Ahmad Rizki',
    email: 'ahmad.rizki@email.com',
    phone: '+62 812-3456-7890',
    location: 'Jakarta, Indonesia',
    gender: 'Male',
    avatarUrl: '',
    status: 'PENDING',
    resumeUrl: '/resumes/ahmad-rizki.pdf',
    linkedin: 'https://linkedin.com/in/ahmadrizki',
    appliedAt: '2024-01-15T10:30:00Z',
    userInfo: {
      education: { answer: 'Bachelor of Computer Science - University of Indonesia' },
      experience: { answer: '3 years as Frontend Developer at Tech Company' },
      skills: { answer: 'JavaScript, React, TypeScript, Node.js' },
      salary: { answer: 'Rp 12.000.000' },
      notice_period: { answer: '30 days' }
    },
    matchRate: 85
  },
  {
    id: '2',
    applicantId: '2',
    jobId: 'job-1',
    fullname: 'Sarah Wijaya',
    email: 'sarah.wijaya@email.com',
    phone: '+62 813-9876-5432',
    location: 'Bandung, Indonesia',
    gender: 'Female',
    avatarUrl: '',
    status: 'UNDER_REVIEW',
    resumeUrl: '/resumes/sarah-wijaya.pdf',
    linkedin: 'https://linkedin.com/in/sarahwijaya',
    appliedAt: '2024-01-14T14:20:00Z',
    userInfo: {
      education: { answer: 'Bachelor of Information Systems - ITB' },
      experience: { answer: '2 years as Fullstack Developer at Startup' },
      skills: { answer: 'Vue.js, Python, PostgreSQL, Docker' },
      salary: { answer: 'Rp 10.000.000' },
      notice_period: { answer: '15 days' }
    },
    matchRate: 92
  },
  {
    id: '3',
    applicantId: '3',
    jobId: 'job-1',
    fullname: 'Budi Santoso',
    email: 'budi.santoso@email.com',
    phone: '+62 811-2233-4455',
    location: 'Surabaya, Indonesia',
    gender: 'Male',
    avatarUrl: '',
    status: 'SHORTLISTED',
    resumeUrl: '/resumes/budi-santoso.pdf',
    linkedin: 'https://linkedin.com/in/budisantoso',
    appliedAt: '2024-01-13T09:15:00Z',
    userInfo: {
      education: { answer: 'Diploma in Software Engineering - Politeknik Negeri' },
      experience: { answer: '4 years as Backend Developer at E-commerce' },
      skills: { answer: 'Java, Spring Boot, MySQL, AWS' },
      salary: { answer: 'Rp 15.000.000' },
      notice_period: { answer: '60 days' }
    },
    matchRate: 78
  },
  {
    id: '4',
    applicantId: '4',
    jobId: 'job-1',
    fullname: 'Maya Sari',
    email: 'maya.sari@email.com',
    phone: '+62 817-5566-7788',
    location: 'Yogyakarta, Indonesia',
    gender: 'Female',
    avatarUrl: '',
    status: 'REJECTED',
    resumeUrl: '/resumes/maya-sari.pdf',
    linkedin: 'https://linkedin.com/in/mayasari',
    appliedAt: '2024-01-12T16:45:00Z',
    userInfo: {
      education: { answer: 'Bachelor of Computer Engineering - UGM' },
      experience: { answer: '1 year as Junior Developer at Agency' },
      skills: { answer: 'PHP, Laravel, JavaScript, MySQL' },
      salary: { answer: 'Rp 8.000.000' },
      notice_period: { answer: 'Immediately' }
    },
    matchRate: 65
  },
  {
    id: '5',
    applicantId: '5',
    jobId: 'job-1',
    fullname: 'Rizky Pratama',
    email: 'rizky.pratama@email.com',
    phone: '+62 818-8899-0011',
    location: 'Bali, Indonesia',
    gender: 'Male',
    avatarUrl: '',
    status: 'ACCEPTED',
    resumeUrl: '/resumes/rizky-pratama.pdf',
    linkedin: 'https://linkedin.com/in/rizkypratama',
    appliedAt: '2024-01-11T11:10:00Z',
    userInfo: {
      education: { answer: 'Master of Data Science - Bina Nusantara' },
      experience: { answer: '5 years as Data Scientist at Fintech' },
      skills: { answer: 'Python, R, SQL, Machine Learning, TensorFlow' },
      salary: { answer: 'Rp 20.000.000' },
      notice_period: { answer: '45 days' }
    },
    matchRate: 95
  },
  {
    id: '6',
    applicantId: '6',
    jobId: 'job-1',
    fullname: 'Dewi Anggraini',
    email: 'dewi.anggraini@email.com',
    phone: '+62 819-3344-5566',
    location: 'Medan, Indonesia',
    gender: 'Female',
    avatarUrl: '',
    status: 'WITHDRAWN',
    resumeUrl: '/resumes/dewi-anggraini.pdf',
    linkedin: 'https://linkedin.com/in/dewianggraini',
    appliedAt: '2024-01-10T13:25:00Z',
    userInfo: {
      education: { answer: 'Bachelor of Computer Science - USU' },
      experience: { answer: '2 years as Mobile Developer' },
      skills: { answer: 'React Native, Flutter, Firebase, JavaScript' },
      salary: { answer: 'Rp 11.000.000' },
      notice_period: { answer: '30 days' }
    },
    matchRate: 72
  }
];

export const mockVisibleFields: AppFormField[] = [
  {
    id: 'education',
    fieldState: 'mandatory',
    key: 'education',
    label: 'Pendidikan Terakhir',
    fieldType: 'text'
  },
  {
    id: 'experience',
    fieldState: 'mandatory',
    key: 'experience',
    label: 'Pengalaman Kerja',
    fieldType: 'text'
  },
  {
    id: 'skills',
    fieldState: 'mandatory',
    key: 'skills',
    label: 'Keahlian',
    fieldType: 'text'
  },
  {
    id: 'salary',
    fieldState: 'mandatory',
    key: 'salary',
    label: 'Ekspektasi Gaji',
    fieldType: 'text'
  },
  {
    id: 'notice_period',
    fieldState: 'mandatory',
    key: 'notice_period',
    label: 'Notice Period',
    fieldType: 'text'
  }
];

export const mockJobTitle = "Senior Frontend Developer";
export const mockTotalApplicants = 24;