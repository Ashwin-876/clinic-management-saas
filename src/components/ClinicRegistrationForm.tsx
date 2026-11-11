'use client';

import React, { useState } from 'react';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { clinicTypes, ClinicRegistrationInput } from '@/lib/validations';
import RegistrationSuccessModal, { RegisteredClinicData } from './RegistrationSuccessModal';

export default function ClinicRegistrationForm() {
  const [formData, setFormData] = useState<ClinicRegistrationInput>({
    clinicName: '',
    clinicType: clinicTypes[0] as string,
    officialEmail: '',
    contactNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    ownerName: '',
    ownerEmail: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [registeredData, setRegisteredData] = useState<RegisteredClinicData | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  const handlePrefillDemo = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setFormData({
      clinicName: `Apollo Care & Research Center ${randomSuffix}`,
      clinicType: 'Multi-specialty Hospital',
      officialEmail: `info.apollo${randomSuffix}@quantanix-care.com`,
      contactNumber: '+91 80 4123 4567',
      address: `${randomSuffix} Medical Enclave, Health City Boulevard`,
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560100',
      ownerName: `Dr. Ramesh Sharma`,
      ownerEmail: `dr.ramesh${randomSuffix}@quantanix-care.com`,
      mobileNumber: '+91 98765 43210',
      password: 'SecurePass@2026',
      confirmPassword: 'SecurePass@2026',
    });
    setServerError(null);
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setServerError(null);
    setFieldErrors({});

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!res.ok) {
        if (result.details) {
          setFieldErrors(result.details);
        }
        setServerError(result.error || 'Failed to register clinic. Please check form inputs.');
        return;
      }

      setRegisteredData(result.data);
    } catch (err) {
      console.error('Registration submit error:', err);
      setServerError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {registeredData && <RegistrationSuccessModal data={registeredData} />}

      <div className="rounded-2xl bg-white p-6 sm:p-10 shadow-lg border border-slate-200">
        {/* Top Header & Demo Prefill Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                <Stethoscope className="h-4 w-4" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Clinic Onboarding Portal</h2>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Register your healthcare institution to initialize a dedicated, tenant-isolated medical database.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePrefillDemo}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50/80 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 active:bg-brand-200 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Fill Demo Data</span>
          </button>
        </div>

        {serverError && (
          <div className="mt-6 flex items-start gap-3 rounded-xl bg-rose-50 p-4 border border-rose-200 text-rose-800 text-xs sm:text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-semibold">Registration Issue</p>
              <p className="mt-0.5">{serverError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-8" noValidate>
          {/* SECTION 1: CLINIC DETAILS */}
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Building2 className="h-4 w-4 text-brand-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                1. Clinic & Facility Information
              </h3>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Clinic Name */}
              <div className="sm:col-span-2">
                <span id="hint-clinic-name" className="form-hint">Official registered medical facility name</span>
                <label htmlFor="clinicName" className="block text-xs font-semibold text-slate-800 mb-1">
                  Clinic / Hospital Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="clinicName"
                  name="clinicName"
                  type="text"
                  required
                  autoComplete="organization"
                  aria-describedby="hint-clinic-name"
                  placeholder="e.g. Apex Multispecialty Hospital"
                  value={formData.clinicName}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
                />
                {fieldErrors.clinicName && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.clinicName[0]}</p>
                )}
              </div>

              {/* Clinic Type */}
              <div>
                <span id="hint-clinic-type" className="form-hint">Specialization category</span>
                <label htmlFor="clinicType" className="block text-xs font-semibold text-slate-800 mb-1">
                  Clinic Type <span className="text-rose-500">*</span>
                </label>
                <select
                  id="clinicType"
                  name="clinicType"
                  required
                  aria-describedby="hint-clinic-type"
                  value={formData.clinicType}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
                >
                  {clinicTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {fieldErrors.clinicType && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.clinicType[0]}</p>
                )}
              </div>

              {/* Official Email */}
              <div>
                <span id="hint-official-email" className="form-hint">Official clinic correspondence email</span>
                <label htmlFor="officialEmail" className="block text-xs font-semibold text-slate-800 mb-1">
                  Official Email <span className="text-rose-500">*</span>
                </label>
                <input
                  id="officialEmail"
                  name="officialEmail"
                  type="email"
                  required
                  autoComplete="email"
                  spellCheck={false}
                  aria-describedby="hint-official-email"
                  placeholder="contact@apexhospital.com"
                  value={formData.officialEmail}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
                />
                {fieldErrors.officialEmail && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.officialEmail[0]}</p>
                )}
              </div>

              {/* Contact Number */}
              <div>
                <span id="hint-contact-number" className="form-hint">Landline or reception contact number</span>
                <label htmlFor="contactNumber" className="block text-xs font-semibold text-slate-800 mb-1">
                  Contact Number <span className="text-rose-500">*</span>
                </label>
                <input
                  id="contactNumber"
                  name="contactNumber"
                  type="tel"
                  required
                  autoComplete="tel"
                  aria-describedby="hint-contact-number"
                  placeholder="+91 80 2345 6789"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
                />
                {fieldErrors.contactNumber && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.contactNumber[0]}</p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: PHYSICAL ADDRESS */}
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <MapPin className="h-4 w-4 text-brand-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                2. Physical Location
              </h3>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Complete Address */}
              <div className="sm:col-span-3">
                <span id="hint-address" className="form-hint">Building, street, landmark details</span>
                <label htmlFor="address" className="block text-xs font-semibold text-slate-800 mb-1">
                  Complete Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="address"
                  name="address"
                  rows={2}
                  required
                  autoComplete="street-address"
                  aria-describedby="hint-address"
                  placeholder="Plot No. 12, Medical Corridor, Near City Square"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
                />
                {fieldErrors.address && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.address[0]}</p>
                )}
              </div>

              {/* City */}
              <div>
                <label htmlFor="city" className="block text-xs font-semibold text-slate-800 mb-1">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  required
                  autoComplete="address-level2"
                  placeholder="e.g. Mumbai"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
                />
                {fieldErrors.city && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.city[0]}</p>
                )}
              </div>

              {/* State */}
              <div>
                <label htmlFor="state" className="block text-xs font-semibold text-slate-800 mb-1">
                  State <span className="text-rose-500">*</span>
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  required
                  autoComplete="address-level1"
                  placeholder="e.g. Maharashtra"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
                />
                {fieldErrors.state && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.state[0]}</p>
                )}
              </div>

              {/* Pincode */}
              <div>
                <label htmlFor="pincode" className="block text-xs font-semibold text-slate-800 mb-1">
                  Pincode / Postal Code <span className="text-rose-500">*</span>
                </label>
                <input
                  id="pincode"
                  name="pincode"
                  type="text"
                  required
                  autoComplete="postal-code"
                  placeholder="e.g. 400001"
                  value={formData.pincode}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
                />
                {fieldErrors.pincode && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.pincode[0]}</p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: OWNER / ADMINISTRATOR CREDENTIALS */}
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="h-4 w-4 text-brand-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                3. Primary Administrator & Owner Credentials
              </h3>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Owner Name */}
              <div className="sm:col-span-2">
                <span id="hint-owner-name" className="form-hint">Full name of the clinic owner or medical director</span>
                <label htmlFor="ownerName" className="block text-xs font-semibold text-slate-800 mb-1">
                  Owner / Administrator Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="ownerName"
                  name="ownerName"
                  type="text"
                  required
                  autoComplete="name"
                  aria-describedby="hint-owner-name"
                  placeholder="Dr. Rajesh Varma"
                  value={formData.ownerName}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
                />
                {fieldErrors.ownerName && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.ownerName[0]}</p>
                )}
              </div>

              {/* Owner Email */}
              <div>
                <span id="hint-owner-email" className="form-hint">Login email for dashboard authentication</span>
                <label htmlFor="ownerEmail" className="block text-xs font-semibold text-slate-800 mb-1">
                  Owner Email (Login Account) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="ownerEmail"
                  name="ownerEmail"
                  type="email"
                  required
                  autoComplete="email"
                  spellCheck={false}
                  aria-describedby="hint-owner-email"
                  placeholder="dr.rajesh@apexhospital.com"
                  value={formData.ownerEmail}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
                />
                {fieldErrors.ownerEmail && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.ownerEmail[0]}</p>
                )}
              </div>

              {/* Mobile Number */}
              <div>
                <span id="hint-mobile-number" className="form-hint">Mobile number for urgent alerts & 2FA</span>
                <label htmlFor="mobileNumber" className="block text-xs font-semibold text-slate-800 mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  id="mobileNumber"
                  name="mobileNumber"
                  type="tel"
                  required
                  autoComplete="tel"
                  aria-describedby="hint-mobile-number"
                  placeholder="+91 98765 12345"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
                />
                {fieldErrors.mobileNumber && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.mobileNumber[0]}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <span id="hint-password" className="form-hint">Min 8 chars, 1 uppercase, 1 lowercase, 1 number</span>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-800 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    aria-describedby="hint-password"
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={handleChange}
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
                {fieldErrors.password && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.password[0]}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <span id="hint-confirm-password" className="form-hint">Must match password above</span>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-800 mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    aria-describedby="hint-confirm-password"
                    placeholder="••••••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 pl-3.5 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.confirmPassword[0]}</p>
                )}
              </div>
            </div>
          </div>

          {/* Submission Banner & Submit Button */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Multi-tenant database isolation enabled • Auto-generates unique Clinic ID (QNX-CLN-XXXXXX)</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Provisioning Clinic...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Register & Generate Clinic ID</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
