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
  Calendar,
  Activity,
  Beaker,
  ChevronRight,
  Lock,
  CheckCircle
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 flex flex-col">
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-white p-2 rounded-lg">
                  <HeartPulse className="h-6 w-6 text-blue-600" />
                </div>
                <h1 className="text-xl font-bold text-white">
                  Doctor Workspace
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <User className="h-5 w-5 text-white" />
                <span className="text-sm text-white font-medium">
                  Dr. {user?.staffProfile?.fullName?.split(' ')[1] || user?.email}
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
        {/* Vertical Sidebar - Workflow Steps */}
        <nav className="w-64 bg-white border-r border-gray-200 shadow-sm flex-shrink-0">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Patient Workflow</h3>
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
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : isCompleted
                          ? 'bg-green-50 text-green-700'
                          : canAccess
                          ? 'text-gray-600 hover:bg-gray-100'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <div className="relative">
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : !canAccess ? (
                          <Lock className="h-5 w-5" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>
                      <span>{step.label}</span>
                      {isCurrent && (
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      )}
                    </button>
                    {index < 4 && (
                      <div className="absolute left-7 top-10 w-0.5 h-4 bg-gray-200" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Master-Detail Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}