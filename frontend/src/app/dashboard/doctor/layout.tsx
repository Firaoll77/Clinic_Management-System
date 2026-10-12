'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LogOut,
  HeartPulse,
  User,
  Users,
  Calendar,
  Activity,
  Beaker,
  ChevronRight,
  Lock,
  CheckCircle,
  Bell,
  Menu,
  X
} from 'lucide-react';

export default function DoctorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout, user } = useAuth();
  const { activeTab, setActiveTab, role, setRole } = useNavigation();
  const { currentStep, setCurrentStep, completedSteps, canAccessStep, getNextStep, getPreviousStep, setWorkflowSteps } = useWorkflow();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return 'D';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex overflow-hidden">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Vertical Sidebar */}
      <nav className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1f2933] flex-shrink-0 flex flex-col transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <HeartPulse className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white">
              Doctor Portal
            </h1>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Patient Workflow</h3>
          <div className="space-y-1">
            {[
              { id: 'intake' as const, label: 'Intake', icon: Users },
              { id: 'vitals' as const, label: 'Vitals', icon: Activity },
              { id: 'encounter' as const, label: 'Encounter', icon: HeartPulse },
              { id: 'orders' as const, label: 'Orders', icon: Beaker },
              { id: 'lab-results' as const, label: 'Lab Results', icon: CheckCircle }
            ].map((step, index) => {
              const isCurrent = currentStep === step.id;
              const isCompleted = completedSteps.has(step.id);
              const canAccess = canAccessStep(step.id);
              const Icon = step.icon;

              return (
                <div key={step.id} className="relative">
                  <button
                    onClick={() => canAccess && setCurrentStep(step.id)}
                    disabled={!canAccess}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isCurrent
                        ? 'bg-blue-600 text-white font-medium'
                        : isCompleted
                        ? 'text-green-400'
                        : canAccess
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <div className="relative">
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : !canAccess ? (
                        <Lock className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className="text-sm">{step.label}</span>
                    {isCurrent && (
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    )}
                  </button>
                  {index < 4 && (
                    <div className="absolute left-7 top-10 w-0.5 h-4 bg-gray-600" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-gray-700 space-y-3">
          <div className="flex items-center space-x-3 px-3 py-2 bg-gray-800 rounded-lg">
            <div className="bg-blue-600 h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {getInitials(user?.staffProfile?.fullName || user?.email || 'D')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">
                Dr. {user?.staffProfile?.fullName?.split(' ')[1] || user?.staffProfile?.fullName?.split(' ')[0] || user?.email}
              </p>
              <p className="text-xs text-gray-400">Doctor</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Doctor Workspace</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 rounded-lg hover:bg-gray-100">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-blue-600 rounded-full"></span>
            </button>
            <div className="hidden sm:flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-lg">
              <div className="bg-blue-600 h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {getInitials(user?.staffProfile?.fullName || user?.email || 'D')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 font-medium truncate">
                  Dr. {user?.staffProfile?.fullName?.split(' ')[1] || user?.staffProfile?.fullName?.split(' ')[0] || user?.email}
                </p>
                <p className="text-xs text-gray-500">Doctor</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col overflow-auto p-4 lg:p-6">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <p>© 2026 Clinic Management System</p>
            <p>v1.0.0</p>
          </div>
        </footer>
      </div>
    </div>
  );
}