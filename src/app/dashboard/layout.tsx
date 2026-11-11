export const metadata = {
  title: 'Clinic Dashboard | Quantanix Health SaaS',
  description: 'Multi-tenant clinic management dashboard.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {children}
    </div>
  );
}

