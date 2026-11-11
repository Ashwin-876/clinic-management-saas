'use client';

import React from 'react';
import {
  X,
  User,
  Stethoscope,
  Building2,
  Mail,
  Phone,
  DollarSign,
  Award,
  Clock,
  ShieldCheck,
  Calendar,
  Edit,
  Power,
} from 'lucide-react';

interface DoctorProfileData {
  id: string;
  doctorId: string;
  fullName: string;
  email: string;
  phone: string;
  specialization: string;
  qualification: string;
  experience: number;
  departmentId: string;
  consultationFee: number;
  profileImage?: string | null;
  accountStatus: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  department: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    email: string;
    isActive: boolean;
    lastLoginAt?: string | null;
  };
}

interface Props {
  doctor: DoctorProfileData | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (doctor: DoctorProfileData) => void;
  onToggleStatus: (doctor: DoctorProfileData) => void;
}

export default function DoctorProfileModal({
  doctor,
  isOpen,
  onClose,
  onEdit,
  onToggleStatus,
}: Props) {
  if (!isOpen || !doctor) return null;

  const formattedDate = new Date(doctor.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Doctor Identity Header */}
        <div className="flex items-start gap-4 pb-5 border-b border-slate-100">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-500 text-white font-bold text-xl shadow-md overflow-hidden flex-shrink-0">
            {doctor.profileImage ? (
              <img
                src={doctor.profileImage}
                alt={doctor.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>
                {doctor.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                {doctor.doctorId}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  doctor.accountStatus === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    doctor.accountStatus === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
                {doctor.accountStatus}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900">{doctor.fullName}</h3>
            <p className="text-xs text-brand-700 font-medium">{doctor.specialization}</p>
          </div>
        </div>

        {/* Doctor Details Grid */}
        <div className="mt-5 space-y-3 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="flex items-center gap-2 text-slate-500">
              <Building2 className="h-4 w-4 text-slate-400" /> Department
            </span>
            <span className="font-semibold text-slate-900">{doctor.department.name}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="flex items-center gap-2 text-slate-500">
              <Award className="h-4 w-4 text-slate-400" /> Qualification
            </span>
            <span className="font-semibold text-slate-900">{doctor.qualification}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="flex items-center gap-2 text-slate-500">
              <Clock className="h-4 w-4 text-slate-400" /> Clinical Experience
            </span>
            <span className="font-semibold text-slate-900">{doctor.experience} Years</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="flex items-center gap-2 text-slate-500">
              <DollarSign className="h-4 w-4 text-slate-400" /> Consultation Fee
            </span>
            <span className="font-bold text-slate-900 font-mono">₹{doctor.consultationFee}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="flex items-center gap-2 text-slate-500">
              <Mail className="h-4 w-4 text-slate-400" /> Login Email
            </span>
            <span className="font-mono text-slate-900">{doctor.email}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="flex items-center gap-2 text-slate-500">
              <Phone className="h-4 w-4 text-slate-400" /> Contact Phone
            </span>
            <span className="font-semibold text-slate-900">{doctor.phone}</span>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <span className="flex items-center gap-2 text-slate-500">
              <Calendar className="h-4 w-4 text-slate-400" /> Onboarding Date
            </span>
            <span className="text-slate-700">{formattedDate}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={() => onToggleStatus(doctor)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold border transition ${
              doctor.accountStatus === 'ACTIVE'
                ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <Power className="h-3.5 w-3.5" />
            <span>{doctor.accountStatus === 'ACTIVE' ? 'Deactivate Doctor' : 'Activate Doctor'}</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => onEdit(doctor)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Edit Details</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
