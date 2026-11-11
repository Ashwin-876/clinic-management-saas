'use client';

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Stethoscope, AlertCircle, Sparkles, Lock, Mail, Phone, DollarSign, Award, Clock } from 'lucide-react';

interface DepartmentOption {
  id: string;
  name: string;
  isActive: boolean;
}

interface Doctor {
  id?: string;
  doctorId?: string;
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
}

interface Props {
  doctor?: Doctor | null;
  departments: DepartmentOption[];
  isOpen: boolean;
  onClose: () => void;
  onSaved: (savedDoctor?: any, credentials?: { email: string; temporaryPassword?: string }) => void;
}

export default function DoctorModal({
  doctor,
  departments,
  isOpen,
  onClose,
  onSaved,
}: Props) {
  const isEditing = Boolean(doctor?.id);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    specialization: '',
    qualification: '',
    experience: 5,
    departmentId: '',
    consultationFee: 500,
    profileImage: '',
    accountStatus: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    initialPassword: 'Doctor@12345',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (doctor) {
      setFormData({
        fullName: doctor.fullName || '',
        email: doctor.email || '',
        phone: doctor.phone || '',
        specialization: doctor.specialization || '',
        qualification: doctor.qualification || '',
        experience: doctor.experience || 0,
        departmentId: doctor.departmentId || (departments[0]?.id || ''),
        consultationFee: doctor.consultationFee || 500,
        profileImage: doctor.profileImage || '',
        accountStatus: doctor.accountStatus || 'ACTIVE',
        initialPassword: 'Doctor@12345',
      });
    } else {
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        specialization: '',
        qualification: '',
        experience: 5,
        departmentId: departments[0]?.id || '',
        consultationFee: 500,
        profileImage: '',
        accountStatus: 'ACTIVE',
        initialPassword: 'Doctor@12345',
      });
    }
    setError(null);
    setFieldErrors({});
  }, [doctor, isOpen, departments]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handlePrefillDemoDoctor = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setFormData((prev) => ({
      ...prev,
      fullName: `Dr. Vikram Sengupta ${randomSuffix}`,
      email: `dr.vikram${randomSuffix}@cliniccare.com`,
      phone: '+91 98765 22334',
      specialization: 'Senior Interventional Cardiologist',
      qualification: 'MBBS, MD (Medicine), DM (Cardiology)',
      experience: 12,
      departmentId: departments[0]?.id || '',
      consultationFee: 800,
      profileImage: `https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80`,
      accountStatus: 'ACTIVE',
      initialPassword: 'Doctor@12345',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const url = isEditing ? `/api/doctors/${doctor!.id}` : '/api/doctors';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = isEditing
        ? {
            fullName: formData.fullName,
            phone: formData.phone,
            specialization: formData.specialization,
            qualification: formData.qualification,
            experience: Number(formData.experience),
            departmentId: formData.departmentId,
            consultationFee: Number(formData.consultationFee),
            profileImage: formData.profileImage || undefined,
            accountStatus: formData.accountStatus,
          }
        : {
            ...formData,
            experience: Number(formData.experience),
            consultationFee: Number(formData.consultationFee),
          };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.details) {
          setFieldErrors(data.details);
        }
        setError(data.error || 'Failed to save doctor.');
        return;
      }

      onSaved(data.doctor, data.credentials);
      onClose();
    } catch (err) {
      console.error('Save doctor error:', err);
      setError('A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? `Edit Doctor: ${doctor?.doctorId}` : 'Onboard New Doctor'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? 'Update doctor specialization, department assignment, and fee.'
                  : 'Automatically generates unique Doctor ID and login account.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                type="button"
                onClick={handlePrefillDemoDoctor}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition"
              >
                <Sparkles className="h-3 w-3" />
                <span>Fill Demo</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 p-3 border border-rose-200 text-rose-800 text-xs">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="sm:col-span-2">
              <label htmlFor="doc-name" className="block text-xs font-semibold text-slate-800 mb-1">
                Full Doctor Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="doc-name"
                name="fullName"
                type="text"
                required
                placeholder="Dr. Rajesh Varma"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
              />
              {fieldErrors.fullName && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.fullName[0]}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="doc-email" className="block text-xs font-semibold text-slate-800 mb-1">
                Doctor Email (Login Account) <span className="text-rose-500">*</span>
              </label>
              <input
                id="doc-email"
                name="email"
                type="email"
                required
                disabled={isEditing}
                placeholder="dr.rajesh@clinic.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
              />
              {fieldErrors.email && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.email[0]}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="doc-phone" className="block text-xs font-semibold text-slate-800 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                id="doc-phone"
                name="phone"
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
              />
              {fieldErrors.phone && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.phone[0]}</p>
              )}
            </div>

            {/* Department */}
            <div>
              <label htmlFor="doc-dept" className="block text-xs font-semibold text-slate-800 mb-1">
                Assigned Department <span className="text-rose-500">*</span>
              </label>
              <select
                id="doc-dept"
                name="departmentId"
                required
                value={formData.departmentId}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
              >
                {departments.length === 0 ? (
                  <option value="" disabled>No departments available. Create a department first.</option>
                ) : (
                  departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} {!dept.isActive && '(Inactive)'}
                    </option>
                  ))
                )}
              </select>
              {fieldErrors.departmentId && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.departmentId[0]}</p>
              )}
            </div>

            {/* Specialization */}
            <div>
              <label htmlFor="doc-spec" className="block text-xs font-semibold text-slate-800 mb-1">
                Medical Specialization <span className="text-rose-500">*</span>
              </label>
              <input
                id="doc-spec"
                name="specialization"
                type="text"
                required
                placeholder="e.g. Pediatric Cardiology"
                value={formData.specialization}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
              />
              {fieldErrors.specialization && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.specialization[0]}</p>
              )}
            </div>

            {/* Qualification */}
            <div>
              <label htmlFor="doc-qual" className="block text-xs font-semibold text-slate-800 mb-1">
                Qualifications <span className="text-rose-500">*</span>
              </label>
              <input
                id="doc-qual"
                name="qualification"
                type="text"
                required
                placeholder="e.g. MBBS, MD, FRCS"
                value={formData.qualification}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
              />
              {fieldErrors.qualification && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.qualification[0]}</p>
              )}
            </div>

            {/* Experience (Years) */}
            <div>
              <label htmlFor="doc-exp" className="block text-xs font-semibold text-slate-800 mb-1">
                Experience (in Years) <span className="text-rose-500">*</span>
              </label>
              <input
                id="doc-exp"
                name="experience"
                type="number"
                min={0}
                max={60}
                required
                placeholder="e.g. 8"
                value={formData.experience}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
              />
              {fieldErrors.experience && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.experience[0]}</p>
              )}
            </div>

            {/* Consultation Fee */}
            <div>
              <label htmlFor="doc-fee" className="block text-xs font-semibold text-slate-800 mb-1">
                Consultation Fee (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                id="doc-fee"
                name="consultationFee"
                type="number"
                min={0}
                required
                placeholder="e.g. 500"
                value={formData.consultationFee}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
              />
              {fieldErrors.consultationFee && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.consultationFee[0]}</p>
              )}
            </div>

            {/* Account Status */}
            <div>
              <label htmlFor="doc-status" className="block text-xs font-semibold text-slate-800 mb-1">
                Account Status
              </label>
              <select
                id="doc-status"
                name="accountStatus"
                value={formData.accountStatus}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
              >
                <option value="ACTIVE">ACTIVE (Can consult & login)</option>
                <option value="INACTIVE">INACTIVE (Deactivated)</option>
              </select>
            </div>

            {/* Profile Image URL */}
            <div className="sm:col-span-2">
              <label htmlFor="doc-img" className="block text-xs font-semibold text-slate-800 mb-1">
                Profile Image URL (Optional)
              </label>
              <input
                id="doc-img"
                name="profileImage"
                type="url"
                placeholder="https://images.unsplash.com/... or leave blank for default avatar"
                value={formData.profileImage}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
              />
            </div>

            {/* Initial Password (when creating) */}
            {!isEditing && (
              <div className="sm:col-span-2 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 mb-1">
                  <Lock className="h-3.5 w-3.5 text-brand-600" />
                  <span>Initial Doctor Login Password</span>
                </div>
                <input
                  id="doc-pwd"
                  name="initialPassword"
                  type="text"
                  required
                  placeholder="Doctor@12345"
                  value={formData.initialPassword}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-xs text-slate-900 bg-white"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Doctor can use this password and their email to sign in on the login portal.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || departments.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50 shadow-xs transition"
            >
              {loading && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              <span>{isEditing ? 'Save Changes' : 'Register Doctor'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

