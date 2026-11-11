'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Plus,
  Mail,
  Phone,
  Lock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Users,
  Shield,
  KeyRound,
} from 'lucide-react';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  mobileNumber: string;
  role: 'OWNER' | 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST';
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
}

export default function RoleManagement() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add staff modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'RECEPTIONIST'>('RECEPTIONIST');
  const [password, setPassword] = useState('Staff@12345');
  const [saving, setSaving] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/clinic/staff');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to retrieve staff directory');
        return;
      }
      setStaff(data.staff || []);
    } catch (err) {
      console.error('Fetch staff error:', err);
      setError('Network communication error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/clinic/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          mobileNumber,
          role,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to add staff member.');
        return;
      }

      setSuccessMsg(`Staff member added successfully with role ${role}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      setIsAddModalOpen(false);
      setName('');
      setEmail('');
      setMobileNumber('');
      setPassword('Staff@12345');
      fetchStaff();
    } catch (err) {
      console.error('Add staff error:', err);
      setError('A network error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return (
          <span className="rounded-full bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 text-[10px] font-bold">
            Clinic Owner
          </span>
        );
      case 'ADMIN':
        return (
          <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold">
            Clinic Administrator
          </span>
        );
      case 'DOCTOR':
        return (
          <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold">
            Doctor (Physician)
          </span>
        );
      case 'RECEPTIONIST':
        return (
          <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold">
            Receptionist (Front Desk)
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold">
            {role}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Role Management & Access Control</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Define clinic personnel roles across Clinic Owner, Administrator, Doctor, and Receptionist tiers.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 active:bg-brand-800 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-4 border border-rose-200 text-rose-800 text-xs">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1">{error}</div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3.5 border border-emerald-200 text-emerald-800 text-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Role Permissions Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="rounded-xl bg-white p-4 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">Clinic Owner</span>
            <Shield className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-[11px] text-slate-500">
            Full root control: facility registration, billing, financial settings, and tenant owner privileges.
          </p>
        </div>

        <div className="rounded-xl bg-white p-4 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">Administrator</span>
            <ShieldCheck className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-[11px] text-slate-500">
            Clinical management: add/edit doctors, create departments, adjust operational settings, and audit logs.
          </p>
        </div>

        <div className="rounded-xl bg-white p-4 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">Doctor</span>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-[11px] text-slate-500">
            Clinical portal: individual login, profile self-service, view assigned department, and fee configuration.
          </p>
        </div>

        <div className="rounded-xl bg-white p-4 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">Receptionist</span>
            <Users className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-[11px] text-slate-500">
            Front-desk operations: view active doctors directory, verify departments, and clinic schedule.
          </p>
        </div>
      </div>

      {/* Staff Directory Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Authorized Clinic Personnel</h3>
          <span className="text-xs text-slate-500 font-mono">Total Staff: {staff.length}</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">Loading staff personnel...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Role Tier</th>
                  <th className="py-3 px-4">Login Email</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{member.name}</td>
                    <td className="py-3.5 px-4">{getRoleBadge(member.role)}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{member.email}</td>
                    <td className="py-3.5 px-4 text-slate-600">{member.mobileNumber}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                          member.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Add Clinic Staff Member
            </h3>

            <form onSubmit={handleAddStaff} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sumanth Rao"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Login Email</label>
                <input
                  type="email"
                  required
                  placeholder="sumanth@clinic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 00000"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Assigned Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                >
                  <option value="RECEPTIONIST">Receptionist (Front Desk & Directory)</option>
                  <option value="ADMIN">Clinic Administrator (Full Operations)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Initial Password</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 shadow-xs"
                >
                  {saving && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                  <span>Add Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

