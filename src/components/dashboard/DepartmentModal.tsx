'use client';

import React, { useState, useEffect } from 'react';
import { X, Building2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Department {
  id?: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
}

interface Props {
  department?: Department | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function DepartmentModal({ department, isOpen, onClose, onSaved }: Props) {
  const isEditing = Boolean(department?.id);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (department) {
      setName(department.name || '');
      setDescription(department.description || '');
      setIsActive(department.isActive !== undefined ? department.isActive : true);
    } else {
      setName('');
      setDescription('');
      setIsActive(true);
    }
    setError(null);
  }, [department, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = isEditing ? `/api/departments/${department!.id}` : '/api/departments';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          isActive: isEditing ? isActive : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save department.');
        return;
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error('Save department error:', err);
      setError('A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Building2 className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {isEditing ? 'Edit Department' : 'Create Department'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 p-3 border border-rose-200 text-rose-800 text-xs">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="dept-name" className="block text-xs font-semibold text-slate-800 mb-1">
              Department Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="dept-name"
              type="text"
              required
              placeholder="e.g. Cardiology, Orthopedics, Pediatrics"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
            />
          </div>

          <div>
            <label htmlFor="dept-desc" className="block text-xs font-semibold text-slate-800 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="dept-desc"
              rows={3}
              placeholder="Specialized medical scope, treatments, and facilities..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
            />
          </div>

          {isEditing && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <p className="text-xs font-semibold text-slate-800">Department Status</p>
                <p className="text-[11px] text-slate-500">Allow active doctor assignments</p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isActive ? 'bg-brand-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50 shadow-xs transition"
            >
              {loading && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              <span>{isEditing ? 'Save Changes' : 'Create Department'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

