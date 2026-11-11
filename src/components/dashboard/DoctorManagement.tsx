'use client';

import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Power,
  Mail,
  Phone,
  Building2,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  Award,
} from 'lucide-react';
import DoctorModal from './DoctorModal';
import DoctorProfileModal from './DoctorProfileModal';

interface Department {
  id: string;
  name: string;
  isActive: boolean;
}

interface Doctor {
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
  onDoctorChanged?: () => void;
}

export default function DoctorManagement({ onDoctorChanged }: Props) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [newCredentials, setNewCredentials] = useState<{
    email: string;
    temporaryPassword?: string;
    doctorId?: string;
  } | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [viewingDoctor, setViewingDoctor] = useState<Doctor | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      if (res.ok) {
        setDepartments(data.departments || []);
      }
    } catch (err) {
      console.error('Failed to load departments for filter:', err);
    }
  };

  const fetchDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (selectedDept !== 'ALL') params.set('departmentId', selectedDept);
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus);

      const res = await fetch(`/api/doctors?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load doctors.');
        return;
      }
      setDoctors(data.doctors || []);
    } catch (err) {
      console.error('Fetch doctors error:', err);
      setError('Network communication error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [search, selectedDept, selectedStatus]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAdd = () => {
    setEditingDoctor(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (doc: Doctor) => {
    setEditingDoctor(doc);
    setIsAddEditModalOpen(true);
  };

  const handleToggleStatus = async (doc: Doctor) => {
    const nextStatus = doc.accountStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/doctors/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to toggle doctor status.');
        return;
      }
      setSuccessMsg(
        `Doctor ${doc.fullName} (${doc.doctorId}) status changed to ${nextStatus}.`
      );
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchDoctors();
      if (viewingDoctor && viewingDoctor.id === doc.id) {
        setViewingDoctor({ ...viewingDoctor, accountStatus: nextStatus });
      }
      onDoctorChanged?.();
    } catch (err) {
      console.error('Toggle status error:', err);
      setError('Failed to update doctor status.');
    }
  };

  const handleDoctorSaved = (savedDoc?: any, credentials?: any) => {
    fetchDoctors();
    onDoctorChanged?.();
    if (credentials) {
      setNewCredentials({
        ...credentials,
        doctorId: savedDoc?.doctorId,
      });
    }
    setSuccessMsg('Doctor record saved successfully.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Stethoscope className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Doctor Directory & Staff Management</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Onboard physicians, assign departments, configure consultation fees, and control access status.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 active:bg-brand-800 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Doctor</span>
        </button>
      </div>

      {/* New Doctor Credentials Alert */}
      {newCredentials && (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 p-5 border border-emerald-200 shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-emerald-950">
                  Doctor Account Created with Unique ID: <span className="font-mono text-brand-700">{newCredentials.doctorId}</span>
                </p>
                <p className="text-xs text-emerald-800">
                  Share these login credentials with the doctor to grant them individual doctor portal access:
                </p>
                <div className="mt-2 flex flex-wrap gap-4 text-xs font-mono bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                  <span><strong>Login Email:</strong> {newCredentials.email}</span>
                  <span><strong>Initial Password:</strong> {newCredentials.temporaryPassword}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setNewCredentials(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-4 border border-rose-200 text-rose-800 text-xs">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1">{error}</div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && !newCredentials && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3.5 border border-emerald-200 text-emerald-800 text-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SEARCH AND FILTERS BAR */}
      <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID, specialization, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            <span className="text-slate-500 whitespace-nowrap">Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="rounded-xl border border-slate-300 px-2.5 py-2 text-xs text-slate-900 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            <span className="text-slate-500 whitespace-nowrap">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-slate-300 px-2.5 py-2 text-xs text-slate-900 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* DOCTORS TABLE */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-600 border-t-transparent mx-auto mb-2" />
            <p className="text-xs">Loading doctors directory...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <Stethoscope className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Doctors Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search || selectedDept !== 'ALL' || selectedStatus !== 'ALL'
                ? 'No doctors match the specified search and filter criteria.'
                : 'No doctors are currently onboarded in this clinic. Click "Add New Doctor" to register one.'}
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Add First Doctor</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Doctor & ID</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Specialization</th>
                  <th className="py-3 px-4">Experience & Qual</th>
                  <th className="py-3 px-4">Consultation Fee</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                    {/* Doctor Info */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-teal-500 text-white font-bold text-xs shadow-xs overflow-hidden flex-shrink-0">
                          {doc.profileImage ? (
                            <img src={doc.profileImage} alt={doc.fullName} className="h-full w-full object-cover" />
                          ) : (
                            <span>{doc.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{doc.fullName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px] font-bold text-brand-700 bg-brand-50 px-1.5 py-0.2 rounded border border-brand-200">
                              {doc.doctorId}
                            </span>
                            <button
                              onClick={() => handleCopy(doc.doctorId, doc.id)}
                              className="text-slate-400 hover:text-slate-600"
                              title="Copy Doctor ID"
                            >
                              {copiedId === doc.id ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="rounded-lg bg-slate-100 px-2 py-1 font-semibold text-slate-800 border border-slate-200">
                        {doc.department.name}
                      </span>
                    </td>

                    {/* Specialization */}
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800">{doc.specialization}</span>
                    </td>

                    {/* Experience & Qualification */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-semibold text-slate-900">{doc.experience} Years Exp.</p>
                      <p className="text-[11px] text-slate-500">{doc.qualification}</p>
                    </td>

                    {/* Fee */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-slate-900">
                      ₹{doc.consultationFee}
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="text-[11px] font-mono text-slate-600">{doc.email}</p>
                      <p className="text-[11px] text-slate-500">{doc.phone}</p>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                          doc.accountStatus === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            doc.accountStatus === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {doc.accountStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingDoctor(doc)}
                          className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                          title="View Doctor Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(doc)}
                          className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                          title="Edit Doctor"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(doc)}
                          className={`p-1.5 rounded-lg transition ${
                            doc.accountStatus === 'ACTIVE'
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={doc.accountStatus === 'ACTIVE' ? 'Deactivate Doctor' : 'Activate Doctor'}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <DoctorModal
        doctor={editingDoctor}
        departments={departments}
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        onSaved={handleDoctorSaved}
      />

      <DoctorProfileModal
        doctor={viewingDoctor}
        isOpen={Boolean(viewingDoctor)}
        onClose={() => setViewingDoctor(null)}
        onEdit={(doc) => {
          setViewingDoctor(null);
          handleOpenEdit(doc);
        }}
        onToggleStatus={(doc) => handleToggleStatus(doc)}
      />
    </div>
  );
}

