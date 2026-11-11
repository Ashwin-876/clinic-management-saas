import Link from 'next/link';
import {
  Building2,
  ShieldCheck,
  KeyRound,
  Database,
  ArrowRight,
  CheckCircle,
  Activity,
  Stethoscope,
  Layers,
  Lock,
  Sparkles,
  Users,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-16 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-navy-900 via-slate-900 to-navy-950 p-8 sm:p-14 text-white shadow-2xl">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-brand-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/20 px-3.5 py-1.5 text-xs font-semibold text-brand-300 border border-brand-500/30">
            <Sparkles className="h-4 w-4" />
            <span>PHASE 2: Advanced Dashboard & Doctor Management</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Multi-Tenant Clinic Management <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-teal-300 to-emerald-400">SaaS Platform</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Enterprise healthcare architecture built with <strong className="text-white">Next.js</strong>, <strong className="text-white">TypeScript</strong>, <strong className="text-white">Tailwind CSS</strong>, and <strong className="text-white">PostgreSQL & Prisma</strong>. Featuring advanced clinic dashboard metrics, full doctor directory, department management, individual physician logins, and strict shared-database tenant isolation.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/30 hover:bg-brand-500 active:bg-brand-700 transition-all"
            >
              <span>Register New Clinic</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 backdrop-blur-md px-6 py-3.5 text-sm font-semibold text-white border border-white/20 hover:bg-white/20 active:bg-white/25 transition-all"
            >
              <KeyRound className="h-4 w-4 text-brand-300" />
              <span>Admin & Doctor Login</span>
            </Link>
          </div>

          <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-400 border-t border-white/10">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-400" /> Unique Doctor ID (DOC-000001)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-400" /> Safe Department Deletion
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-400" /> Individual Doctor Portal
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-400" /> Strict Tenant Isolation
            </span>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES GRID */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Phase 2 Healthcare Management Capabilities
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Complete doctor onboarding, department assignment, individual logins, and metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Advanced Clinic Dashboard */}
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">1. Advanced Clinic Dashboard</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Real-time scoped metrics: Total Doctors, Active Doctors, Inactive Doctors, Total Departments, Recently Added Doctors table, and Clinic Information card with Unique Clinic ID.
            </p>
            <div className="pt-2 text-[11px] font-semibold text-brand-700">
              Instant operational visibility
            </div>
          </div>

          {/* Card 2: Doctor Directory & Management */}
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Stethoscope className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">2. Full Doctor Lifecycle</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Add Doctors with auto-allocated sequential IDs (<code className="font-mono text-brand-700 font-bold">DOC-000001</code>), edit details, view complete clinical profiles, toggle active/inactive status, with search and filters.
            </p>
            <div className="pt-2 text-[11px] font-semibold text-brand-700">
              Search by name, ID & department
            </div>
          </div>

          {/* Card 3: Department Management */}
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">3. Safe Department Management</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Create, edit, and activate/deactivate departments. Safe deletion logic prevents deleting departments while doctors are assigned to them, maintaining referential integrity.
            </p>
            <div className="pt-2 text-[11px] font-semibold text-brand-700">
              Safe deletion dependency guard
            </div>
          </div>

          {/* Card 4: Individual Doctor Portal */}
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <KeyRound className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">4. Individual Doctor Login</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every doctor receives individual login credentials (<code className="font-mono text-slate-800">role: DOCTOR</code>). Dedicated doctor dashboard showing their profile, affiliated clinic metadata, and self-profile updates.
            </p>
            <div className="pt-2 text-[11px] font-semibold text-brand-700">
              Dedicated /doctor/dashboard
            </div>
          </div>

          {/* Card 5: Role-Based Permissions */}
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">5. Role Management & RBAC</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Role permissions strictly enforced: Clinic Owner and Administrator manage doctors & departments; Doctors have scoped self-service access; and cross-clinic access is denied.
            </p>
            <div className="pt-2 text-[11px] font-semibold text-brand-700">
              OWNER, ADMIN, DOCTOR, RECEPTIONIST
            </div>
          </div>

          {/* Card 6: Database & Tenant Guard */}
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">6. Tenant Isolation on Every API</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              All <code className="font-mono text-slate-800">doctors</code> and <code className="font-mono text-slate-800">departments</code> tables link to <code className="font-mono text-brand-700">clinic_id</code>. Verified cross-clinic access prevention in shared PostgreSQL database.
            </p>
            <div className="pt-2 text-[11px] font-semibold text-brand-700">
              Shared DB with strict row-level isolation
            </div>
          </div>
        </div>
      </section>

      {/* QUICK WORKFLOW CALLOUT */}
      <section className="rounded-2xl bg-white p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900">Experience Phase 2 in Action</h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Sign in as a clinic administrator to manage doctors and departments, or log in as a doctor to view the physician portal.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-brand-700 transition"
          >
            Access Portal
          </Link>
          <Link
            href="/register"
            className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Register Clinic
          </Link>
        </div>
      </section>
    </div>
  );
}
