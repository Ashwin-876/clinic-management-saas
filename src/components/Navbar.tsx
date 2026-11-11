'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Activity, ShieldCheck, LogOut, LayoutDashboard, PlusCircle, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AuthUser {
  userId: string;
  clinicId: string;
  clinicName: string;
  name: string;
  email: string;
  role: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data && data.authenticated) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-teal-500 text-white shadow-sm shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Quantanix<span className="text-brand-600">Health</span>
              </span>
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700 tracking-wide uppercase border border-brand-200">
                Phase 2 SaaS
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">Clinic & Doctor Management</p>
          </div>
        </Link>

        {/* Navigation Actions */}
        <nav className="flex items-center space-x-2 sm:space-x-4">
          <Link
            href="/"
            className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
              pathname === '/'
                ? 'text-brand-700 bg-brand-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Overview
          </Link>

          {!loading && user ? (
            <>
              <Link
                href={user.role === 'DOCTOR' ? '/doctor/dashboard' : '/dashboard'}
                className={`flex items-center space-x-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                  pathname.startsWith('/dashboard') || pathname.startsWith('/doctor')
                    ? 'text-brand-700 bg-brand-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>{user.role === 'DOCTOR' ? 'Doctor Portal' : 'Clinic Dashboard'}</span>
              </Link>

              <div className="hidden md:flex items-center space-x-2 pl-2 border-l border-slate-200">
                <div className="flex flex-col text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-xs font-semibold text-slate-800">{user.name}</span>
                    <span className="rounded bg-slate-100 text-[10px] font-bold px-1.5 py-0.5 text-slate-600 border border-slate-200">
                      {user.role}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-brand-700">
                    {user.clinicName} ({user.clinicId})
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 shadow-xs hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/register"
                className={`flex items-center space-x-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                  pathname === '/register'
                    ? 'text-brand-700 bg-brand-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <PlusCircle className="h-4 w-4" />
                <span>Register Clinic</span>
              </Link>

              <Link
                href="/login"
                className="flex items-center space-x-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 transition-all"
              >
                <LogIn className="h-4 w-4" />
                <span>Clinic Login</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

