'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Stethoscope,
  Building2,
  User,
  Mail,
  Phone,
  DollarSign,
  Award,
  Clock,
  Calendar,
  LogOut,
  Edit,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Activity,
} from 'lucide-react';

interface DoctorData {
  id: string;
  doctorId: string;
  fullName: string;
  email: string;
  phone: string;
  specialization: string;
  qualification: string;
  experience: number;
  consultationFee: number;
  profileImage?: string | null;
  accountStatus: string;
  createdAt: string;
}

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
}

interface DepartmentData {
  id: string;
  name: string;
  description?: string | null;
}

export default function DoctorDashboardView() {
  const router = useRouter();
  const [doctor, setDoctor] = useState<DoctorData | null>(null);
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [department, setDepartment] = useState<DepartmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editQualification, setEditQualification] = useState('');
  const [editFee, setEditFee] = useState(500);
  const [editImage, setEditImage] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const fetchDoctorData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/doctor/dashboard');
      if (res.status === 401 || res.status === 403) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load doctor dashboard.');
        return;
      }
      setDoctor(data.data.doctor);
      setClinic(data.data.clinic);
      setDepartment(data.data.department);

      setEditPhone(data.data.doctor.phone || '');
      setEditQualification(data.data.doctor.qualification || '');
      setEditFee(data.data.doctor.consultationFee || 500);
      setEditImage(data.data.doctor.profileImage || '');
    } catch (err) {
      console.error('Fetch doctor data error:', err);
      setError('Network communication error loading doctor dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/doctor/dashboard', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: editPhone,
          qualification: editQualification,
          consultationFee: Number(editFee),
          profileImage: editImage || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update profile.');
        return;
      }

      setDoctor(data.doctor);
      setIsEditModalOpen(false);
      setSaveSuccess('Profile updated successfully.');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      console.error('Save profile error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        <p className="text-sm font-medium text-slate-600">Loading physician portal...</p>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="rounded-2xl bg-white p-8 border border-rose-200 text-center max-w-xl mx-auto my-12 shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-3">
          <Activity className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Doctor Portal Error</h2>
        <p className="text-xs text-slate-500 mt-1">{error || 'Unable to retrieve doctor profile.'}</p>
        <button
          onClick={fetchDoctorData}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4">
      {/* Top Banner Card */}
      <div className="rounded-3xl bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-brand-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-400 text-white font-extrabold text-2xl shadow-lg overflow-hidden flex-shrink-0 border-2 border-white/20">
              {doctor.profileImage ? (
                <img src={doctor.profileImage} alt={doctor.fullName} className="h-full w-full object-cover" />
              ) : (
                <span>{doctor.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-brand-300 bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/10">
                  {doctor.doctorId}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {doctor.accountStatus}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {doctor.fullName}
              </h1>

              <p className="text-xs sm:text-sm text-brand-200 font-medium">
                {doctor.specialization} • {department?.name || 'Department'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 text-xs font-semibold text-white transition"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Edit Profile</span>
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3.5 border border-emerald-200 text-emerald-800 text-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* 2-COLUMN PROFILE & CLINIC DETAIL GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DOCTOR PROFILE PANEL */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Stethoscope className="h-5 w-5 text-brand-600" />
            <h3 className="text-base font-bold text-slate-900">Physician Credentials & Profile</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Doctor ID</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-brand-700">{doctor.doctorId}</span>
                <button onClick={() => handleCopy(doctor.doctorId)} className="text-slate-400 hover:text-slate-600">
                  {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Specialization</span>
              <span className="font-semibold text-slate-900">{doctor.specialization}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Department</span>
              <span className="rounded bg-brand-50 px-2 py-0.5 font-bold text-brand-700 border border-brand-200">
                {department?.name}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Qualification</span>
              <span className="font-semibold text-slate-900">{doctor.qualification}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Experience</span>
              <span className="font-semibold text-slate-900">{doctor.experience} Years</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Consultation Fee</span>
              <span className="font-mono font-bold text-slate-900 text-sm">₹{doctor.consultationFee}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Login Email</span>
              <span className="font-mono text-slate-900">{doctor.email}</span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 font-medium">Contact Phone</span>
              <span className="font-semibold text-slate-900">{doctor.phone}</span>
            </div>
          </div>
        </div>

        {/* CLINIC AFFILIATION PANEL */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="h-5 w-5 text-brand-600" />
            <h3 className="text-base font-bold text-slate-900">Affiliated Clinic Information</h3>
          </div>

          {clinic ? (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Facility Name</span>
                <span className="font-bold text-slate-900">{clinic.name}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Unique Clinic ID</span>
                <span className="font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                  {clinic.clinicId}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Clinic Type</span>
                <span className="font-semibold text-slate-900">{clinic.clinicType}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Official Contact</span>
                <span className="font-semibold text-slate-900">{clinic.phone}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Official Email</span>
                <span className="font-mono text-slate-900">{clinic.email}</span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">Address</span>
                <span className="font-semibold text-slate-900 text-right max-w-[65%]">
                  {clinic.address}, {clinic.city}, {clinic.state} - {clinic.pincode}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Loading clinic metadata...</p>
          )}

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-slate-600 text-[11px]">
              <span className="font-semibold text-slate-800">Tenant-Isolated Physician Account:</span> You have individual credentials linked to your clinic workspace. All consultations and clinical records are isolated.
            </div>
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Update Doctor Profile
            </h3>

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Qualifications</label>
                <input
                  type="text"
                  required
                  value={editQualification}
                  onChange={(e) => setEditQualification(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Consultation Fee (₹)</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={editFee}
                  onChange={(e) => setEditFee(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Profile Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={editImage}
                  onChange={(e) => setEditImage(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700"
                >
                  {saving && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

