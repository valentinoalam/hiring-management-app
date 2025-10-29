// metadata.ts
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rakamin-hiringhub.com";

// =====================================
// PAGE METADATA (EN + ID)
// =====================================

export const pageMetadata = {
  home: {
    en: {
      title: "HiringHub | Smart Hiring Management Platform",
      description:
        "Streamline your recruitment process with HiringHub — post jobs, manage applicants, and hire smarter with dynamic, configurable workflows.",
      keywords: [
        "hiring platform",
        "recruitment management",
        "job application system",
        "applicant tracking",
        "HR software",
      ],
    },
    id: {
      title: "HiringHub | Platform Manajemen Rekrutmen Cerdas",
      description:
        "Permudah proses rekrutmen Anda dengan HiringHub — buat lowongan, kelola pelamar, dan rekrut dengan sistem cerdas yang dinamis dan fleksibel.",
      keywords: [
        "platform rekrutmen",
        "sistem manajemen pelamar",
        "lowongan kerja online",
        "software HR",
        "manajemen rekrutmen",
      ],
    },
  },

  jobs: {
    en: {
      title: "Browse Jobs | HiringHub",
      description:
        "Discover open job positions across departments. Apply easily with a smart, dynamic form that adapts to each job's requirements.",
      keywords: [
        "job listings",
        "apply job",
        "career opportunities",
        "dynamic job form",
      ],
    },
    id: {
      title: "Cari Lowongan | HiringHub",
      description:
        "Temukan berbagai lowongan kerja di berbagai departemen. Lamar dengan mudah melalui form dinamis yang menyesuaikan kebutuhan tiap posisi.",
      keywords: [
        "daftar lowongan kerja",
        "lamar pekerjaan",
        "kesempatan karier",
        "formulir lamaran dinamis",
      ],
    },
  },

  apply: {
    en: {
      title: "Apply for Job | HiringHub",
      description:
        "Submit your application quickly and easily. Each form adapts dynamically based on recruiter requirements — ensuring a smooth experience.",
      keywords: [
        "job application",
        "apply job",
        "career submission",
        "recruitment process",
        "smart form",
      ],
    },
    id: {
      title: "Lamar Pekerjaan | HiringHub",
      description:
        "Kirim lamaran Anda dengan cepat dan mudah. Formulir akan menyesuaikan secara dinamis sesuai kebutuhan rekruter untuk pengalaman terbaik.",
      keywords: [
        "lamar pekerjaan",
        "formulir lamaran kerja",
        "proses rekrutmen",
        "karier",
      ],
    },
  },

  admin: {
    en: {
      title: "Admin Dashboard | Manage Jobs & Applicants | HiringHub",
      description:
        "Create and manage job postings, configure application forms, and track candidate progress — all in one place with HiringHub’s admin dashboard.",
      keywords: [
        "admin dashboard",
        "job management",
        "candidate tracking",
        "recruitment analytics",
      ],
    },
    id: {
      title: "Dasbor Admin | Kelola Lowongan & Pelamar | HiringHub",
      description:
        "Buat dan kelola lowongan pekerjaan, atur formulir lamaran, dan pantau progres pelamar — semua dalam satu dashboard HiringHub.",
      keywords: [
        "dashboard admin",
        "manajemen lowongan",
        "pelacakan pelamar",
        "analitik rekrutmen",
      ],
    },
  },

  candidates: {
    en: {
      title: "Candidate Management | HiringHub",
      description:
        "View, sort, and manage applicants per job. Customize your candidate table just like a spreadsheet — sort, resize, and reorder columns easily.",
      keywords: [
        "candidate management",
        "applicant tracking",
        "recruiter tools",
        "HR software",
      ],
    },
    id: {
      title: "Manajemen Pelamar | HiringHub",
      description:
        "Lihat, urutkan, dan kelola pelamar per lowongan. Sesuaikan tampilan tabel pelamar seperti spreadsheet — ubah ukuran dan urutan kolom dengan mudah.",
      keywords: [
        "manajemen pelamar",
        "pelacakan kandidat",
        "alat rekruter",
        "sistem HR",
      ],
    },
  },

  contact: {
    en: {
      title: "Contact HiringHub | Partner with Us",
      description:
        "Get in touch with our team for inquiries, demos, or partnership opportunities. Let’s simplify recruitment together.",
      keywords: [
        "contact HiringHub",
        "business inquiry",
        "demo request",
        "partnership",
      ],
    },
    id: {
      title: "Hubungi HiringHub | Jadi Mitra Kami",
      description:
        "Hubungi tim kami untuk pertanyaan, demo, atau peluang kerja sama. Mari permudah proses rekrutmen bersama.",
      keywords: [
        "hubungi HiringHub",
        "permintaan demo",
        "kerja sama bisnis",
        "kontak HiringHub",
      ],
    },
  },
};

// =====================================
// MAIN METADATA GENERATOR
// =====================================

export const generateMetaData = (
  pageKey: keyof typeof pageMetadata = "home",
  locale: "en" | "id" = "en",
  path: string = ""
): Metadata => {
  const meta = pageMetadata[pageKey][locale];
  const safePath = path.startsWith("/") ? path : `/${path}`;
  const url = `${baseUrl}${locale === "en" ? "" : `/id`}${safePath}`;

  return {
    metadataBase: new URL(baseUrl),
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: {
      canonical: url,
      languages: {
        "en-US": `${baseUrl}${safePath}`,
        "id-ID": `${baseUrl}/id${safePath}`,
      },
    },
    openGraph: {
      type: "website",
      locale: locale === "id" ? "id_ID" : "en_US",
      url,
      siteName: "HiringHub",
      title: meta.title,
      description: meta.description,
      images: [
        {
          url: `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: meta.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [`${baseUrl}/og-image.jpg`],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
};

// =====================================
// DEFAULT METADATA (for root layout)
// =====================================

export const defaultMetadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "HiringHub | Smart Hiring Management Platform",
    template: "%s | HiringHub",
  },
  description:
    "HiringHub helps companies and applicants streamline the hiring process — from job posting and dynamic form setup to candidate management and evaluation.",
  keywords: [
    "hiring platform",
    "recruitment system",
    "job management app",
    "applicant tracking system",
    "recruitment software",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "HiringHub",
    title: "HiringHub | Smart Hiring Management Platform",
    description:
      "Streamline your recruitment process — post jobs, manage applicants, and hire smarter with dynamic, configurable workflows.",
    images: [
      {
        url: `${baseUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "HiringHub — Smart Hiring Management Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HiringHub | Smart Hiring Management Platform",
    description:
      "Empowering recruiters and applicants with a modern, flexible hiring system — efficient, transparent, and customizable.",
    images: [`${baseUrl}/og-image.jpg`],
  },
  alternates: {
    canonical: baseUrl,
    languages: {
      "en-US": "/",
      "id-ID": "/id",
    },
  },
};

export default defaultMetadata;
