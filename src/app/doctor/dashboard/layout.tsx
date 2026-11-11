export const metadata = {
  title: 'Doctor Portal | Quantanix Health SaaS',
  description: 'Individual physician dashboard and profile management.',
};

export default function DoctorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {children}
    </div>
  );
}

