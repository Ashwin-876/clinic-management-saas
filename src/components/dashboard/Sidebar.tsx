'use client';

import React from 'react';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Building2,
  ShieldCheck,
  Settings,
  LogOut,
  Activity,
  UserCheck,
  Layers,
  QrCode,
} from 'lucide-react';

export type DashboardTab = 'overview' | 'patients' | 'doctors' | 'departments' | 'roles' | 'security' | 'settings';

interface Props {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  clinicName: string;
  clinicId: string;
  adminName: string;
  role: string;
  onLogout: () => void;
  onOpenQr?: () => void;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  clinicName,
  clinicId,
  adminName,
  role,
  onLogout,
  onOpenQr,
}: Props) {
  const navItems = [
    {
      id: 'overview' as DashboardTab,
      label: 'Clinic Overview',
      icon: LayoutDashboard,
      badge: 'Main',
    },
    {
      id: 'patients' as DashboardTab,
      label: 'Patients & Visits',
      icon: Users,
      badge: 'Phase 3',
    },
    {
      id: 'doctors' as DashboardTab,
      label: 'Doctor Directory',
      icon: Stethoscope,
      badge: 'Phase 2',
    },
    {
      id: 'departments' as DashboardTab,
      label: 'Departments',
      icon: Building2,
      badge: 'Phase 2',
    },
    {
      id: 'roles' as DashboardTab,
      label: 'Role Management',
      icon: UserCheck,
      badge: 'RBAC',
    },
    {
      id: 'security' as DashboardTab,
      label: 'Tenant Security Guard',
      icon: ShieldCheck,
      badge: 'Active',
    },
    {
      id: 'settings' as DashboardTab,
      label: 'Clinic Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 flex flex-col justify-between rounded-2xl bg-white border border-slate-200 p-4 shadow-xs">
      <div className="space-y-6">
        {/* Clinic Identity Card */}
        <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-xs shadow-xs">
              <Activity className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xs font-bold text-slate-900 truncate">{clinicName}</h2>
              <span className="font-mono text-[10px] text-brand-700 bg-brand-100/60 px-1.5 py-0.2 rounded border border-brand-200 block truncate w-fit">
                {clinicId}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                      isActive
                        ? 'bg-brand-700 text-brand-100'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {onOpenQr && (
          <div className="pt-2">
            <button
              onClick={onOpenQr}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <QrCode className="w-3.5 h-3.5 text-sky-400" />
              <span>Show Clinic QR</span>
            </button>
          </div>
        )}
      </div>

      {/* User Session Footer & Logout */}
      <div className="mt-8 pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{adminName}</p>
            <span className="text-[10px] font-bold text-brand-700 uppercase tracking-wide">
              {role}
            </span>
          </div>

          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
            title="Log out of session"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

