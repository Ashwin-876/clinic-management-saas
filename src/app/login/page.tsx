import { Suspense } from 'react';
import LoginForm from '@/components/LoginForm';
import { ShieldCheck, Lock, Activity } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Administrator Login | Quantanix Health SaaS',
  description: 'Secure authentication for clinic administrators with role-based access control and tenant verification.',
};

export default function LoginPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-md mx-auto">
      <div className="mb-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-brand-700 hover:text-brand-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white shadow-xs">
            <Activity className="h-4 w-4" />
          </div>
          <span className="font-bold text-slate-900 tracking-tight text-lg">
            Quantanix<span className="text-brand-600">Health</span>
          </span>
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="rounded-2xl bg-white p-8 text-center text-slate-500 shadow-md">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent mx-auto mb-2"></div>
            Loading authentication portal...
          </div>
        }
      >
        <LoginForm />
      </Suspense>

      <div className="mt-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <span>End-to-end encrypted session • RBAC active</span>
      </div>
    </div>
  );
}

