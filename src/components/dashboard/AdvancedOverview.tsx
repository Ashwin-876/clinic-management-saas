'use client';

import React, { useState } from 'react';
import {
  Building2,
  Stethoscope,
  Users,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  QrCode,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import TenantIsolationVerifier from '../TenantIsolationVerifier';

interface ClinicData {
  id: string;
  clinicId: string;
  name: string;
  clinicType: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  accountStatus: string;
  createdAt: string;
}

interface Metrics {
  totalDoctors: number;
  activeDoctors: number;
  inactiveDoctors: number;
  totalDepartments: number;
  totalPatients?: number;
  newPatients?: number;
  returningPatients?: number;
}

interface DoctorPreview {
  id: string;
  doctorId: string;
  fullName: string;
  specialization: string;
  experience: number;
  accountStatus: string;
  department: {
    id: string;
    name: string;
  };
}

interface Props {
  clinic: ClinicData;
  metrics: Metrics;
  recentDoctors: DoctorPreview[];
  onNavigateDoctors: () => void;
  onNavigateDepartments: () => void;
  onNavigatePatients?: () => void;
  onOpenQr?: () => void;
}

export default function AdvancedOverview({
  clinic,
  metrics,
  recentDoctors,
  onNavigateDoctors,
  onNavigateDepartments,
  onNavigatePatients,
  onOpenQr,
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(clinic.clinicId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Date(clinic.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* PHASE 3: PATIENT REGISTRATION & QR CODE CALLOUT BANNER */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 uppercase tracking-wider">
              Phase 3 Active
            </span>
            <span className="text-xs text-slate-300 font-medium">
              QR Code Self-Service & Patient Management
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Touchless Patient Check-In & Verification
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Display your facility&apos;s unique QR code at reception. Returning patients are identified instantly via mobile number &amp; OTP verification.
          </p>

          <div className="flex flex-wrap gap-4 pt-1 text-xs">
            <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-slate-400 block text-[10px] uppercase">Total Patients</span>
              <span className="font-bold font-mono text-base text-sky-400">
                {metrics.totalPatients ?? 0}
              </span>
            </div>
            <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-slate-400 block text-[10px] uppercase">New Patients</span>
              <span className="font-bold font-mono text-base text-emerald-400">
                {metrics.newPatients ?? 0}
              </span>
            </div>
            <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-slate-400 block text-[10px] uppercase">Returning Patients</span>
              <span className="font-bold font-mono text-base text-indigo-300">
                {metrics.returningPatients ?? 0}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 flex-shrink-0">
          {onOpenQr && (
            <button
              onClick={onOpenQr}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-xl shadow-sm transition"
            >
              <QrCode className="w-4 h-4 mr-2" />
              View / Print Clinic QR
            </button>
          )}
          {onNavigatePatients && (
            <button
              onClick={onNavigatePatients}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-xl border border-white/20 transition"
            >
              <Users className="w-4 h-4 mr-2" />
              Manage Patients Directory
            </button>
          )}
        </div>
      </div>

      {/* 4 ADVANCED METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Doctors */}
        <div
          onClick={onNavigateDoctors}
          className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs hover:border-brand-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Doctors</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 group-hover:scale-110 transition-transform">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 font-mono">{metrics.totalDoctors}</p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>Registered physicians</span>
            <span className="text-brand-600 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              View <ArrowRight className="h-3 w-3 inline" />
            </span>
          </div>
        </div>

        {/* Metric 2: Active Doctors */}
        <div
          onClick={onNavigateDoctors}
          className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Doctors</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-2xl font-black text-slate-900 font-mono">{metrics.activeDoctors}</p>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Available for consultation</p>
        </div>

        {/* Metric 3: Inactive Doctors */}
        <div
          onClick={onNavigateDoctors}
          className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs hover:border-rose-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Inactive Doctors</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 group-hover:scale-110 transition-transform">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 font-mono">{metrics.inactiveDoctors}</p>
          <p className="mt-1 text-[11px] text-slate-500">Temporarily paused</p>
        </div>

        {/* Metric 4: Total Departments */}
        <div
          onClick={onNavigateDepartments}
          className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs hover:border-brand-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Departments</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 group-hover:scale-110 transition-transform">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 font-mono">{metrics.totalDepartments}</p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>Clinical specialties</span>
            <span className="text-brand-600 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Manage <ArrowRight className="h-3 w-3 inline" />
            </span>
          </div>
        </div>
      </div>

      {/* CLINIC INFORMATION CARD */}
      <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-brand-600" />
            <h3 className="text-base font-bold text-slate-900">Clinic Information</h3>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Status: {clinic.accountStatus}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80">
            <span className="text-slate-500 font-medium">Clinic / Hospital Name</span>
            <p className="mt-1 font-bold text-slate-900 text-sm">{clinic.name}</p>
            <p className="text-[11px] text-brand-700">{clinic.clinicType}</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80">
            <span className="text-slate-500 font-medium">Unique Clinic ID</span>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono font-bold text-brand-700 text-sm">{clinic.clinicId}</span>
              <button
                onClick={handleCopyId}
                className="text-slate-400 hover:text-slate-600"
                title="Copy Clinic ID"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">Permanent tenant key</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80">
            <span className="text-slate-500 font-medium">Registration Date</span>
            <p className="mt-1 font-bold text-slate-900 text-sm">{formattedDate}</p>
            <p className="text-[11px] text-slate-400">Onboarded timestamp</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80">
            <span className="text-slate-500 font-medium">Official Contact Email</span>
            <p className="mt-1 font-mono font-semibold text-slate-900 truncate">{clinic.email}</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80">
            <span className="text-slate-500 font-medium">Contact Phone</span>
            <p className="mt-1 font-semibold text-slate-900">{clinic.phone}</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80">
            <span className="text-slate-500 font-medium">Facility Address</span>
            <p className="mt-1 font-semibold text-slate-900 truncate">
              {clinic.address}, {clinic.city}, {clinic.state} - {clinic.pincode}
            </p>
          </div>
        </div>
      </div>

      {/* RECENTLY ADDED DOCTORS SECTION */}
      <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-brand-600" />
            <h3 className="text-base font-bold text-slate-900">Recently Added Doctors</h3>
          </div>
          <button
            onClick={onNavigateDoctors}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>View All Doctors ({metrics.totalDoctors})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {recentDoctors.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No doctors have been onboarded yet. Click &quot;Doctor Directory&quot; in the sidebar to add your first doctor.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Doctor Name</th>
                  <th className="py-2.5 px-3">Doctor ID</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Specialization</th>
                  <th className="py-2.5 px-3">Experience</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentDoctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{doc.fullName}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] font-semibold text-brand-700">
                      {doc.doctorId}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-800 font-medium">
                        {doc.department.name}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{doc.specialization}</td>
                    <td className="py-2.5 px-3 text-slate-600">{doc.experience} Years</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                          doc.accountStatus === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {doc.accountStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TENANT ISOLATION VERIFIER */}
      <TenantIsolationVerifier currentClinicId={clinic.clinicId} />
    </div>
  );
}

