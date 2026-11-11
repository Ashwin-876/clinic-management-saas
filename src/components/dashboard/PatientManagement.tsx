'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserPlus,
  Search,
  QrCode,
  Eye,
  Edit,
  Phone,
  Calendar,
  RefreshCw,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { PatientProfileModal, PatientProfileData } from './PatientProfileModal';
import { PatientEditModal } from './PatientEditModal';
import { AddPatientModal } from './AddPatientModal';
import { ClinicQrModal } from './ClinicQrModal';

interface Props {
  clinicId: string;
  clinicName: string;
}

export const PatientManagement: React.FC<Props> = ({ clinicId, clinicName }) => {
  const [patients, setPatients] = useState<PatientProfileData[]>([]);
  const [metrics, setMetrics] = useState({
    totalPatients: 0,
    newPatients: 0,
    returningPatients: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals state
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientProfileData | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchPatients();
  }, [page, search]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
      });
      if (search.trim()) {
        params.append('search', search.trim());
      }

      const res = await fetch(`/api/clinic/patients?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setPatients(data.patients);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
        if (data.metrics) {
          setMetrics(data.metrics);
        }
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenProfile = async (patient: PatientProfileData) => {
    // Fetch latest profile with full visits history
    try {
      const res = await fetch(`/api/clinic/patients/${patient.id}`);
      const data = await res.json();
      if (res.ok && data.patient) {
        setSelectedPatient(data.patient);
      } else {
        setSelectedPatient(patient);
      }
    } catch {
      setSelectedPatient(patient);
    }
    setIsProfileModalOpen(true);
  };

  const handleOpenEdit = (patient: PatientProfileData) => {
    setSelectedPatient(patient);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Patients
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalPatients}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Registered in clinic tenant</p>
          </div>
          <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              New Patients
            </p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{metrics.newPatients}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Single initial visit</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <UserPlus className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Returning Patients
            </p>
            <h3 className="text-2xl font-bold text-indigo-600 mt-1">
              {metrics.returningPatients}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Verified repeat visits</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by Patient Name, ID, or Mobile..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsQrModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <QrCode className="w-4 h-4 mr-2 text-sky-400" />
            Clinic QR Code
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Register Patient
          </button>
        </div>
      </div>

      {/* Patients Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">
            Patient Directory ({totalCount})
          </h3>
          <button
            onClick={fetchPatients}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3">Patient ID</th>
                <th className="px-5 py-3">Patient Name</th>
                <th className="px-5 py-3">Mobile Number</th>
                <th className="px-5 py-3">Age / Gender</th>
                <th className="px-5 py-3">Total Visits</th>
                <th className="px-5 py-3">Last Visit</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
                    Loading patient directory...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    No patients found. Patients who register via QR code or front desk will appear here.
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3 font-mono font-semibold text-sky-900 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span>{p.patientId}</span>
                        <button
                          onClick={() => handleCopy(p.patientId)}
                          className="p-1 text-slate-400 hover:text-slate-600 transition"
                          title="Copy ID"
                        >
                          {copiedId === p.patientId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900 whitespace-nowrap">
                      {p.fullName}
                    </td>
                    <td className="px-5 py-3 text-slate-600 font-mono whitespace-nowrap">
                      +91 {p.mobileNumber}
                    </td>
                    <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                      {p.age ? `${p.age}y` : '—'} {p.gender ? `• ${p.gender}` : ''}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          p.totalVisits > 1
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.totalVisits} {p.totalVisits === 1 ? 'visit' : 'visits'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(p.lastVisitAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => handleOpenProfile(p)}
                        className="inline-flex items-center px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Profile
                      </button>
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="inline-flex items-center px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ClinicQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        clinicId={clinicId}
        clinicName={clinicName}
      />

      <PatientProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        patient={selectedPatient}
        onEditClick={(pat) => {
          setSelectedPatient(pat);
          setIsEditModalOpen(true);
        }}
      />

      <PatientEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        patient={selectedPatient}
        onPatientUpdated={fetchPatients}
      />

      <AddPatientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPatientAdded={fetchPatients}
      />
    </div>
  );
};

export default PatientManagement;

