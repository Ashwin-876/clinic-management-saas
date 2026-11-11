'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  RefreshCw,
  Settings,
  FileText,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import Sidebar, { DashboardTab } from './dashboard/Sidebar';
import AdvancedOverview from './dashboard/AdvancedOverview';
import DoctorManagement from './dashboard/DoctorManagement';
import DepartmentManagement from './dashboard/DepartmentManagement';
import RoleManagement from './dashboard/RoleManagement';
import PatientManagement from './dashboard/PatientManagement';
import { ClinicQrModal } from './dashboard/ClinicQrModal';
import TenantIsolationVerifier from './TenantIsolationVerifier';

export default function DashboardOverview() {
  const router = useRouter();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Settings form state
  const [slotDuration, setSlotDuration] = useState(15);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [currency, setCurrency] = useState('INR');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/clinic/dashboard');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to load clinic dashboard.');
        return;
      }
      setData(json.data);
      if (json.data.settings) {
        setSlotDuration(json.data.settings.slotDuration || 15);
        setTimezone(json.data.settings.timezone || 'Asia/Kolkata');
        setCurrency(json.data.settings.currency || 'INR');
        setEmailNotifications(
          json.data.settings.emailNotifications !== undefined
            ? json.data.settings.emailNotifications
            : true
        );
        setSmsNotifications(
          json.data.settings.smsNotifications !== undefined
            ? json.data.settings.smsNotifications
            : true
        );
      }
    } catch (err) {
      console.error('Fetch dashboard error:', err);
      setError('Network communication error loading clinic data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(null);
    try {
      const res = await fetch('/api/clinic/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotDuration: Number(slotDuration),
          timezone,
          currency,
          emailNotifications,
          smsNotifications,
        }),
      });
      const resJson = await res.json();
      if (res.ok) {
        setSettingsSuccess('Clinic configuration updated successfully.');
        setTimeout(() => setSettingsSuccess(null), 3000);
      } else {
        setError(resJson.error || 'Failed to update settings.');
      }
    } catch (err) {
      console.error('Save settings error:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        <p className="text-sm font-medium text-slate-600">Loading clinic workspace...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl bg-white p-8 border border-rose-200 text-center max-w-xl mx-auto my-12 shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-3">
          <Activity className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Workspace Unavailable</h2>
        <p className="text-xs text-slate-500 mt-1">{error || 'Unable to retrieve clinic information.'}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const { clinic, metrics, recentDoctors, adminUser, recentAuditLogs } = data;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* SIDEBAR NAVIGATION */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        clinicName={clinic.name}
        clinicId={clinic.clinicId}
        adminName={adminUser.name}
        role={adminUser.role}
        onLogout={handleLogout}
        onOpenQr={() => setIsQrModalOpen(true)}
      />

      {/* MAIN VIEW AREA */}
      <main className="flex-1 min-w-0">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <AdvancedOverview
            clinic={clinic}
            metrics={metrics || { totalDoctors: 0, activeDoctors: 0, inactiveDoctors: 0, totalDepartments: 0 }}
            recentDoctors={recentDoctors || []}
            onNavigateDoctors={() => setActiveTab('doctors')}
            onNavigateDepartments={() => setActiveTab('departments')}
            onNavigatePatients={() => setActiveTab('patients')}
            onOpenQr={() => setIsQrModalOpen(true)}
          />
        )}

        {/* TAB 2: PATIENTS & VISITS */}
        {activeTab === 'patients' && (
          <PatientManagement clinicId={clinic.clinicId} clinicName={clinic.name} />
        )}

        {/* TAB 3: DOCTORS */}
        {activeTab === 'doctors' && (
          <DoctorManagement onDoctorChanged={fetchDashboardData} />
        )}

        {/* TAB 4: DEPARTMENTS */}
        {activeTab === 'departments' && (
          <DepartmentManagement onDepartmentChanged={fetchDashboardData} />
        )}

        {/* TAB 5: ROLE MANAGEMENT */}
        {activeTab === 'roles' && (
          <RoleManagement />
        )}

        {/* TAB 6: TENANT SECURITY & AUDIT */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <TenantIsolationVerifier currentClinicId={clinic.clinicId} />

            {/* Audit Logs Table */}
            <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-brand-600" />
                  <h3 className="text-base font-bold text-slate-900">Clinic Security Audit Trail</h3>
                </div>
                <span className="text-xs text-slate-500 font-mono">Scoped by clinic_id = {clinic.clinicId}</span>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 border-y border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Entity</th>
                      <th className="py-2.5 px-3">Details</th>
                      <th className="py-2.5 px-3">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentAuditLogs && recentAuditLogs.length > 0 ? (
                      recentAuditLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 border border-slate-200 font-mono text-[11px]">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{log.entity}</td>
                          <td className="py-2.5 px-3 max-w-xs truncate text-slate-500 font-mono text-[11px]">
                            {log.details || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{log.ipAddress || '127.0.0.1'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          No audit events recorded yet for this clinic.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CLINIC SETTINGS */}
        {activeTab === 'settings' && (
          <div className="rounded-2xl bg-white p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <Settings className="h-5 w-5 text-brand-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Clinic Operational Settings</h3>
                <p className="text-xs text-slate-500">Configure consultation slots, timezone, and communication preferences.</p>
              </div>
            </div>

            {settingsSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3.5 border border-emerald-200 text-emerald-800 text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>{settingsSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl text-xs">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Appointment Slot Duration (Minutes)</label>
                <select
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white"
                >
                  <option value={10}>10 Minutes</option>
                  <option value={15}>15 Minutes (Standard)</option>
                  <option value={20}>20 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">System Timezone</label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Billing Currency</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="pt-2 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="font-medium text-slate-700">Enable Automated Email Notifications</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsNotifications}
                    onChange={(e) => setSmsNotifications(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="font-medium text-slate-700">Enable SMS Appointment Reminders</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition"
                >
                  {savingSettings && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <ClinicQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        clinicId={clinic.clinicId}
        clinicName={clinic.name}
      />
    </div>
  );
}
