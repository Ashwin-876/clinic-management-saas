import ClinicRegistrationForm from '@/components/ClinicRegistrationForm';
import { Shield, Sparkles, Database, Lock } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Register Clinic | Quantanix Health SaaS',
  description: 'Onboard a new clinic facility with automated unique Clinic ID generation and tenant isolation.',
};

export default function RegisterPage() {
  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Breadcrumb / Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-800">Home</Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">Clinic Registration</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
          <Shield className="h-3.5 w-3.5 text-brand-600" />
          <span>Shared DB Tenant Isolation</span>
        </div>
      </div>

      {/* Main Registration Component */}
      <ClinicRegistrationForm />

      {/* Trust & Architecture Badges */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
        <div className="flex items-start gap-3 rounded-xl bg-white p-4 border border-slate-200">
          <Sparkles className="h-4 w-4 text-brand-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-slate-800">Immutable Clinic ID</p>
            <p className="mt-0.5 text-slate-500">Auto-allocated format QNX-CLN-000001 with collision-proof concurrency.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl bg-white p-4 border border-slate-200">
          <Database className="h-4 w-4 text-brand-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-slate-800">PostgreSQL + Prisma</p>
            <p className="mt-0.5 text-slate-500">Shared schema with strict tenant isolation enforced at query level.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl bg-white p-4 border border-slate-200">
          <Lock className="h-4 w-4 text-brand-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-slate-800">RBAC & Audit Trails</p>
            <p className="mt-0.5 text-slate-500">Admin password hashing, secure JWT sessions, and full operational audit logs.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

