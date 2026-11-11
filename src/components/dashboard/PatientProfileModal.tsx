'use client';

import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Calendar,
  Mail,
  MapPin,
  Clock,
  QrCode,
  ShieldAlert,
  Copy,
  Check,
  Building,
} from 'lucide-react';

export interface PatientVisitRecord {
  id: string;
  visitDate: string;
  registrationChannel: string;
  notes?: string | null;
}

export interface PatientProfileData {
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
  consentGiven: boolean;
  totalVisits: number;
  lastVisitAt: string;
  createdAt: string;
  visits?: PatientVisitRecord[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfileData | null;
  onEditClick: (patient: PatientProfileData) => void;
}

export const PatientProfileModal: React.FC<Props> = ({
  isOpen,
  onClose,
  patient,
  onEditClick,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !patient) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(patient.patientId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Patient Profile</h3>
              <p className="text-xs text-slate-300">Detailed medical record & visit history</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Patient ID & Main Banner */}
          <div className="p-4 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 rounded-xl flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-700">
                  Patient ID:
                </span>
                <span className="text-lg font-bold font-mono text-sky-900">
                  {patient.patientId}
                </span>
                <button
                  onClick={handleCopyId}
                  className="p-1 text-sky-600 hover:text-sky-800 transition"
                  title="Copy Patient ID"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">{patient.fullName}</h2>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">
                {patient.totalVisits > 1 ? `${patient.totalVisits} Visits (Returning)` : 'New Patient'}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Last Visit: {new Date(patient.lastVisitAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Demographic & Contact Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Patient Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-400 flex items-center mb-1">
                  <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" /> Mobile Number
                </span>
                <span className="font-medium text-slate-800">+91 {patient.mobileNumber}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-400 flex items-center mb-1">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" /> Age & DOB
                </span>
                <span className="font-medium text-slate-800">
                  {patient.age ? `${patient.age} yrs` : '—'}
                  {patient.dateOfBirth
                    ? ` (DOB: ${new Date(patient.dateOfBirth).toLocaleDateString()})`
                    : ''}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-400 flex items-center mb-1">
                  <User className="w-3.5 h-3.5 mr-1 text-slate-400" /> Gender
                </span>
                <span className="font-medium text-slate-800">{patient.gender || 'Not specified'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-400 flex items-center mb-1">
                  <ShieldAlert className="w-3.5 h-3.5 mr-1 text-slate-400" /> Emergency Contact
                </span>
                <span className="font-medium text-slate-800">
                  {patient.emergencyContact || 'None provided'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-400 flex items-center mb-1">
                  <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" /> Email Address
                </span>
                <span className="font-medium text-slate-800">{patient.email || 'None provided'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-400 flex items-center mb-1">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" /> Address
                </span>
                <span className="font-medium text-slate-800">{patient.address || 'None provided'}</span>
              </div>
            </div>
          </div>

          {/* Previous Visits Timeline */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Visit History ({patient.visits?.length || 0})
              </h4>
            </div>

            {patient.visits && patient.visits.length > 0 ? (
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {patient.visits.map((v, idx) => (
                  <div key={v.id || idx} className="p-3 flex items-center justify-between hover:bg-slate-50 text-sm">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                        {v.registrationChannel === 'QR_CODE' ? (
                          <QrCode className="w-4 h-4 text-sky-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">
                          {new Date(v.visitDate).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-400">
                          Channel: {v.registrationChannel.replace('_', ' ')}
                          {v.notes ? ` • ${v.notes}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      Visit #{patient.visits ? patient.visits.length - idx : 1}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No visit history recorded yet.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Registered on {new Date(patient.createdAt).toLocaleDateString()}
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                onClose();
                onEditClick(patient);
              }}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg transition"
            >
              Edit Details
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfileModal;

