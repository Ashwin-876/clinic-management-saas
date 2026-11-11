'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LogIn, Mail, Lock, Eye, EyeOff, AlertCircle, Sparkles, Building2, ShieldCheck } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Authentication failed. Please verify credentials.');
        return;
      }

      // Successful login
      router.push(data.redirectTo || '/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Login submit error:', err);
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-xl border border-slate-200">
      <div className="text-center pb-4 border-b border-slate-100">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 mb-3">
          <Building2 className="h-6 w-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Clinic & Doctor Login</h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter registered credentials to access your clinic administrator or physician workspace.
        </p>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-rose-50 p-3.5 border border-rose-200 text-rose-800 text-xs">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        {/* Email */}
        <div>
          <span id="hint-login-email" className="form-hint">Registered owner/admin email</span>
          <label htmlFor="loginEmail" className="block text-xs font-semibold text-slate-800 mb-1">
            Administrator Email
          </label>
          <div className="relative">
            <input
              id="loginEmail"
              name="email"
              type="email"
              required
              autoComplete="username"
              spellCheck={false}
              aria-describedby="hint-login-email"
              placeholder="dr.rajesh@apexhospital.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 pl-3.5 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
            />
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
        </div>

        {/* Password */}
        <div>
          <span id="hint-login-password" className="form-hint">Account password</span>
          <label htmlFor="loginPassword" className="block text-xs font-semibold text-slate-800 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              id="loginPassword"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              aria-describedby="hint-login-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 pl-3.5 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50 transition-all"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              <span>Log In to Dashboard</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
        <p>
          Don&apos;t have a clinic registered yet?{' '}
          <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700 underline">
            Register your clinic here
          </Link>
        </p>
      </div>
    </div>
  );
}

