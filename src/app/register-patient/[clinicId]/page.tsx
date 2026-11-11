'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Building2,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  User,
  Calendar,
  Mail,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';

interface ClinicPublicInfo {
  clinicId: string;
  qrSlug: string | null;
  name: string;
  clinicType: string;
  phone: string;
  address: string;
  city: string;
  state: string;
}

interface PatientProfile {
  id: string;
  patientId: string;
  fullName: string;
  mobileNumber: string;
  age?: number | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  email?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  totalVisits: number;
  lastVisitAt: string;
  previousVisits?: Array<{ id: string; visitDate: string; registrationChannel: string }>;
}

type RegistrationStep = 'MOBILE_ENTRY' | 'OTP_VERIFICATION' | 'RETURNING_REVIEW' | 'NEW_REGISTRATION' | 'SUCCESS';

export default function RegisterPatientPage() {
  const params = useParams();
  const router = useRouter();
  const clinicIdentifier = (params?.clinicId as string) || '';

  // Clinic State
  const [clinic, setClinic] = useState<ClinicPublicInfo | null>(null);
  const [clinicLoading, setClinicLoading] = useState(true);
  const [clinicError, setClinicError] = useState<string | null>(null);

  // Form & Wizard State
  const [step, setStep] = useState<RegistrationStep>('MOBILE_ENTRY');
  const [mobileNumber, setMobileNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // OTP State (following Modern Web Guidance: sms-otp-form)
  const [otpCode, setOtpCode] = useState('');
  const [otpSimulatedMessage, setOtpSimulatedMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Patient Fields
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [gender, setGender] = useState('Prefer not to say');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [consentGiven, setConsentGiven] = useState(true);

  // Success State
  const [registeredPatient, setRegisteredPatient] = useState<PatientProfile | null>(null);
  const [isReturningVisit, setIsReturningVisit] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // 1. Fetch public clinic details
  useEffect(() => {
    if (!clinicIdentifier) return;

    async function loadClinic() {
      try {
        setClinicLoading(true);
        setClinicError(null);
        const res = await fetch(`/api/clinic/public-info/${encodeURIComponent(clinicIdentifier)}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Clinic information unavailable.');
        }
        setClinic(data.clinic);
      } catch (err: any) {
        setClinicError(err.message || 'Unable to connect to clinic.');
      } finally {
        setClinicLoading(false);
      }
    }

    loadClinic();
  }, [clinicIdentifier]);

  // 2. WebOTP API progressive enhancement for OTP
  useEffect(() => {
    if (step !== 'OTP_VERIFICATION') return;

    let ac = new AbortController();

    if ('OTPCredential' in window && navigator.credentials) {
      navigator.credentials
        .get({
          // @ts-ignore
          otp: { transport: ['sms'] },
          signal: ac.signal,
        })
        .then((content: any) => {
          if (content?.code) {
            setOtpCode(content.code);
            verifyOtp(content.code);
          }
        })
        .catch(() => {
          // Ignore abort or unsupported browser errors
        });
    }

    // Focus input
    if (otpInputRef.current) {
      otpInputRef.current.focus();
    }

    return () => {
      ac.abort();
    };
  }, [step]);

  // 3. Resend timer
  useEffect(() => {
    if (step !== 'OTP_VERIFICATION' || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  // Handle Mobile Check
  const handleCheckMobile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanMobile = mobileNumber.trim().replace(/[^0-9+]/g, '');
    if (cleanMobile.length < 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/patient/check-mobile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicIdentifier,
          mobileNumber: cleanMobile,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify mobile number.');
      }

      if (data.exists) {
        // Returning patient: Trigger OTP step
        setStep('OTP_VERIFICATION');
        setResendCooldown(60);
        if (data.simulatedOtp) {
          setOtpSimulatedMessage(`Test environment OTP: ${data.simulatedOtp}`);
        }
      } else {
        // New patient: proceed to registration form
        setStep('NEW_REGISTRATION');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error checking mobile number.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify OTP
  const verifyOtp = async (codeToVerify?: string) => {
    const code = (codeToVerify || otpCode).trim();
    if (code.length !== 6) {
      setFormError('Please enter the full 6-digit code.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      const res = await fetch('/api/patient/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicIdentifier,
          mobileNumber: mobileNumber.trim(),
          otpCode: code,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed.');
      }

      setVerificationToken(data.verificationToken);
      const pat = data.patient;
      setRegisteredPatient(pat);
      setFullName(pat.fullName || '');
      setAge(pat.age ? String(pat.age) : '');
      setDateOfBirth(pat.dateOfBirth || '');
      setGender(pat.gender || 'Prefer not to say');
      setEmail(pat.email || '');
      setAddress(pat.address || '');
      setEmergencyContact(pat.emergencyContact || '');

      setStep('RETURNING_REVIEW');
    } catch (err: any) {
      setFormError(err.message || 'Verification error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      setIsSubmitting(true);
      setFormError(null);
      const res = await fetch('/api/patient/check-mobile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicIdentifier,
          mobileNumber: mobileNumber.trim(),
        }),
      });
      const data = await res.json();
      if (data.simulatedOtp) {
        setOtpSimulatedMessage(`Test environment OTP: ${data.simulatedOtp}`);
      }
      setResendCooldown(60);
    } catch (err: any) {
      setFormError(err.message || 'Failed to resend verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Patient Registration / Check-in
  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError('Patient full name is required.');
      return;
    }

    if (!consentGiven) {
      setFormError('Please accept data consent to complete registration.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: any = {
        clinicIdentifier,
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        age: age ? parseInt(age, 10) : null,
        dateOfBirth: dateOfBirth || null,
        gender: gender || null,
        email: email.trim() || null,
        address: address.trim() || null,
        emergencyContact: emergencyContact.trim() || null,
        consentGiven,
        registrationChannel: 'QR_CODE',
      };

      if (verificationToken) {
        payload.verificationToken = verificationToken;
      }

      const res = await fetch('/api/patient/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete registration.');
      }

      setRegisteredPatient(data.patient);
      setIsReturningVisit(Boolean(data.isReturning));
      setStep('SUCCESS');
    } catch (err: any) {
      setFormError(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyPatientId = () => {
    if (!registeredPatient?.patientId) return;
    navigator.clipboard.writeText(registeredPatient.patientId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (clinicLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-8 h-8 text-sky-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Connecting to clinic...</p>
      </div>
    );
  }

  if (clinicError || !clinic) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-lg border border-slate-200">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Clinic Not Found</h2>
          <p className="text-sm text-slate-600 mb-6">
            {clinicError || 'This QR code is either invalid or registration is currently disabled.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/60 via-slate-50 to-slate-100 py-6 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        {/* Clinic Header Banner */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-5 text-center sm:text-left sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center space-x-3 mb-3 sm:mb-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 leading-tight">{clinic.name}</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center mt-0.5">
                <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                {clinic.address}, {clinic.city}
              </p>
            </div>
          </div>
          <div className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg inline-block">
            {clinic.clinicType}
          </div>
        </div>

        {/* Wizard Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
          {/* Header Progress / Subtitle */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
              <span className="text-sm font-semibold tracking-wide">
                Patient Self Check-In & Registration
              </span>
            </div>
            <span className="text-xs text-slate-400">Step {step === 'MOBILE_ENTRY' ? '1/2' : step === 'OTP_VERIFICATION' ? 'Verify' : '2/2'}</span>
          </div>

          <div className="p-6">
            {formError && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2.5 text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* STEP 1: MOBILE NUMBER ENTRY */}
            {step === 'MOBILE_ENTRY' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Phone className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Enter Your Mobile Number</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Returning patients will be identified automatically. New patients will proceed to quick registration.
                  </p>
                </div>

                <form onSubmit={handleCheckMobile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm font-medium">
                        +91
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="9876543210"
                        maxLength={10}
                        required
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-base font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none transition tracking-wide"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Your records are strictly confidential and isolated to this clinic.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || mobileNumber.length < 10}
                    className="w-full mt-2 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Checking Clinic Records...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 2: OTP VERIFICATION (Modern Web Guidance sms-otp-form) */}
            {step === 'OTP_VERIFICATION' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Returning Patient Verification</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    We found an existing profile for <strong className="text-slate-800">+91 {mobileNumber}</strong>.
                  </p>
                </div>

                {otpSimulatedMessage && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-mono">
                    {otpSimulatedMessage}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Instructional hint placed above the input per sms-otp-form standard */}
                  <label
                    htmlFor="otp-code-input"
                    className="block text-xs font-semibold text-slate-700 text-center uppercase tracking-wider"
                  >
                    Enter 6-Digit Verification Code
                  </label>

                  <div className="max-w-xs mx-auto">
                    {/* Single input element with inputmode numeric and autocomplete one-time-code */}
                    <input
                      id="otp-code-input"
                      ref={otpInputRef}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="\d{6}"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setOtpCode(val);
                        if (val.length === 6) {
                          verifyOtp(val);
                        }
                      }}
                      placeholder="••••••"
                      className="w-full py-3.5 bg-slate-50 border-2 border-sky-300 rounded-xl text-center text-2xl font-bold tracking-[0.35em] text-slate-900 focus:ring-4 focus:ring-sky-100 focus:border-sky-600 focus:outline-none transition font-mono"
                    />
                  </div>

                  <p className="text-xs text-center text-slate-400">
                    The code is valid for 10 minutes.
                  </p>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setStep('MOBILE_ENTRY')}
                      className="text-xs font-medium text-slate-500 hover:text-slate-800"
                    >
                      Change Number
                    </button>

                    <button
                      type="button"
                      disabled={resendCooldown > 0 || isSubmitting}
                      onClick={handleResendOtp}
                      className="text-xs font-medium text-sky-600 hover:text-sky-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting || otpCode.length !== 6}
                    onClick={() => verifyOtp()}
                    className="w-full mt-4 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center space-x-2 transition"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Check-In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3A: RETURNING PATIENT REVIEW */}
            {step === 'RETURNING_REVIEW' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Welcome Back, {fullName}!</h2>
                  <p className="text-xs text-slate-500">
                    Patient ID: <span className="font-mono font-semibold text-slate-800">{registeredPatient?.patientId}</span>
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-5 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Previous Visits:</span>
                    <span className="font-semibold text-slate-800">{registeredPatient?.totalVisits || 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mobile Number:</span>
                    <span className="font-semibold text-slate-800">{registeredPatient?.mobileNumber}</span>
                  </div>
                  {registeredPatient?.gender && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Gender:</span>
                      <span className="font-semibold text-slate-800">{registeredPatient.gender}</span>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmitRegistration} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Update Full Name if Needed
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Age
                      </label>
                      <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="e.g. 32"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Emergency Contact
                      </label>
                      <input
                        type="tel"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        placeholder="Mobile number"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Current Address (Optional)
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street address or area"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-start space-x-2.5 pt-2">
                    <input
                      type="checkbox"
                      id="returning-consent"
                      checked={consentGiven}
                      onChange={(e) => setConsentGiven(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                    />
                    <label htmlFor="returning-consent" className="text-xs text-slate-600 leading-tight">
                      I confirm these details and consent to clinic check-in for today's visit.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !consentGiven}
                    className="w-full mt-4 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center space-x-2 transition"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Recording Visit...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Confirm Check-In for Today</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 3B: NEW PATIENT REGISTRATION FORM */}
            {step === 'NEW_REGISTRATION' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <User className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">New Patient Registration</h2>
                  <p className="text-xs text-slate-500">
                    Registering at <strong className="text-slate-800">{clinic.name}</strong>
                  </p>
                </div>

                <form onSubmit={handleSubmitRegistration} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Patient Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  {/* Mobile (pre-filled & locked) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={mobileNumber}
                      readOnly
                      className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium cursor-not-allowed"
                    />
                  </div>

                  {/* Age and DOB */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Age
                      </label>
                      <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="e.g. 28"
                        min={0}
                        max={130}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Gender & Emergency Contact */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Gender (Optional)
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Emergency Contact (Optional)
                      </label>
                      <input
                        type="tel"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        placeholder="Mobile number"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Complete Address (Optional)
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House / Flat, Street, Area"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  {/* Consent */}
                  <div className="flex items-start space-x-2.5 pt-2">
                    <input
                      type="checkbox"
                      id="new-consent"
                      checked={consentGiven}
                      onChange={(e) => setConsentGiven(e.target.checked)}
                      required
                      className="mt-0.5 w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                    />
                    <label htmlFor="new-consent" className="text-xs text-slate-600 leading-tight">
                      I consent to clinic data processing in accordance with healthcare privacy guidelines.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !fullName.trim() || !consentGiven}
                    className="w-full mt-4 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center space-x-2 transition"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Generating Patient ID...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Complete Registration</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 4: REGISTRATION CONFIRMATION */}
            {step === 'SUCCESS' && registeredPatient && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-1">
                  {isReturningVisit ? 'Check-In Confirmed!' : 'Registration Successful!'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mb-6">
                  {isReturningVisit
                    ? 'Your return visit has been recorded. Please inform reception.'
                    : 'Your patient account has been created. Show this ID at reception.'}
                </p>

                {/* Patient ID Banner */}
                <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-lg mb-6">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">
                    Your Unique Patient ID
                  </p>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-wider text-sky-400">
                      {registeredPatient.patientId}
                    </span>
                    <button
                      onClick={copyPatientId}
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition"
                      title="Copy Patient ID"
                    >
                      {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 mt-2 font-medium">
                    {registeredPatient.fullName} • +91 {registeredPatient.mobileNumber}
                  </p>
                </div>

                {/* Visit summary */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 mb-6 text-left space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Clinic:</span>
                    <span className="font-semibold text-slate-800">{clinic.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Check-In Channel:</span>
                    <span className="font-semibold text-slate-800">QR Code Self-Service</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Visits to Date:</span>
                    <span className="font-semibold text-slate-800">{registeredPatient.totalVisits}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStep('MOBILE_ENTRY');
                    setMobileNumber('');
                    setFullName('');
                    setOtpCode('');
                    setRegisteredPatient(null);
                  }}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition"
                >
                  Register Another Patient
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Powered by Clinic Management SaaS • Multi-tenant Secure Healthcare Network
        </p>
      </div>
    </div>
  );
}

