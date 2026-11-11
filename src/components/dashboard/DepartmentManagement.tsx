'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Power,
  ShieldAlert,
} from 'lucide-react';
import DepartmentModal from './DepartmentModal';

interface Department {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    doctors: number;
  };
}

interface Props {
  onDepartmentChanged?: () => void;
}

export default function DepartmentManagement({ onDepartmentChanged }: Props) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load departments.');
        return;
      }
      setDepartments(data.departments);
    } catch (err) {
      console.error('Fetch departments error:', err);
      setError('Network communication error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpenCreate = () => {
    setEditingDept(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setModalOpen(true);
  };

  const handleToggleStatus = async (dept: Department) => {
    try {
      const res = await fetch(`/api/departments/${dept.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !dept.isActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update department status.');
        return;
      }
      setSuccessMsg(`Department "${dept.name}" ${!dept.isActive ? 'activated' : 'deactivated'}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchDepartments();
      onDepartmentChanged?.();
    } catch (err) {
      console.error('Toggle status error:', err);
      setError('Failed to update status.');
    }
  };

  const handleDelete = async (dept: Department) => {
    if (dept._count.doctors > 0) {
      setError(
        `Safe Deletion Blocked: Department "${dept.name}" has ${dept._count.doctors} active doctor(s) assigned. Reassign doctors to another department before deleting.`
      );
      return;
    }

    if (!confirm(`Are you sure you want to delete department "${dept.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/departments/${dept.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to delete department.');
        return;
      }
      setSuccessMsg(`Department "${dept.name}" deleted successfully.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchDepartments();
      onDepartmentChanged?.();
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete department.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Building2 className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Department Management</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Organize clinic clinical specialties, assign medical personnel, and configure active service lines.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 active:bg-brand-800 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Create Department</span>
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-4 border border-rose-200 text-rose-800 text-xs">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1">
            <p className="font-semibold">Operation Alert</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
          >
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

      {/* Department Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-600 border-t-transparent mx-auto mb-2" />
          <p className="text-xs">Loading clinic departments...</p>
        </div>
      ) : departments.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center border border-slate-200 shadow-xs space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <Building2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Departments Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Get started by creating your clinic&apos;s first medical department to begin assigning doctors.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create First Department</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className={`rounded-2xl bg-white p-5 border shadow-xs transition hover:shadow-md flex flex-col justify-between ${
                dept.isActive ? 'border-slate-200' : 'border-slate-200 bg-slate-50/50 opacity-80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700 font-bold text-xs">
                      {dept.name.slice(0, 2).toUpperCase()}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">{dept.name}</h3>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                      dept.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {dept.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-500 min-h-[36px] line-clamp-2">
                  {dept.description || 'No description provided for this clinical department.'}
                </p>

                <div className="mt-4 flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Users className="h-3.5 w-3.5 text-brand-600" /> Assigned Doctors
                  </span>
                  <span className="font-bold text-slate-900 font-mono">
                    {dept._count.doctors}
                  </span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleToggleStatus(dept)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition ${
                    dept.isActive
                      ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                  title="Toggle active status"
                >
                  <Power className="h-3 w-3" />
                  <span>{dept.isActive ? 'Deactivate' : 'Activate'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(dept)}
                    className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                    title="Edit Department"
                  >
                    <Edit className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(dept)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title={
                      dept._count.doctors > 0
                        ? `Cannot delete (${dept._count.doctors} doctors assigned)`
                        : 'Delete Department'
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <DepartmentModal
        department={editingDept}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          fetchDepartments();
          onDepartmentChanged?.();
        }}
      />
    </div>
  );
}

