'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { 
  LogOut, 
  HeartPulse,
  User,
  Settings,
  Users,
  Activity,
  Calendar,
  Shield,
  DollarSign,
  ChevronRight,
  FolderArchive,
  Terminal
} from 'lucide-react';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading, logout, user } = useAuth();
  const { activeTab, setActiveTab, role, setRole } = useNavigation();
  const { currentStep, setCurrentStep, setWorkflowSteps } = useWorkflow();
  const router = useRouter();

  // Set role on mount
  useEffect(() => {
    setRole('admin');
  }, [setRole]);

  // Initialize workflow steps for admin (for navigation tracking only)
  useEffect(() => {
    setWorkflowSteps(['overview', 'staff', 'patients', 'appointments', 'billing', 'audit', 'settings']);
  }, [setWorkflowSteps]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
    if (!loading && isAuthenticated && user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router, user?.role]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-medical">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D93344] mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex flex-col">
      {/* Header */}
      <header className="bg-[#D93344] shadow-lg sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-white p-2 rounded-lg">
                  <HeartPulse className="h-6 w-6 text-[#D93344]" />
                </div>
                <h1 className="text-xl font-bold text-white">
                  Clinic Admin Command Center
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <User className="h-5 w-5 text-white" />
                <span className="text-sm text-white font-medium">
                  {user?.staffProfile?.fullName || user?.email}
                </span>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Vertical Sidebar - Flexible Navigation */}
        <nav className="w-64 bg-white border-r border-gray-200 shadow-sm flex-shrink-0">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Admin Navigation</h3>
            <div className="space-y-1">
              {[
                { id: 'overview' as const, label: 'Overview', icon: Activity },
                { id: 'staff' as const, label: 'Staff Management', icon: Users },
                { id: 'patients' as const, label: 'Patient Records', icon: FolderArchive },
                { id: 'appointments' as const, label: 'Appointments', icon: Calendar },
                { id: 'billing' as const, label: 'Billing & Fees', icon: DollarSign },
                { id: 'audit' as const, label: 'Audit Logs', icon: Terminal },
                { id: 'settings' as const, label: 'Settings', icon: Settings }
              ].map((step) => {
                const isCurrent = currentStep === step.id;
                const Icon = step.icon;
                
                return (
                  <div key={step.id} className="relative">
                    <button
                      onClick={() => setCurrentStep(step.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isCurrent
                          ? 'bg-red-100 text-red-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{step.label}</span>
                      {isCurrent && (
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Bento-Box Analytics */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}