# **🚀 Hiring Management Web App**


## **🧭 i. Project Overview**

The Hiring Management Web App is a modern platform designed to simplify the hiring process between Recruiters (Admins) and Job Seekers (Applicants).

Recruiters can manage job postings, configure custom applicant requirements, and review submitted candidates in a flexible, spreadsheet-like interface.
Applicants can explore open positions, apply dynamically according to recruiter configurations, and capture their profile photos using webcam gesture recognition.

The project emphasizes:

- Dynamic form validation based on backend configuration.

- Pixel-perfect UI based on provided design.

- Modular, scalable frontend architecture built for enterprise quality.

## **🧱 ii. Tech Stack Used**
| Layer	 | Technology|
| ------ | ------ |
| Framework	| Next.js 16 (App Router)|
| UI Components	| Shadcn/UI  + Tailwind CSS|
| State Management	| Zustand|
| Data Fetching	| TanStack Query (React Query)|
| ORM / Database	| Prisma|
| Authentication	| Auth.js|
| Gesture & Webcam	| MediaPipe Hands|
| Form Validation	| Zod + React Hook Form|
| Deployment	| Vercel|

## **🧩 iii. How to Run Locally**
### 1️⃣ Clone the repository
git clone https://github.com/valentinoalam/hiring-management-app.git
cd hiring-management-app

### 2️⃣ Install dependencies
npm install

### 3️⃣ Setup environment variables
cp .env.example .env.local
Fill in values for:
```
    DATABASE_URL=
    NEXT_PUBLIC_APP_URL=
    NEXTAUTH_SECRET=
    NEXTAUTH_URL=
    GOOGLE_CLIENT_ID=
    GOOGLE_CLIENT_SECRET=
    BLOB_READ_WRITE_TOKEN=
    EMAIL_SERVER_HOST=smtp.gmail.com
    EMAIL_SERVER_PORT=
    EMAIL_SERVER_USER=
    EMAIL_SERVER_PASSWORD=
    EMAIL_FROM=
    RESEND_API_KEY=
```

### 4️⃣ Run Prisma migrations and seed initial data
npx prisma migrate dev
npx prisma db seed

### 5️⃣ Start the local development server
npm run dev

### 6️⃣ Open in your browser
http://localhost:3000

## **⚙️ iv. Key Features Implemented**
🧑‍💼 Admin (Recruiter)

Job List Management — view, sort, and filter job postings (Active / Draft / Inactive).

Dynamic Job Configuration — toggle applicant form fields (Mandatory / Optional / Hidden).

Candidate Management Table — built with TanStack Table:

Resizable & draggable columns.

Sorting, filtering, and pagination.

State persisted via Zustand + localStorage.

👩‍💻 Applicant (Job Seeker)

Job Listing Page — browse active vacancies with salary range and metadata.

Dynamic Application Form — fields rendered & validated based on recruiter config.

Webcam Capture with Gesture Trigger — powered by MediaPipe Hands for automatic capture.

Feedback UI — success/error states using Shadcn Toaster.

## **🌟 v. Optional Enhancements Added**

💾 Persisted table layout (columns + order saved to localStorage).

⚡ Form autosave using Zustand store.

🔔 Sonner / Shadcn toast notifications for consistent feedback.

🧠 Optimized query caching and refetching behavior with TanStack Query.

🧩 Custom error boundaries and validation summary modal for admin forms.

## **🧮 vi. Design or Logic Assumptions**

Missing fields in backend config are treated as hidden on the applicant form.

All admin actions assume authenticated sessions via Auth.js.

Prisma manages User, Job, and Application models in a PostgreSQL database.

Photo captures are handled in-memory (not persisted to database).

Gesture detection simplified to a single “3-finger” pose for UX reliability.

## **🧠 vii. Known Limitations**

⚠️ Gesture detection may vary under poor lighting or low-resolution webcams.

🔐 Role-based access control not fully implemented beyond basic authentication.

🗃️ Column layout persistence stored locally only (not synced to backend).

📧 No email notification or resume parsing features (planned future enhancement).

🧪 Limited automated test coverage (manual validation only).

📂 Project Folder Structure
.
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/ (main code)
├── tests/ (jest test)
├── public/ (public access assets)
└── README.md

src
├── app/
│   ├── (auth)/  [/login, /sign-up, /auth/verify-request, /auth/error]
│   ├── (default)/  [/jobs, /recruiter, /jobs/[id]/apply, /recruiter/jobs/[id]]
│   ├── [applicationId]/ [/[applicationId]/success]
│   ├── api/
│   └── layout.tsx
├── components/
│   ├── ui/
│   ├── custom-ui  (customized ui form component)
│   ├── job/   (all main features component)
│   └── layout/ (all component related to layout)
├── configs/
├── data/  (data that saved in json, example: data of location names)
├── hooks/ 
│   ├── queries/ (hooks for tanstack queries)
├── lib/
│   ├── api.ts (function for fetch api)
│   ├── prisma.ts
│   ├── email.ts (send magic mail using nodemailer)
│   ├── tokens.ts (to generate verify token to verify email)
│   └── upload.ts (upload file to vercel blob)  
│   └── utils.ts  (from shadcn, to merge className)
├── store/
│   └── auth-store.ts (to save user data from auth using zustand)
├── styles/
│   └── base.ts (base set up variables for tailwind)
│   └── global.ts (main tailwind config)
│   └── theme.ts (custom class)
├── types/
│   └── job.ts (job related types)
│   └── user.ts (user related types)
├── utils/ (any supported function)
├── auth.config.ts (configuration for authjs)
├── auth.ts (main authjs file)



## **🧑‍💻 Author**

Valentino Noor Alam
Fullstack Engineer — https://tino-karya.vercel.app/

📧 ichikyube@gmail.com [🔗 LinkedIn](https://www.linkedin.com/in/valentinoalam/) [🐙 GitHub](https://github.com/valentinoalam)