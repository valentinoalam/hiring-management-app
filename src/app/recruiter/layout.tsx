
import Header from '@/components/layout/recruiter/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="flex-1 grow flex flex-col min-w-0 relative">
      <Header />
      <main className="flex flex-1 flex-col overflow-auto gap-4 md:p-4">
        {children}
      </main>
    </div>
  );
}