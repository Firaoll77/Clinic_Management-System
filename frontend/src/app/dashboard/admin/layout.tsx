'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LogOut,
  HeartPulse,
  Settings,
  Users,
  DollarSign,
  ChevronRight,
  FolderArchive,
  Terminal,
  LayoutDashboard,
  X
} from 'lucide-react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout, user } = useAuth();
  const { setRole } = useNavigation();
  const { currentStep, setCurrentStep, setWorkflowSteps } = useWorkflow();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Set role on mount
  useEffect(() => {
    setRole('admin');
  }, [setRole]);

  // Initialize workflow steps for admin
  useEffect(() => {
    setWorkflowSteps(['overview', 'staff', 'patients', 'billing', 'audit', 'settings']);
  }, [setWorkflowSteps]);

  // Role verification - redirect if wrong role
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-3"></div>
          <div className="text-sm font-medium text-slate-600">Verifying administrator access...</div>
        </div>
      </div>
    );
  }

  const navigationGroups = [
    {
      label: 'GENERAL',
      items: [
        { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
        { id: 'staff' as const, label: 'Staff Management', icon: Users },
        { id: 'patients' as const, label: 'Patients', icon: FolderArchive },
      ]
    },
    {
      label: 'OPERATIONS',
      items: [
        { id: 'billing' as const, label: 'Billing & Fees', icon: DollarSign },
        { id: 'audit' as const, label: 'Audit Logs', icon: Terminal },
      ]
    },
    {
      label: 'SYSTEM',
      items: [
        { id: 'settings' as const, label: 'Settings', icon: Settings },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Mobile-only backdrop (hidden on desktop lg) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Pure Black Background with White Accents */}
      <aside
        className={`bg-black text-neutral-200 border-r border-neutral-900 flex-shrink-0 flex flex-col z-40 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-64 min-w-[16rem]' : 'w-0 min-w-0 opacity-0 pointer-events-none'
        } overflow-hidden`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-neutral-900 flex items-center justify-between min-w-[16rem]">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-lg text-black shadow-sm">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">Clinic Admin</h1>
              <p className="text-[11px] text-neutral-400">Executive Console</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-900 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Items with White Accent for Active Item */}
        <div className="flex-1 overflow-y-auto py-4 min-w-[16rem]">
          {navigationGroups.map((group) => (
            <div key={group.label} className="mb-6">
              <h3 className="px-5 mb-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                {group.label}
              </h3>
              <div className="space-y-0.5 px-3">
                {group.items.map((item) => {
                  const isCurrent = currentStep === item.id;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentStep(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isCurrent
                          ? 'bg-white text-black font-semibold shadow-sm'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {isCurrent && (
                        <ChevronRight className="h-3.5 w-3.5 opacity-80" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-neutral-900 min-w-[16rem] space-y-2">
          <div className="flex items-center space-x-3 px-3 py-2 bg-neutral-950 border border-neutral-900 rounded-lg">
            <div className="h-8 w-8 rounded-md bg-white flex items-center justify-center text-black text-xs font-bold shadow-sm">
              {user?.staffProfile?.fullName
                ? user.staffProfile.fullName.slice(0, 2).toUpperCase()
                : 'AD'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.staffProfile?.fullName || user?.username}
              </p>
              <p className="text-[10px] text-neutral-400 truncate">Administrator</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-1.5 text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-lg transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area - Expands when sidebar is hidden */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out w-full">
        {/* Topbar with functional notification & profile, NO search and NO breadcrumbs */}
        <DashboardHeader
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          roleTitle="Clinic Administration"
          roleBadge="Admin"
          badgeColorClass="bg-black text-white border-neutral-800 shadow-sm"
        />

        {/* Main Content Canvas */}
        <main className="flex-1 overflow-auto bg-slate-50">
          <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200/80 px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Clinic Management System</p>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center text-neutral-900 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 mr-1.5"></span>
                Operational
              </span>
              <span>v1.0.0</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}