import { ApplicationStatus } from "@/types/job";

export const generateMockApplicants = (count: number = 6) => {
  const statuses: ApplicationStatus[] = ['PENDING', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED', 'ACCEPTED', 'WITHDRAWN'];
  const locations = ['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Bali', 'Medan', 'Semarang', 'Makassar'];
  const genders = ['Male', 'Female'];
  
  const firstNames = ['Ahmad', 'Budi', 'Rizky', 'Dewi', 'Maya', 'Sarah', 'Joko', 'Sari', 'Putri', 'Hendra'];
  const lastNames = ['Santoso', 'Wijaya', 'Pratama', 'Anggraini', 'Sari', 'Kurniawan', 'Nugroho', 'Putra', 'Lestari', 'Siregar'];

  return Array.from({ length: count }, (_, index) => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const status = statuses[index % statuses.length];
    
    return {
      id: `mock-${index + 1}`,
      fullname: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
      phone: `+62 81${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      location: `${locations[Math.floor(Math.random() * locations.length)]}, Indonesia`,
      gender: genders[Math.floor(Math.random() * genders.length)],
      avatarUrl: '',
      status,
      resumeUrl: `/resumes/${firstName.toLowerCase()}-${lastName.toLowerCase()}.pdf`,
      linkedin: `https://linkedin.com/in/${firstName.toLowerCase()}${lastName.toLowerCase()}`,
      appliedAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      userInfo: {
        education: { answer: 'Bachelor of Computer Science - University Sample' },
        experience: { answer: `${Math.floor(1 + Math.random() * 5)} years as Developer` },
        skills: { answer: 'JavaScript, React, Node.js, TypeScript' },
        salary: { answer: `Rp ${(8 + Math.floor(Math.random() * 12)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}.000.000` },
        notice_period: { answer: `${15 + Math.floor(Math.random() * 45)} days` }
      },
      matchRate: 60 + Math.floor(Math.random() * 40)
    };
  });
};