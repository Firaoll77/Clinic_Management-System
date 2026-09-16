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
  Clock,
  ChevronRight,
  Users,
  UserPlus,
  Calendar,
  Receipt
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

export default function ReceptionistDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout, user } = useAuth();
  const { activeTab, setActiveTab, role, setRole } = useNavigation();
  const { currentStep, setCurrentStep, setWorkflowSteps } = useWorkflow();
  const router = useRouter();
  const [workflowInitialized, setWorkflowInitialized] = useState(false);

  // Set role on mount
  useEffect(() => {
    setRole('receptionist');
  }, [setRole]);

  // Initialize workflow steps for receptionist (for navigation tracking only)
  useEffect(() => {
    setWorkflowSteps(['queue', 'registration', 'appointments', 'billing']);
    setWorkflowInitialized(true);
  }, [setWorkflowSteps]);

  // Role verification - redirect if wrong role
  useEffect(() => {
    if (user && user.role !== 'RECEPTIONIST') {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (!user || user.role !== 'RECEPTIONIST') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-white p-2 rounded-lg">
                  <HeartPulse className="h-6 w-6 text-green-600" />
                </div>
                <h1 className="text-xl font-bold text-white">
                  Reception Desk
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell />
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
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Reception Navigation</h3>
            <div className="space-y-1">
              {[
                { id: 'queue' as const, label: 'Patient Queue', icon: Users },
                { id: 'registration' as const, label: 'Registration', icon: UserPlus },
                { id: 'appointments' as const, label: 'Appointments', icon: Calendar },
                { id: 'billing' as const, label: 'Billing', icon: Receipt }
              ].map((step) => {
                const isCurrent = currentStep === step.id;
                const Icon = step.icon;
                
                return (
                  <div key={step.id} className="relative">
                    <button
                      onClick={() => setCurrentStep(step.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isCurrent
                          ? 'bg-green-100 text-green-700 font-medium'
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

        {/* 50/50 Split-Screen Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}