'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LogOut,
  HeartPulse,
  Beaker,
  Clock,
  CheckCircle,
  Activity,
  ChevronRight,
  X
} from 'lucide-react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

export default function LaboratoristDashboardLayout({
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
    setRole('laboratorist');
  }, [setRole]);

  // Initialize workflow steps for laboratorist
  useEffect(() => {
    setWorkflowSteps(['pending', 'in-progress', 'completed']);
    if (!currentStep) {
      setCurrentStep('pending');
    }
  }, [setWorkflowSteps, setCurrentStep, currentStep]);

  // Role verification - redirect if wrong role
  useEffect(() => {
    if (user && user.role !== 'LAB_TECH') {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (!user || user.role !== 'LAB_TECH') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-3"></div>
          <div className="text-sm font-medium text-slate-600">Verifying laboratory access...</div>
        </div>
      </div>
    );
  }

  const workflowSteps = [
    { id: 'pending' as const, label: 'Pending Orders', icon: Clock },
    { id: 'in-progress' as const, label: 'In Progress Tests', icon: Activity },
    { id: 'completed' as const, label: 'Completed Results', icon: CheckCircle }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Mobile-only backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Collapses cleanly to w-0, expanding content area */}
      <aside
        className={`bg-slate-900 text-slate-200 border-r border-slate-800 flex-shrink-0 flex flex-col z-40 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-64 min-w-[16rem]' : 'w-0 min-w-0 opacity-0 pointer-events-none'
        } overflow-hidden`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between min-w-[16rem]">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-sm">
              <Beaker className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">Diagnostics Lab</h1>
              <p className="text-[11px] text-slate-400">Specimen & Analysis</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Workflow Navigation */}
        <div className="flex-1 overflow-y-auto py-4 min-w-[16rem]">
          <h3 className="px-5 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Diagnostic Queue
          </h3>
          <div className="space-y-1 px-3">
            {workflowSteps.map((step) => {
              const isCurrent = currentStep === step.id;
              const Icon = step.icon;

              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isCurrent
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{step.label}</span>
                  {isCurrent && (
                    <ChevronRight className="h-3.5 w-3.5 opacity-80" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-800 min-w-[16rem] space-y-2">
          <div className="flex items-center space-x-3 px-3 py-2 bg-slate-800/60 rounded-lg">
            <div className="h-8 w-8 rounded-md bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              LT
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.staffProfile?.fullName || user?.username}
              </p>
              <p className="text-[10px] text-slate-400 truncate">Lab Specialist</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-600/30 rounded-lg transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area - Expands when sidebar is hidden */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out w-full">
        <DashboardHeader
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          roleTitle="Laboratory Console"
          roleBadge="Lab Tech"
          badgeColorClass="bg-indigo-50 text-indigo-700 border-indigo-200"
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
              <span className="inline-flex items-center text-emerald-600 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                Lab Instrument Interface Connected
              </span>
              <span>v1.0.0</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}