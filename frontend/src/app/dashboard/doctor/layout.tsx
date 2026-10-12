'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LogOut,
  HeartPulse,
  Users,
  Activity,
  Beaker,
  ChevronRight,
  Lock,
  CheckCircle,
  X
} from 'lucide-react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

export default function DoctorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout, user } = useAuth();
  const { activeTab, setActiveTab, setRole } = useNavigation();
  const { currentStep, setCurrentStep, completedSteps, canAccessStep, setWorkflowSteps } = useWorkflow();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Set role on mount
  useEffect(() => {
    setRole('doctor');
  }, [setRole]);

  // Initialize workflow steps for doctor
  useEffect(() => {
    setWorkflowSteps(['intake', 'vitals', 'encounter', 'orders', 'lab-results']);
  }, [setWorkflowSteps]);

  // Initialize to patients tab
  useEffect(() => {
    if (activeTab === 'default' || !activeTab.startsWith('doctor-')) {
      setActiveTab('doctor-patients');
    }
  }, [activeTab, setActiveTab]);

  // Role verification - redirect if wrong role
  useEffect(() => {
    if (user && user.role !== 'DOCTOR') {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (!user || user.role !== 'DOCTOR') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <div className="text-sm font-medium text-slate-600">Verifying physician access...</div>
        </div>
      </div>
    );
  }

  const workflowSteps = [
    { id: 'intake' as const, label: 'Nurse Intake', icon: Users },
    { id: 'vitals' as const, label: 'Vital Signs', icon: Activity },
    { id: 'encounter' as const, label: 'Clinical SOAP Note', icon: HeartPulse },
    { id: 'orders' as const, label: 'Lab & Prescription Orders', icon: Beaker },
    { id: 'lab-results' as const, label: 'Lab Results Review', icon: CheckCircle }
  ];

  const getDoctorName = () => {
    if (user?.staffProfile?.fullName) {
      return `Dr. ${user.staffProfile.fullName.replace(/^Dr\.?\s*/i, '')}`;
    }
    return user?.username ? `Dr. ${user.username}` : 'Attending Physician';
  };

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
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-sm">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">Physician Portal</h1>
              <p className="text-[11px] text-slate-400">Clinical Consultation</p>
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
            Patient Consultation Stages
          </h3>
          <div className="space-y-1 px-3">
            {workflowSteps.map((step, index) => {
              const isCurrent = currentStep === step.id;
              const isCompleted = completedSteps.has(step.id);
              const canAccess = canAccessStep(step.id);
              const Icon = step.icon;

              return (
                <div key={step.id} className="relative">
                  <button
                    onClick={() => canAccess && setCurrentStep(step.id)}
                    disabled={!canAccess}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isCurrent
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : isCompleted
                        ? 'text-emerald-400 hover:bg-slate-800/80 hover:text-emerald-300'
                        : canAccess
                        ? 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                        : 'text-slate-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                      ) : !canAccess ? (
                        <Lock className="h-3.5 w-3.5 text-slate-500" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span className="flex-1 text-left">{step.label}</span>
                    {isCurrent && (
                      <ChevronRight className="h-3.5 w-3.5 opacity-80" />
                    )}
                  </button>
                  {index < workflowSteps.length - 1 && (
                    <div className="ml-5 my-0.5 w-0.5 h-1 bg-slate-800" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-800 min-w-[16rem] space-y-2">
          <div className="flex items-center space-x-3 px-3 py-2 bg-slate-800/60 rounded-lg">
            <div className="h-8 w-8 rounded-md bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              MD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {getDoctorName()}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.staffProfile?.specialization || 'Attending Physician'}
              </p>
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
          roleTitle="Physician Workspace"
          roleBadge="Doctor"
          badgeColorClass="bg-blue-50 text-blue-700 border-blue-200"
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
                EMR Connected
              </span>
              <span>v1.0.0</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}