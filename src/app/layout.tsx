import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Quantanix Health | Multi-Tenant Clinic Management SaaS',
  description:
    'Enterprise healthcare management platform with multi-tenant architecture, automated Clinic ID allocation, and strict data isolation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© 2026 Quantanix Health Systems Inc. Phase 1 Multi-Tenant Core.</p>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Shared DB Tenant Isolation: Active
              </span>
              <span>•</span>
              <span className="text-slate-400">PostgreSQL + Prisma</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

