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
  Thermometer,
  Stethoscope,
  ChevronRight,
  Lock,
  CheckCircle
} from 'lucide-react';

export default function NurseDashboardLayout({
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
    setRole('nurse');
  }, [setRole]);

  // Initialize workflow steps for nurse
  useEffect(() => {
    setWorkflowSteps(['triage', 'vitals', 'intake']);
    setCurrentStep('triage');
  }, [setWorkflowSteps, setCurrentStep]);

  // Role verification - redirect if wrong role
  useEffect(() => {
    if (user && user.role !== 'NURSE') {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (!user || user.role !== 'NURSE') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 flex overflow-hidden">
      {/* Vertical Sidebar */}
      <nav className="w-64 bg-white border-r border-gray-200 shadow-sm flex-shrink-0 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-pink-600 p-2 rounded-lg">
              <HeartPulse className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-800">
              Nurse
            </h1>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Nurse Workflow</h3>
          <div className="space-y-1">
            {[
              { id: 'triage' as const, label: 'Triage Queue', icon: Users },
              { id: 'vitals' as const, label: 'Vitals', icon: Thermometer },
              { id: 'intake' as const, label: 'Patient Intake', icon: Stethoscope }
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
                        ? 'bg-pink-100 text-pink-700 font-medium'
                        : isCompleted
                        ? 'bg-pink-50 text-pink-700'
                        : canAccess
                        ? 'text-gray-600 hover:bg-gray-100'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="relative">
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-pink-600" />
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
                  {index < 2 && (
                    <div className="absolute left-7 top-10 w-0.5 h-4 bg-gray-200" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 space-y-3">
          <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-lg">
            <User className="h-5 w-5 text-gray-600" />
            <span className="text-sm text-gray-700 font-medium truncate">
              {user?.staffProfile?.fullName || user?.email}
            </span>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Nurse Station</h1>
            <p className="text-gray-600 mt-1">Patient triage, vitals, and care coordination</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}