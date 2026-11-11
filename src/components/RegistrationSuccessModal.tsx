'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Copy, Check, ArrowRight, ShieldCheck, Building2, User, Mail, Phone, Calendar } from 'lucide-react';

export interface RegisteredClinicData {
  clinicId: string;
  clinicName: string;
  clinicType: string;
  officialEmail: string;
  contactNumber: string;
  address: string;
  adminName: string;
  adminEmail: string;
  registrationDate: string;
  accountStatus: string;
}

interface Props {
  data: RegisteredClinicData;
  onClose?: () => void;
}

export default function RegistrationSuccessModal({ data }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.clinicId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100">
        {/* Header Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        {/* Title */}
        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 mb-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Tenant Provisioned Successfully
          </span>
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Clinic Registered!</h2>
          <p className="mt-1 text-sm text-slate-600">
            Your clinic has been successfully provisioned in the multi-tenant system.
          </p>
        </div>

        {/* Unique Clinic ID Showcase Banner */}
        <div className="mt-6 rounded-xl border-2 border-brand-200 bg-gradient-to-br from-brand-50/80 to-white p-5 text-center shadow-xs">
          <p className="text-xs font-semibold tracking-wider text-brand-900 uppercase">
            Permanent Unique Clinic ID
          </p>
          <div className="mt-2 flex items-center justify-center gap-3">
            <span className="font-mono text-2xl sm:text-3xl font-extrabold tracking-wide text-brand-700 bg-white px-4 py-1.5 rounded-lg border border-brand-300 shadow-inner">
              {data.clinicId}
            </span>
            <button
              onClick={handleCopy}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200 shadow-xs hover:bg-slate-50 active:scale-95 transition-all"
              title="Copy Clinic ID"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-slate-500" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Immutable backend-generated tenant key. Keep this ID for multi-tenant verification.
          </p>
        </div>

        {/* Details Grid */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
            <span className="flex items-center text-slate-500 gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Clinic Name
            </span>
            <span className="font-semibold text-slate-800">{data.clinicName}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
            <span className="flex items-center text-slate-500 gap-1.5">
              <User className="h-3.5 w-3.5" /> Administrator
            </span>
            <span className="font-semibold text-slate-800">{data.adminName}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
            <span className="flex items-center text-slate-500 gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Login Email
            </span>
            <span className="font-mono text-slate-800">{data.adminEmail}</span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="flex items-center text-slate-500 gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Account Status
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
              {data.accountStatus || 'ACTIVE'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            href={`/login?email=${encodeURIComponent(data.adminEmail)}`}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 transition-all"
          >
            <span>Proceed to Admin Login</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

